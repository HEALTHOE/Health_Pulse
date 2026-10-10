"""Alert + upload + admin response schemas (flat JSON)."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlertOut(BaseModel):
    id: int
    indicator_id: int | None
    indicator_code: str | None = None
    indicator_name: str | None = None
    district_id: int | None
    district_name: str | None = None
    block_id: int | None
    block_name: str | None = None
    severity: str
    status: str
    message: str
    current_value: float | None
    threshold: float | None
    period: str | None = None
    created_at: datetime | None = None


class AlertStatusUpdate(BaseModel):
    status: str  # ACKNOWLEDGED | RESOLVED (validated in router)


class UploadResponse(BaseModel):
    upload_id: int
    filename: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    status: str
    inserted: int
    updated: int
    indicator_values_recomputed: int
    alerts: dict
    errors: list[dict]


class LastUpload(BaseModel):
    filename: str
    at: str
    status: str


class QualityResponse(BaseModel):
    total_records: int
    uploaded_rows: int
    valid_rows: int
    invalid_rows: int
    completeness_pct: float
    total_uploads: int
    last_upload: LastUpload | None = None
    last_upload_error_breakdown: dict = {}


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    action: str
    resource: str
    timestamp: datetime


class UserAdminUpdate(BaseModel):
    role: str | None = None
    district_id: int | None = None
    block_id: int | None = None
    is_active: bool | None = None


class ThresholdUpdate(BaseModel):
    target: float | None = None
    warning_threshold: float | None = None
    critical_threshold: float | None = None
