from sqlmodel import Session, select
from app.database import engine, init_db
from app.models import Country, Obligation
from app.seed_data import COUNTRIES, OBLIGATIONS

def init():
    with Session(engine) as session:
        # Countries
        print("Seeding Countries...")
        for country_data in COUNTRIES:
            country = session.get(Country, country_data["id"])
            if not country:
                country = Country(**country_data)
                session.add(country)
            else:
                country.name = country_data["name"]
                session.add(country)

        # Obligations
        print("Seeding Obligations...")
        for ob_data in OBLIGATIONS:
            obligation = session.get(Obligation, ob_data["id"])
            if not obligation:
                obligation = Obligation(**ob_data)
                session.add(obligation)
            else:
                # Update fields if needed
                for key, value in ob_data.items():
                    setattr(obligation, key, value)
                session.add(obligation)

        session.commit()
        print("Seeding completed.")

def main():
    init_db()
    init()

if __name__ == "__main__":
    main()
