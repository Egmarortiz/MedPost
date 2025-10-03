#!/bin/bash/env python3
"""Pydantic schema for worker model"""

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
class WorkerRead(BaseModel)
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
