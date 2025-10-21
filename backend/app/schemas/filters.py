"""Filtering schemas used by list endpoints."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel

from app.core import PuertoRicoMunicipality
from app.models import (
    CompensationType,
    EducationLevel,
    EmploymentType,
    Industry,
    WorkerTitle,
)


class WorkerFilter(BaseModel):
    """Query parameters used to filter workers."""

    title: Optional[WorkerTitle] = None
    city: Optional[PuertoRicoMunicipality] = None
    education_level: Optional[EducationLevel] = None
    has_endorsements: Optional[bool] = None


class FacilityFilter(BaseModel):
    """Query parameters used to filter facilities."""

    industry: Optional[Industry] = None


class JobFilter(BaseModel):
    """Query parameters used to filter job posts."""

    worker_titles: Optional[List[WorkerTitle]] = None
    employment_type: Optional[EmploymentType] = None
    compensation_type: Optional[CompensationType] = None
    city: Optional[PuertoRicoMunicipality] = None

__all__ = ["WorkerFilter", "FacilityFilter", "JobFilter"]
