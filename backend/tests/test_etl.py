"""Phase 3 tests: ETL validation catches bad data, never silently drops."""

from pathlib import Path

import pandas as pd

from app.services.etl import (
    REQUIRED_COLUMNS,
    validate_dataframe,
    validate_extension,
    validate_file,
)


def _base_row(**overrides):
    row = {
        "district": "North District", "block": "ND Block A",
        "facility": "ND Block A PHC-2", "facility_type": "PHC",
        "period": "2025-01",
        "total_pregnant_women": 50, "anc_4_visits": 45,
        "total_deliveries": 40, "institutional_deliveries": 38,
        "total_infants": 50, "fully_immunized_infants": 46,
        "total_tb_patients": 10, "tb_treatment_success": 9,
        "population": 5000, "malaria_cases": 3,
        "opd_visits": 500, "opd_expected": 600,
        "sanctioned_health_workers": 10, "positioned_health_workers": 9,
        "live_births": 40, "infant_deaths": 1,
    }
    row.update(overrides)
    return row


def _df(rows: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(rows, columns=REQUIRED_COLUMNS)


def test_valid_row_passes():
    result = validate_dataframe(_df([_base_row()]))
    assert len(result.valid_rows) == 1
    assert result.errors == []
    assert result.valid_rows[0]["period"].isoformat() == "2025-01-01"


def test_missing_value_flagged():
    result = validate_dataframe(_df([_base_row(anc_4_visits="")]))
    assert len(result.valid_rows) == 0
    assert any(e.column == "anc_4_visits" and "Missing" in e.message
               for e in result.errors)


def test_negative_count_flagged():
    result = validate_dataframe(_df([_base_row(malaria_cases=-5)]))
    assert len(result.valid_rows) == 0
    assert any(e.column == "malaria_cases" and "Negative" in e.message
               for e in result.errors)


def test_numerator_exceeds_denominator_flagged():
    result = validate_dataframe(
        _df([_base_row(total_pregnant_women=50, anc_4_visits=70)])
    )
    assert len(result.valid_rows) == 0
    assert any("exceeds" in e.message for e in result.errors)


def test_bad_date_flagged():
    result = validate_dataframe(_df([_base_row(period="2026-13")]))
    assert len(result.valid_rows) == 0
    assert any(e.column == "period" for e in result.errors)


def test_duplicate_in_file_detected():
    result = validate_dataframe(_df([_base_row(), _base_row()]))
    assert len(result.valid_rows) == 1  # second copy rejected
    assert any("Duplicate" in e.message for e in result.errors)


def test_unknown_location_flagged():
    known = {("North District", "ND Block A", "ND Block A PHC-2")}
    result = validate_dataframe(
        _df([_base_row(facility="Ghost Facility")]), known_facilities=known
    )
    assert len(result.valid_rows) == 0
    assert any("Unknown location" in e.message for e in result.errors)


def test_missing_columns_header_error():
    df = pd.DataFrame([{"district": "x"}])
    result = validate_dataframe(df)
    assert result.valid_rows == []
    assert any("Missing required columns" in e.message for e in result.errors)


def test_extension_rejected():
    assert validate_extension("data.pdf") is not None
    assert validate_extension("data.csv") is None
    assert validate_extension("data.xlsx") is None


def test_dirty_file_reports_errors_without_silent_drops():
    dirty = Path(__file__).resolve().parents[1] / "data" / "hmis_dirty.csv"
    result = validate_file(dirty)
    summary = result.to_summary()
    # Nothing silently dropped: every input row is valid or has an error.
    assert summary["total_rows"] == 496
    assert summary["valid_rows"] == 486
    assert summary["invalid_rows"] == 10
    messages = " ".join(e["message"] for e in summary["errors"])
    for keyword in ("Missing", "Duplicate", "exceeds", "Negative", "Invalid date"):
        assert keyword in messages, f"expected '{keyword}' in errors"
