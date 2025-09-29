# MedPost — Key Interaction Flows

This README documents three critical MedPost use cases with **Mermaid sequence diagrams**.  
They cover login & dashboard loading, posting a job with instant candidate suggestions, and the end-to-end apply/review/endorse flow.

> Rendering: GitHub, GitLab, and many Markdown previewers render Mermaid automatically. In VS Code, use a Mermaid-enabled preview extension if needed.

---

## 1) Login → Load Dashboard (retrieve data)

```mermaid
sequenceDiagram
  autonumber
  actor User as Facility/Worker
  participant FE as Frontend (Web/App)
  participant API as Backend API
  participant Auth as AuthSvc
  participant SQL as PostgreSQL
  participant GQL as GraphDB (OrientDB)

  User->>FE: Submit email + password
  FE->>API: POST /auth/login
  API->>Auth: Verify credentials
  Auth-->>API: OK + session/JWT
  API-->>FE: 200 {token}

  FE->>API: GET /me/dashboard (Bearer token)
  API->>SQL: SELECT profile + role
  alt Facility
    API->>SQL: SELECT jobs, counts, recent applicants
    API->>GQL: Query unique viewers last 30d
  else Worker
    API->>SQL: SELECT worker_profile_public
    API->>SQL: SELECT worker_my_applications
  end
  SQL-->>API: rows
  GQL-->>API: metrics (if facility)
  API-->>FE: 200 dashboard payload
  FE-->>User: Render dashboard
```

---

## 2) Facility Posts a Job (save new record) + Instant Candidate Suggestions

```mermaid
sequenceDiagram
  autonumber
  actor Facility as Facility User
  participant FE as Frontend (Web/App)
  participant API as Backend API
  participant SQL as PostgreSQL
  participant Match as Match Engine
  participant GQL as GraphDB (OrientDB)

  Facility->>FE: Fill "New Job" form
  FE->>API: POST /jobs {title, category, reqs, pay...}
  API->>SQL: INSERT INTO job_posting … RETURNING job_id
  SQL-->>API: job_id

  API->>Match: getCandidates(job_id, filters)
  par Candidate fetch
    Match->>SQL: Query worker_profile + licenses/bg + rank
    Match->>GQL: Relationship signals (endorsements/paths)
  and Recency signals
    Match->>SQL: Recent activity (recency decay)
  end
  SQL-->>Match: candidate rows
  GQL-->>Match: relationship signals
  Match-->>API: Top-N candidates (ranked)
  API-->>FE: 201 {job_id, suggested_candidates[]}
  FE-->>Facility: Show job page + suggestions
```

---

## 3) Worker Applies → Facility Reviews Applicants → Endorsement (updates rank)

```mermaid
sequenceDiagram
  autonumber
  actor Worker as Worker User
  actor HR as Facility User
  participant FE as Frontend (Web/App)
  participant API as Backend API
  participant SQL as PostgreSQL
  participant MQ as Queue/Events
  participant Mail as Email/Notify

  Note over Worker,SQL: Apply to job (private)
  Worker->>FE: Click "Apply"
  FE->>API: POST /jobs/:id/applications {contact_phone,email}
  API->>SQL: INSERT job_application (status='submitted')
  SQL-->>API: application_id
  API->>MQ: enqueue "NewApplication" (job_id, worker_id)
  MQ->>Mail: Notify facility HR (optional)
  API-->>FE: 201 {application_id}
  FE-->>Worker: Show "Application submitted"

  Note over HR,SQL: Facility reviews applicants
  HR->>FE: Open Applicants tab
  FE->>API: GET /jobs/:id/applications
  API->>SQL: SELECT from facility_job_applications WHERE job_id=:id
  SQL-->>API: rows (worker_id, status, submitted_at…)
  API-->>FE: 200 applicants[]
  FE-->>HR: Render list + worker cards

  Note over HR,SQL: Endorse after engagement (optional)
  HR->>FE: Click "Endorse worker" (note optional)
  FE->>API: POST /endorsements {worker_id, note}
  API->>SQL: INSERT endorsement (facility_id, worker_id, note)
  API->>SQL: UPDATE worker_profile SET rank_score = rank_score + δ
  API-->>FE: 201 {endorsement_id}
  FE-->>HR: Show endorsement badge on worker profile
```
