"""Worker domain models."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship

from app.core import DEFAULT_STATE_PROVINCE, PuertoRicoMunicipality
from .base_model import (
    Base,
    TimestampMixin,
    mapped_column,
    Mapped,
    WorkerTitle,
    EducationLevel,
    SafetyTier,
    VerificationStatus,
)

# ---------- Worker (core profile) ----------
class Worker(Base, TimestampMixin):
    __tablename__ = "workers"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    full_name: Mapped[str] = mapped_column(String(160), index=True)
    title: Mapped[WorkerTitle] = mapped_column(SAEnum(WorkerTitle), index=True)
    bio: Mapped[Optional[str]] = mapped_column(Text)

    profile_image_url: Mapped[Optional[str]] = mapped_column(String(512))
    resume_url: Mapped[Optional[str]] = mapped_column(String(512))

    city: Mapped[Optional[PuertoRicoMunicipality]] = mapped_column(
        SAEnum(PuertoRicoMunicipality), index=True
    )
    state_province: Mapped[Optional[str]] = mapped_column(
        String(120),
        index=True,
        default=DEFAULT_STATE_PROVINCE,
        server_default=DEFAULT_STATE_PROVINCE,
    )
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)

    education_level: Mapped[EducationLevel] = mapped_column(
        SAEnum(EducationLevel), default=EducationLevel.HIGHSCHOOL, nullable=False
    )

    applications: Mapped[List["JobApplication"]] = relationship(
        "JobApplication",
        back_populates="worker",
        cascade="all, delete-orphan",
    )

    experiences: Mapped[List["Experience"]] = relationship(
        "Experience",
        back_populates="worker",
        cascade="all, delete-orphan",
        order_by="Experience.start_date.desc()",
    )
    credentials: Mapped[List["WorkerCredential"]] = relationship(
        "WorkerCredential",
        back_populates="worker",
        cascade="all, delete-orphan",
    )
    endorsements: Mapped[List["Endorsement"]] = relationship(
        "Endorsement",
        back_populates="worker",
        cascade="all, delete-orphan",
    )
    safety_checks: Mapped[List["SafetyCheck"]] = relationship(
        "SafetyCheck",
        back_populates="worker",
        cascade="all, delete-orphan",
    )
    user: Mapped["User"] = relationship("User", back_populates="worker_profile")
    __table_args__ = (
        Index("ix_workers_title_city", "title", "city"),
        Index("ix_workers_title_state", "title", "state_province"),
    )


class Experience(Base):
    __tablename__ = "experiences"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    worker_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workers.id", ondelete="CASCADE"), index=True
    )

    company_name: Mapped[str] = mapped_column(String(255), index=True)
    position_title: Mapped[str] = mapped_column(String(160))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)  # NULL => current
    description: Mapped[Optional[str]] = mapped_column(Text)

    worker: Mapped["Worker"] = relationship("Worker", back_populates="experiences")

# ---------- Credentials (normalized) ----------
class CredentialType(Base):
    __tablename__ = "credential_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    label: Mapped[str] = mapped_column(String(160))


class WorkerCredential(Base):
    __tablename__ = "worker_credentials"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    worker_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workers.id", ondelete="CASCADE"), index=True
    )
    credential_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("credential_types.id", ondelete="RESTRICT")
    )

    number: Mapped[Optional[str]] = mapped_column(String(120))
    jurisdiction: Mapped[Optional[str]] = mapped_column(String(120))
    evidence_url: Mapped[Optional[str]] = mapped_column(String(512))
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    worker: Mapped["Worker"] = relationship("Worker", back_populates="credentials")
    credential_type: Mapped["CredentialType"] = relationship("CredentialType")

    __table_args__ = (
        UniqueConstraint("worker_id", "credential_type_id", name="uq_worker_credential_unique"),
    )


# ---------- Safety checks ----------
class SafetyCheck(Base):
    __tablename__ = "safety_checks"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    worker_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workers.id", ondelete="CASCADE"), index=True
    )
    tier: Mapped[SafetyTier] = mapped_column(SAEnum(SafetyTier))
    status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus), default=VerificationStatus.NOT_STARTED, nullable=False
    )
    evidence_url: Mapped[Optional[str]] = mapped_column(String(512))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    worker: Mapped["Worker"] = relationship("Worker", back_populates="safety_checks")
