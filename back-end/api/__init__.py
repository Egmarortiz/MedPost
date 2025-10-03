#!/bin/bash/env python3
from fastapi import APIRouter
from . import facility, worker, auth


# Creates API router for subrouter files
api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/worker" \
"", tags=["worker"])
api_router.include_router(facility.router, prefix="/facility", tags=["facility"])
