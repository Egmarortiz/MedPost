import strawberry
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.schemas.jobs import JobCreate, JobRead
from app.crud import jobs as jobs_crud


@strawberry.type
class JobType:
    id: strawberry.ID
    position_title: str
    employment_type: str
    compensation_type: str
    city: Optional[str]
    state_province: Optional[str]
    description: Optional[str]
    is_active: bool
    published_at: Optional[datetime]


@strawberry.type
class Query:
    @strawberry.field
    async def all_jobs(self) -> List[JobType]:
        # Fetch all job posts
        jobs = await jobs_crud.get_all_jobs()
        return [JobType(**j.__dict__) for j in jobs]

    @strawberry.field
    async def get_job(self, id: UUID) -> Optional[JobType]:
        # Fetch one job post
        job = await jobs_crud.get_job(id)
        if job:
            return JobType(**job.__dict__)
        return None


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_job(self, input: JobCreate) -> JobType:
        # Creates new job post
        new_job = await jobs_crud.create_job(input)
        return JobType(**new_job.__dict__)

    @strawberry.mutation
    async def delete_job(self, id: UUID) -> bool:
        # Deletes job post
        return await jobs_crud.delete_job(id)