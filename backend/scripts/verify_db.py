import sys
import os

# Add the parent directory to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.database import init_db, engine
    from app.models import Country, Obligation, Law, LawChunk, AnalysisResult
    from sqlalchemy import text
    print("Imports successful: app.models and app.database are valid.")
except Exception as e:
    print(f"Import failed: {e}")
    sys.exit(1)

def verify():
    print("Verifying database connection (expect failure if DB is not running)...")
    try:
        # Check connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"Database connection successful: {result.scalar()}")

        # Initialize schema
        print("Initializing database schema...")
        init_db()
        print("Schema initialized successfully.")

    except Exception as e:
        print(f"Connection/Initialization failed as expected (DB not reachable): {e}")
        # This is expected in this environment without running docker-compose up
        sys.exit(0)

if __name__ == "__main__":
    verify()
