"""Worker REST endpoints."""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core import PuertoRicoMunicipality
from app.models import EducationLevel, WorkerTitle
from app.schemas import (
    ExperienceCreate,
    ExperienceRead,
    ExperienceUpdate,
    PaginatedResponse,
    WorkerCreate,
    WorkerCredentialCreate,
    WorkerCredentialRead,
    WorkerFilter,
    WorkerRead,
    WorkerUpdate,
)
from app.api.deps import (
    get_pagination_params,
    get_workers_service,
)
from app.schemas.common import PaginationParams
from app.services.workers_service import WorkersService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse[WorkerRead])
def list_workers(
    title: Optional[WorkerTitle] = None,
    city: Optional[PuertoRicoMunicipality] = None,
    education_level: Optional[EducationLevel] = None,
    has_endorsements: Optional[bool] = None,
    pagination: PaginationParams = Depends(get_pagination_params),
    service: WorkersService = Depends(get_workers_service),
) -> PaginatedResponse[WorkerRead]:
    filters = WorkerFilter(
        title=title,
        city=city,
        education_level=education_level,
        has_endorsements=has_endorsements,
    )
    workers, total = service.list_workers(filters, pagination)
    items = [WorkerRead.from_orm(worker) for worker in workers]
    return PaginatedResponse[WorkerRead](
        items=items,
        total=total,
        limit=pagination.limit,
        offset=pagination.offset,
    )

@router.post("/", response_model=WorkerRead, status_code=status.HTTP_201_CREATED)
def create_worker(
    payload: WorkerCreate,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    worker = service.create_worker(payload)
    return WorkerRead.from_orm(worker)


@router.get("/{worker_id}", response_model=WorkerRead)
def get_worker(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    worker = service.get_worker(worker_id)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return WorkerRead.from_orm(worker)


@router.patch("/{worker_id}", response_model=WorkerRead)
def update_worker(
    worker_id: UUID,
    payload: WorkerUpdate,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerRead:
    worker = service.update_worker(worker_id, payload)
    if not worker:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return WorkerRead.from_orm(worker)


@router.delete("/{worker_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_worker(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> Response:
    deleted = service.delete_worker(worker_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Worker not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.post("/{worker_id}/experiences", response_model=ExperienceRead, status_code=status.HTTP_201_CREATED)
def create_experience(
    worker_id: UUID,
    payload: ExperienceCreate,
    service: WorkersService = Depends(get_workers_service),
) -> ExperienceRead:
    return service.add_experience(worker_id, payload)


@router.get("/{worker_id}/experiences", response_model=List[ExperienceRead])
def list_experiences(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> List[ExperienceRead]:
    return service.list_experiences(worker_id)


@router.get("/{worker_id}/experiences/{experience_id}", response_model=ExperienceRead)
def get_experience(
    worker_id: UUID,
    experience_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> ExperienceRead:
    experience = service.get_experience(worker_id, experience_id)
    if not experience:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return experience


@router.patch("/{worker_id}/experiences/{experience_id}", response_model=ExperienceRead)
@router.put("/{worker_id}/experiences/{experience_id}", response_model=ExperienceRead)
def update_experience(
    worker_id: UUID,
    experience_id: UUID,
    payload: ExperienceUpdate,
    service: WorkersService = Depends(get_workers_service),
) -> ExperienceRead:
    experience = service.update_experience(worker_id, experience_id, payload)
    if not experience:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return experience


@router.delete(
    "/{worker_id}/experiences/{experience_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_experience(
    worker_id: UUID,
    experience_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> Response:
    deleted = service.delete_experience(worker_id, experience_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{worker_id}/credentials", response_model=WorkerCredentialRead, status_code=status.HTTP_201_CREATED)
def create_credential(
    worker_id: UUID,
    payload: WorkerCredentialCreate,
    service: WorkersService = Depends(get_workers_service),
) -> WorkerCredentialRead:
    return service.add_credential(worker_id, payload)


@router.get("/{worker_id}/credentials", response_model=List[WorkerCredentialRead])
def list_credentials(
    worker_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> List[WorkerCredentialRead]:
    return service.list_credentials(worker_id)


@router.delete(
    "/{worker_id}/credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_credential(
    worker_id: UUID,
    credential_id: UUID,
    service: WorkersService = Depends(get_workers_service),
) -> Response:
    deleted = service.delete_credential(worker_id, credential_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
