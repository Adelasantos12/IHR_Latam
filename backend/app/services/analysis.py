import json
import os
from pathlib import Path
from typing import List, Dict, Any
from app.models import Obligation, LawChunk
from openai import OpenAI

# Initialize with fallback
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY") or "mock-key")

PROMPT_TEMPLATE_PATH = Path(__file__).with_name("judge_prompt_template.txt")
PROMPT_TEMPLATE = PROMPT_TEMPLATE_PATH.read_text(encoding="utf-8")


def construct_prompt(obligation: Obligation, chunks: List[LawChunk], country: str = "unknown", language: str = "mixed") -> str:
    """
    Construct the strict JSON prompt for the LLM Judge.
    """
    evidence_rows = []
    for i, c in enumerate(chunks, start=1):
        evidence_rows.append(
            (
                f"Fragmento {i}: chunk_id={c.id}, law_id={c.law_id}, law_title=unknown, "
                f"publication_date=unknown, last_amendment_date=unknown, source_url=unknown, "
                f"sector_id=unknown, article_label=chunk_{c.chunk_index}, text={c.text}"
            )
        )

    return PROMPT_TEMPLATE.format(
        obligation_id=obligation.id,
        ihr_provision=obligation.ihr_provision,
        normative_content=obligation.normative_content,
        required_domestic_functions=obligation.required_domestic_functions,
        observance=obligation.observance,
        compliance_indicator=obligation.compliance_indicator,
        country=country,
        language=language,
        EVIDENCE_CHUNKS_HERE="\n".join(evidence_rows),
    )


def call_llm_judge(prompt: str) -> Dict[str, Any]:
    """
    Call the LLM to analyze the compliance.
    Returns the parsed JSON response.
    """
    if not os.getenv("OPENAI_API_KEY"):
        # Mock response for testing without API key
        return {
            "status": "parcial",
            "score": 0.5,
            "confidence": 0.75,
            "evidence": [
                {
                    "chunk_id": "MOCK_CHUNK_001",
                    "law_id": "MOCK_LAW_001",
                    "law_title": "Ley Sanitaria Mock",
                    "article_label": "Art. 10",
                    "quote": "The Ministry shall notify WHO within 48 hours...",
                    "reason": "Mentions notification but time window is incorrect (48h vs 24h)."
                }
            ],
            "missing": ["24 hour requirement"],
            "notes": "Mock analysis result."
        }

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un asistente jurídico preciso. Entrega JSON válido estricto."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return {
            "status": "no",
            "score": 0,
            "confidence": 0.0,
            "evidence": [],
            "missing": ["Error during analysis"],
            "notes": f"LLM Error: {str(e)}"
        }


def analyze_obligation(obligation: Obligation, chunks: List[LawChunk], country: str = "unknown") -> Dict[str, Any]:
    prompt = construct_prompt(obligation, chunks, country=country)
    return call_llm_judge(prompt)
