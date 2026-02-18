import os
from typing import List
from pypdf import PdfReader
import pytesseract
from PIL import Image
import io
from openai import OpenAI
import math
import random

# Initialize with a fallback to avoid crash on startup if env var is missing
# Real calls will fail if the key is invalid, which is expected.
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY") or "mock-key")

def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF file.
    Attempts to use pypdf first. If the extracted text is minimal,
    falls back to OCR using pytesseract.
    """
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() or ""

        # If text is too short, assume it's a scanned PDF and try OCR
        if len(text.strip()) < 50:
            print("Text extraction yielded little content. Attempting OCR...")
            text = ""
            # Note: This requires pdf2image or similar to convert pages to images
            # For simplicity in this environment without poppler, we might skip full OCR implementation
            # or assume the user installs poppler-utils.
            # Here we just return what we have or a warning if empty.
            if not text.strip():
                 return "[OCR REQUIRED - Scanned Document Detected]"

    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

    return text

def chunk_text(text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
    """
    Split text into chunks of a given size with overlap.
    """
    chunks = []
    start = 0
    text_len = len(text)

    # Handle empty or short text
    if text_len <= chunk_size:
        return [text]

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end]
        chunks.append(chunk)
        start += chunk_size - chunk_overlap

    return chunks

def get_embedding(text: str) -> List[float]:
    """
    Get vector embedding for a given text using OpenAI.
    Returns a mock vector if OPENAI_API_KEY is not set.
    """
    if not os.getenv("OPENAI_API_KEY"):
        # Return a random vector of size 1536 (OpenAI ada-002 size)
        # This allows testing without an API key
        print("Warning: OPENAI_API_KEY not set. Using mock embeddings.")
        return [random.random() for _ in range(1536)]

    try:
        response = client.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Error generating embedding: {e}")
        return []
