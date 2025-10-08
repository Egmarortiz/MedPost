"""GraphQL resolvers bridging to the service layer."""

from __future__ import annotations

from contextlib import contextmanager
from typing import List, Optional

import strawberry
from strawberry.types import Info

from app.schemas import JobFilter, PaginationParams, WorkerFilter
from app.services import FacilitiesService, JobsService, WorkersService

from .types import FacilityType, JobPostType, WorkerType


@contextmanager
def session_from_context(info: Info):
    session_factory = info.context["session_factory"]
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


@strawberry.type
class Query:
    @strawberry.field
    def workers(
        self,
        info: Info,
        title: Optional[str] = None,
    ) -> List[WorkerType]:
        with session_from_context(info) as session:
            service = WorkersService(session)
            workers = service.list_workers(
                WorkerFilter(title=title), PaginationParams()
            )
            return [
                WorkerType(
                    id=worker.id,
                    full_name=worker.full_name,
                    title=worker.title.value if hasattr(worker.title, "value") else str(worker.title),
                    city=worker.city,
                    state_province=worker.state_province,
                    created_at=worker.created_at,
                )
                for worker in workers
            ]

    @strawberry.field
    def job_posts(
        self,
        info: Info,
        city: Optional[str] = None,
    ) -> List[JobPostType]:
        with session_from_context(info) as session:
            service = JobsService(session)
            jobs = service.list_jobs(JobFilter(city=city), PaginationParams())
            return [
                JobPostType(
                    id=job.id,
                    position_title=job.position_title,
                    city=job.city,
                    state_province=job.state_province,
                    employment_type=job.employment_type.value if hasattr(job.employment_type, "value") else str(job.employment_type),
                    compensation_type=job.compensation_type.value if hasattr(job.compensation_type, "value") else str(job.compensation_type),
                    is_active=job.is_active,
                )
                for job in jobs
            ]

    @strawberry.field
    def facilities(self, info: Info) -> List[FacilityType]:
        with session_from_context(info) as session:
            service = FacilitiesService(session)
            facilities = service.list_facilities(PaginationParams())
            return [
                FacilityType(
                    id=facility.id,
                    legal_name=facility.legal_name,
                    industry=facility.industry.value if hasattr(facility.industry, "value") else str(facility.industry),
                    city=facility.hq_city,
                    state_province=facility.hq_state_province,
                    is_verified=facility.is_verified,
                )
                for facility in facilities
            ]


schema_query = Query
