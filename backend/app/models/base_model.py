from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional, List
from uuid import uuid4, UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    MetaData,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)

# ---------- Base / metadata naming (stable Alembic diffs) ----------
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


# ---------- Mixins ----------
class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


# ---------- Shared enums (used by multiple modules) ----------
class VerificationStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SafetyTier(str, Enum):
    TIER1 = "TIER1"      # ID + background check
    TIER2 = "TIER2"      # Industry-specific (license, etc.)
    TIER3 = "TIER3"      # Enterprise (drug test, credit, etc.)


class WorkerTitle(str, Enum):
    RN = "REGISTERED NURSE"
    LPN = "LICENSED PRACTICAL NURSE"
    CNA = "CERTIFIED NURSING ASSISTANT"
    CAREGIVER = "CAREGIVER"
    SUPPORT = "SUPPORT STAFF"


class EducationLevel(str, Enum):
    HIGHSCHOOL = "HIGH SCHOOL"
    ASSOCIATES = "ASSOCIATE'S DEGREE"
    BACHELORS = "BACHELOR'S DEGREE"
    MASTERS = "MASTER'S DEGREE"
    DOCTORATE = "DOCTORATE"


class Industry(str, Enum):
    HOSPITAL = "HOSPITAL"
    HOME_HEALTH = "HOME HEALTH"
    SENIOR_CARE = "SENIOR CARE"
    REHAB_CENTER = "REHAB CENTER"
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

# ---------- Cross-module association to avoid circular imports ----------
class Endorsement(Base, TimestampMixin):
    """
    Association: verified facilities endorse workers.
    Defined here to avoid circular imports between worker.py and facility.py.
    """
    __tablename__ = "endorsements"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True,
                                     default=uuid4)

    worker_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workers.id", ondelete="CASCADE"),
        index=True
    )
    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("facilities.id", ondelete="CASCADE"),
        index=True
    )

    note: Mapped[Optional[str]] = mapped_column(Text, default=None)
    has_badge: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # String-based targets to dodge import cycles; resolved at mapper config time
    worker: Mapped["Worker"] = relationship("Worker", back_populates="endorsements")
    facility: Mapped["Facility"] = relationship("Facility", back_populates="endorsements")

    __table_args__ = (
        UniqueConstraint("worker_id", "facility_id",
                         name="uq_endorsement_once_per_facility"),
    )

# ---------- Auth Event Type Enum ----------
class AuthEventType(str, Enum):
    REGISTRATION = "REGISTRATION"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    PASSWORD_RESET = "PASSWORD_RESET"
    TOKEN_REFRESH = "TOKEN_REFRESH"
    FAILED_LOGIN = "FAILED_LOGIN"

# ---------- User Role Enum ----------
class UserRole(str, Enum):
    WORKER = "WORKER"
    FACILITY = "FACILITY"
