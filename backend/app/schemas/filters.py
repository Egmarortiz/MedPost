"""Filtering schemas used by list endpoints."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from app.models import (
    CompensationType,
    EmploymentType,
    WorkerTitle,
)


class WorkerFilter(BaseModel):
    """Query parameters used to filter workers."""

    title: Optional[WorkerTitle] = None
    city: Optional[str] = None
    state_province: Optional[str] = None


class JobFilter(BaseModel):
    """Query parameters used to filter job posts."""

    title: Optional[str] = None
    worker_title: Optional[WorkerTitle] = None
    employment_type: Optional[EmploymentType] = None
    compensation_type: Optional[CompensationType] = None
    city: Optional[str] = None
    state_province: Optional[str] = None


__all__ = ["WorkerFilter", "JobFilter"]
