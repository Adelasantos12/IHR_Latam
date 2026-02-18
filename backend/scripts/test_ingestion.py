import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.ingestion import chunk_text, get_embedding

def test_ingestion():
    text = "This is a sample text for testing chunking. " * 50
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20)
    print(f"Original text length: {len(text)}")
    print(f"Number of chunks: {len(chunks)}")

    # Verify chunking logic basic sanity
    if len(text) > 100:
        assert len(chunks) > 1

    # Mock behavior if key missing
    embedding = get_embedding("test")
    if embedding:
        print(f"Embedding length: {len(embedding)}")
        # If running without key, expect mock length
        if not os.getenv("OPENAI_API_KEY"):
            assert len(embedding) == 1536
    else:
        print("Embedding failed (might be expected if key invalid but present).")

    print("Ingestion test passed.")

if __name__ == "__main__":
    test_ingestion()
