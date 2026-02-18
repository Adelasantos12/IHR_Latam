# IHR Compliance Analyzer

This repository is a baseline implementation of an IHR legal-compliance platform with FastAPI + Postgres/pgvector + Redis/Celery + Next.js.

## Features

- **Document ingestion**: Upload PDF laws, extract text, chunk, and embed.
- **Compliance analysis**: LLM-based evaluator per obligation with evidence payloads.
- **Admin/Public UI**: `/admin` upload flow and public compliance dashboard.
- **Queue architecture**: Redis + Celery workers for background ingestion/analysis.
- **Migrations**: Alembic migration scaffold included under `backend/alembic`.
- **CLI imports**:
  - obligations matrix (`2IHR_Formal_Law_Matrix.xlsx`) → `obligation`
  - sanitary authorities (`sanitary_authority.xlsx`) → `authority`

## Setup

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

## Data files (required)

Store source files under `data/` in the repository root:

- `data/2IHR_Formal_Law_Matrix.xlsx`
- `data/sanitary_authority.xlsx`

## Run imports

```bash
cd backend
python -m app.cli.import_data \
  --obligations ../data/2IHR_Formal_Law_Matrix.xlsx \
  --authorities ../data/sanitary_authority.xlsx
```

Behavior for authorities import:
- Upserts rows into `authority` table.
- Uses a LATAM-18 baseline.
- If the Excel has only 17 countries, it logs a **warning** listing missing country/countries and **does not break**.

## Migrations (Alembic)

```bash
cd backend
alembic upgrade head
```

## Objective-fit quick assessment

Current status against requested scope:

- ✅ Docker stack with backend + db(pgvector) + redis + worker + frontend.
- ✅ Alembic migration scaffold present.
- ✅ CLI imports for obligations + authorities.
- ⚠️ Admin UI exists but metadata fields are still partial (country/title/date/url + file only).
- ⚠️ Pipeline has extraction/chunk/embedding/retrieval + judge call, but no explicit anti-hallucination validator layer yet.
- ⚠️ Public dashboard exists but does not yet fully expose all requested analytics (sector coverage, CSV export, obligation page).
- ⚠️ Audit UX (low-confidence review + publish toggle) missing.
- ⚠️ Documentation still needs explicit methodology and limitations docs.

## Judge prompt template

A strict ES/PT JSON prompt template is included at:

- `backend/app/services/judge_prompt_template.txt`

It enforces:
- no hallucinations
- strict JSON output
- status `no|parcial|si`
- required traceable evidence
- no `si` without explicit legal basis.
