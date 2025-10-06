#!/bin/bash/env python3
"""Pydantic schema for worker model"""

from __future__ import annotations
from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from ..models.base_model import WorkerTitle, EducationLevel

# Creates input
class WorkerCreate(BaseModel):
    full_name: str
    title: WorkerTitle
    bio: Optional[str] = None
    profile_image_url: HttpUrl
    resume_url: HttpUrl
    city: str
    state_province: str
    postal_code: int
    education_level: EducationLevel

# Reads output
class WorkerRead(BaseModel):
    id: UUID
    full_name: str
    title: WorkerTitle
    bio: Optional[str] = None
    profile_image_url: HttpUrl
    resume_url: HttpUrl
    city: str
    state_province: str
    postal_code: int
    education_level: EducationLevel
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True   # Object relational mapping mode

# Updates inputs
class WorkerUpdate(BaseModel):
    full_name: Optional[str] = None
    title: Optional[WorkerTitle] = None
    bio: Optional[str] = None
    profile_image_url: Optional[HttpUrl] = None
    resume_url: Optional[HttpUrl] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[int] = None
    education_level: Optional[EducationLevel] = None

# Workers experience model
class ExperienceBase(BaseModel):
    company_name: str
    position_title: str
    start_date: date
    end_date: date
    description: str

class ExperienceCreate(ExperienceBase):
    pass

class ExperienceUpdate(BaseModel):
    company_name: Optional[str] = None
    position_title: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None

class ExperienceRead(ExperienceBase):
    id: UUID
    worker_id: UUID

    class Config:
        orm_mode = True

class WorkerCredentialBase(BaseModel):
    credential_type_id: int
    number: int
    jurisdiction: str
    evidence_url: HttpUrl
    verified: bool
    verified_at: datetime

class WorkerCredentialCreate(WorkerCredentialBase):
    pass

class WorkerCredentialRead(WorkerCredentialBase):
    id: UUID
    worker_id: UUID
    verified_at: datetime

    class Config:
        orm_mode = True
