# Metodología de evaluación (Sí/Parcial/No)

## Unidad de análisis
- País × obligación RSI.
- Evidencia legal recuperada por RAG (top-k fragmentos por obligación).

## Criterios
- **Sí (score=1)**: existe base legal explícita (competencia/poder/obligación/procedimiento) y evidencia citada.
- **Parcial (score=0.5)**: hay indicios normativos, pero faltan elementos clave de implementación.
- **No (score=0)**: no hay base legal explícita o no hay evidencia suficiente.

## Regla anti-alucinación
- El sistema no permite persistir `si` sin evidencia.
- Si el LLM responde `si` sin evidencia, se degrada automáticamente a `no` y se marca en notas.

## Revisión humana
- Todo resultado con confidence < 0.7 se marca `needs_review=true`.
- En panel admin, el analista puede corregir estado/notas y activar `publish`.
