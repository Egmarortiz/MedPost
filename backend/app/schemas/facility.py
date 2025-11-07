#!/usr/bin/env python3
"""Facility pydantic schemas"""

from __future__ import annotations
from pydantic import BaseModel, EmailStr, HttpUrl, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.base_model import Industry

from app.models.base_model import Industry, FacilityCertificationCode, VerificationStatus

# Address schemas
from uuid import UUID

class FacilityAddressCreate(BaseModel):
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state_province: str
    postal_code: str
    country: str

class FacilityAddressRead(FacilityAddressCreate):
    id: UUID


class FacilityCertificationCreate(BaseModel):
    code: FacilityCertificationCode
    evidence_url: HttpUrl

class FacilityCertificationRead(BaseModel):
    id: UUID
    code: FacilityCertificationCode
    status: VerificationStatus
    evidence_url: Optional[str] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class FacilityBase(BaseModel):
    legal_name: str
    industry: Industry
    bio: Optional[str] = None
    profile_image_url: HttpUrl
    phone: Optional[str] = None
    company_size: int
    founded_year: int
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state_province: str
    postal_code: str
    country: str

class FacilityCreate(FacilityBase):
    legal_name: str
    email: EmailStr
    password: str
    industry: Industry
    phone_e164: Optional[str] = None
    profile_image_url: HttpUrl

class FacilityLogin(BaseModel):
    email: EmailStr
    password: str

class FacilityOut(BaseModel):
    id: UUID
    legal_name: str
    email: EmailStr
    industry: Industry
    phone_e164: Optional[str] = None
    profile_image_url: Optional[str] = None

    class Config: 
        from_attributes = True

class FacilityUpdate(BaseModel):
    legal_name: Optional[str] = None
    industry: Optional[Industry] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None  
    phone_e164: Optional[str] = None
    company_size_min: Optional[int] = None
    company_size_max: Optional[int] = None
    founded_year: Optional[int] = None
    hq_address_line1: Optional[str] = None
    hq_address_line2: Optional[str] = None
    hq_city: Optional[str] = None
    hq_state_province: Optional[str] = None
    hq_postal_code: Optional[str] = None
    hq_country: Optional[str] = None

class FacilityRead(BaseModel):
    id: UUID
    legal_name: str
    industry: Industry
    email: Optional[str] = None
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    id_photo_url: Optional[str] = None
    license_id: Optional[str] = None
    phone_e164: Optional[str] = None
    company_size_min: Optional[int] = None
    company_size_max: Optional[int] = None
    founded_year: Optional[int] = None
    hq_address_line1: Optional[str] = None
    hq_address_line2: Optional[str] = None
    hq_city: Optional[str] = None
    hq_state_province: Optional[str] = None
    hq_postal_code: Optional[str] = None
    hq_country: Optional[str] = None
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    certifications: List[FacilityCertificationRead] = []

    class Config:
        from_attributes = True

class FacilityWithCertifications(FacilityBase):
    id: UUID
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    certifications: List[FacilityCertificationRead] = []

    class Config:
        from_attributes = True

class FacilityVerificationRequest(BaseModel):
    """Facility verification submission with ID photo and license."""
    id_photo_url: str
    license_id: Optional[str] = None
