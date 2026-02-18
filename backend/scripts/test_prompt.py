import sys
import os

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.analysis import construct_prompt
from app.models import Obligation, LawChunk

def test_prompt_construction():
    obligation = Obligation(
        id="IHR_Art04_NFP_Designation",
        ihr_provision="Art. 4",
        normative_content="Establish National IHR Focal Point accessible 24/7.",
        required_domestic_functions="Formal designation authority; intersectoral information access.",
        observance="Explicit legal designation of NFP.",
        compliance_indicator="NFP established by law (Yes/No)."
    )

    chunks = [
        LawChunk(
            law_id=101,
            chunk_index=0,
            text="The Ministry of Health shall act as the National Focal Point.",
            embedding=[0.1]*1536
        )
    ]

    prompt = construct_prompt(obligation, chunks)
    print("Generated Prompt:")
    print(prompt)

    assert "IHR_Art04_NFP_Designation" in prompt or "Art. 4" in prompt
    assert "The Ministry of Health shall act as the National Focal Point." in prompt

if __name__ == "__main__":
    test_prompt_construction()
