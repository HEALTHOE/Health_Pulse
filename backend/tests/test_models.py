"""Phase 2 test: all tables create and relationships wire correctly."""

from app.database import Base
from app.models import Block, District, Facility, HealthRecord  # noqa: F401
from datetime import date


def test_tables_create_and_relationships(db_session):
    district = District(name="TestDistrict", code="TD01")
    db_session.add(district)
    db_session.flush()

    block = Block(name="TestBlock", code="TB01", district_id=district.id)
    db_session.add(block)
    db_session.flush()

    facility = Facility(name="TestPHC", facility_type="PHC", block_id=block.id)
    db_session.add(facility)
    db_session.flush()

    record = HealthRecord(
        facility_id=facility.id,
        period=date(2026, 1, 1),
        total_pregnant_women=100,
        anc_4_visits=80,
    )
    db_session.add(record)
    db_session.commit()

    assert district.blocks[0].id == block.id
    assert block.facilities[0].id == facility.id
    assert facility.health_records[0].period == date(2026, 1, 1)

    # Unique constraint: duplicate facility+period must fail
    from sqlalchemy.exc import IntegrityError

    dup = HealthRecord(facility_id=facility.id, period=date(2026, 1, 1))
    db_session.add(dup)
    try:
        db_session.commit()
        assert False, "expected IntegrityError for duplicate facility+period"
    except IntegrityError:
        db_session.rollback()
