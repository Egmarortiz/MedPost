"""File upload endpoints."""

from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from pydantic import BaseModel

router = APIRouter(tags=["upload"])

# Configure upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


class UploadResponse(BaseModel):
    url: str
    filename: str


def save_upload_file(upload_file: UploadFile, allowed_types: set) -> str:
    """Save uploaded file and return the URL."""
    # Validate content type
    if upload_file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed types: {', '.join(allowed_types)}",
        )
    
    # Generate unique filename
    file_extension = Path(upload_file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            content = upload_file.file.read()
            
            # Check file size
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB",
                )
            
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )
    
    return f"/uploads/{unique_filename}"


@router.post("/image", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)) -> UploadResponse:
    """Upload an image file (profile picture, etc.)."""
    url = save_upload_file(file, ALLOWED_IMAGE_TYPES)
    return UploadResponse(url=url, filename=file.filename)


@router.post("/document", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...)) -> UploadResponse:
    """Upload a document file (resume, verification docs, etc.)."""
    url = save_upload_file(file, ALLOWED_DOCUMENT_TYPES)
    return UploadResponse(url=url, filename=file.filename)
