import json
import os
from typing import List, Dict, Any
from app.models import Obligation, LawChunk
from openai import OpenAI

# Initialize with fallback
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY") or "mock-key")

def construct_prompt(obligation: Obligation, chunks: List[LawChunk]) -> str:
    """
    Construct the prompt for the LLM Judge.
    """
    context_text = "\n\n".join([f"Source {i+1} (Law ID: {c.law_id}):\n{c.text}" for i, c in enumerate(chunks)])

    prompt = f"""
    You are an expert legal analyst specializing in International Health Regulations (IHR).
    Your task is to verify if the provided national laws contain provisions that fulfill the following IHR obligation.

    **OBLIGATION TO ANALYZE:**
    - IHR Provision: {obligation.ihr_provision}
    - Normative Content: {obligation.normative_content}
    - Required Domestic Functions: {obligation.required_domestic_functions}
    - Observance Criteria: {obligation.observance}
    - Compliance Indicators: {obligation.compliance_indicator}

    **LEGAL CONTEXT (Retrieved Fragments):**
    {context_text}

    **INSTRUCTIONS:**
    1. Analyze the context to find evidence supporting compliance.
    2. Determine the status: "Yes" (Fully compliant), "Partial" (Some aspects missing), or "No" (No evidence found).
    3. Assign a confidence score (0.0 to 1.0).
    4. Extract specific evidence (Quote, Article, Reason).
    5. List missing elements.

    **OUTPUT FORMAT (JSON ONLY):**
    {{
        "status": "Yes" | "Partial" | "No",
        "confidence": 0.85,
        "evidence": [
            {{
                "law_id": "ID from source",
                "article": "Art. X",
                "quote": "Exact text...",
                "reason": "Explanation..."
            }}
        ],
        "missing": ["List of missing requirements..."],
        "notes": "Overall assessment..."
    }}
    """
    return prompt

def call_llm_judge(prompt: str) -> Dict[str, Any]:
    """
    Call the LLM to analyze the compliance.
    Returns the parsed JSON response.
    """
    if not os.getenv("OPENAI_API_KEY"):
        # Mock response for testing without API key
        return {
            "status": "Partial",
            "confidence": 0.75,
            "evidence": [
                {
                    "law_id": "MOCK_LAW_001",
                    "article": "Art. 10",
                    "quote": "The Ministry shall notify WHO within 48 hours...",
                    "reason": "Mentions notification but time window is incorrect (48h vs 24h)."
                }
            ],
            "missing": ["24 hour requirement"],
            "notes": "Mock analysis result."
        }

    try:
        response = client.chat.completions.create(
            model="gpt-4-turbo-preview",  # Or gpt-3.5-turbo if cost is a concern
            messages=[
                {"role": "system", "content": "You are a precise legal compliance assistant. Output valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return {
            "status": "Unknown",
            "confidence": 0.0,
            "evidence": [],
            "missing": ["Error during analysis"],
            "notes": f"LLM Error: {str(e)}"
        }

def analyze_obligation(obligation: Obligation, chunks: List[LawChunk]) -> Dict[str, Any]:
    prompt = construct_prompt(obligation, chunks)
    return call_llm_judge(prompt)
