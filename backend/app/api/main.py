#!/bin/bash/env python3
from fastapi import FastAPI
from app.api import api_router
"""
Initializes API connection with route
"""


app = FastApi(title="MedPost API")

app.include_router(api_router)
