"""GraphQL schema factory."""

from __future__ import annotations

import strawberry

from .resolvers import schema_query


def create_schema() -> strawberry.Schema:
    return strawberry.Schema(query=schema_query)
