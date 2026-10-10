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
from app.models.user import User
from app.services.audit import log_action
from app.services.users import validate_user_scope
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
    error = validate_user_scope(
        db, payload.role, payload.district_id, payload.block_id)
    if error:
        raise HTTPException(status_code=400, detail=error)


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
    log_action(db, admin.id if admin else user.id, "USER_CREATE",
               f"user:{user.email}", f"role={user.role.value}")
    return user


@router.post("/login", response_model=TokenResponse, summary="Login with email+password")
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="User is deactivated")
    log_action(db, user.id, "LOGIN", f"user:{user.email}")
    return TokenResponse(
        access_token=create_access_token(user.id, user.role.value)
    )


@router.get("/me", response_model=UserOut, summary="Current user profile")
def me(current: User = Depends(get_current_user)) -> User:
    return current
