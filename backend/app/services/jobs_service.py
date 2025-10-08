"""""Business logic for jobs."""

from __future__ import annotations

from typing import List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import JobPost
from app.repositories import JobRepository
from app.schemas import (
    JobApplicationCreate,
    JobApplicationRead,
    JobFilter,
    JobPostCreate,
    PaginationParams,
)


class JobsService:
    def __init__(self, session: Session):
        self.session = session
        self.repo = JobRepository(session)

    def list_jobs(self, filters: JobFilter, pagination: PaginationParams) -> List[JobPost]:
        return self.repo.list_filtered(filters, pagination)

    def get_job(self, job_id: UUID) -> JobPost | None:
        return self.repo.get_job(job_id)

    def create_job(self, payload: JobPostCreate) -> JobPost:
        job = JobPost(**payload.dict(exclude_unset=True))
        self.repo.add(job)
        self.session.commit()
        self.session.refresh(job)
        return job

    def apply(self, payload: JobApplicationCreate) -> JobApplicationRead:
        application = self.repo.add_application(payload.dict(exclude_unset=True))
        self.session.commit()
        self.session.refresh(application)
        return JobApplicationRead.from_orm(application)

    def list_applications(self, job_post_id: UUID) -> List[JobApplicationRead]:
        applications = self.repo.list_applications(job_post_id)
        return [JobApplicationRead.from_orm(app) for app in applications]
