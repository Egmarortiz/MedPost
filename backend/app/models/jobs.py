# app/models/jobs.py
from __future__ import annotations

from datetime import datetime
from typing import Optional, List
from uuid import uuid4, UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import (
    Base,
    TimestampMixin,
    WorkerTitle,
    EmploymentType,
    CompensationType,
)

# ---- Job Post ----
class JobPost(Base, TimestampMixin):
    __tablename__ = "job_posts"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    # who/where
    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("facilities.id", ondelete="CASCADE"), index=True
    )
    # optional denormalized snapshot for fast list rendering
    facility_legal_name_snapshot: Mapped[Optional[str]] = mapped_column(String(255))

    city: Mapped[Optional[str]] = mapped_column(String(120), index=True)
    state_province: Mapped[Optional[str]] = mapped_column(String(120), index=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)

    # role/time
    position_title: Mapped[str] = mapped_column(String(200), index=True)  # e.g., "ER Head of Staff"
    employment_type: Mapped[EmploymentType] = mapped_column(SAEnum(EmploymentType), index=True)

    # compensation (store one chosen type; unused fields can be NULL)
    compensation_type: Mapped[CompensationType] = mapped_column(SAEnum(CompensationType), index=True)

    hourly_min: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    hourly_max: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    monthly_min: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    monthly_max: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    yearly_min: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    yearly_max: Mapped[Optional[float]] = mapped_column(Numeric(10, 2))

    description: Mapped[Optional[str]] = mapped_column(Text)

    # lifecycle
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    # relationships
    facility: Mapped["Facility"] = relationship(back_populates="job_posts")
    roles: Mapped[List["JobPostRole"]] = relationship(
        back_populates="job_post", cascade="all, delete-orphan"
    )
    applications: Mapped[List["JobApplication"]] = relationship(
        back_populates="job_post", cascade="all, delete-orphan"
    )

    __table_args__ = (
        # sanity checks on min/max pairs
        CheckConstraint("(hourly_min IS NULL OR hourly_max IS NULL) OR (hourly_min <= hourly_max)",
                        name="ck_job_hourly_min_le_max"),
        CheckConstraint("(monthly_min IS NULL OR monthly_max IS NULL) OR (monthly_min <= monthly_max)",
                        name="ck_job_monthly_min_le_max"),
        CheckConstraint("(yearly_min IS NULL OR yearly_max IS NULL) OR (yearly_min <= yearly_max)",
                        name="ck_job_yearly_min_le_max"),
        Index("ix_job_posts_city_state", "city", "state_province"),
    )


# ---- Looking-for (many roles per job) ----
class JobPostRole(Base):
    __tablename__ = "job_post_roles"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    job_post_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("job_posts.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[WorkerTitle] = mapped_column(SAEnum(WorkerTitle), index=True)

    job_post: Mapped["JobPost"] = relationship(back_populates="roles")

    __table_args__ = (
        UniqueConstraint("job_post_id", "role", name="uq_job_post_role_once"),
    )


# ---- Job Application (apply form) ----
class ApplicationStatus(str):
    SUBMITTED = "SUBMITTED"
    REVIEWED = "REVIEWED"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"
    HIRED = "HIRED"


class JobApplication(Base, TimestampMixin):
    __tablename__ = "job_applications"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    job_post_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("job_posts.id", ondelete="CASCADE"), index=True
    )
    # Optional: applicant might be a signed-in worker OR a guest
    worker_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("workers.id", ondelete="SET NULL"), index=True
    )

    # captured from form
    answer_text: Mapped[Optional[str]] = mapped_column(Text)  # "Why would you like to apply?"
    phone_e164: Mapped[Optional[str]] = mapped_column(String(32), index=True)
    email: Mapped[Optional[str]] = mapped_column(String(254), index=True)

    status: Mapped[str] = mapped_column(String(20), default=ApplicationStatus.SUBMITTED, index=True)

    job_post: Mapped["JobPost"] = relationship(back_populates="applications")
    worker: Mapped[Optional["Worker"]] = relationship(back_populates="applications")

