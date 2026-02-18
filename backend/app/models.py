from typing import Optional, List, Dict
from sqlmodel import Field, SQLModel, Relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, JSON
from datetime import datetime
import enum

class ComplianceStatus(str, enum.Enum):
    YES = "Yes"
    NO = "No"
    PARTIAL = "Partial"
    UNKNOWN = "Unknown"

class Country(SQLModel, table=True):
    id: str = Field(primary_key=True)  # ISO Code (e.g., ARG)
    name: str

    laws: List["Law"] = Relationship(back_populates="country")
    analysis_results: List["AnalysisResult"] = Relationship(back_populates="country")
    authorities: List["Authority"] = Relationship(back_populates="country")

class Obligation(SQLModel, table=True):
    id: str = Field(primary_key=True)  # e.g., IHR_Art04_NFP_Designation
    ihr_provision: str
    normative_content: str
    required_domestic_functions: str
    observance: str
    compliance_indicator: str

    analysis_results: List["AnalysisResult"] = Relationship(back_populates="obligation")

class Law(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    country_id: str = Field(foreign_key="country.id")
    title: str
    publication_date: Optional[datetime] = None
    url: Optional[str] = None
    file_path: Optional[str] = None
    full_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    country: Country = Relationship(back_populates="laws")
    chunks: List["LawChunk"] = Relationship(back_populates="law")

class LawChunk(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    law_id: int = Field(foreign_key="law.id")
    chunk_index: int
    text: str
    embedding: List[float] = Field(sa_column=Column(Vector(1536)))  # OpenAI ada-002 dimension

    law: Law = Relationship(back_populates="chunks")

class AnalysisResult(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    country_id: str = Field(foreign_key="country.id")
    obligation_id: str = Field(foreign_key="obligation.id")

    status: ComplianceStatus
    confidence: float
    evidence: List[Dict] = Field(default=[], sa_column=Column(JSON))
    missing_info: List[str] = Field(default=[], sa_column=Column(JSON))
    notes: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    country: Country = Relationship(back_populates="analysis_results")
    obligation: Obligation = Relationship(back_populates="analysis_results")


class Authority(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    country_id: str = Field(foreign_key="country.id", unique=True, index=True)
    authority_name: str
    source_url: Optional[str] = None
    notes: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    country: Country = Relationship(back_populates="authorities")
