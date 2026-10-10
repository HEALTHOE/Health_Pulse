"""Data upload + quality endpoints."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.ops import QualityResponse, UploadResponse
from app.services.audit import log_action
from app.services.data_upload import process_upload, quality_overview

router = APIRouter(prefix="/api/data", tags=["data"])


@router.post("/upload", response_model=UploadResponse,
             status_code=status.HTTP_201_CREATED,
             summary="Upload HMIS CSV/XLSX (ADMIN only)")
def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current: User = Depends(require_roles(UserRole.ADMIN)),
) -> dict:
    try:
        content = file.file.read()
        result = process_upload(db, file_bytes=content,
                                filename=file.filename or "upload.csv",
                                user=current)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    log_action(db, current.id, "DATA_UPLOAD", f"file:{result['filename']}",
               f"total={result['total_rows']} valid={result['valid_rows']} "
               f"invalid={result['invalid_rows']}")
    return result


@router.get("/quality", response_model=QualityResponse,
            summary="Data-quality overview")
def data_quality(
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
) -> dict:
    return quality_overview(db)
