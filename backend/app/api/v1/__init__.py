"""API v1 router configuration."""

from fastapi import APIRouter

from .routers import (
    auth,
    endorsements,
    facility_certifications,
    facilities,
    jobs,
    workers,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth")
api_router.include_router(workers.router, prefix="/workers", tags=["workers"])
api_router.include_router(facilities.router, prefix="/facilities", tags=["facilities"])
api_router.include_router(
    facility_certifications.router,
    prefix="/facility-certifications",
    tags=["facility-certifications"],
)
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(endorsements.router, prefix="/endorsements", tags=["endorsements"])

__all__ = ["api_router"]
