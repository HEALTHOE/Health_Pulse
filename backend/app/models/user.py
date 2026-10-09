"""User model with role-based scoping.

WHY: RBAC scoping (ADMIN = everything, DHO = one district,
BLOCK_OFFICER = one block) is enforced in every endpoint via
district_id / block_id on the user row.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    full_name: Mapped[str] = mapped_column(String(150), nullable=False, default="")
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True),
        nullable=False,
        default=UserRole.BLOCK_OFFICER,
    )
    # Nullable scoping: ADMIN leaves both NULL; DHO sets district_id;
    # BLOCK_OFFICER sets district_id + block_id.
    district_id: Mapped[int | None] = mapped_column(
        ForeignKey("districts.id", ondelete="SET NULL"), nullable=True, index=True
    )
    block_id: Mapped[int | None] = mapped_column(
        ForeignKey("blocks.id", ondelete="SET NULL"), nullable=True, index=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email!r}, role={self.role})"
