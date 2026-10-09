"""Raw HMIS-style monthly record per facility.

WHY: stores numerators/denominators (never pre-computed percentages) so
the indicator engine can aggregate correctly (sum then divide, not
average of percentages). One row = one facility x one month.
"""

from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class HealthRecord(Base):
    __tablename__ = "health_records"
    __table_args__ = (
        UniqueConstraint(
            "facility_id", "period", name="uq_health_record_facility_period"
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    facility_id: Mapped[int] = mapped_column(
        ForeignKey("facilities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # First day of the reporting month, e.g. 2026-01-01 for "Jan 2026".
    period: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # --- ANC ---
    total_pregnant_women: Mapped[int] = mapped_column(Integer, default=0)
    anc_4_visits: Mapped[int] = mapped_column(Integer, default=0)

    # --- Deliveries ---
    total_deliveries: Mapped[int] = mapped_column(Integer, default=0)
    institutional_deliveries: Mapped[int] = mapped_column(Integer, default=0)

    # --- Immunization ---
    total_infants: Mapped[int] = mapped_column(Integer, default=0)
    fully_immunized_infants: Mapped[int] = mapped_column(Integer, default=0)

    # --- TB ---
    total_tb_patients: Mapped[int] = mapped_column(Integer, default=0)
    tb_treatment_success: Mapped[int] = mapped_column(Integer, default=0)

    # --- Malaria (lower is better) ---
    population: Mapped[int] = mapped_column(Integer, default=0)
    malaria_cases: Mapped[int] = mapped_column(Integer, default=0)

    # --- OPD ---
    opd_visits: Mapped[int] = mapped_column(Integer, default=0)
    opd_expected: Mapped[int] = mapped_column(Integer, default=0)

    # --- Health workers ---
    sanctioned_health_workers: Mapped[int] = mapped_column(Integer, default=0)
    positioned_health_workers: Mapped[int] = mapped_column(Integer, default=0)

    # --- Births / mortality (optional IMR) ---
    live_births: Mapped[int] = mapped_column(Integer, default=0)
    infant_deaths: Mapped[int] = mapped_column(Integer, default=0)

    facility: Mapped["Facility"] = relationship(back_populates="health_records")

    def __repr__(self) -> str:
        return (
            f"HealthRecord(facility_id={self.facility_id}, period={self.period})"
        )
