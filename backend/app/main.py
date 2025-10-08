"""FastAPI application factory."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter

from app.api import api_router
from app.core import get_settings
from app.db.session import get_session_factory
from app.graphql import create_schema


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title=settings.project_name, debug=settings.debug)

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.cors_origins],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_router, prefix="/api/v1")

    schema = create_schema()
    session_factory = get_session_factory()

    async def get_context() -> Dict[str, Any]:
        return {"session_factory": session_factory}

    graphql_router = GraphQLRouter(schema, context_getter=get_context)
    app.include_router(graphql_router, prefix="/graphql")

    return app


app = create_app()
