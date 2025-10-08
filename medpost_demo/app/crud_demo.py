# app/crud_demo.py
from sqlalchemy import select
from app.db import SessionLocal
from app.models import Worker

def run():
    # CALL the factory to get a Session instance
    with SessionLocal() as s:
        # grab one worker
        w = s.execute(select(Worker).limit(1)).scalar_one_or_none()
        if not w:
            print("No workers found. Seed first: python -m app.seed")
            return

        # update something
        # NOTE: only use 'phone' if you added the column & migrated
        # otherwise change this line to update an existing column like license_number
        if hasattr(w, "phone"):
            w.phone = "787-555-1234"
        else:
            w.license_number = "PR-NEW-9999"

        s.commit()
        print(f"Updated worker: {w.full_name}")

if __name__ == "__main__":
    run()

