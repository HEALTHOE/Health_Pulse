"""Indicator definitions + computed indicator values.

WHY: `Indicator` is the CENTRAL registry (formula + thresholds live in the
backend, never the frontend). `IndicatorValue` caches computed results per
period/level so dashboards and alerts read fast without recomputing.
"""

from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import AggregationLevel, IndicatorDirection


class Indicator(Base):
    __tablename__ = "indicators"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )  # e.g. ANC_COVERAGE
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    unit: Mapped[str] = mapped_column(
        String(20), nullable=False, default="%"
    )  # % | per_1000
    numerator_field: Mapped[str] = mapped_column(String(50), nullable=False)
    denominator_field: Mapped[str] = mapped_column(String(50), nullable=False)
    formula: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    target: Mapped[float] = mapped_column(Float, nullable=False)
    warning_threshold: Mapped[float] = mapped_column(Float, nullable=False)
    critical_threshold: Mapped[float] = mapped_column(Float, nullable=False)
    direction: Mapped[IndicatorDirection] = mapped_column(
        Enum(IndicatorDirection, name="indicator_direction", native_enum=True),
        nullable=False,
        default=IndicatorDirection.HIGHER_IS_BETTER,
    )
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")

    def __repr__(self) -> str:
        return f"Indicator(code={self.code!r}, target={self.target})"


class IndicatorValue(Base):
    __tablename__ = "indicator_values"
    __table_args__ = (
        UniqueConstraint(
            "indicator_id",
            "period",
            "level",
            "district_id",
            "block_id",
            "facility_id",
            name="uq_indicator_value_scope",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    indicator_id: Mapped[int] = mapped_column(
        ForeignKey("indicators.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    level: Mapped[AggregationLevel] = mapped_column(
        Enum(AggregationLevel, name="aggregation_level", native_enum=True),
        nullable=False,
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
    numerator: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    denominator: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    value: Mapped[float | None] = mapped_column(Float, nullable=True)
    computed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
