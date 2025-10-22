"""Job repository."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import JobPost, JobPostRole, JobApplication
from app.schemas import JobFilter, PaginationParams
from .base import SQLAlchemyRepository


class JobRepository(SQLAlchemyRepository[JobPost]):
    def __init__(self, session: Session):
        super().__init__(JobPost, session)

    def list_filtered(self, filters: JobFilter, params: Optional[PaginationParams] = None) -> List[JobPost]:
        stmt = select(JobPost)
        if filters.worker_titles:
            stmt = (
                stmt.join(JobPost.roles)
                .where(JobPostRole.role.in_(filters.worker_titles))
                .distinct()
            )
        if filters.employment_type:
            stmt = stmt.where(JobPost.employment_type == filters.employment_type)
        if filters.compensation_type:
            stmt = stmt.where(JobPost.compensation_type == filters.compensation_type)
        if filters.city:
            stmt = stmt.where(JobPost.city == filters.city)
        if params:
            stmt = stmt.offset(params.offset).limit(params.limit)
        return self.session.execute(stmt).scalars().all()

    def get_job(self, job_id: UUID) -> Optional[JobPost]:
        return self.session.get(JobPost, job_id)

    def get_job_for_facility(self, job_id: UUID, facility_id: UUID) -> Optional[JobPost]:
        stmt = select(JobPost).where(
            JobPost.id == job_id,
            JobPost.facility_id == facility_id,
        )
        return self.session.execute(stmt).scalars().first()

    def add_application(self, payload: dict) -> JobApplication:
        obj = JobApplication(**payload)
        self.session.add(obj)
        self.session.flush()
        return obj

    def list_applications(self, job_post_id: UUID) -> List[JobApplication]:
        stmt = select(JobApplication).where(JobApplication.job_post_id == job_post_id)
        return self.session.execute(stmt).scalars().all()

    def list_applications_for_facility(
        self, facility_id: UUID, job_post_id: Optional[UUID] = None
    ) -> List[JobApplication]:
        stmt = (
            select(JobApplication)
            .join(JobPost)
            .where(JobPost.facility_id == facility_id)
        )
        if job_post_id:
            stmt = stmt.where(JobApplication.job_post_id == job_post_id)
        stmt = stmt.order_by(JobApplication.created_at.desc())
        return self.session.execute(stmt).scalars().all()

    def get_application(self, application_id: UUID) -> Optional[JobApplication]:
        return self.session.get(JobApplication, application_id)

    def get_application_for_worker(
        self, application_id: UUID, worker_id: UUID
    ) -> Optional[JobApplication]:
        stmt = select(JobApplication).where(
            JobApplication.id == application_id,
            JobApplication.worker_id == worker_id,
        )
        return self.session.execute(stmt).scalars().first()

    def list_applications_for_worker(self, worker_id: UUID) -> List[JobApplication]:
        stmt = (
            select(JobApplication)
            .where(JobApplication.worker_id == worker_id)
            .order_by(JobApplication.created_at.desc())
        )
        return self.session.execute(stmt).scalars().all()
