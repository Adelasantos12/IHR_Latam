import os
from celery import Celery
from sqlmodel import Session, select
from app.database import engine
from app.models import Law, LawChunk, Obligation, AnalysisResult, Country, ComplianceStatus
from app.services.ingestion import extract_text_from_pdf, chunk_text, get_embedding
from app.services.analysis import analyze_obligation
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

celery = Celery(__name__)
celery.conf.broker_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
celery.conf.result_backend = os.environ.get("REDIS_URL", "redis://localhost:6379")


def normalize_status(raw_status):
    value = str(raw_status or "").strip().lower()
    mapping = {
        "si": ComplianceStatus.YES,
        "yes": ComplianceStatus.YES,
        "parcial": ComplianceStatus.PARTIAL,
        "partial": ComplianceStatus.PARTIAL,
        "no": ComplianceStatus.NO,
    }
    return mapping.get(value, ComplianceStatus.UNKNOWN)


@celery.task(name="ingest_law")
def ingest_law_task(law_id: int):
    logger.info(f"Starting ingestion for law_id: {law_id}")
    with Session(engine) as session:
        law = session.get(Law, law_id)
        if not law:
            logger.error(f"Law {law_id} not found.")
            return "Law not found"

        if not law.file_path or not os.path.exists(law.file_path):
            logger.error(f"File not found for law {law_id}: {law.file_path}")
            return "File not found"

        # 1. Extract Text
        try:
            text = extract_text_from_pdf(law.file_path)
            law.full_text = text
            session.add(law)
            session.commit()
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return f"Error extracting text: {e}"

        # 2. Chunk & Embed
        try:
            # Clear existing chunks if any (re-ingestion)
            existing_chunks = session.exec(select(LawChunk).where(LawChunk.law_id == law_id)).all()
            for chunk in existing_chunks:
                session.delete(chunk)

            chunks_text = chunk_text(text)
            for i, chunk_text_content in enumerate(chunks_text):
                embedding = get_embedding(chunk_text_content)
                if not embedding:
                     logger.warning(f"Empty embedding for chunk {i}")
                     continue

                chunk_obj = LawChunk(
                    law_id=law_id,
                    chunk_index=i,
                    text=chunk_text_content,
                    embedding=embedding
                )
                session.add(chunk_obj)

            session.commit()
            logger.info(f"Ingestion complete for law {law_id}. Created {len(chunks_text)} chunks.")
            return f"Ingested {len(chunks_text)} chunks"

        except Exception as e:
            logger.error(f"Error chunking/embedding: {e}")
            return f"Error chunking/embedding: {e}"

@celery.task(name="analyze_country")
def analyze_country_task(country_id: str):
    logger.info(f"Starting analysis for country: {country_id}")
    with Session(engine) as session:
        country = session.get(Country, country_id)
        if not country:
            logger.error(f"Country {country_id} not found.")
            return "Country not found"

        obligations = session.exec(select(Obligation)).all()

        results = []
        for obligation in obligations:
            logger.info(f"Analyzing obligation {obligation.id} for {country_id}...")

            # 1. Retrieve relevant chunks (RAG)
            # Using pgvector L2 distance (or cosine similarity)
            # We need to embed the query (obligation content) to search
            query_text = f"{obligation.normative_content} {obligation.required_domestic_functions}"
            query_embedding = get_embedding(query_text)

            if not query_embedding:
                logger.warning(f"Could not embed query for {obligation.id}")
                continue

            # Query DB using pgvector
            # Note: SQLModel doesn't directly support vector operators easily without raw SQL or proper typing
            # We'll use session.exec with text() or direct sqlalchemy select
            try:
                # Find chunks belonging to laws of this country
                # Subquery to filter by country
                # Ordered by distance
                stmt = select(LawChunk).join(Law).where(Law.country_id == country_id).order_by(LawChunk.embedding.l2_distance(query_embedding)).limit(5)
                retrieved_chunks = session.exec(stmt).all()

                if not retrieved_chunks:
                    logger.info(f"No chunks found for {obligation.id} in {country_id}")
                    # Create a "No Evidence" result? Or skip?
                    # Let's create a result saying "No evidence found"
                    analysis_result = {
                        "status": ComplianceStatus.NO,
                        "confidence": 1.0,
                        "evidence": [],
                        "missing": ["No relevant legal text found in uploaded laws."],
                        "notes": "No matching documents retrieved."
                    }
                else:
                    # 2. Analyze with LLM
                    analysis_result = analyze_obligation(obligation, retrieved_chunks, country=country_id)

                # 3. Save Result
                # Check if result exists
                existing_result = session.exec(
                    select(AnalysisResult)
                    .where(AnalysisResult.country_id == country_id)
                    .where(AnalysisResult.obligation_id == obligation.id)
                ).first()

                if existing_result:
                    existing_result.status = normalize_status(analysis_result.get("status"))
                    existing_result.confidence = analysis_result.get("confidence", 0.0)
                    existing_result.evidence = analysis_result.get("evidence", [])
                    existing_result.missing_info = analysis_result.get("missing", [])
                    existing_result.notes = analysis_result.get("notes", "")
                    session.add(existing_result)
                else:
                    new_result = AnalysisResult(
                        country_id=country_id,
                        obligation_id=obligation.id,
                        status=normalize_status(analysis_result.get("status")),
                        confidence=analysis_result.get("confidence", 0.0),
                        evidence=analysis_result.get("evidence", []),
                        missing_info=analysis_result.get("missing", []),
                        notes=analysis_result.get("notes", "")
                    )
                    session.add(new_result)

                results.append(obligation.id)

            except Exception as e:
                logger.error(f"Error processing obligation {obligation.id}: {e}")

        session.commit()
        logger.info(f"Analysis complete for {country_id}. Processed {len(results)} obligations.")
        return f"Analyzed {len(results)} obligations"
