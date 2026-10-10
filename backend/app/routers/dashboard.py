"""Dashboard endpoints: summary, district ranking, block drill-down."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    assert_block_access,
    assert_district_access,
    district_exists_or_404,
    get_current_user,
)
from app.database import get_db
from app.models.enums import AggregationLevel, UserRole
from app.models.indicator import IndicatorValue
from app.models.location import Block, District, Facility
from app.models.user import User
from app.schemas.dashboard import (
    BlockDashboard,
    BlockRankingItem,
    DashboardSummary,
    DistrictDashboard,
)
from app.services.dashboard import (
    SCORE_CODES,
    block_snapshot,
    critical_alerts_count,
    district_snapshot,
    latest_period,
    parse_month,
    performance_counts,
)


router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
)


CODE_TO_KEY = {
    "ANC_COVERAGE": "anc",
    "FULL_IMMUNIZATION": "immunization",
    "TB_SUCCESS": "tb_success",
    "INST_DELIVERY": "institutional_delivery",
}


def _resolve_district(
    db: Session,
    district_id: int | None,
    user: User,
) -> District:
    """Explicit id wins; else user's district; ADMIN falls back to first."""

    if district_id is not None:
        district = district_exists_or_404(db, district_id)
        assert_district_access(db, district_id, user)
        return district

    if user.role in (
        UserRole.DISTRICT_HEALTH_OFFICER,
        UserRole.BLOCK_OFFICER,
    ):
        if not user.district_id:
            raise HTTPException(
                status_code=403,
                detail="No district assigned",
            )

        return district_exists_or_404(db, user.district_id)

    district = (
        db.query(District)
        .order_by(District.id)
        .first()
    )

    if not district:
        raise HTTPException(
            status_code=404,
            detail="No districts found",
        )

    return district


@router.get(
    "/summary",
    response_model=DashboardSummary,
    summary="District summary cards",
)
def summary(
    district_id: int | None = None,
    period: str | None = Query(
        default=None,
        description="YYYY-MM, default latest",
    ),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict:
    district = _resolve_district(
        db,
        district_id,
        current,
    )

    month = parse_month(period) or latest_period(db)

    if not month:
        raise HTTPException(
            status_code=404,
            detail="No data available yet",
        )

    snap = district_snapshot(
        db,
        district.id,
        month,
    )

    indicators = {
        CODE_TO_KEY.get(code, code.lower()): {
            "value": snap["items"].get(code, {}).get("value"),
            "status": snap["items"]
            .get(code, {})
            .get("status", "NO_DATA"),
        }
        for code in SCORE_CODES
    }

    return {
        "district": {
            "id": district.id,
            "name": district.name,
        },
        "period": month.strftime("%Y-%m"),
        "health_score": snap["score"],
        "health_status": snap["status"],
        "indicators": indicators,
        "performance": performance_counts(
            snap["items"]
        ),
        "critical_alerts": critical_alerts_count(
            db,
            district.id,
            month,
        ),
    }


@router.get(
    "/district/{district_id}",
    response_model=DistrictDashboard,
    summary="Block ranking within a district",
)
def district_view(
    district_id: int,
    period: str | None = Query(
        default=None,
        description="YYYY-MM, default latest",
    ),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict:
    district = district_exists_or_404(
        db,
        district_id,
    )

    assert_district_access(
        db,
        district_id,
        current,
    )

    month = parse_month(period) or latest_period(db)

    if not month:
        raise HTTPException(
            status_code=404,
            detail="No data available yet",
        )

    snap = district_snapshot(
        db,
        district.id,
        month,
    )

    # District-level indicator performance
    indicators = {
        CODE_TO_KEY.get(code, code.lower()): {
            "value": snap["items"].get(code, {}).get("value"),
            "status": snap["items"]
            .get(code, {})
            .get("status", "NO_DATA"),
        }
        for code in SCORE_CODES
    }

    blocks = (
        db.query(Block)
        .filter(Block.district_id == district_id)
        .order_by(Block.id)
        .all()
    )

    ranking: list[dict] = []

    for block in blocks:
        # BLOCK_OFFICER sees only their own block in the ranking.
        if (
            current.role == UserRole.BLOCK_OFFICER
            and block.id != current.block_id
        ):
            continue

        bsnap = block_snapshot(
            db,
            block.id,
            district_id,
            month,
        )

        ranking.append(
            {
                "block": {
                    "id": block.id,
                    "name": block.name,
                },
                "health_score": bsnap["score"],
                "status": bsnap["status"],
            }
        )

    ranking.sort(
        key=lambda r: r["health_score"],
        reverse=True,
    )

    return {
        "district": {
            "id": district.id,
            "name": district.name,
        },
        "period": month.strftime("%Y-%m"),
        "health_score": snap["score"],
        "health_status": snap["status"],
        "indicators": indicators,
        "blocks": ranking,
    }


@router.get(
    "/block/{block_id}",
    response_model=BlockDashboard,
    summary="Block drill-down with facility breakdown",
)
def block_view(
    block_id: int,
    period: str | None = Query(
        default=None,
        description="YYYY-MM, default latest",
    ),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict:
    block = (
        db.query(Block)
        .filter(Block.id == block_id)
        .first()
    )

    if not block:
        raise HTTPException(
            status_code=404,
            detail="Block not found",
        )

    assert_block_access(
        db,
        block_id,
        current,
    )

    district = district_exists_or_404(
        db,
        block.district_id,
    )

    month = parse_month(period) or latest_period(db)

    if not month:
        raise HTTPException(
            status_code=404,
            detail="No data available yet",
        )

    snap = block_snapshot(
        db,
        block.id,
        district.id,
        month,
    )

    indicators = {
        CODE_TO_KEY.get(code, code.lower()): {
            "value": snap["items"].get(code, {}).get("value"),
            "status": snap["items"]
            .get(code, {})
            .get("status", "NO_DATA"),
        }
        for code in SCORE_CODES
    }

    facilities = (
        db.query(Facility)
        .filter(Facility.block_id == block_id)
        .order_by(Facility.id)
        .all()
    )

    breakdown: list[dict] = []

    for facility in facilities:
        rows = (
            db.query(IndicatorValue)
            .filter(
                IndicatorValue.level
                == AggregationLevel.FACILITY,
                IndicatorValue.period == month,
                IndicatorValue.facility_id == facility.id,
            )
            .all()
        )

        from app.models.indicator import Indicator

        code_by_id = {
            i.id: i.code
            for i in db.query(Indicator).all()
        }

        components = {
            code_by_id[r.indicator_id]: r.value
            for r in rows
            if r.indicator_id in code_by_id
        }

        from app.analytics.scoring import (
            compute_health_score,
            score_band,
        )

        score = compute_health_score(
            components
        )

        breakdown.append(
            {
                "facility_id": facility.id,
                "facility_name": facility.name,
                "health_score": score,
                "status": score_band(score),
            }
        )

    breakdown.sort(
        key=lambda f: f["health_score"],
        reverse=True,
    )

    return {
        "block": {
            "id": block.id,
            "name": block.name,
        },
        "district": {
            "id": district.id,
            "name": district.name,
        },
        "period": month.strftime("%Y-%m"),
        "health_score": snap["score"],
        "health_status": snap["status"],
        "indicators": indicators,
        "facilities": breakdown,
    }