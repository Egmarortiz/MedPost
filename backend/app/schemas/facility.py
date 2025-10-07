#!/usr/bin/env python3
"""Facility pydantic schemas"""

from __future__ import annotations
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.models.base_model import Industry, FacilityCertificationCode, VerificationStatus

# Address schemas
from uuid import UUID

class FacilityAddressCreate(BaseModel):
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state_province: str
    postal_code: int
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
    evidence_url: HttpUrl
    verified_at: datetime

    class Config:
        orm_mode = True

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
    postal_code: int
    country: str

class FacilityCreate(FacilityBase):
    pass

class FacilityUpdate(BaseModel):
    legal_name: Optional[str] = None
    industry: Optional[Industry] = None
    bio: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None
    phone: Optional[str] = None
    company_size: Optional[int] = None
    founded_year: Optional[int] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[int] = None
    country: Optional[str] = None

class FacilityRead(FacilityBase):
    id: UUID
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    certifications: List[FacilityCertificationRead] = []

    class Config:
        orm_mode = True
