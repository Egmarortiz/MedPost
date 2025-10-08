"""Worker repository."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Worker, Experience, WorkerCredential
from app.schemas import PaginationParams, WorkerFilter
from .base import SQLAlchemyRepository


class WorkerRepository(SQLAlchemyRepository[Worker]):
    def __init__(self, session: Session):
        super().__init__(Worker, session)

    def list_filtered(self, filters: WorkerFilter, params: Optional[PaginationParams] = None) -> List[Worker]:
        stmt = select(Worker)
        if filters.title:
            stmt = stmt.where(Worker.title == filters.title)
        if filters.city:
            stmt = stmt.where(Worker.city == filters.city)
        if filters.state_province:
            stmt = stmt.where(Worker.state_province == filters.state_province)
        if params:
            stmt = stmt.offset(params.offset).limit(params.size)
        return self.session.execute(stmt).scalars().all()

    def get_worker(self, worker_id: UUID) -> Optional[Worker]:
        return self.session.get(Worker, worker_id)

    def add_experience(self, worker_id: UUID, payload: dict) -> Experience:
        obj = Experience(worker_id=worker_id, **payload)
        self.session.add(obj)
        self.session.flush()
        return obj

    def list_experiences(self, worker_id: UUID) -> List[Experience]:
        stmt = select(Experience).where(Experience.worker_id == worker_id)
        return self.session.execute(stmt).scalars().all()

    def add_credential(self, worker_id: UUID, payload: dict) -> WorkerCredential:
        obj = WorkerCredential(worker_id=worker_id, **payload)
        self.session.add(obj)
        self.session.flush()
        return obj

    def list_credentials(self, worker_id: UUID) -> List[WorkerCredential]:
        stmt = select(WorkerCredential).where(WorkerCredential.worker_id == worker_id)
        return self.session.execute(stmt).scalars().all()
