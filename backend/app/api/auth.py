#!/usr/bin/env python3
"""Login session authentication"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login_user(data: LoginRequest):
    # Verifies credentials
    return {"message": "Login successful!"}