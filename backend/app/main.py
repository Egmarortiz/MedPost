"""FastAPI application factory."""

from __future__ import annotations
from pathlib import Path
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.core import get_settings

# Initialize sentence transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Create FastAPI app
settings = get_settings()
app = FastAPI(title="MedPost API", debug=settings.debug)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if not settings.cors_origins else [str(origin) for origin in settings.cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving static files
UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include API router
app.include_router(api_router)

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "MedPost API is running",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.post('/get_embedding')
async def get_embedding(text: str):
    """Get text embedding using sentence transformer"""
    embedding = model.encode(text).tolist()
    return {'embedding': embedding}
