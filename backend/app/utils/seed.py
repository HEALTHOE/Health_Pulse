"""Idempotent seed: locations + indicators + admin user + clean dataset.

WHY: one command gives evaluators a full demo database. Re-running never
duplicates (get-or-create + upsert by facility+period). Admin credentials
come from env (ADMIN_EMAIL / ADMIN_PASSWORD), never hardcoded.

Run:  cd backend ; .\\.venv\\Scripts\\python.exe -m app.utils.seed
"""

from datetime import date
from pathlib import Path

from sqlalchemy.orm import Session

from app.analytics.indicator_engine import recompute_indicator_values
from app.analytics.registry import INDICATOR_DEFINITIONS
from app.auth.security import hash_password
from app.config import settings
from app.database import SessionLocal, init_db
from app.models.enums import IndicatorDirection
from app.models.indicator import Indicator
from app.models.location import Block, District, Facility
from app.models.user import User
from app.models.enums import UserRole
from app.models.health_record import HealthRecord
from app.services.etl import validate_file
from app.utils.generate_synthetic import BLOCKS, DISTRICTS, write_datasets


def get_or_create_district(db: Session, name: str, code: str) -> District:
    obj = db.query(District).filter_by(code=code).first()
    if obj:
        return obj
    obj = District(name=name, code=code)
    db.add(obj)
    db.flush()
    return obj


def get_or_create_block(db: Session, name: str, code: str, district_id: int) -> Block:
    obj = db.query(Block).filter_by(code=code).first()
    if obj:
        return obj
    obj = Block(name=name, code=code, district_id=district_id)
    db.add(obj)
    db.flush()
    return obj


def get_or_create_facility(
    db: Session, name: str, facility_type: str, block_id: int
) -> Facility:
    obj = db.query(Facility).filter_by(name=name, block_id=block_id).first()
    if obj:
        return obj
    obj = Facility(name=name, facility_type=facility_type, block_id=block_id)
    db.add(obj)
    db.flush()
    return obj


def seed_locations(db: Session) -> dict[str, Facility]:
    """Create districts/blocks/facilities from the synthetic layout."""
    facilities: dict[str, Facility] = {}
    for entry in DISTRICTS:
        district = get_or_create_district(db, entry["district"], entry["code"])
        for block_name in BLOCKS[entry["district"]]:
            block_code = block_name.replace(" ", "_").upper()
            block = get_or_create_block(db, block_name, block_code, district.id)
            for n in (1, 2, 3):
                ftype = "SC" if n == 1 else ("PHC" if n == 2 else "CHC")
                fname = f"{block_name} {ftype}-{n}"
                facilities[fname] = get_or_create_facility(db, fname, ftype, block.id)
    db.commit()
    return facilities


def seed_indicators(db: Session) -> int:
    """Upsert every registry entry into the indicators table."""
    count = 0
    for definition in INDICATOR_DEFINITIONS:
        obj = db.query(Indicator).filter_by(code=definition["code"]).first()
        payload = {
            "name": definition["name"],
            "description": definition["description"],
            "unit": definition["unit"],
            "numerator_field": definition["numerator_field"],
            "denominator_field": definition["denominator_field"],
            "formula": definition["formula"],
            "target": definition["target"],
            "warning_threshold": definition["warning_threshold"],
            "critical_threshold": definition["critical_threshold"],
            "direction": IndicatorDirection(definition["direction"]),
        }
        if obj:
            for key, value in payload.items():
                setattr(obj, key, value)
        else:
            db.add(Indicator(code=definition["code"], **payload))
            count += 1
    db.commit()
    return count


def seed_admin(db: Session) -> User:
    """Create the admin user from env (idempotent by email)."""
    existing = db.query(User).filter_by(email=settings.ADMIN_EMAIL).first()
    if existing:
        return existing
    admin = User(
        email=settings.ADMIN_EMAIL,
        full_name="HealthPulse Admin",
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        role=UserRole.ADMIN,
        district_id=None,
        block_id=None,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    return admin


COUNT_FIELDS = [
    "total_pregnant_women", "anc_4_visits", "total_deliveries",
    "institutional_deliveries", "total_infants", "fully_immunized_infants",
    "total_tb_patients", "tb_treatment_success", "population", "malaria_cases",
    "opd_visits", "opd_expected", "sanctioned_health_workers",
    "positioned_health_workers", "live_births", "infant_deaths",
]


def upsert_health_record(db: Session, facility_id: int, period: date, counts: dict) -> None:
    existing = (
        db.query(HealthRecord)
        .filter_by(facility_id=facility_id, period=period)
        .first()
    )
    if existing:
        for field in COUNT_FIELDS:
            setattr(existing, field, int(counts.get(field, 0)))
        return
    db.add(HealthRecord(facility_id=facility_id, period=period, **{
        f: int(counts.get(f, 0)) for f in COUNT_FIELDS
    }))


def seed_dataset(db: Session, data_dir: Path | None = None) -> dict:
    """Load the clean CSV through the ETL validator, then upsert rows."""
    data_dir = data_dir or Path(__file__).resolve().parents[2] / "data"
    clean_csv = data_dir / "hmis_clean.csv"
    if not clean_csv.exists():
        write_datasets(data_dir)
    result = validate_file(clean_csv)
    facilities = {f.name: f for f in db.query(Facility).all()}
    inserted = updated = 0
    for row in result.valid_rows:
        facility = facilities.get(row["facility"])
        if not facility:
            continue
        exists = (
            db.query(HealthRecord)
            .filter_by(facility_id=facility.id, period=row["period"])
            .first()
        )
        upsert_health_record(db, facility.id, row["period"], row)
        if exists:
            updated += 1
        else:
            inserted += 1
    db.commit()
    return {
        "inserted": inserted, "updated": updated,
        "invalid_rows": len({e.row for e in result.errors}),
    }


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_locations(db)
        new_indicators = seed_indicators(db)
        admin = seed_admin(db)
        stats = seed_dataset(db)
        n_values = recompute_indicator_values(db)
        from app.services.alert_service import evaluate_alerts

        alerts = evaluate_alerts(db)
        print(f"indicators added: {new_indicators}")
        print(f"admin: {admin.email}")
        print(f"health_records inserted={stats['inserted']} updated={stats['updated']}")
        print(f"indicator_values recomputed: {n_values}")
        print(f"alerts created={alerts['created']} resolved={alerts['resolved']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
