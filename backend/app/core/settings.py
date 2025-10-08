"""Application configuration powered by Pydantic settings."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, BaseSettings, Field


class Settings(BaseSettings):
    """Runtime configuration for the MedPost backend."""

    project_name: str = Field(default="MedPost API")
    debug: bool = Field(default=False)

    database_url: str = Field(
        default="sqlite:///./changeme",
        description="SQLAlchemy compatible database URL",
    )

    cors_origins: List[AnyHttpUrl] = Field(default_factory=list)

    jwt_secret_key: str = Field(default="change-me", min_length=1)
    jwt_algorithm: str = Field(default="HS256")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
