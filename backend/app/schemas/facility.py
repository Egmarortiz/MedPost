"""Facility DTOs."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.core import DEFAULT_COUNTRY, DEFAULT_STATE_PROVINCE, PuertoRicoMunicipality
from .common import APIModel
from app.models import FacilityCertificationCode, Industry, VerificationStatus


class FacilityBase(BaseModel):
    legal_name: str
    industry: Industry
    bio: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None
    phone_e164: Optional[str] = None
    company_size_min: Optional[int] = None
    company_size_max: Optional[int] = None
    founded_year: Optional[int] = None
    hq_address_line1: Optional[str] = None
    hq_address_line2: Optional[str] = None
    hq_city: Optional[PuertoRicoMunicipality] = None
    hq_state_province: Optional[str] = DEFAULT_STATE_PROVINCE
    hq_postal_code: Optional[str] = None
    hq_country: Optional[str] = DEFAULT_COUNTRY


class FacilityCreate(FacilityBase):
    user_id: UUID


class FacilityRead(FacilityBase, APIModel):
    id: UUID
    user_id: UUID
    is_verified: bool
    created_at: datetime
    updated_at: datetime


class FacilityUpdate(BaseModel):
    legal_name: Optional[str] = None
    industry: Optional[Industry] = None
    bio: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None
    phone_e164: Optional[str] = None
    company_size_min: Optional[int] = None
    company_size_max: Optional[int] = None
    founded_year: Optional[int] = None
    hq_address_line1: Optional[str] = None
    hq_address_line2: Optional[str] = None
    hq_city: Optional[PuertoRicoMunicipality] = None
    hq_state_province: Optional[str] = None
    hq_postal_code: Optional[str] = None
    hq_country: Optional[str] = None
    is_verified: Optional[bool] = None


class FacilityCertificationRead(APIModel):
    id: UUID
    facility_id: UUID
    code: FacilityCertificationCode
    status: VerificationStatus
    evidence_url: Optional[HttpUrl]
    verified_at: Optional[datetime]


class FacilityWithCertifications(FacilityRead):
    certifications: List[FacilityCertificationRead] = Field(default_factory=list)
