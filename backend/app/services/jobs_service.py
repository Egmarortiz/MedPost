"""""Business logic for jobs."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import JobPost
from app.repositories import FacilityRepository, JobRepository, WorkerRepository
from app.schemas import (
    JobApplicationCreate,
    JobApplicationRead,
    JobApplicationUpdate,
    JobFilter,
    JobPostCreate,
    PaginationParams,
    JobPostUpdate,
)


class JobsService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = JobRepository(session)
        self.facility_repo = FacilityRepository(session)
        self.worker_repo = WorkerRepository(session)

    def list_jobs(self, filters: JobFilter, pagination: PaginationParams) -> List[JobPost]:
        return self.repo.list_filtered(filters, pagination)

    def get_job(self, job_id: UUID) -> JobPost | None:
        return self.repo.get_job(job_id)

    def get_job_for_facility(self, job_id: UUID, facility_id: UUID) -> JobPost | None:
        return self.repo.get_job_for_facility(job_id, facility_id)

    def create_job(self, payload: JobPostCreate) -> JobPost:
        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        job = JobPost(**data)
        self.repo.add(job)
        self.session.commit()
        self.session.refresh(job)
        return job

    def replace_job(
        self, job_id: UUID, facility_id: UUID, payload: JobPostCreate
    ) -> JobPost | None:
        job = self.repo.get_job(job_id)
        if not job or job.facility_id != facility_id:
            return None

        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        data.pop("facility_id", None)
        for key, value in data.items():
            setattr(job, key, value)
        self.session.commit()
        self.session.refresh(job)
        return job

    def update_job(
        self, job_id: UUID, facility_id: UUID, payload: JobPostUpdate
    ) -> JobPost | None:
        job = self.repo.get_job(job_id)
        if not job or job.facility_id != facility_id:
            return None

        update_data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        update_data.pop("facility_id", None)
        for key, value in update_data.items():
            setattr(job, key, value)
        self.session.commit()
        self.session.refresh(job)
        return job

    def apply(self, payload: JobApplicationCreate) -> JobApplicationRead:
        from fastapi import HTTPException, status
        from app.models import VerificationStatus
        
        # Check if worker is verified
        worker = self.worker_repo.get(payload.worker_id)
        if not worker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not found",
            )
        
        if worker.verification_status != VerificationStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Verification required to apply for jobs. Please complete identity verification first.",
            )
        
        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        application = self.repo.add_application(data)
        self.session.commit()
        self.session.refresh(application)
        return JobApplicationRead.from_orm(application)

    def list_applications(
        self, job_post_id: UUID, facility_id: Optional[UUID] = None
    ) -> Optional[List[JobApplicationRead]]:
        if facility_id is not None and not self.repo.get_job_for_facility(
            job_post_id, facility_id
        ):
            return None
        applications = self.repo.list_applications(job_post_id)
        return [JobApplicationRead.from_orm(app) for app in applications]

    def list_facility_applications(
        self, facility_id: UUID, job_post_id: Optional[UUID] = None
    ) -> List[JobApplicationRead]:
        applications = self.repo.list_applications_for_facility(
            facility_id, job_post_id
        )
        return [JobApplicationRead.from_orm(app) for app in applications]

    def list_worker_applications(self, worker_id: UUID) -> List[JobApplicationRead]:
        applications = self.repo.list_applications_for_worker(worker_id)
        return [JobApplicationRead.from_orm(app) for app in applications]

    def update_application(
        self, application_id: UUID, worker_id: UUID, payload: JobApplicationUpdate
    ) -> Optional[JobApplicationRead]:
        application = self.repo.get_application_for_worker(application_id, worker_id)
        if not application:
            return None

        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        for key, value in data.items():
            setattr(application, key, value)
        self.session.commit()
        self.session.refresh(application)
        return JobApplicationRead.from_orm(application)

    def update_application_status(
        self, application_id: UUID, facility_id: UUID, payload: JobApplicationUpdate
    ) -> Optional[JobApplicationRead]:
        """Update application status by facility (authorization check included)."""
        # Get the application
        application = self.repo.get_application(application_id)
        if not application:
            return None
        
        # Verify the application belongs to a job posting of this facility
        job_post = self.repo.get_job(application.job_post_id)
        if not job_post or job_post.facility_id != facility_id:
            return None

        data = (
            payload.model_dump(mode="json", exclude_unset=True)
            if hasattr(payload, "model_dump")
            else payload.dict(exclude_unset=True)
        )
        for key, value in data.items():
            setattr(application, key, value)
        self.session.commit()
        self.session.refresh(application)
        return JobApplicationRead.from_orm(application)

    def delete_application(self, application_id: UUID, worker_id: UUID) -> bool:
        application = self.repo.get_application_for_worker(application_id, worker_id)
        if not application:
            return False
        self.repo.delete(application)
        self.session.commit()
        return True

    def get_facility_for_user(self, user_id: UUID):
        return self.facility_repo.get_by_user_id(user_id)

    def get_worker_for_user(self, user_id: UUID):
        return self.worker_repo.get_by_user_id(user_id)
