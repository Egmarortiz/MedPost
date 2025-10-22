from app.db import SessionLocal
from app.models import Worker, Facility, Application

def run():
    with SessionLocal() as session:
        ana = Worker(full_name="Ana Rivera", role="RN", license_number="PR-12345")
        pavia = Facility(legal_name="Pavia Hospital", industry="hospital")
        session.add_all([ana, pavia])
        session.commit()
        session.refresh(ana); session.refresh(pavia)

        app = Application(worker_id=ana.id, facility_id=pavia.id, status="submitted")
        session.add(app)
        session.commit()

if __name__ == "__main__":
    run()
