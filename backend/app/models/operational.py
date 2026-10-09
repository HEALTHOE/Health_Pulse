"""Data upload tracking + audit logs.

WHY: every CSV/XLSX upload is recorded (row counts + error summary) so
data-quality demos are reproducible, and every sensitive action is
audited (login, upload, user changes, threshold changes, alert ACK).
"""

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import UploadStatus


class DataUpload(Base):
    __tablename__ = "data_uploads"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    uploaded_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    valid_rows: Mapped[int] = mapped_column(Integer, default=0)
    invalid_rows: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[UploadStatus] = mapped_column(
        Enum(UploadStatus, name="upload_status", native_enum=True),
        nullable=False,
        default=UploadStatus.COMPLETED,
    )
    error_summary: Mapped[str] = mapped_column(Text, nullable=False, default="")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # e.g. LOGIN, DATA_UPLOAD, USER_CREATE
    resource: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )
    details: Mapped[str] = mapped_column(Text, nullable=False, default="")
