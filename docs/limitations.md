# Limitaciones conocidas

## Extracción y OCR
- El flujo actual prioriza PDF digital con `pypdf`.
- Si el PDF está escaneado, se activa fallback básico con aviso; OCR completo depende del entorno (tesseract + conversión de páginas).

## Recuperación y ranking
- El retrieval usa embeddings y distancia vectorial; resultados dependen de calidad de chunking y del texto disponible.

## Cobertura documental
- La evaluación depende de leyes cargadas y links oficiales disponibles.
- Ausencia de normas cargadas no implica incumplimiento real del país.

## Riesgo LLM
- Aunque hay validación anti-alucinación, el razonamiento LLM puede requerir revisión humana para casos ambiguos.

## UI/Operación
- El panel admin es funcional pero minimalista; no incluye aún autenticación fuerte ni flujos multi-rol.
