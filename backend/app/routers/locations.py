"""Location endpoints (all auth + scope-filtered, flat JSON)."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import (
    assert_block_access,
    assert_district_access,
    assert_facility_access,
    district_exists_or_404,
    get_current_user,
)
from app.database import get_db
from app.models.enums import UserRole
from app.models.location import Block, District, Facility
from app.models.user import User
from app.schemas.catalog import BlockOut, DistrictOut, FacilityOut

router = APIRouter(prefix="/api", tags=["locations"])


def _visible_district_ids(user: User) -> list[int] | None:
    """None = all districts (ADMIN); else the allowed subset."""
    if user.role == UserRole.ADMIN:
        return None
    if user.role == UserRole.DISTRICT_HEALTH_OFFICER:
        return [user.district_id] if user.district_id else []
    return [user.district_id] if user.district_id else []


@router.get("/districts", response_model=list[DistrictOut],
            summary="List districts in your scope")
def list_districts(
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db), current: User = Depends(get_current_user),
) -> list[District]:
    query = db.query(District).order_by(District.id)
    allowed = _visible_district_ids(current)
    if allowed is not None:
        query = query.filter(District.id.in_(allowed))
    return query.offset(skip).limit(limit).all()


@router.get("/districts/{district_id}", response_model=DistrictOut,
            summary="District detail")
def get_district(
    district_id: int, db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> District:
    district = district_exists_or_404(db, district_id)
    assert_district_access(db, district_id, current)
    return district


@router.get("/blocks", response_model=list[BlockOut], summary="List blocks in your scope")
def list_blocks(
    district_id: int | None = None,
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db), current: User = Depends(get_current_user),
) -> list[dict]:
    query = db.query(Block, District.name).join(
        District, Block.district_id == District.id
    ).order_by(Block.id)
    if district_id is not None:
        district_exists_or_404(db, district_id)
        assert_district_access(db, district_id, current)
        query = query.filter(Block.district_id == district_id)
    elif current.role == UserRole.DISTRICT_HEALTH_OFFICER:
        query = query.filter(Block.district_id == current.district_id)
    elif current.role == UserRole.BLOCK_OFFICER:
        query = query.filter(Block.id == current.block_id)
    rows = query.offset(skip).limit(limit).all()
    return [{"id": b.id, "name": b.name, "code": b.code,
             "district_id": b.district_id, "district_name": dname}
            for b, dname in rows]


@router.get("/blocks/{block_id}", response_model=BlockOut, summary="Block detail")
def get_block(
    block_id: int, db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict:
    row = db.query(Block, District.name).join(
        District, Block.district_id == District.id
    ).filter(Block.id == block_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Block not found")
    block, district_name = row
    assert_block_access(db, block_id, current)
    return {"id": block.id, "name": block.name, "code": block.code,
            "district_id": block.district_id, "district_name": district_name}


@router.get("/facilities", response_model=list[FacilityOut],
            summary="List facilities in your scope")
def list_facilities(
    block_id: int | None = None, district_id: int | None = None,
    skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db), current: User = Depends(get_current_user),
) -> list[dict]:
    query = (
        db.query(Facility, Block, District)
        .join(Block, Facility.block_id == Block.id)
        .join(District, Block.district_id == District.id)
        .order_by(Facility.id)
    )
    if block_id is not None:
        assert_block_access(db, block_id, current)
        query = query.filter(Facility.block_id == block_id)
    elif district_id is not None:
        district_exists_or_404(db, district_id)
        assert_district_access(db, district_id, current)
        query = query.filter(Block.district_id == district_id)
    elif current.role == UserRole.DISTRICT_HEALTH_OFFICER:
        query = query.filter(Block.district_id == current.district_id)
    elif current.role == UserRole.BLOCK_OFFICER:
        query = query.filter(Facility.block_id == current.block_id)
    rows = query.offset(skip).limit(limit).all()
    return [{"id": f.id, "name": f.name, "facility_type": f.facility_type,
             "block_id": f.block_id, "block_name": b.name,
             "district_id": d.id, "district_name": d.name}
            for f, b, d in rows]


@router.get("/facilities/{facility_id}", response_model=FacilityOut,
            summary="Facility detail")
def get_facility(
    facility_id: int, db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict:
    row = (
        db.query(Facility, Block, District)
        .join(Block, Facility.block_id == Block.id)
        .join(District, Block.district_id == District.id)
        .filter(Facility.id == facility_id).first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Facility not found")
    facility, block, district = row
    assert_facility_access(db, facility_id, current)
    return {"id": facility.id, "name": facility.name,
            "facility_type": facility.facility_type, "block_id": facility.block_id,
            "block_name": block.name, "district_id": district.id,
            "district_name": district.name}
