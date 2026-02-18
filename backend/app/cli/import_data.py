import argparse
import logging
from pathlib import Path
from typing import Dict, Iterable

from sqlmodel import Session, select

from app.database import engine, init_db
from app.models import Authority, Country, Obligation

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

EXPECTED_COUNTRY_ISO = {
    "ARG", "BLZ", "BOL", "BRA", "CHL", "COL", "CRI", "ECU", "SLV", "GTM",
    "GUY", "HND", "MEX", "NIC", "PAN", "PRY", "PER", "SUR", "URY", "VEN"
}

COUNTRY_ALIASES: Dict[str, str] = {
    "argentina": "ARG",
    "bolivia": "BOL",
    "brazil": "BRA",
    "brasil": "BRA",
    "chile": "CHL",
    "colombia": "COL",
    "costa rica": "CRI",
    "cuba": "CUB",
    "dominican republic": "DOM",
    "república dominicana": "DOM",
    "ecuador": "ECU",
    "el salvador": "SLV",
    "guatemala": "GTM",
    "honduras": "HND",
    "mexico": "MEX",
    "méxico": "MEX",
    "nicaragua": "NIC",
    "panama": "PAN",
    "panamá": "PAN",
    "paraguay": "PRY",
    "peru": "PER",
    "perú": "PER",
    "uruguay": "URY",
}


def _normalize_country_to_iso(value: str | None) -> str | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    if len(raw) == 3 and raw.upper().isalpha():
        return raw.upper()
    return COUNTRY_ALIASES.get(raw.lower())


def _required_columns(df, columns: Iterable[str], source: str) -> None:
    missing = [col for col in columns if col not in df.columns]
    if missing:
        raise ValueError(f"{source} is missing required columns: {missing}")


def import_obligations(path: Path) -> int:
    import pandas as pd
    df = pd.read_excel(path)
    required = [
        "obligation_id",
        "ihr_provision",
        "normative_content",
        "required_domestic_functions",
        "observance",
        "compliance_indicator",
    ]
    _required_columns(df, required, "obligations file")

    upserted = 0
    with Session(engine) as session:
        for record in df.to_dict(orient="records"):
            payload = {
                "id": str(record["obligation_id"]).strip(),
                "ihr_provision": str(record["ihr_provision"]),
                "normative_content": str(record["normative_content"]),
                "required_domestic_functions": str(record["required_domestic_functions"]),
                "observance": str(record["observance"]),
                "compliance_indicator": str(record["compliance_indicator"]),
            }
            if not payload["id"]:
                logger.warning("Skipping obligation row with empty obligation_id")
                continue

            obligation = session.get(Obligation, payload["id"])
            if obligation:
                for key, value in payload.items():
                    setattr(obligation, key, value)
            else:
                obligation = Obligation(**payload)
            session.add(obligation)
            upserted += 1

        session.commit()

    return upserted


def import_authorities(path: Path) -> tuple[int, set[str]]:
    import pandas as pd
    df = pd.read_excel(path)
    lower_map = {c.lower().strip(): c for c in df.columns}
    country_col = lower_map.get("country") or lower_map.get("country_name") or lower_map.get("pais")
    name_col = lower_map.get("authority") or lower_map.get("authority_name") or lower_map.get("autoridad")
    url_col = lower_map.get("link") or lower_map.get("url") or lower_map.get("source_url")

    if not country_col or not name_col:
        raise ValueError(
            "authorities file must include country/country_name and authority/authority_name columns"
        )

    upserted = 0
    found_isos: set[str] = set()

    with Session(engine) as session:
        for row in df.to_dict(orient="records"):
            iso = _normalize_country_to_iso(row.get(country_col))
            if not iso:
                logger.warning("Skipping authority row with unknown country value: %s", row.get(country_col))
                continue

            found_isos.add(iso)
            country = session.get(Country, iso)
            if not country:
                country = Country(id=iso, name=str(row.get(country_col)).strip())
                session.add(country)
                session.flush()

            authority = session.exec(select(Authority).where(Authority.country_id == iso)).first()
            if authority:
                authority.authority_name = str(row.get(name_col, "")).strip()
                authority.source_url = str(row.get(url_col, "")).strip() if url_col else None
                authority.notes = "imported_from_sanitary_authority.xlsx"
            else:
                authority = Authority(
                    country_id=iso,
                    authority_name=str(row.get(name_col, "")).strip(),
                    source_url=str(row.get(url_col, "")).strip() if url_col else None,
                    notes="imported_from_sanitary_authority.xlsx",
                )
            session.add(authority)
            upserted += 1

        session.commit()

    missing = EXPECTED_COUNTRY_ISO.difference(found_isos)
    return upserted, missing


def main() -> None:
    parser = argparse.ArgumentParser(description="Import IHR obligations and sanitary authorities from Excel files.")
    parser.add_argument("--obligations", default="data/2IHR_Formal_Law_Matrix.xlsx")
    parser.add_argument("--authorities", default="data/sanitary_authority.xlsx")
    args = parser.parse_args()

    init_db()

    obligations_path = Path(args.obligations)
    authorities_path = Path(args.authorities)

    if not obligations_path.exists() or not authorities_path.exists():
        raise FileNotFoundError(
            f"Expected files in data/: {obligations_path} and {authorities_path}."
        )

    obligation_count = import_obligations(obligations_path)
    authority_count, missing_countries = import_authorities(authorities_path)

    logger.info("Imported obligations: %s", obligation_count)
    logger.info("Imported authorities: %s", authority_count)
    if missing_countries:
        logger.warning(
            "Authorities import finished with missing countries in LATAM-20 baseline: %s",
            ", ".join(sorted(missing_countries)),
        )


if __name__ == "__main__":
    main()
