import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.database import engine
from app.models import Country, Obligation

def check_rows():
    try:
        with Session(engine) as session:
            countries = session.exec(select(Country)).all()
            obligations = session.exec(select(Obligation)).all()

            print(f"Countries in DB: {len(countries)}")
            print(f"Obligations in DB: {len(obligations)}")

            if len(countries) == 0:
                print("WARNING: No countries found in DB. Need to run initial_data.py")
            if len(obligations) == 0:
                print("WARNING: No obligations found in DB. Need to run initial_data.py")

    except Exception as e:
        print(f"Error connecting to DB: {e}")

if __name__ == "__main__":
    check_rows()
