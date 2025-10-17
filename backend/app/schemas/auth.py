"""Authentication DTOs."""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl, SecretStr, field_validator

from app.models import EducationLevel, Industry, UserRole, WorkerTitle
from .common import APIModel


class TokenPair(APIModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_at: datetime
    refresh_expires_at: datetime
    user_id: UUID
    role: UserRole
    worker_id: Optional[UUID] = None
    facility_id: Optional[UUID] = None


class LoginRequest(BaseModel):
    username: str
    password: str
    email: EmailStr
    password: SecretStr


class RefreshRequest(BaseModel):
    refresh_token: SecretStr


class LogoutRequest(BaseModel):
    refresh_token: SecretStr


class WorkerRegistrationRequest(BaseModel):
    email: EmailStr
    password: SecretStr
    full_name: str
    title: WorkerTitle
    bio: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None
    resume_url: Optional[HttpUrl] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    education_level: EducationLevel = Field(default=EducationLevel.HIGHSCHOOL)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        return value.strip()


class FacilityRegistrationRequest(BaseModel):
    email: EmailStr
    password: SecretStr
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
    hq_city: Optional[str] = None
    hq_state_province: Optional[str] = None
    hq_postal_code: Optional[str] = None
    hq_country: Optional[str] = None

    @field_validator("legal_name")
    @classmethod
    def validate_legal_name(cls, value: str) -> str:
        return value.strip()
