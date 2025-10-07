#!/usr/bin/env python3
"""
Initializes API connection with route
"""

from fastapi import FastAPI
from app.api import api_router
from strawberry.fastapi import GraphQLRouter
from app.graphql.root import schema

app = FastApi(title="MedPost API")

app.include_router(api_router. prefic="/api")
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")
