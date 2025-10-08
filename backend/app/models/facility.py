"""Facility domain models."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import (
    Base,
    TimestampMixin,
    Industry,
    VerificationStatus,
    FacilityCertificationCode,
)

class Facility(Base, TimestampMixin):
    __tablename__ = "facilities"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    legal_name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    industry: Mapped[Industry] = mapped_column(SAEnum(Industry), index=True)
    bio: Mapped[Optional[str]] = mapped_column(Text)

    profile_image_url: Mapped[Optional[str]] = mapped_column(String(512))
    phone_e164: Mapped[Optional[str]] = mapped_column(String(32), index=True)

    company_size_min: Mapped[Optional[int]] = mapped_column(Integer)
    company_size_max: Mapped[Optional[int]] = mapped_column(Integer)
    founded_year: Mapped[Optional[int]] = mapped_column(Integer)

    hq_address_line1: Mapped[Optional[str]] = mapped_column(String(255))
    hq_address_line2: Mapped[Optional[str]] = mapped_column(String(255))
    hq_city: Mapped[Optional[str]] = mapped_column(String(120), index=True)
    hq_state_province: Mapped[Optional[str]] = mapped_column(String(120), index=True)
    hq_postal_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    hq_country: Mapped[Optional[str]] = mapped_column(String(120), index=True)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    job_posts: Mapped[List["JobPost"]] = relationship(
        back_populates="facility", cascade="all, delete-orphan"
    )
    locations: Mapped[List["FacilityAddress"]] = relationship(
        back_populates="facility", cascade="all, delete-orphan"
    )
    specialties: Mapped[List["FacilitySpecialty"]] = relationship(
        back_populates="facility", cascade="all, delete-orphan"
    )
    certifications: Mapped[List["FacilityCertification"]] = relationship(
        back_populates="facility", cascade="all, delete-orphan"
    )
    endorsements: Mapped[List["Endorsement"]] = relationship(
        back_populates="facility", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "(company_size_min IS NULL OR company_size_max IS NULL) OR (company_size_min <= company_size_max)",
            name="ck_facility_size_min_le_max",
        ),
        CheckConstraint(
            "(founded_year IS NULL) OR (founded_year BETWEEN 1800 AND 2100)",
            name="ck_facility_founded_year_range",
        ),
        Index("ix_facilities_industry_city", "industry", "hq_city"),
        Index("ix_facilities_industry_state", "industry", "hq_state_province"),
    )


class FacilityAddress(Base):
    __tablename__ = "facility_addresses"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("facilities.id", ondelete="CASCADE"), index=True
    )

    label: Mapped[Optional[str]] = mapped_column(String(120))
    address_line1: Mapped[str] = mapped_column(String(255))
    address_line2: Mapped[Optional[str]] = mapped_column(String(255))
    city: Mapped[Optional[str]] = mapped_column(String(120), index=True)
    state_province: Mapped[Optional[str]] = mapped_column(String(120), index=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), index=True)
    country: Mapped[Optional[str]] = mapped_column(String(120), index=True)

    is_headquarters: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    facility: Mapped["Facility"] = relationship(back_populates="locations")

    __table_args__ = (Index("ix_facaddr_city_state", "city", "state_province"),)


class SpecialtyType(Base):
    __tablename__ = "specialty_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    label: Mapped[str] = mapped_column(String(160))


class FacilitySpecialty(Base):
    __tablename__ = "facility_specialties"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    facility_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("facilities.id", ondelete="CASCADE"), index=True
    )
    specialty_type_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("specialty_types.id", ondelete="RESTRICT"), index=True
    )

    facility: Mapped["Facility"] = relationship(back_populates="specialties")
    specialty_type: Mapped["SpecialtyType"] = relationship()

    __table_args__ = (
        UniqueConstraint("facility_id", "specialty_type_id", name="uq_facility_specialty_once"),
    )


class FacilityCertification(Base):
    __tablename__ = "facility_certifications"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    facility_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("facilities.id", ondelete="CASCADE"), index=True
    )

    code: Mapped[FacilityCertificationCode] = mapped_column(
        SAEnum(FacilityCertificationCode), index=True
    )
    status: Mapped[VerificationStatus] = mapped_column(
        SAEnum(VerificationStatus), default=VerificationStatus.NOT_STARTED, nullable=False
    )
    evidence_url: Mapped[Optional[str]] = mapped_column(String(512))
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime)

    facility: Mapped["Facility"] = relationship(back_populates="certifications")

    __table_args__ = (
        UniqueConstraint("facility_id", "code", name="uq_facility_certification_once"),
    )
