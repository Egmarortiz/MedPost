"""Job REST endpoints."""

from __future__ import annotations

from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, Request
from sqlalchemy import or_, func, cast, String

from app.core import PuertoRicoMunicipality
from app.core.security import TokenPayload, decode_jwt
from app.models import CompensationType, EmploymentType, WorkerTitle, UserRole, JobPost
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
from app.schemas import PaginationParams
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
    current_user: FacilityUser,
    service: JobsService = Depends(get_jobs_service),
) -> JobPostRead:
    job = service.create_job(payload)
    return JobPostRead.from_orm(job)


@router.get("/search")
def search_jobs(
    q: str = "",
) -> List[dict]:
    """Search jobs by position title, description, location, company name, or industry with keyword matching."""
    try:
        from app.db import get_session_factory
        from app.models import Facility
        SessionLocal = get_session_factory()
        db = SessionLocal()
        
        if not q or not q.strip():
            return []
        
        search_term = f"%{q.strip()}%"
        
        # Search by job position title, description, city, facility name, or industry
        query = db.query(JobPost).join(Facility).filter(
            or_(
                func.lower(cast(JobPost.position_title, String)).ilike(search_term),
                func.lower(cast(JobPost.description, String)).ilike(search_term),
                func.lower(cast(JobPost.city, String)).ilike(search_term),
                func.lower(cast(Facility.legal_name, String)).ilike(search_term),
                func.lower(cast(Facility.industry, String)).ilike(search_term),
            )
        ).limit(50)
        
        jobs = query.all()
        result = []
        for job in jobs:
            try:
                salary_min = None
                salary_max = None
                if job.compensation_type.value == "HOURLY":
                    salary_min = job.hourly_min
                    salary_max = job.hourly_max
                elif job.compensation_type.value == "MONTHLY":
                    salary_min = job.monthly_min
                    salary_max = job.monthly_max
                elif job.compensation_type.value == "YEARLY":
                    salary_min = job.yearly_min
                    salary_max = job.yearly_max
                
                facility_name = None
                facility_industry = None
                if job.facility:
                    facility_name = job.facility.legal_name
                    facility_industry = job.facility.industry
                
                job_dict = {
                    'id': str(job.id),
                    'title': job.position_title,
                    'description': job.description[:200] if job.description else None,
                    'city': job.city,
                    'state_province': job.state_province,
                    'employment_type': job.employment_type.value if job.employment_type else None,
                    'compensation_type': job.compensation_type.value if job.compensation_type else None,
                    'salary_min': float(salary_min) if salary_min else None,
                    'salary_max': float(salary_max) if salary_max else None,
                    'is_active': job.is_active,
                    'facility_id': str(job.facility_id),
                    'facility_name': facility_name,
                    'industry': facility_industry,
                }
                result.append(job_dict)
            except Exception as e:
                print(f"Error serializing job {job.id}: {e}")
                import traceback
                traceback.print_exc()
        db.close()
        return result
    except Exception as e:
        print(f"Search jobs error: {e}")
        import traceback
        traceback.print_exc()
        return []


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
    current_user: FacilityUser,
    job_post_id: Optional[UUID] = Query(None),
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


@router.patch("/applications/{application_id}/status", response_model=JobApplicationRead)
def update_application_status_by_facility(
    application_id: UUID,
    payload: JobApplicationUpdate,
    current_user: FacilityUser,
    service: JobsService = Depends(get_jobs_service),
) -> JobApplicationRead:
    """Allow facility to update application status."""
    facility_id = _get_facility_id(service, current_user)
    application = service.update_application_status(application_id, facility_id, payload)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job application not found or not authorized"
        )
    return application


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
