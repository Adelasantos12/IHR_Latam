import sys
import os

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.analysis import analyze_obligation
from app.models import Obligation, LawChunk
import json

def test_analysis():
    # Mock data
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
            law_id=1,
            chunk_index=0,
            text="The Ministry of Health shall act as the National Focal Point for IHR implementation.",
            embedding=[0.1]*1536
        ),
        LawChunk(
            law_id=1,
            chunk_index=1,
            text="The Ministry must be accessible at all times for communication with WHO.",
            embedding=[0.2]*1536
        )
    ]

    print("Testing analysis logic...")
    result = analyze_obligation(obligation, chunks)

    print("Result:")
    print(json.dumps(result, indent=2))

    assert "status" in result
    assert "confidence" in result
    assert isinstance(result["evidence"], list)

    print("Analysis test passed.")

if __name__ == "__main__":
    test_analysis()
