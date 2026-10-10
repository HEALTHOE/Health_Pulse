"""Location + indicator response schemas (flat, frontend-friendly)."""

from pydantic import BaseModel, ConfigDict


class DistrictOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str


class BlockOut(BaseModel):
    id: int
    name: str
    code: str
    district_id: int
    district_name: str | None = None


class FacilityOut(BaseModel):
    id: int
    name: str
    facility_type: str
    block_id: int
    block_name: str | None = None
    district_id: int | None = None
    district_name: str | None = None


class IndicatorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str
    unit: str
    numerator_field: str
    denominator_field: str
    formula: str
    target: float
    warning_threshold: float
    critical_threshold: float
    direction: str


class TrendPoint(BaseModel):
    month: str  # "YYYY-MM"
    value: float | None


class TrendResponse(BaseModel):
    indicator: str
    period: str = "monthly"
    data: list[TrendPoint]


class IndicatorStatusItem(BaseModel):
    code: str
    name: str
    value: float | None
    target: float
    status: str


class ScoreItem(BaseModel):
    health_score: float
    status: str
