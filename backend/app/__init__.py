"""MedPost backend application package."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:  # pragma: no cover - imported for type checking only
    from fastapi import FastAPI


    def create_app(*args: Any, **kwargs: Any) -> FastAPI: ...
else:

    def create_app(*args: Any, **kwargs: Any):
        """Create and return the FastAPI application instance lazily."""

        from .main import create_app as _create_app

        return _create_app(*args, **kwargs)

__all__ = ["create_app"]
