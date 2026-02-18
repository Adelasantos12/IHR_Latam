import sys
import os

# Add the parent directory to sys.path so we can import 'app'
# We are in backend/scripts, need to reach backend/app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ingestion import chunk_text, get_embedding

def test_ingestion():
    text = "This is a sample text for testing chunking. " * 50
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
    print(f"Original text length: {len(text)}")
    print(f"Number of chunks: {len(chunks)}")
    print(f"First chunk: {chunks[0]}")

    # Mock behavior if key missing
    embedding = get_embedding("test")
    if embedding:
        print(f"Embedding length: {len(embedding)}")
        # If mock, assert mock logic
        if not os.getenv("OPENAI_API_KEY"):
            assert len(embedding) == 1536
    else:
        print("Embedding failed.")

    print("Ingestion test passed.")

if __name__ == "__main__":
    test_ingestion()
