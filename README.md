# IHR Compliance Analyzer

This project is a RAG-based tool to analyze national laws against International Health Regulations (IHR) obligations. It processes legal documents (PDFs), extracts text, and uses an LLM to determine compliance status for 19 specific IHR obligations across 20 Latin American countries.

## Features

- **Document Ingestion**: Upload PDF laws, extract text (with OCR fallback logic), and generate embeddings.
- **Compliance Analysis**: Automated "Judge" using LLM (GPT-4) to evaluate laws against IHR obligations.
- **Dashboard**: Heatmap visualization of compliance status (Yes/Partial/No) per country and obligation.
- **Evidence Tracking**: Citations (Article, Quote) and confidence scores for every assessment.

## Tech Stack

- **Backend**: FastAPI (Python), SQLModel, Celery (Workers).
- **Database**: PostgreSQL with `pgvector` extension.
- **Vector Store**: Embeddings stored in Postgres.
- **Queue**: Redis + Celery.
- **Frontend**: Next.js (React), TailwindCSS.
- **LLM**: OpenAI API.

## Prerequisites

- Docker & Docker Compose
- OpenAI API Key

## Setup & Run

1. **Clone the repository**

2. **Set Environment Variables**
   Create a `.env` file in the root (optional, or pass inline):
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

3. **Start Services**
   ```bash
   docker compose up --build
   ```

4. **Access the Application**
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Usage Workflow

1. Go to **Admin Panel** (`/admin`).
2. Select a **Country** (e.g., Argentina).
3. Upload a **Law** (PDF file).
   - The system will process, chunk, and embed the text in the background.
4. Click **Trigger Compliance Analysis**.
   - The worker will retrieve relevant chunks for each of the 19 obligations and assess compliance.
5. Go to **Public Dashboard** (`/dashboard`) to view the heatmap.
6. Click on a country name to view detailed evidence and gaps.

## Directory Structure

- `backend/`: FastAPI application and Celery worker.
- `frontend/`: Next.js application.
- `docker-compose.yml` service orchestration.

## Data Seeding

On startup, the application automatically seeds:
- 20 Latin American Countries.
- 19 IHR Obligations (definitions, normative content, indicators).
