"""Dataset upload pipeline: save -> ETL -> upsert -> record -> recompute.

WHY: the dashboard's "Upload HMIS file" button hits one service that does
everything: validates (never silently drops), stores valid rows idempotently,
records a data_uploads row with a JSON error summary, recomputes indicators
and re-evaluates alerts. ADMIN only (enforced in the router).
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.analytics.indicator_engine import recompute_indicator_values
from app.models.enums import UploadStatus
from app.models.health_record import HealthRecord
from app.models.location import Block, District, Facility
from app.models.operational import DataUpload
from app.models.user import User
from app.services.alert_service import evaluate_alerts
from app.services.etl import (
    ALLOWED_SUFFIXES,
    MAX_FILE_MB,
    validate_extension,
    validate_file,
)
from app.utils.seed import COUNT_FIELDS

UPLOAD_DIR_NAME = "uploads"


def _error_breakdown(errors: list[dict]) -> dict[str, int]:
    counts = {"missing": 0, "range": 0, "date": 0, "duplicate": 0,
              "location": 0, "other": 0}
    for error in errors:
        message = error.get("message", "")
        if "Missing" in message:
            counts["missing"] += 1
        elif "Duplicate" in message:
            counts["duplicate"] += 1
        elif "Invalid date" in message:
            counts["date"] += 1
        elif "Unknown location" in message:
            counts["location"] += 1
        elif ("Negative" in message or "exceeds" in message
              or "Not a number" in message):
            counts["range"] += 1
        else:
            counts["other"] += 1
    return counts


def _data_dir() -> Path:
    return Path(__file__).resolve().parents[2] / "data"


def process_upload(
    db: Session, *, file_bytes: bytes, filename: str, user: User
) -> dict:
    """Validate + load a CSV/XLSX upload. Returns summary + row errors."""
    ext_error = validate_extension(filename)
    if ext_error:
        raise ValueError(ext_error)
    if len(file_bytes) > MAX_FILE_MB * 1024 * 1024:
        raise ValueError(f"File too large (max {MAX_FILE_MB}MB)")

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise ValueError(f"Unsupported file type '{suffix}'. Use CSV or XLSX.")

    upload_dir = _data_dir() / UPLOAD_DIR_NAME
    upload_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S")
    safe_name = Path(filename).name
    saved_path = upload_dir / f"{stamp}_{safe_name}"
    saved_path.write_bytes(file_bytes)

    known = {(d.name, b.name, f.name)
             for d, b, f in db.query(District, Block, Facility)
             .join(Block, Facility.block_id == Block.id)
             .join(District, Block.district_id == District.id).all()}
    result = validate_file(saved_path, known_facilities=known or None)
    summary = result.to_summary()

    facilities = {f.name: f for f in db.query(Facility).all()}
    inserted = updated = 0
    for row in result.valid_rows:
        facility = facilities.get(row["facility"])
        if not facility:
            continue
        existing = db.query(HealthRecord).filter_by(
            facility_id=facility.id, period=row["period"]).first()
        payload = {f: int(row.get(f, 0)) for f in COUNT_FIELDS}
        if existing:
            for field, value in payload.items():
                setattr(existing, field, value)
            updated += 1
        else:
            db.add(HealthRecord(facility_id=facility.id,
                                period=row["period"], **payload))
            inserted += 1
    db.commit()

    status = (UploadStatus.COMPLETED if summary["invalid_rows"] == 0
              else (UploadStatus.PARTIAL if summary["valid_rows"] > 0
                    else UploadStatus.FAILED))
    error_summary = json.dumps({
        "by_type": _error_breakdown(summary["errors"]),
        "total_errors": len(summary["errors"]),
        "sample": summary["errors"][:20],
    })
    upload = DataUpload(
        filename=safe_name, uploaded_by=user.id,
        total_rows=summary["total_rows"], valid_rows=summary["valid_rows"],
        invalid_rows=summary["invalid_rows"], status=status,
        error_summary=error_summary,
    )
    db.add(upload)
    db.commit()

    n_values = recompute_indicator_values(db)
    alerts = evaluate_alerts(db)
    return {
        "upload_id": upload.id, "filename": safe_name,
        "total_rows": summary["total_rows"], "valid_rows": summary["valid_rows"],
        "invalid_rows": summary["invalid_rows"], "status": status.value,
        "inserted": inserted, "updated": updated,
        "indicator_values_recomputed": n_values, "alerts": alerts,
        "errors": summary["errors"],
    }


def quality_overview(db: Session) -> dict:
    """Global data-quality snapshot for GET /api/data/quality."""
    from sqlalchemy import func

    total_records = db.query(func.count(HealthRecord.id)).scalar() or 0
    uploads = db.query(DataUpload).order_by(DataUpload.uploaded_at.desc()).all()
    uploaded_rows = sum(u.total_rows for u in uploads)
    valid_rows = sum(u.valid_rows for u in uploads)
    invalid_rows = sum(u.invalid_rows for u in uploads)
    completeness = (round(valid_rows / uploaded_rows * 100, 2)
                    if uploaded_rows else 100.0)
    last = uploads[0] if uploads else None
    breakdown: dict = {}
    if last and last.error_summary:
        try:
            breakdown = json.loads(last.error_summary).get("by_type", {})
        except (ValueError, AttributeError):
            breakdown = {}
    return {
        "total_records": total_records,
        "uploaded_rows": uploaded_rows,
        "valid_rows": valid_rows,
        "invalid_rows": invalid_rows,
        "completeness_pct": completeness,
        "total_uploads": len(uploads),
        "last_upload": (
            {"filename": last.filename,
             "at": last.uploaded_at.isoformat(),
             "status": last.status.value} if last else None
        ),
        "last_upload_error_breakdown": breakdown,
    }

