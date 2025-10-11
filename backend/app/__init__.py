from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost", 
    "http://localhost:19006",   # Expo web
    "http://127.0.0.1:8000",   # FastAPI dev
    "exp:://127.0.0.1:9000",   # Expo Go local dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
)
