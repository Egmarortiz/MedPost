from sqlalchemy import select
from app.db import SessionLocal
from app.models import Worker, Facility, Application

def run():
    with SessionLocal() as session:
        stmt = (
            select(Worker.full_name, Facility.legal_name, Application.status)
            .join(Application, Application.worker_id == Worker.id)
            .join(Facility, Application.facility_id == Facility.id)
        )
        for row in session.execute(stmt).all():
            print(row)

if __name__ == "__main__":
    run()
