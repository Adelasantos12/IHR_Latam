from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from typing import List, Optional
import shutil
import os
from datetime import datetime
from app.database import get_session, init_db
from app.models import Country, Obligation, Law, AnalysisResult, ComplianceStatus
from app.worker import ingest_law_task, analyze_country_task

app = FastAPI(title="IHR Compliance Analyzer")

# Allow all origins for simplicity in this demo
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
    return {"status": "ok", "version": "1.0.0"}

@app.get("/countries", response_model=List[Country])
def get_countries(session: Session = Depends(get_session)):
    countries = session.exec(select(Country)).all()
    return countries

@app.get("/countries/{country_id}")
def get_country_details(country_id: str, session: Session = Depends(get_session)):
    country = session.get(Country, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")

    # Fetch related laws and results
    laws = session.exec(select(Law).where(Law.country_id == country_id)).all()
    results = session.exec(select(AnalysisResult).where(AnalysisResult.country_id == country_id)).all()

    return {
        "country": country,
        "laws": laws,
        "analysis_results": results
    }

@app.post("/laws")
def upload_law(
    country_id: str = Form(...),
    title: str = Form(...),
    publication_date: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: UploadFile = File(...),
    session: Session = Depends(get_session)
):
    # Verify country exists
    country = session.get(Country, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")

    # Save file
    upload_dir = "/app/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{country_id}_{file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Create Law record
    law = Law(
        country_id=country_id,
        title=title,
        publication_date=datetime.strptime(publication_date, "%Y-%m-%d") if publication_date else None,
        url=url,
        file_path=file_path
    )
    session.add(law)
    session.commit()
    session.refresh(law)

    # Trigger Ingestion Task
    ingest_law_task.delay(law.id)

    return {"message": "Law uploaded successfully", "law_id": law.id}

@app.post("/analyze/{country_id}")
def trigger_analysis(country_id: str, session: Session = Depends(get_session)):
    country = session.get(Country, country_id)
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")

    # Trigger Analysis Task
    analyze_country_task.delay(country_id)

    return {"message": "Analysis triggered", "country_id": country_id}

@app.get("/dashboard/summary")
def get_dashboard_summary(session: Session = Depends(get_session)):
    # Calculate some stats
    total_countries = session.exec(select(Country)).all()
    total_laws = session.exec(select(Law)).all()
    results = session.exec(select(AnalysisResult)).all()

    compliance_counts = {
        "Yes": 0,
        "Partial": 0,
        "No": 0,
        "Unknown": 0
    }

    for r in results:
        if r.status in compliance_counts:
            compliance_counts[r.status] += 1

    return {
        "total_countries": len(total_countries),
        "total_laws": len(total_laws),
        "compliance_counts": compliance_counts,
        "recent_results": results[:10]
    }
