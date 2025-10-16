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
        if filters.title:
            stmt = stmt.where(JobPost.position_title.ilike(f"%{filters.title}%"))
        if filters.worker_title:
            stmt = stmt.join(JobPost.roles).where(JobPostRole.role == filters.worker_title)
        if filters.employment_type:
            stmt = stmt.where(JobPost.employment_type == filters.employment_type)
        if filters.compensation_type:
            stmt = stmt.where(JobPost.compensation_type == filters.compensation_type)
        if filters.city:
            stmt = stmt.where(JobPost.city == filters.city)
        if filters.state_province:
            stmt = stmt.where(JobPost.state_province == filters.state_province)
        if params:
            stmt = stmt.offset(params.offset).limit(params.limit)
        return self.session.execute(stmt).scalars().all()

    def get_job(self, job_id: UUID) -> Optional[JobPost]:
        return self.session.get(JobPost, job_id)

    def add_application(self, payload: dict) -> JobApplication:
        obj = JobApplication(**payload)
        self.session.add(obj)
        self.session.flush()
        return obj

    def list_applications(self, job_post_id: UUID) -> List[JobApplication]:
        stmt = select(JobApplication).where(JobApplication.job_post_id == job_post_id)
        return self.session.execute(stmt).scalars().all()
