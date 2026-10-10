"""Indicator catalog + trend endpoints (auth + scope-filtered)."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.analytics.trends import build_monthly_series
from app.auth.dependencies import (
    assert_block_access,
    assert_district_access,
    assert_facility_access,
    get_current_user,
)
from app.database import get_db
from app.models.enums import AggregationLevel
from app.models.indicator import Indicator, IndicatorValue
from app.models.user import User
from app.schemas.catalog import IndicatorOut, TrendResponse

router = APIRouter(prefix="/api/indicators", tags=["indicators"])


@router.get("", response_model=list[IndicatorOut], summary="List all indicators")
def list_indicators(
    db: Session = Depends(get_db), current: User = Depends(get_current_user)
) -> list[Indicator]:
    return db.query(Indicator).order_by(Indicator.id).all()


@router.get("/{indicator_id}", response_model=IndicatorOut, summary="Indicator detail")
def get_indicator(
    indicator_id: int, db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> Indicator:
    indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")
    return indicator


@router.get("/{indicator_id}/trend", response_model=TrendResponse,
            summary="Monthly trend series for charts")
def indicator_trend(
    indicator_id: int,
    level: AggregationLevel = AggregationLevel.DISTRICT,
    district_id: int | None = None,
    block_id: int | None = None,
    facility_id: int | None = None,
    from_month: str | None = Query(default=None, alias="from"),
    to_month: str | None = Query(default=None, alias="to"),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict:
    indicator = db.query(Indicator).filter(Indicator.id == indicator_id).first()
    if not indicator:
        raise HTTPException(status_code=404, detail="Indicator not found")

    # Scope checks match the requested granularity.
    if facility_id is not None:
        assert_facility_access(db, facility_id, current)
    elif block_id is not None:
        assert_block_access(db, block_id, current)
    elif district_id is not None:
        assert_district_access(db, district_id, current)

    query = db.query(IndicatorValue).filter(
        IndicatorValue.indicator_id == indicator_id,
        IndicatorValue.level == level,
    )
    if district_id is not None:
        query = query.filter(IndicatorValue.district_id == district_id)
    if block_id is not None:
        query = query.filter(IndicatorValue.block_id == block_id)
    if facility_id is not None:
        query = query.filter(IndicatorValue.facility_id == facility_id)

    def month_start(raw: str | None) -> date | None:
        if not raw:
            return None
        text = raw.strip()[:7]
        try:
            year, month = int(text[:4]), int(text[5:7])
            return date(year, month, 1)
        except (ValueError, IndexError):
            raise HTTPException(
                status_code=422, detail=f"Invalid month '{raw}'. Use YYYY-MM."
            )

    start, end = month_start(from_month), month_start(to_month)
    if start:
        query = query.filter(IndicatorValue.period >= start)
    if end:
        query = query.filter(IndicatorValue.period <= end)
    rows = query.order_by(IndicatorValue.period).all()
    return build_monthly_series(
        indicator.name, [(r.period, r.value) for r in rows]
    )
