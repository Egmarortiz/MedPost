#!/bin/bash/env python3
"""Pydantic schema for worker model"""

from pydantic import BaseModel
from typing import Optional
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
class WorkerRead(BaseModel)
    id: UUID
    full_name: str
    title: WorkerTitle
    bio: Optional[str]
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
    full_name: Optional[str]
    title: Optional[WorkerTitle]
    bio: Optional[str]
    profile_image_url: Optional[HttpUrl]
    resume_url: Optional[HttpUrl]
    city: Optional[str]
    state_province: Optional[str]
    postal_code: Optional[int]
    education_level: Optional[EducationLevel]
