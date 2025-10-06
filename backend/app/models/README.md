## File tree

```
app/
  models/
    __init__.py        # imports worker, facility, jobs (registers mappers)
    base_model.py      # Base, naming, shared enums, Endorsement
    worker.py          # Worker*, Experience, Credential*
    facility.py        # Facility*, FacilityAddress, Specialty*, Certification
    jobs.py            # JobPost, JobPostRole, JobApplication
```



## Workers model (October 1, 2025)

```
file: workers.py
```

# Purpose behind design (to stay sane)

The current design is built to be lean;
map out cleanly and enable future scale,
avoiding painful restructuring of the schema in the future.

# Worker fields and some notes

Single title per worker: enforced via Worker.title enum.

Education: constrained to your two options via EducationLevel.

Location: simple columns + indexes → fast filtering; can upgrade to geosearch later.

Resume & profile image: URL fields only (store files in S3 / GCS using signed URLs).

Experience: its own table → multiple entries, ordered by start_date.

Credentials/Specializations: normalized as (CredentialType ↔ WorkerCredential).

Today we can pre-seed CPR, ICU, COLLEGE_DIPLOMA, HS_DIPLOMA, etc.

Tomorrow we can add new rows with no schema change.

Endorsements: one per facility per worker (unique constraint), optional note.

We can enforce “only verified facilities can endorse” in service layer (or via DB trigger if we want).

Safety tiers: explicit records per tier with status + evidence; easy to show a progress UI.

# Practical constraints and indexes

Compound indexes ("title", "city"), ("title", "state_province") support the most common search filters.

Uniqs prevent duplicates:

One endorsement per (facility, worker).

One credential_type per worker.

One safety tier row per worker.

Dates: Experience.end_date can be NULL to signal “current role.”

# Opinions / tiny tweaks

Keep titles as defined (one per user). If a worker later upgrades (e.g., CNA → LPN), simply update the enum value and keep history in Experience.

Endorsements should show the facility’s verified status in the UI; can also include a “verified at” timestamp later.

Note to self: Consider a search_vector (Postgres tsvector) later for name, city, credentials labels, etc. Not needed for MVP, I think.
