from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import declarative_base, relationship, Mapped, mapped_column

Base = declarative_base()

class Worker(Base):
    __tablename__ = "workers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)  # 'RN','LPN','CNA',...
    license_number: Mapped[str | None] = mapped_column(String, nullable=True)
    phone = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    applications: Mapped[list["Application"]] = relationship(back_populates="worker")

class Facility(Base):
    __tablename__ = "facilities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    legal_name: Mapped[str] = mapped_column(String, nullable=False)
    industry: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(DateTime, server_default=func.now())

    applications: Mapped[list["Application"]] = relationship(back_populates="facility")

class Application(Base):
    __tablename__ = "applications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("workers.id"), nullable=False)
    facility_id: Mapped[int] = mapped_column(ForeignKey("facilities.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="submitted")

    worker: Mapped[Worker] = relationship(back_populates="applications")
    facility: Mapped[Facility] = relationship(back_populates="applications")

