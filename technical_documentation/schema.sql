-- ============================================================
-- MedPost Relational Schema (PostgreSQL)
-- Consolidated from Worker + Facility pages and prior drafts
-- Idempotent-ish: uses IF NOT EXISTS and safe CREATE TYPE blocks
-- ============================================================

-- Extensions (optional but why not honestly)
CREATE EXTENSION IF NOT EXISTS citext;
--  if we plan to use GEOGRAPHY/GEOMETRY types, enable PostGIS:
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- =========================
-- Enums
-- =========================
DO $$ BEGIN
  CREATE TYPE education_level AS ENUM ('none','high_school','some_college','associate','bachelor','master','doctorate','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bg_level AS ENUM ('basic','standard','premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bg_status AS ENUM ('not_started','in_progress','clear','flagged','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE facility_type AS ENUM ('hospital','home_health','clinic','dialysis','senior_care','behavioral_health','rehab','fqh_center','lab','imaging','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE verify_status AS ENUM ('unverified','pending','verified','rejected','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================
-- Core Identity
-- =========================
CREATE TABLE IF NOT EXISTS app_user (
  id           BIGSERIAL PRIMARY KEY,
  role         TEXT NOT NULL CHECK (role IN ('worker','facility','admin','verifier')),
  email        CITEXT UNIQUE NOT NULL,
  phone_e164   TEXT UNIQUE,
  pwd_hash     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended','deleted')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profile (
  user_id      BIGINT PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  first_name   TEXT,
  last_name    TEXT,
  dob          DATE,
  country      TEXT,
  region       TEXT,
  city         TEXT,
  postal_code  TEXT,
  headline     TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- Workers
-- =========================
CREATE TABLE IF NOT EXISTS worker_profile (
  user_id        BIGINT PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  category       TEXT NOT NULL CHECK (category IN ('RN','LPN','CNA','Caregiver','Support')),
  sub_specialty  TEXT[],
  years_exp      NUMERIC(4,1) CHECK (years_exp >= 0),
  seeking_types  TEXT[] DEFAULT '{}',
  rank_score     NUMERIC(6,2) DEFAULT 0,
  visibility     BOOLEAN NOT NULL DEFAULT TRUE,
  -- location_geo GEOGRAPHY(POINT,4326), -- enable PostGIS if you want this
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  meta           JSONB NOT NULL DEFAULT '{}',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_worker_profile_category ON worker_profile(category);
CREATE INDEX IF NOT EXISTS idx_worker_profile_rank ON worker_profile(rank_score DESC);

-- Education (1:1 with worker)
CREATE TABLE IF NOT EXISTS education_attainment (
  worker_id      BIGINT PRIMARY KEY REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  level          education_level NOT NULL,
  institution    TEXT,
  field_of_study TEXT,
  evidence_url   TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Skills / courses (CPR, ACLS, etc.)
CREATE TABLE IF NOT EXISTS skill (
  id     BIGSERIAL PRIMARY KEY,
  code   TEXT UNIQUE NOT NULL,
  name   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS worker_skill (
  worker_id    BIGINT NOT NULL REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  skill_id     BIGINT NOT NULL REFERENCES skill(id),
  evidence_url TEXT,
  issued_at    DATE,
  expires_at   DATE,
  PRIMARY KEY (worker_id, skill_id)
);

-- Licenses
CREATE TABLE IF NOT EXISTS license_type (
  id           BIGSERIAL PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  issuer_scope TEXT
);

CREATE TABLE IF NOT EXISTS worker_license (
  id              BIGSERIAL PRIMARY KEY,
  worker_id       BIGINT NOT NULL REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  license_type_id BIGINT NOT NULL REFERENCES license_type(id),
  license_number  TEXT,
  issuer          TEXT,
  jurisdiction    TEXT,
  issued_at       DATE,
  expires_at      DATE,
  status          TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('unverified','pending','verified','rejected')),
  evidence_url    TEXT,
  verifier_user   BIGINT REFERENCES app_user(id),
  verified_at     TIMESTAMPTZ,
  UNIQUE(worker_id, license_type_id, license_number)
);

CREATE INDEX IF NOT EXISTS idx_license_worker_status ON worker_license(worker_id, status);

-- External facility directory to normalize experiences
CREATE TABLE IF NOT EXISTS facility_directory (
  id           BIGSERIAL PRIMARY KEY,
  legal_name   TEXT NOT NULL,
  city         TEXT,
  region       TEXT,
  country      TEXT,
  external_ref TEXT,
  UNIQUE (legal_name, city, region, country)
);

-- Experience
CREATE TABLE IF NOT EXISTS worker_experience (
  id                   BIGSERIAL PRIMARY KEY,
  worker_id            BIGINT NOT NULL REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  facility_name        TEXT NOT NULL,
  title                TEXT NOT NULL,
  start_date           DATE NOT NULL,
  end_date             DATE,
  description          TEXT,
  tags                 TEXT[] DEFAULT '{}',
  facility_id          BIGINT REFERENCES facility_directory(id),
  verified_by_platform BOOLEAN NOT NULL DEFAULT FALSE,
  verifier_user        BIGINT REFERENCES app_user(id),
  verified_at          TIMESTAMPTZ
);

-- Reviews / ratings (facility -> worker)
CREATE TABLE IF NOT EXISTS review (
  id                BIGSERIAL PRIMARY KEY,
  reviewer_facility BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE, -- facility user_id
  worker_id         BIGINT NOT NULL REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  rating            SMALLINT CHECK (rating BETWEEN 1 AND 5),
  strengths         TEXT[],
  comments          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reviewer_facility, worker_id)
);

-- Endorsements (lighter than reviews; optional note)
CREATE TABLE IF NOT EXISTS endorsement (
  id           BIGSERIAL PRIMARY KEY,
  facility_id  BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE, -- facility user_id
  worker_id    BIGINT NOT NULL REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  note_md      TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (facility_id, worker_id)
);

-- Background checks
CREATE TABLE IF NOT EXISTS background_check (
  id            BIGSERIAL PRIMARY KEY,
  worker_id     BIGINT NOT NULL REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  level         bg_level NOT NULL,
  status        bg_status NOT NULL DEFAULT 'not_started',
  provider      TEXT,
  reference_id  TEXT,
  ordered_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  report_url    TEXT,
  UNIQUE(worker_id, level)
);

CREATE INDEX IF NOT EXISTS idx_bg_worker_status ON background_check(worker_id, status);

-- Badges (shared between workers and facilities)
CREATE TABLE IF NOT EXISTS badge (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  weight      NUMERIC(4,2) NOT NULL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS worker_badge (
  worker_id   BIGINT NOT NULL REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  badge_code  TEXT NOT NULL REFERENCES badge(code),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (worker_id, badge_code)
);

-- =========================
-- Facilities
-- =========================
CREATE TABLE IF NOT EXISTS facility (
  user_id                   BIGINT PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  legal_name                TEXT NOT NULL,
  doing_business_as         TEXT,
  facility_type             facility_type NOT NULL,
  headcount_band            TEXT,
  website                   TEXT,
  logo_url                  TEXT,
  founded_year              INT CHECK (founded_year BETWEEN 1850 AND EXTRACT(YEAR FROM now())::INT),
  ein                       TEXT,
  license_number            TEXT,
  medicare_provider_number  TEXT,
  phone_primary             TEXT,
  meta                      JSONB NOT NULL DEFAULT '{}',
  verified                  BOOLEAN NOT NULL DEFAULT FALSE, -- legacy field, prefer tiered verification
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_facility_legal_name ON facility(legal_name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_facility_ein ON facility(ein) WHERE ein IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_facility_license ON facility(license_number) WHERE license_number IS NOT NULL;

-- Contacts
CREATE TABLE IF NOT EXISTS facility_contact (
  id          BIGSERIAL PRIMARY KEY,
  facility_id BIGINT NOT NULL REFERENCES facility(user_id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('phone','email')),
  phone_e164  TEXT,
  email       CITEXT,
  label       TEXT,
  is_primary  BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_facility_contact_fac ON facility_contact(facility_id);

-- Locations (HQ + additional)
CREATE TABLE IF NOT EXISTS facility_location (
  id              BIGSERIAL PRIMARY KEY,
  facility_id     BIGINT NOT NULL REFERENCES facility(user_id) ON DELETE CASCADE,
  address_line1   TEXT NOT NULL,
  address_line2   TEXT,
  city            TEXT NOT NULL,
  region          TEXT,
  country         TEXT DEFAULT 'US',
  postal_code     TEXT,
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  is_headquarters BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_facility_location_fac ON facility_location(facility_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_facility_hq ON facility_location(facility_id) WHERE is_headquarters = TRUE;

-- Specialties
CREATE TABLE IF NOT EXISTS specialty (
  id      BIGSERIAL PRIMARY KEY,
  code    TEXT UNIQUE NOT NULL,
  name    TEXT NOT NULL,
  name_en TEXT,
  name_es TEXT
);

CREATE TABLE IF NOT EXISTS facility_specialty (
  facility_id  BIGINT NOT NULL REFERENCES facility(user_id) ON DELETE CASCADE,
  specialty_id BIGINT NOT NULL REFERENCES specialty(id),
  PRIMARY KEY (facility_id, specialty_id)
);

-- Tiered Verification
CREATE TABLE IF NOT EXISTS facility_verification (
  id             BIGSERIAL PRIMARY KEY,
  facility_id    BIGINT NOT NULL REFERENCES facility(user_id) ON DELETE CASCADE,
  tier           SMALLINT NOT NULL CHECK (tier IN (1,2)),
  status         verify_status NOT NULL DEFAULT 'pending',
  verifier_user  BIGINT REFERENCES app_user(id),
  note           TEXT,
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at     TIMESTAMPTZ,
  UNIQUE (facility_id, tier)
);

CREATE TABLE IF NOT EXISTS verification_document (
  id              BIGSERIAL PRIMARY KEY,
  verification_id BIGINT NOT NULL REFERENCES facility_verification(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL CHECK (doc_type IN ('EIN','BUSINESS_LICENSE','INSURANCE','FACILITY_LICENSE','MEDICARE_PROVIDER')),
  file_url        TEXT NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Facility badges
CREATE TABLE IF NOT EXISTS facility_badge (
  facility_id BIGINT NOT NULL REFERENCES facility(user_id) ON DELETE CASCADE,
  badge_code  TEXT NOT NULL REFERENCES badge(code),
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (facility_id, badge_code)
);

-- Profile views (private analytics)
CREATE TABLE IF NOT EXISTS facility_profile_view (
  id                BIGSERIAL PRIMARY KEY,
  facility_id       BIGINT NOT NULL REFERENCES facility(user_id) ON DELETE CASCADE,
  viewer_worker_id  BIGINT REFERENCES worker_profile(user_id) ON DELETE SET NULL,
  viewed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  viewer_fingerprint TEXT,
  ip_hash           TEXT
);
CREATE INDEX IF NOT EXISTS idx_facility_view_fac ON facility_profile_view(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_view_fac_time ON facility_profile_view(facility_id, viewed_at DESC);

-- =========================
-- Jobs
-- =========================
CREATE TABLE IF NOT EXISTS job_posting (
  id              BIGSERIAL PRIMARY KEY,
  facility_id     BIGINT NOT NULL REFERENCES facility(user_id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  category        TEXT NOT NULL,  -- 'RN','CNA', etc.
  location        TEXT,
  employment_type TEXT NOT NULL,  -- 'fulltime','per_diem','contract'
  min_pay         NUMERIC(10,2),
  max_pay         NUMERIC(10,2),
  currency        TEXT DEFAULT 'USD',
  description_md  TEXT NOT NULL,
  requirements    TEXT[],
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  posted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closes_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_posting_active_cat ON job_posting(is_active, category);

CREATE TABLE IF NOT EXISTS job_application (
  id             BIGSERIAL PRIMARY KEY,
  job_id         BIGINT NOT NULL REFERENCES job_posting(id) ON DELETE CASCADE,
  worker_id      BIGINT NOT NULL REFERENCES worker_profile(user_id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','in_review','rejected','offered','hired','withdrawn')),
  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  contact_phone  TEXT,
  contact_email  TEXT,
  UNIQUE(job_id, worker_id)
);

-- =========================
-- Public / Private Views
-- =========================
-- Public worker profile (safe exposure)
CREATE MATERIALIZED VIEW IF NOT EXISTS worker_profile_public AS
SELECT
  u.id AS user_id,
  p.first_name,
  p.last_name,
  p.city, p.region, p.country, p.postal_code,
  p.avatar_url,
  w.category,
  w.sub_specialty,
  w.years_exp,
  (SELECT level FROM education_attainment e WHERE e.worker_id = w.user_id) AS highest_education,
  EXISTS (
    SELECT 1 FROM background_check bc
    WHERE bc.worker_id = w.user_id AND bc.status='clear'
  ) AS has_cleared_bg,
  w.rank_score
FROM worker_profile w
JOIN app_user u ON u.id = w.user_id
JOIN user_profile p ON p.user_id = u.id
WHERE u.status = 'active' AND w.visibility = TRUE;

-- Private worker applications list
CREATE MATERIALIZED VIEW IF NOT EXISTS worker_my_applications AS
SELECT
  a.worker_id,
  a.id AS application_id,
  j.id AS job_id,
  j.title,
  j.is_active,
  a.status,
  a.submitted_at,
  a.updated_at,
  f.user_id AS facility_user_id,
  f.legal_name AS facility_name,
  a.contact_phone,
  a.contact_email
FROM job_application a
JOIN job_posting j ON j.id = a.job_id
JOIN facility f ON f.user_id = j.facility_id;

-- Public facility card
CREATE MATERIALIZED VIEW IF NOT EXISTS facility_public AS
SELECT
  f.user_id AS facility_id, f.legal_name, f.doing_business_as, f.facility_type, f.logo_url,
  f.headcount_band, f.founded_year, f.website,
  (SELECT array_agg(s.name ORDER BY s.name)
     FROM facility_specialty fs JOIN specialty s ON s.id=fs.specialty_id
     WHERE fs.facility_id=f.user_id) AS specialties,
  (SELECT jsonb_build_object(
          'address_line1', fl.address_line1,
          'address_line2', fl.address_line2,
          'city', fl.city, 'region', fl.region,
          'country', fl.country, 'postal_code', fl.postal_code
        )
     FROM facility_location fl
     WHERE fl.facility_id=f.user_id AND fl.is_headquarters = TRUE) AS hq_address,
  EXISTS (SELECT 1 FROM facility_verification v WHERE v.facility_id=f.user_id AND v.tier=1 AND v.status='verified') AS has_tier1,
  EXISTS (SELECT 1 FROM facility_verification v WHERE v.facility_id=f.user_id AND v.tier=2 AND v.status='verified') AS has_tier2
FROM facility f;

-- Facility dashboard: applicants per job
CREATE MATERIALIZED VIEW IF NOT EXISTS facility_job_applications AS
SELECT
  j.facility_id, j.id AS job_id, j.title, j.is_active,
  a.id AS application_id, a.worker_id, a.status, a.submitted_at
FROM job_posting j
LEFT JOIN job_application a ON a.job_id = j.id;

-- =========================
-- Helpful seed badges (optional)
-- =========================
INSERT INTO badge(code,name,description,weight) VALUES
('VERIFIED_BUSINESS','Verified Business','Passed Tier 1 verification',1.0),
('VERIFIED_HEALTHCARE','Verified Healthcare Provider','Passed Tier 2 verification',1.5),
('FIDELITY_EMPLOYMENT','Fidelity Employment','Employment verified by platform',0.8)
ON CONFLICT (code) DO NOTHING;

-- =========================
-- Notes:
-- • Consider adding RLS policies for user_profile, worker_my_applications, facility_job_applications.
-- • Refresh materialized views after writes that affect them.
-- =========================
