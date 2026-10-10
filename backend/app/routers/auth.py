"""Auth endpoints: register / login / me. Routers hold NO business logic
beyond orchestration; hashing lives in auth/security, tokens in auth/jwt.

Registration policy (default, admin-only): the very first user (empty DB)
is open bootstrap; afterwards only ADMIN can create users (all roles).
Public self-registration stays disabled so privileged roles can't be
self-granted. Tell the team before changing this contract.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt import create_access_token, decode_token
from app.auth.security import hash_password, verify_password
from app.database import get_db
from app.models.enums import UserRole
from app.models.location import Block
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
_optional_bearer = HTTPBearer(auto_error=False)


def _validate_scope(db: Session, payload: RegisterRequest) -> None:
    """Enforce role->scope rules; raise 400 on inconsistent scope."""
    if payload.role == UserRole.ADMIN:
        if payload.district_id is not None or payload.block_id is not None:
            raise HTTPException(
                status_code=400, detail="ADMIN must not have district/block scope"
            )
    elif payload.role == UserRole.DISTRICT_HEALTH_OFFICER:
        if payload.district_id is None:
            raise HTTPException(
                status_code=400, detail="District officer requires district_id"
            )
        if payload.block_id is not None:
            raise HTTPException(
                status_code=400, detail="District officer must not have block_id"
            )
    else:  # BLOCK_OFFICER
        if payload.block_id is None:
            raise HTTPException(
                status_code=400, detail="Block officer requires block_id"
            )
        block = db.query(Block).filter(Block.id == payload.block_id).first()
        if not block:
            raise HTTPException(status_code=400, detail="Unknown block_id")
        if payload.district_id is not None and payload.district_id != block.district_id:
            raise HTTPException(
                status_code=400, detail="district_id does not match block's district"
            )


def _optional_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_optional_bearer),
    db: Session = Depends(get_db),
) -> User | None:
    """Return the ADMIN user for a valid admin token, else None."""
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user = db.query(User).filter(User.id == int(payload.get("sub", 0))).first()
    except (ValueError, TypeError, AttributeError):
        return None
    if user and user.is_active and user.role == UserRole.ADMIN:
        return user
    return None


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED,
             summary="Create a user (bootstrap open; afterwards ADMIN only)")
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    admin: User | None = Depends(_optional_admin),
) -> User:
    if db.query(User).count() > 0 and admin is None:
        raise HTTPException(
            status_code=403, detail="Only ADMIN can create users"
        )
    _validate_scope(db, payload)
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        district_id=payload.district_id,
        block_id=payload.block_id,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse, summary="Login with email+password")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User is deactivated")
    return TokenResponse(
        access_token=create_access_token(user.id, user.role.value)
    )


@router.get("/me", response_model=UserOut, summary="Current user profile")
def me(current: User = Depends(get_current_user)) -> User:
    return current
