"""Job REST endpoints."""

from __future__ import annotations

from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response,  status

from app.core import PuertoRicoMunicipality
from app.core.security import TokenPayload
from app.models import CompensationType, EmploymentType, WorkerTitle, UserRole
from app.schemas import (
    JobApplicationCreate,
    JobApplicationRead,
    JobApplicationUpdate,
    JobFilter,
    JobPostCreate,
    JobPostRead,
    JobPostUpdate,
)
from app.api.deps import get_jobs_service, get_pagination_params, require_role
from app.schemas.common import PaginationParams
from app.services.jobs_service import JobsService

router = APIRouter()


FacilityUser = Annotated[TokenPayload, Depends(require_role(UserRole.FACILITY.value))]
WorkerUser = Annotated[TokenPayload, Depends(require_role(UserRole.WORKER.value))]


def _get_user_id(payload: TokenPayload) -> UUID:
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token"
        )
    try:
        return UUID(str(sub))
    except ValueError as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid authentication token"
        ) from exc


def _get_facility_id(service: JobsService, payload: TokenPayload) -> UUID:
    user_id = _get_user_id(payload)
    facility = service.get_facility_for_user(user_id)
    if not facility:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Facility profile not found"
        )
    return facility.id


def _get_worker_id(service: JobsService, payload: TokenPayload) -> UUID:
    user_id = _get_user_id(payload)
    worker = service.get_worker_for_user(user_id)
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Worker profile not found"
        )
    return worker.id


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
    current_user: FacilityUser,
    service: JobsService = Depends(get_jobs_service),
) -> List[JobApplicationRead]:
    facility_id = _get_facility_id(service, current_user)
    applications = service.list_applications(job_id, facility_id=facility_id)
    if applications is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return applications


@router.get("/applications/facility", response_model=List[JobApplicationRead])
def list_facility_applications(
    job_post_id: Optional[UUID] = Query(None),
    current_user: FacilityUser,
    service: JobsService = Depends(get_jobs_service),
) -> List[JobApplicationRead]:
    facility_id = _get_facility_id(service, current_user)
    if job_post_id and not service.get_job_for_facility(job_post_id, facility_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return service.list_facility_applications(facility_id, job_post_id=job_post_id)


@router.get("/applications/worker", response_model=List[JobApplicationRead])
def list_worker_applications(
    current_user: WorkerUser,
    service: JobsService = Depends(get_jobs_service),
) -> List[JobApplicationRead]:
    worker_id = _get_worker_id(service, current_user)
    return service.list_worker_applications(worker_id)


@router.patch("/{job_id}", response_model=JobPostRead)
def update_job(
    job_id: UUID,
    payload: JobPostUpdate,
    current_user: FacilityUser,
    service: JobsService = Depends(get_jobs_service),
) -> JobPostRead:
    facility_id = _get_facility_id(service, current_user)
    job = service.update_job(job_id, facility_id, payload)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobPostRead.from_orm(job)


@router.put("/{job_id}", response_model=JobPostRead)
def replace_job(
    job_id: UUID,
    payload: JobPostCreate,
    current_user: FacilityUser,
    service: JobsService = Depends(get_jobs_service),
) -> JobPostRead:
    facility_id = _get_facility_id(service, current_user)
    if payload.facility_id != facility_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer job post to another facility",
        )
    job = service.replace_job(job_id, facility_id, payload)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return JobPostRead.from_orm(job)


@router.patch("/applications/{application_id}", response_model=JobApplicationRead)
def update_application(
    application_id: UUID,
    payload: JobApplicationUpdate,
    current_user: WorkerUser,
    service: JobsService = Depends(get_jobs_service),
) -> JobApplicationRead:
    worker_id = _get_worker_id(service, current_user)
    application = service.update_application(application_id, worker_id, payload)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job application not found"
        )
    return application


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: UUID,
    current_user: WorkerUser,
    service: JobsService = Depends(get_jobs_service),
) -> Response:
    worker_id = _get_worker_id(service, current_user)
    deleted = service.delete_application(application_id, worker_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job application not found"
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
