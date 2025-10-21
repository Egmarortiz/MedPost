"""Worker Pydantic schemas."""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.core import DEFAULT_STATE_PROVINCE, PuertoRicoMunicipality
from .common import APIModel
from app.models import EducationLevel, WorkerTitle

class ExperienceBase(BaseModel):
    company_name: str
    position_title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceRead(ExperienceBase, APIModel):
    id: UUID
    worker_id: UUID


class ExperienceUpdate(BaseModel):
    company_name: Optional[str] = None
    position_title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None


class WorkerCredentialBase(BaseModel):
    credential_type_id: int
    number: Optional[str] = None
    jurisdiction: Optional[str] = None
    evidence_url: Optional[HttpUrl] = None


class WorkerCredentialCreate(WorkerCredentialBase):
    pass


class WorkerCredentialRead(WorkerCredentialBase, APIModel):
    id: UUID
    worker_id: UUID
    verified: bool
    verified_at: Optional[datetime] = None


class WorkerBase(BaseModel):
    full_name: str
    title: WorkerTitle
    bio: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None
    resume_url: Optional[HttpUrl] = None
    city: Optional[PuertoRicoMunicipality] = None
    state_province: Optional[str] = DEFAULT_STATE_PROVINCE
    postal_code: Optional[str] = None
    education_level: EducationLevel = EducationLevel.HIGHSCHOOL


class WorkerCreate(WorkerBase):
    user_id: UUID


class WorkerUpdate(BaseModel):
    full_name: Optional[str] = None
    title: Optional[WorkerTitle] = None
    bio: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None
    resume_url: Optional[HttpUrl] = None
    city: Optional[PuertoRicoMunicipality] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    education_level: Optional[EducationLevel] = None


class WorkerRead(WorkerBase, APIModel):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    experiences: List[ExperienceRead] = Field(default_factory=list)
    credentials: List[WorkerCredentialRead] = Field(default_factory=list)
