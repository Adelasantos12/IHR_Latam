import logging
import os

from celery import Celery
from sqlmodel import Session, select

from app.database import engine
from app.models import AnalysisResult, ComplianceStatus, Country, Law, LawChunk, Obligation
from app.services.analysis import analyze_obligation
from app.services.ingestion import chunk_text, extract_text_from_pdf, get_embedding

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


def validate_analysis_payload(payload: dict) -> dict:
    """Hard validation layer to reduce hallucination risk before persistence."""
    normalized = dict(payload)
    status = str(normalized.get("status", "")).lower().strip()
    evidence = normalized.get("evidence", []) or []
    confidence = float(normalized.get("confidence", 0.0) or 0.0)

    if status in {"si", "yes"} and not evidence:
        normalized["status"] = "no"
        normalized["score"] = 0
        missing = normalized.get("missing", []) or []
        missing.append("Respuesta 'si' rechazada por falta de evidencia trazable")
        normalized["missing"] = missing
        notes = normalized.get("notes", "")
        normalized["notes"] = f"{notes}\nValidation: downgraded to 'no' due to missing evidence.".strip()

    if confidence < 0:
        normalized["confidence"] = 0.0
    if confidence > 1:
        normalized["confidence"] = 1.0

    status_after = str(normalized.get("status", "")).lower().strip()
    if "score" not in normalized:
        normalized["score"] = 1 if status_after in {"si", "yes"} else 0.5 if status_after in {"parcial", "partial"} else 0

    normalized["needs_review"] = bool(normalized.get("confidence", 0) < 0.7)
    return normalized


@celery.task(name="ingest_law")
def ingest_law_task(law_id: int):
    logger.info("Starting ingestion for law_id: %s", law_id)
    with Session(engine) as session:
        law = session.get(Law, law_id)
        if not law:
            logger.error("Law %s not found.", law_id)
            return "Law not found"

        if not law.file_path or not os.path.exists(law.file_path):
            logger.error("File not found for law %s: %s", law_id, law.file_path)
            return "File not found"

        try:
            text = extract_text_from_pdf(law.file_path)
            law.full_text = text
            session.add(law)
            session.commit()
        except Exception as exc:
            logger.error("Error extracting text: %s", exc)
            return f"Error extracting text: {exc}"

        try:
            existing_chunks = session.exec(select(LawChunk).where(LawChunk.law_id == law_id)).all()
            for chunk in existing_chunks:
                session.delete(chunk)

            chunks_text = chunk_text(text)
            for i, chunk_text_content in enumerate(chunks_text):
                embedding = get_embedding(chunk_text_content)
                if not embedding:
                    logger.warning("Empty embedding for chunk %s", i)
                    continue

                session.add(
                    LawChunk(
                        law_id=law_id,
                        chunk_index=i,
                        text=chunk_text_content,
                        embedding=embedding,
                    )
                )

            session.commit()
            logger.info("Ingestion complete for law %s. Created %s chunks.", law_id, len(chunks_text))
            return f"Ingested {len(chunks_text)} chunks"

        except Exception as exc:
            logger.error("Error chunking/embedding: %s", exc)
            return f"Error chunking/embedding: {exc}"


@celery.task(name="analyze_country")
def analyze_country_task(country_id: str):
    logger.info("Starting analysis for country: %s", country_id)
    with Session(engine) as session:
        country = session.get(Country, country_id)
        if not country:
            logger.error("Country %s not found.", country_id)
            return "Country not found"

        obligations = session.exec(select(Obligation)).all()
        results = []

        for obligation in obligations:
            logger.info("Analyzing obligation %s for %s...", obligation.id, country_id)
            query_text = f"{obligation.normative_content} {obligation.required_domestic_functions}"
            query_embedding = get_embedding(query_text)

            if not query_embedding:
                logger.warning("Could not embed query for %s", obligation.id)
                continue

            try:
                stmt = (
                    select(LawChunk)
                    .join(Law)
                    .where(Law.country_id == country_id)
                    .order_by(LawChunk.embedding.l2_distance(query_embedding))
                    .limit(5)
                )
                retrieved_chunks = session.exec(stmt).all()

                if not retrieved_chunks:
                    analysis_result = {
                        "status": "no",
                        "score": 0,
                        "confidence": 1.0,
                        "evidence": [],
                        "missing": ["No relevant legal text found in uploaded laws."],
                        "notes": "No matching documents retrieved.",
                    }
                else:
                    analysis_result = analyze_obligation(obligation, retrieved_chunks, country=country_id)

                analysis_result = validate_analysis_payload(analysis_result)

                existing_result = session.exec(
                    select(AnalysisResult)
                    .where(AnalysisResult.country_id == country_id)
                    .where(AnalysisResult.obligation_id == obligation.id)
                ).first()

                if existing_result:
                    existing_result.status = normalize_status(analysis_result.get("status"))
                    existing_result.score = float(analysis_result.get("score", 0.0) or 0.0)
                    existing_result.confidence = float(analysis_result.get("confidence", 0.0) or 0.0)
                    existing_result.evidence = analysis_result.get("evidence", [])
                    existing_result.missing_info = analysis_result.get("missing", [])
                    existing_result.notes = analysis_result.get("notes", "")
                    existing_result.needs_review = bool(analysis_result.get("needs_review", False))
                    session.add(existing_result)
                else:
                    session.add(
                        AnalysisResult(
                            country_id=country_id,
                            obligation_id=obligation.id,
                            status=normalize_status(analysis_result.get("status")),
                            score=float(analysis_result.get("score", 0.0) or 0.0),
                            confidence=float(analysis_result.get("confidence", 0.0) or 0.0),
                            evidence=analysis_result.get("evidence", []),
                            missing_info=analysis_result.get("missing", []),
                            notes=analysis_result.get("notes", ""),
                            needs_review=bool(analysis_result.get("needs_review", False)),
                            is_published=False,
                        )
                    )

                results.append(obligation.id)

            except Exception as exc:
                logger.error("Error processing obligation %s: %s", obligation.id, exc)

        session.commit()
        logger.info("Analysis complete for %s. Processed %s obligations.", country_id, len(results))
        return f"Analyzed {len(results)} obligations"
