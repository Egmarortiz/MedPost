"""Shared Pydantic schemas."""

from __future__ import annotations

from typing import Generic, Sequence, TypeVar

from pydantic import BaseModel, Field, ConfigDict
from pydantic.generics import GenericModel

T = TypeVar("T")


class APIModel(BaseModel):
    class Config:
        from_attributes = True

class PaginatedResponse(GenericModel, Generic[T]):
    items: Sequence[T]
    total: int
    limit: int
    offset: int

    class Config:
        from_attributes = True


class Message(APIModel):
    detail: str


class EnumValue(APIModel):
    key: str
    value: str


class PaginationParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)

