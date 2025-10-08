"""Shared Pydantic schemas."""

from __future__ import annotations

from typing import Generic, Sequence, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIModel(BaseModel):
    class Config:
        orm_mode = True


class PaginatedResponse(APIModel, Generic[T]):
    items: Sequence[T]
    total: int
    page: int
    size: int


class Message(APIModel):
    detail: str


class EnumValue(APIModel):
    key: str
    value: str


class PaginationParams(BaseModel):
    page: int = 1
    size: int = 25

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size
