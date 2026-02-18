from datetime import datetime
import csv
import os
import shutil
from io import StringIO
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from app.database import get_session, init_db
from app.models import AnalysisResult, Authority, ComplianceStatus, Country, Law, Obligation
from app.worker import analyze_country_task, ingest_law_task

app = FastAPI(title="IHR Compliance Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def health_check():
    return {"status": "ok", "version": "1.1.0"}


@app.get("/countries", response_model=List[Country])
def get_countries(session: Session = Depends(get_session)):
    return session.exec(select(Country)).all()


@app.get("/countries/{country_id}")
def get_country_details(country_id: str, session: Session = Depends(get_session)):
    country = session.get(Country, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")

    laws = session.exec(select(Law).where(Law.country_id == country_id)).all()
    results = session.exec(select(AnalysisResult).where(AnalysisResult.country_id == country_id)).all()
    authority = session.exec(select(Authority).where(Authority.country_id == country_id)).first()

    return {
        "country": country,
        "authority": authority,
        "laws": laws,
        "analysis_results": results,
    }


@app.get("/obligations", response_model=List[Obligation])
def get_obligations(session: Session = Depends(get_session)):
    return session.exec(select(Obligation)).all()


@app.get("/obligations/{obligation_id}")
def get_obligation_results(obligation_id: str, session: Session = Depends(get_session)):
    obligation = session.get(Obligation, obligation_id)
    if not obligation:
        raise HTTPException(status_code=404, detail="Obligation not found")

    results = session.exec(select(AnalysisResult).where(AnalysisResult.obligation_id == obligation_id)).all()
    return {"obligation": obligation, "results": results}


@app.post("/laws")
def upload_law(
    country_id: str = Form(...),
    title: str = Form(...),
    publication_date: Optional[str] = Form(None),
    last_amendment_date: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    sector_id: Optional[int] = Form(None),
    norm_type: Optional[str] = Form(None),
    source_type: Optional[str] = Form("pdf"),
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
):
    country = session.get(Country, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")

    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{country_id}_{datetime.utcnow().timestamp()}_{file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    law = Law(
        country_id=country_id,
        title=title,
        publication_date=datetime.strptime(publication_date, "%Y-%m-%d") if publication_date else None,
        last_amendment_date=datetime.strptime(last_amendment_date, "%Y-%m-%d") if last_amendment_date else None,
        url=url,
        language=language,
        sector_id=sector_id,
        norm_type=norm_type,
        source_type=source_type,
        file_path=file_path,
    )
    session.add(law)
    session.commit()
    session.refresh(law)

    ingest_law_task.delay(law.id)
    return {"message": "Law uploaded successfully", "law_id": law.id}


@app.post("/analyze/{country_id}")
def trigger_analysis(country_id: str, session: Session = Depends(get_session)):
    if not session.get(Country, country_id):
        raise HTTPException(status_code=404, detail="Country not found")

    analyze_country_task.delay(country_id)
    return {"message": "Analysis triggered", "country_id": country_id}


@app.get("/audit/review-queue")
def get_review_queue(threshold: float = 0.7, session: Session = Depends(get_session)):
    rows = session.exec(select(AnalysisResult).where(AnalysisResult.needs_review == True)).all()  # noqa: E712
    dynamic = session.exec(select(AnalysisResult).where(AnalysisResult.confidence < threshold)).all()
    union = {r.id: r for r in [*rows, *dynamic] if r.id is not None}
    return {"threshold": threshold, "items": list(union.values())}


@app.post("/audit/results/{result_id}")
def update_audit_result(
    result_id: int,
    status: Optional[str] = Form(None),
    confidence: Optional[float] = Form(None),
    notes: Optional[str] = Form(None),
    is_published: Optional[bool] = Form(None),
    needs_review: Optional[bool] = Form(None),
    session: Session = Depends(get_session),
):
    result = session.get(AnalysisResult, result_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    if status:
        normalized = status.strip().lower()
        if normalized == "si":
            result.status = ComplianceStatus.YES
            result.score = 1
        elif normalized == "parcial":
            result.status = ComplianceStatus.PARTIAL
            result.score = 0.5
        elif normalized == "no":
            result.status = ComplianceStatus.NO
            result.score = 0

    if confidence is not None:
        result.confidence = confidence
    if notes is not None:
        result.notes = notes
    if is_published is not None:
        result.is_published = is_published
    if needs_review is not None:
        result.needs_review = needs_review

    result.updated_at = datetime.utcnow()
    session.add(result)
    session.commit()
    session.refresh(result)
    return result


@app.get("/dashboard/summary")
def get_dashboard_summary(session: Session = Depends(get_session)):
    countries = session.exec(select(Country)).all()
    laws = session.exec(select(Law)).all()
    results = session.exec(select(AnalysisResult)).all()

    compliance_counts = {"Yes": 0, "Partial": 0, "No": 0, "Unknown": 0}
    for r in results:
        label = str(r.status)
        compliance_counts[label] = compliance_counts.get(label, 0) + 1

    coverage_by_sector = {}
    for sector in range(1, 11):
        coverage_by_sector[sector] = len({law.country_id for law in laws if law.sector_id == sector})

    return {
        "total_countries": len(countries),
        "total_laws": len(laws),
        "compliance_counts": compliance_counts,
        "coverage_by_sector": coverage_by_sector,
        "recent_results": results[:25],
    }


@app.get("/dashboard/export.csv")
def export_dashboard_csv(session: Session = Depends(get_session)):
    results = session.exec(select(AnalysisResult)).all()
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["country_id", "obligation_id", "status", "score", "confidence", "is_published", "needs_review"])
    for row in results:
        writer.writerow([row.country_id, row.obligation_id, row.status, row.score, row.confidence, row.is_published, row.needs_review])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ihr_dashboard_export.csv"},
    )
