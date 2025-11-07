#!/usr/bin/env python3
from fastapi import APIRouter
from .v1 import api_router as v1_router

# Creates API router for subrouter files
api_router = APIRouter()

api_router.include_router(v1_router, prefix="/v1")
