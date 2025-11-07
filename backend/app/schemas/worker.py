#!/usr/bin/env python3
"""Pydantic schema for worker model"""

from __future__ import annotations
from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date
from ..models.base_model import WorkerTitle, EducationLevel, VerificationStatus
from ..core import PuertoRicoMunicipality

# Creates input
class WorkerCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    profile_image_url: HttpUrl
    title: WorkerTitle
    bio: Optional[str] = None
    resume_url: HttpUrl
    city: PuertoRicoMunicipality
    state_province: str
    postal_code: str
    education_level: EducationLevel

class WorkerLogin(BaseModel):
    email: EmailStr
    password: str

class WorkerOut(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    phone_e164: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None

    class Config: 
        from_attributes = True

# Reads output
class WorkerRead(BaseModel):
    id: UUID
    full_name: str
    email: Optional[str] = None
    title: WorkerTitle
    bio: Optional[str] = None
    profile_image_url: Optional[str] = None
    resume_url: Optional[str] = None
    city: Optional[PuertoRicoMunicipality] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    education_level: EducationLevel
    verification_status: VerificationStatus
    selfie_url: Optional[str] = None
    id_photo_url: Optional[str] = None
    verification_submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    experiences: List[dict] = []

    class Config:
        from_attributes = True   # Object relational mapping mode

# Updates inputs
class WorkerUpdate(BaseModel):
    full_name: Optional[str] = None
    title: Optional[WorkerTitle] = None
    bio: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None
    resume_url: Optional[HttpUrl] = None
    city: Optional[PuertoRicoMunicipality] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    education_level: Optional[EducationLevel] = None

# Workers experience model
class ExperienceBase(BaseModel):
    company_name: str
    position_title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None

class ExperienceCreate(ExperienceBase):
    company_name: str
    position_title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None

class ExperienceUpdate(BaseModel):
    company_name: Optional[str] = None
    position_title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None

class ExperienceRead(BaseModel):
    id: UUID
    worker_id: UUID
    company_name: str
    position_title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True

class WorkerCredentialBase(BaseModel):
    credential_type_id: str
    number: str | None = None
    jurisdiction: str
    evidence_url: HttpUrl
    verified: bool
    verified_at: datetime | None = None

class WorkerCredentialCreate(WorkerCredentialBase):
    pass

class WorkerCredentialRead(WorkerCredentialBase):
    id: UUID
    worker_id: UUID
    verified_at: datetime

    class Config:
        from_attributes = True

class SafetyCheckCreate(BaseModel):
    worker_id: UUID
    tier: str
    status: str
    evidence_url: Optional[str] = None
    completed_at: Optional[datetime] = None

class SafetyCheckRead(BaseModel):
    id: UUID
    worker_id: UUID
    tier: str
    status: str
    evidence_url: Optional[str] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SafetyCheckSummary(BaseModel):
    tier: str
    status: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
