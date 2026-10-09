"""Alert model for threshold breaches and persistent underperformance.

WHY: alerts turn analytics into action. Severity comes from the same
central thresholds as indicators, so backend and dashboard always agree.
Duplicates are prevented per indicator+area+period (see alert service).
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import AlertSeverity, AlertStatus


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    indicator_id: Mapped[int | None] = mapped_column(
        ForeignKey("indicators.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    district_id: Mapped[int | None] = mapped_column(
        ForeignKey("districts.id", ondelete="CASCADE"), nullable=True, index=True
    )
    block_id: Mapped[int | None] = mapped_column(
        ForeignKey("blocks.id", ondelete="CASCADE"), nullable=True, index=True
    )
    facility_id: Mapped[int | None] = mapped_column(
        ForeignKey("facilities.id", ondelete="CASCADE"), nullable=True, index=True
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, name="alert_severity", native_enum=True),
        nullable=False,
        index=True,
    )
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alert_status", native_enum=True),
        nullable=False,
        default=AlertStatus.ACTIVE,
        index=True,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    current_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    threshold: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Reporting month this alert belongs to (None = non-period alert).
    period: Mapped[date | None] = mapped_column(Date, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    def __repr__(self) -> str:
        return f"Alert(id={self.id}, severity={self.severity}, status={self.status})"
