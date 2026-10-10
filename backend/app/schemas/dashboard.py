"""Dashboard response schemas (flat JSON for React charts)."""

from pydantic import BaseModel


class DistrictRef(BaseModel):
    id: int
    name: str


class BlockRef(BaseModel):
    id: int
    name: str


class DashboardIndicatorItem(BaseModel):
    value: float | None
    status: str


class PerformanceCounts(BaseModel):
    normal: int
    warning: int
    critical: int


class DashboardSummary(BaseModel):
    district: DistrictRef
    period: str  # "YYYY-MM"
    health_score: float
    health_status: str
    indicators: dict[str, DashboardIndicatorItem]
    performance: PerformanceCounts
    critical_alerts: int


class BlockRankingItem(BaseModel):
    block: BlockRef
    health_score: float
    status: str


class DistrictDashboard(BaseModel):
    district: DistrictRef
    period: str
    health_score: float
    health_status: str
    blocks: list[BlockRankingItem]  # sorted desc for ranking charts


class FacilityBreakdownItem(BaseModel):
    facility_id: int
    facility_name: str
    health_score: float
    status: str


class BlockDashboard(BaseModel):
    block: BlockRef
    district: DistrictRef
    period: str
    health_score: float
    health_status: str
    indicators: dict[str, DashboardIndicatorItem]
    facilities: list[FacilityBreakdownItem]
