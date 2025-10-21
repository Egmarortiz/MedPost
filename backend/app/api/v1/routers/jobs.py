"""Job REST endpoints."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core import PuertoRicoMunicipality
from app.models import CompensationType, EmploymentType, WorkerTitle
from app.schemas import (
    JobApplicationCreate,
    JobApplicationRead,
    JobFilter,
    JobPostCreate,
    JobPostRead,
)
from app.api.deps import get_jobs_service, get_pagination_params
from app.schemas.common import PaginationParams
from app.services.jobs_service import JobsService

router = APIRouter()


@router.get("/", response_model=List[JobPostRead])
def list_jobs(
    worker_titles: Optional[List[WorkerTitle]] = Query(None),
    employment_type: Optional[EmploymentType] = None,
    compensation_type: Optional[CompensationType] = None,
    city: Optional[PuertoRicoMunicipality] = None,
    pagination: PaginationParams = Depends(get_pagination_params),
    service: JobsService = Depends(get_jobs_service),
) -> List[JobPostRead]:
    filters = JobFilter(
        worker_titles=worker_titles,
        employment_type=employment_type,
        compensation_type=compensation_type,
        city=city,
    )
    jobs = service.list_jobs(filters, pagination)
    return [JobPostRead.from_orm(job) for job in jobs]


@router.post("/", response_model=JobPostRead, status_code=status.HTTP_201_CREATED)
def create_job(
    payload: JobPostCreate,
    service: JobsService = Depends(get_jobs_service),
) -> JobPostRead:
    job = service.create_job(payload)
    return JobPostRead.from_orm(job)


@router.get("/{job_id}", response_model=JobPostRead)
def get_job(job_id: UUID, service: JobsService = Depends(get_jobs_service)) -> JobPostRead:
    job = service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobPostRead.from_orm(job)


@router.post("/{job_id}/apply", response_model=JobApplicationRead, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: UUID,
    payload: JobApplicationCreate,
    service: JobsService = Depends(get_jobs_service),
) -> JobApplicationRead:
    if payload.job_post_id != job_id:
        payload = payload.copy(update={"job_post_id": job_id})
    return service.apply(payload)


@router.get("/{job_id}/applications", response_model=List[JobApplicationRead])
def list_applications(
    job_id: UUID,
    service: JobsService = Depends(get_jobs_service),
) -> List[JobApplicationRead]:
    return service.list_applications(job_id)
