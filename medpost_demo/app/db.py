import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()  # loads .env if present

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://medpost:ChangeMe123!@127.0.0.1:5432/medpost_demo",
)

engine = create_engine(DATABASE_URL, echo=True, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

