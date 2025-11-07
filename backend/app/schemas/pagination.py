from pydantic import BaseModel, Field
"""Pagination parameters for lists"""

class PaginationParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
    