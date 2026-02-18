# IHR Compliance Analyzer

Repositorio publicable base para evaluación de cumplimiento RSI con:
- **Backend**: FastAPI + Postgres (pgvector) + Celery/Redis
- **Frontend**: Next.js (dashboard público read-only + panel admin)

## 1) Stack y ejecución

```bash
docker compose up --build
```

Servicios:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000/docs

## 2) Migraciones DB

```bash
cd backend
alembic upgrade head
```

## 3) Archivos de entrada (guardar en `data/`)

- `data/2IHR_Formal_Law_Matrix.xlsx`
- `data/sanitary_authority.xlsx`

> Nota: **no es obligatorio commitear los XLS al repositorio**.
> En producción (Railway/Render) puedes montar/descargar esos archivos en `data/` al iniciar o ejecutar los imports desde un job/release command.
> Si no se cargan XLS, igual deben aparecer países porque se siembran en startup.

## 4) Imports CLI

```bash
cd backend
python -m app.cli.import_data \
  --obligations ../data/2IHR_Formal_Law_Matrix.xlsx \
  --authorities ../data/sanitary_authority.xlsx
```

### Baseline de países esperado (20)
ARG, BLZ, BOL, BRA, CHL, COL, CRI, ECU, SLV, GTM, GUY, HND, MEX, NIC, PAN, PRY, PER, SUR, URY, VEN.

Si el Excel de autoridades tiene menos filas, el import:
- muestra warning de países faltantes,
- **no rompe el pipeline**.

## 5) Cobertura funcional actual

### ✅ Implementado
- Docker compose backend + db + redis + worker + frontend.
- Alembic con migraciones iniciales y evolución de metadata/auditoría.
- CLI import obligations + authorities.
- Admin UI: carga ley con metadata (país, sector, título, fechas, URL, idioma, tipo de norma/fuente).
- Pipeline: extracción, chunking, embeddings, retrieval y juez LLM.
- **Validación anti-alucinación**: no se persiste `si` sin evidencia; baja a `no`.
- Dashboard público: resumen, cobertura por sector, heatmap país×obligación, export CSV.
- Página país y página obligación.
- Auditoría: cola low-confidence + publish toggle.

### ⚠️ Pendiente / siguiente iteración
- OCR robusto de PDFs escaneados (pipeline de imagen por página completo).
- Autenticación/autorización fuerte para panel admin privado.
- UI más avanzada de revisión editorial.

## 6) Prompt juez (JSON estricto)

Plantilla en:
- `backend/app/services/judge_prompt_template.txt`

## 7) Documentación metodológica

- Metodología: `docs/methodology.md`
- Limitaciones: `docs/limitations.md`
