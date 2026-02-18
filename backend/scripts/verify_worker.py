import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.worker import ingest_law_task, analyze_country_task
    print("Worker tasks imported successfully.")
except Exception as e:
    print(f"Worker import failed: {e}")
    sys.exit(1)
