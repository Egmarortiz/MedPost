"""Worker Graphql queries schema"""

import strawberry
from typing import List, Optional
from uuid import UUID
from datetime import date

from app.schemas.worker import WorkerCreate, WorkerRead
from app.crud import worker as worker_crud
from app.models import Worker

@strawberry.type
class WorkerType:
    id: strawberry.ID
    full_name: str
    title: Optional[str]
    phone_e164: Optional[str]
    email: Optional[str]
    profile_image_url: Optional[str]
    created_at: Optional[date]


@strawberry.type
class Query:
    @strawberry.field
    async def all_workers(self) -> List[WorkerType]:
        # Fetch all workers
        workers = await worker_crud.get_all_workers()
        return [WorkerType(**w.__dict__) for w in workers]

    @strawberry.field
    async def get_worker(self, id: UUID) -> Optional[WorkerType]:
        # Fetch one worker by ID
        worker = await worker_crud.get_worker(id)
        if worker:
            return WorkerType(**worker.__dict__)
        return None


@strawberry.type
class Mutation:
    @strawberry.mutation
    async def create_worker(self, input: WorkerCreate) -> WorkerType:
        # Create new worker
        new_worker = await worker_crud.create_worker(input)
        return WorkerType(**new_worker.__dict__)

    @strawberry.mutation
    async def delete_worker(self, id: UUID) -> bool:
        # Deletes worker
        return await worker_crud.delete_worker(id)
