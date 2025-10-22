"""Base repository implementation."""

from __future__ import annotations

from typing import Generic, Optional, Sequence, Type, TypeVar

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.schemas.common import PaginationParams

ModelT = TypeVar("ModelT")


class SQLAlchemyRepository(Generic[ModelT]):
    def __init__(self, model: Type[ModelT], session: Session):
        self.model = model
        self.session = session

    def list(self, params: Optional[PaginationParams] = None) -> Sequence[ModelT]:
        stmt = select(self.model)
        if params:
            stmt = stmt.offset(params.offset).limit(params.size)
        return self.session.execute(stmt).scalars().all()

    def get(self, obj_id):
        return self.session.get(self.model, obj_id)

    def add(self, obj: ModelT) -> ModelT:
        self.session.add(obj)
        self.session.flush()
        return obj

    def delete(self, obj: ModelT) -> None:
        self.session.delete(obj)
