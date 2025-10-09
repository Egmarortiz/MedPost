"""Application configuration powered by Pydantic settings."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Runtime configuration for the MedPost backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    project_name: str = Field(default="MedPost API")
    debug: bool = Field(default=False)

    database_url: str = Field(
        default="postgresql+psycopg2://medpost:MedPost123@localhost/medpost_dev",
        description="SQLAlchemy compatible database URL",
    )

    cors_origins: List[AnyHttpUrl] | str = Field(default_factory=list)

    jwt_secret_key: str = Field(default="change-me", min_length=1)
    jwt_algorithm: str = Field(default="HS256")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: List[AnyHttpUrl] | str | None) -> List[AnyHttpUrl] | str | None:
        """Allow comma separated CORS origins or an empty string in the env file.

        Alembic runs without FastAPI so the ``CORS_ORIGINS`` env var may be left
        blank. Pydantic would normally try to JSON decode the empty string and
        raise an error. Accept an empty string as ``[]`` and split comma
        separated strings into lists so regular parsing can continue.
        """

        if value is None:
            return value

        if isinstance(value, str):
            if not value.strip():
                return []
            return [origin.strip() for origin in value.split(",") if origin.strip()]

        return value


@lru_cache()
def get_settings() -> Settings:
    """Return a cached settings instance."""

    return Settings()
