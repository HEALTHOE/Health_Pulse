"""Location hierarchy: District 1-N Block 1-N Facility.

WHY: every HMIS record belongs to a facility; analytics roll up
facility -> block -> district by summing numerators/denominators.
"""

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class District(Base):
    __tablename__ = "districts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)

    blocks: Mapped[list["Block"]] = relationship(
        back_populates="district", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"District(id={self.id}, name={self.name!r})"


class Block(Base):
    __tablename__ = "blocks"
    __table_args__ = (
        UniqueConstraint("district_id", "name", name="uq_block_district_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    district_id: Mapped[int] = mapped_column(
        ForeignKey("districts.id", ondelete="CASCADE"), nullable=False, index=True
    )

    district: Mapped[District] = relationship(back_populates="blocks")
    facilities: Mapped[list["Facility"]] = relationship(
        back_populates="block", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"Block(id={self.id}, name={self.name!r})"


class Facility(Base):
    __tablename__ = "facilities"
    __table_args__ = (
        UniqueConstraint("block_id", "name", name="uq_facility_block_name"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    facility_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PHC"
    )  # e.g. SC | PHC | CHC
    block_id: Mapped[int] = mapped_column(
        ForeignKey("blocks.id", ondelete="CASCADE"), nullable=False, index=True
    )

    block: Mapped[Block] = relationship(back_populates="facilities")
    health_records: Mapped[list["HealthRecord"]] = relationship(
        back_populates="facility", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"Facility(id={self.id}, name={self.name!r})"
