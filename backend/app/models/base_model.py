"""SQLAlchemy base classes and shared enums."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from typing import Any

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    MetaData,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import declarative_base, relationship

try:  # SQLAlchemy 2.0+
    from sqlalchemy.orm import DeclarativeBase
except ImportError:  # SQLAlchemy < 2.0 fallback
    DeclarativeBase = None

try:  # SQLAlchemy 2.0+
    from sqlalchemy.orm import Mapped as _Mapped
except ImportError:  # SQLAlchemy < 2.0 fallback
    _Mapped = Any

try:  # SQLAlchemy 2.0+
    from sqlalchemy.orm import mapped_column as _mapped_column
except ImportError:  # SQLAlchemy < 2.0 fallback

    def _mapped_column(*args, **kwargs):  # type: ignore[override]
        return Column(*args, **kwargs)

Mapped = _Mapped  # type: ignore[assignment]
mapped_column = _mapped_column

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


if DeclarativeBase is not None:

    class Base(DeclarativeBase):
        metadata = MetaData(naming_convention=NAMING_CONVENTION)

else:  # SQLAlchemy < 2.0 fallback
    Base = declarative_base(metadata=MetaData(naming_convention=NAMING_CONVENTION))


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class VerificationStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SafetyTier(str, Enum):
    TIER1 = "TIER1"      # ID + background check
    TIER2 = "TIER2"      # Industry-specific (license, etc.)
    TIER3 = "TIER3"      # Enterprise (drug test, credit, etc.)


class UserRole(str, Enum):
    WORKER = "WORKER"
    FACILITY = "FACILITY"
    ADMIN = "ADMIN"

class WorkerTitle(str, Enum):
    RN = "Registered Nurse"
    LPN = "Licensed Practical Nurse"
    CNA = "Certified Nursing Assistant"
    CAREGIVER = "Caregiver"
    SUPPORT = "Housekeeping/Support Staff"


class EducationLevel(str, Enum):
    HIGHSCHOOL = "HIGHSCHOOL"
    COLLEGE = "COLLEGE"


class Industry(str, Enum):
    HOSPITAL = "HOSPITAL"
    HOME_HEALTH = "HOME_HEALTH"
    SENIOR_CARE = "SENIOR_CARE"
    REHAB_CENTER = "REHAB_CENTER"
    OTHER = "OTHER"


class FacilityCertificationCode(str, Enum):
    VERIFIED_BUSINESS = "VERIFIED_BUSINESS"
    VERIFIED_HEALTHCARE_PROVIDER = "VERIFIED_HEALTHCARE_PROVIDER"


class EmploymentType(str, Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"


class CompensationType(str, Enum):
    HOURLY = "HOURLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


class AuthEventType(str, Enum):
    REGISTER = "REGISTER"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    REFRESH = "REFRESH"


class Endorsement(Base, TimestampMixin):
    """Association table linking facilities and workers."""
    __tablename__ = "endorsements"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    worker_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workers.id", ondelete="CASCADE"), index=True
    )
    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("facilities.id", ondelete="CASCADE"), index=True
    )

    note: Mapped[Optional[str]] = mapped_column(Text, default=None)
    has_badge: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    worker: Mapped["Worker"] = relationship("Worker", back_populates="endorsements")
    facility: Mapped["Facility"] = relationship(
        "Facility", back_populates="endorsements"
    )

    __table_args__ = (
        UniqueConstraint(
            "worker_id",
            "facility_id",
            name="uq_endorsement_once_per_facility",
        ),
    )

