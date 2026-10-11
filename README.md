# HealthPulse

## District Health Monitoring & Analytics Dashboard

HealthPulse is a web-based Digital Health analytics platform designed to help district health officials monitor healthcare performance using HMIS-style health data.

The system aggregates, validates, processes, and analyzes health indicators at district and block levels. It provides interactive dashboards, trend analysis, performance comparisons, underperformance detection, and alerts to support data-driven healthcare planning and decision-making.

**Important:** HealthPulse uses **100 percent synthetic (fake) data**. No real patient information is used anywhere in this project.

Data flows in one direction through the product:

```text
                HMIS-Style Data (synthetic CSV/Excel)
                           |
                           v
                  Data Ingestion Layer (upload)
                           |
                           v
                 Validation / ETL Layer (row-level errors, never silent drops)
                           |
                           v
                     PostgreSQL
                           |
               +-----------+-----------+
               |           |           |
               v           v           v
         Indicator      Analytics     Alert
           Engine        Engine       Engine
         (formulas +   (scores,      (threshold,
          thresholds)   trends)       persistence)
               |           |           |
               +-----------+-----------+
                           |
                           v
                      FastAPI (REST API)
                           |
                           v
                     React Frontend
                           |
                           v
                  HealthPulse Dashboard
```

---

## Table of contents

1. [Problem statement](#problem-statement)
2. [Objectives](#objectives)
3. [Key features](#key-features)
4. [Technology stack](#technology-stack)
5. [Repository map (where everything lives)](#repository-map-where-everything-lives)
6. [Prerequisites (install these first)](#prerequisites-install-these-first)
7. [First-time setup, step by step](#first-time-setup-step-by-step)
8. [Running the application every day](#running-the-application-every-day)
9. [Addresses and login (where to go, who to log in as)](#addresses-and-login-where-to-go-who-to-log-in-as)
10. [Guided tour: click here, expect this](#guided-tour-click-here-expect-this)
11. [Demo script: the 10-minute story that proves the pipeline](#demo-script-the-10-minute-story-that-proves-the-pipeline)
12. [Backend API overview (for frontend work and evaluation)](#backend-api-overview-for-frontend-work-and-evaluation)
13. [Testing](#testing)
14. [Useful backend scripts](#useful-backend-scripts)
15. [Troubleshooting (when something breaks)](#troubleshooting-when-something-breaks)
16. [Branches and team workflow](#branches-and-team-workflow)
17. [Notes for evaluators](#notes-for-evaluators)

---

## Problem Statement

District health officials often need to analyze large amounts of healthcare data to identify underperforming areas and monitor key health indicators.

HealthPulse addresses this problem by providing a centralized dashboard that:

- Aggregates HMIS-style health data
- Monitors important healthcare indicators
- Provides district and block-level drill-down
- Identifies underperforming indicators
- Tracks trends over time
- Generates alerts for critical performance issues
- Supports data-driven decision-making

---

## Objectives

1. Build a centralized health analytics platform.
2. Process and validate HMIS-style healthcare data.
3. Calculate standardized health indicators.
4. Monitor district and block-level performance.
5. Identify underperforming areas.
6. Provide trend and comparative analysis.
7. Generate alerts based on predefined thresholds.
8. Implement secure authentication and role-based access.
9. Maintain data quality and auditability.

---

## Key Features

### Data Management
- CSV/Excel health-data upload (admin only)
- Full ETL pipeline: file check, schema check, missing values, range checks, date checks, known-location checks, duplicate detection
- Row-level validation errors (every rejected row tells you why; nothing is silently dropped)
- Data-quality overview page (completeness, error breakdown, upload history)

### Health Analytics (rule-based only, no machine learning)
- 8 health indicators with central formulas and thresholds (backend owns them, never the frontend)
- Weighted health score (0 to 100) for district/block ranking
- Monthly trend series shaped for charts
- Persistent-underperformance detection (below target 3 consecutive months)

### Monitoring and alerts
- Threshold alerts: WARNING below target, CRITICAL below the critical line
- Persistent-underperformance alerts
- Large month-over-month swing alerts (INFO)
- Alert acknowledgement and resolution with timestamps and audit trail
- No duplicate active alerts; alerts auto-resolve when values recover

### Dashboard
- Interactive KPI cards and health-score displays
- District ranking and block drill-down with facility breakdown
- Indicator pages with trend charts
- Alert list with severity/status filters, search, acknowledge and resolve actions
- Data upload with validation-error table, data-quality page

### Security
- JWT Bearer authentication, bcrypt password hashing
- Role-based access control: ADMIN sees everything, DISTRICT_HEALTH_OFFICER sees their district, BLOCK_OFFICER sees their block (403 outside scope)
- Audit logging of logins, uploads, user changes, threshold changes, alert actions

---

## Technology Stack

### Frontend (`frontend 2.0/`)
- React 19 + Vite + Tailwind CSS 4
- React Router (routing), Axios (API calls), Recharts (charts), Leaflet (maps)
- JWT stored in `localStorage` under `access_token`, sent as `Authorization: Bearer <token>`

### Backend (`backend/`)
- Python 3.10 or newer (tested on 3.13 and 3.14)
- FastAPI + Uvicorn (REST API + server)
- SQLAlchemy 2.x (database models), Pydantic v2 + pydantic-settings (validation + config)
- Pandas + openpyxl (CSV/Excel handling), PyJWT (tokens), passlib/bcrypt (passwords)
- pytest + httpx (test suite, isolated SQLite so tests never touch the real database)

### Database
- PostgreSQL 17 (development and demo database)

---

## Repository map (where everything lives)

```text
Health_Pulse/
  backend/
    app/
      main.py            <- app wiring: CORS, error handlers, routers, GET /api/health
      config.py          <- settings from backend/.env (never hardcoded secrets)
      database.py        <- engine, sessions, Base, init_db()
      analytics/         <- registry.py (indicator formulas/thresholds),
      |                    indicator_engine.py, scoring.py, trends.py, performance.py
      auth/              <- jwt.py, security.py (hashing), dependencies.py (RBAC + scopes)
      models/            <- 10 tables: users, districts, blocks, facilities,
      |                    health_records, indicators, indicator_values,
      |                    alerts, data_uploads, audit_logs
      routers/           <- HTTP endpoints only (auth, locations, indicators,
      |                    dashboard, alerts, data, admin)
      schemas/           <- request/response shapes (the frontend contract)
      services/          <- business logic (etl, alert_service, data_upload,
                           audit, dashboard, users)
      utils/             <- generate_synthetic.py, seed.py
    data/                <- hmis_clean.csv/.xlsx, hmis_dirty.csv,
    |                       demo_2026-07_south-recovery.csv (demo upload file)
    tests/               <- pytest suite (47 tests)
    requirements.txt
    .env.example         <- placeholders only (copy to .env, never commit .env)
  frontend 2.0/          <- the live React app (run this one)
    src/pages/           <- Login, Dashboard, Districts, DistrictDetail, Blocks,
                            BlockDetail, FacilityDetail, Indicators,
                            IndicatorDetail, Alerts, DataUpload, DataQuality
    src/services/        <- api.js (base URL + token), authService.js, dataService.js
    .env.example         <- VITE_API_BASE_URL=http://127.0.0.1:8000
  docs/
    database/schema.md   <- ER diagram (Mermaid) + table documentation
  README.md              <- this file (the full guide)
```

Older work is preserved but inactive: the first frontend lives on the `frontend-v1-archive` branch and is **not** in `main`.

---

## Prerequisites (install these first)

You need all four. Open PowerShell and check each one:

```powershell
python --version     # must print 3.10 or newer (project tested on 3.13/3.14)
git --version        # any recent version
node --version       # must print v18 or newer (project tested on v22)
npm --version        # comes with Node
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" --version
# must print psql (PostgreSQL) 17.x, and the service "postgresql-x64-17" running
```

If PostgreSQL is missing, install PostgreSQL 17 (remember the `postgres` password you set during installation — you will need it below). If `psql` is not on PATH, keep using the full path shown above.

---

## First-time setup, step by step

Do these once, in order. Steps marked BACKEND use one PowerShell terminal; FRONTEND steps use a second terminal.

### Step 1. Get the code

```powershell
cd C:\Users\HP\OneDrive\Desktop
git clone https://github.com/Shriyans406/Health_Pulse.git
cd Health_Pulse
git status -sb   # expect: ## main...origin/main (clean, nothing to commit)
```

### Step 2. Create the database (BACKEND terminal)

Replace `YOUR_POSTGRES_PASSWORD` with the password you set when installing PostgreSQL:

```powershell
$env:PGPASSWORD = "YOUR_POSTGRES_PASSWORD"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE healthpulse;"
```

If it says the database already exists, that is fine — move on.

### Step 3. Backend virtual environment and settings (BACKEND terminal)

```powershell
cd C:\Users\HP\OneDrive\Desktop\Health_Pulse\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
copy .env.example .env
```

Now open `backend\.env` in a text editor and fill in the real values:

| Key | What to put |
|-----|-------------|
| `DATABASE_URL` | `postgresql+psycopg2://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/healthpulse` |
| `JWT_SECRET` | any long random string (32 characters or more). Generate one with `python -c "import secrets; print(secrets.token_urlsafe(48))"` |
| `ADMIN_EMAIL` | the demo admin login email, for example `admin@example.com` |
| `ADMIN_PASSWORD` | the demo admin password, for example `Admin123!` |
| `CORS_ORIGINS` | leave as `http://localhost:5173` |
| the rest | leave the defaults |

Rules: `.env` holds real secrets and is **never committed to git** (it is already in `.gitignore`). Only `.env.example` with placeholders is committed.

### Step 4. Install backend packages and load demo data (BACKEND terminal)

```powershell
pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest tests/ -q
# expect: 47 passed. Tests use a throwaway in-memory database, never your real one.
.\.venv\Scripts\python.exe -m app.utils.seed
# expect lines like: indicators added: 8 ... health_records inserted=486 ...
# ... indicator_values recomputed: 5616 ... alerts created=140 ...
```

The seed is idempotent: running it twice never duplicates anything (second run reports `inserted=0 updated=486`).

### Step 5. Frontend settings and packages (FRONTEND terminal)

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Health_Pulse\frontend 2.0"
copy .env.example .env
npm install
```

The frontend `.env` only contains `VITE_API_BASE_URL=http://127.0.0.1:8000` (the backend address). No secrets live here.

---

## Running the application every day

You need **two terminals** at the same time. Start the backend first, then the frontend.

```powershell
# TERMINAL 1 — backend API (http://127.0.0.1:8000)
cd C:\Users\HP\OneDrive\Desktop\Health_Pulse\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
# leave running. You should see: "Uvicorn running on http://127.0.0.1:8000"
```

```powershell
# TERMINAL 2 — frontend app (http://localhost:5173)
cd "C:\Users\HP\OneDrive\Desktop\Health_Pulse\frontend 2.0"
npm run dev
# leave running. Open the Local URL it prints, normally http://localhost:5173
```

To stop either one, press `Ctrl+C` in its terminal.

---

## Addresses and login (where to go, who to log in as)

| What | Address | Notes |
|------|---------|-------|
| The application | `http://localhost:5173` (exact host, see warning below) | log in first |
| Backend Swagger docs (try every API in the browser) | `http://127.0.0.1:8000/docs` | click Authorize, paste a token from Login |
| Backend health check | `http://127.0.0.1:8000/api/health` | expect `{"status":"ok","database":"connected"}` |

**Host warning:** always open the app at `http://localhost:5173`, never `http://127.0.0.1:5173`. The backend only allows the `localhost` origin, so the other address fails with CORS/network errors even though everything is running.

**Demo login:** use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you put in `backend\.env` (defaults from the template are `admin@example.com` / `Admin123!`). This account has the ADMIN role and sees everything.

**The three roles (for access-control demos):**
- ADMIN: everything, plus uploads, user management, threshold editing, audit logs.
- DISTRICT_HEALTH_OFFICER: one district and its blocks/facilities (needs `district_id`).
- BLOCK_OFFICER: one block and its facilities (needs `block_id`).
- Anything outside your scope returns `403`. Create scoped users as admin via Swagger `POST /api/auth/register`, then log in as them on the site.

---

## Guided tour: click here, expect this

Assumes both servers running and you are logged in as admin. Numbers below match the seeded demo data (18 months, January 2025 to June 2026, plus July 2026 if the demo upload was run).

1. **Dashboard (home page).** District summary cards: health score (North District about 88, NORMAL), the four scoring indicators (ANC, immunization, TB success, institutional delivery) with NORMAL/WARNING/CRITICAL badges, performance counts, and the critical-alert counter. Note how an 88.86 against a 90 target shows WARNING — that threshold check is the backend analytics engine, not frontend logic.
2. **Districts.** Three rows: North (mostly good), Central (moderate), South (poor). Open **South District**: low score, CRITICAL badges — the intentional good/moderate/poor split from the synthetic generator.
3. **District detail.** Block ranking sorted by score, highest first.
4. **Blocks, then a block.** Four indicators plus the facility breakdown, also ranked.
5. **Facility page.** That facility's numbers.
6. **Indicators.** Eight cards, each showing its formula inputs: target and thresholds. Open **TB Treatment Success Rate**: target 90, critical 70. Open **Malaria Incidence**: tiny per-1000 values — it is a lower-is-better indicator, so small numbers are good.
7. **Indicator detail.** Monthly trend chart, January to June 2026 (July appears after the demo upload below).
8. **Alerts.** About 140 ACTIVE alerts (roughly 60 to 90 WARNING, 30 to 50 CRITICAL depending on demo state). Use the severity and status filters and the search box. Open a card: message text, current value vs threshold, location, month. Click **Acknowledge**, then **Resolve** — badges update and survive a page refresh. Reopening a resolved alert is blocked.
9. **Data Upload (admin only).** Choose `backend\data\hmis_dirty.csv` and upload: expect **PARTIAL — 486 valid, 10 invalid**, followed by the row-level error table (one row per problem: missing value, negative count, duplicate, bad date, unknown location). Upload `hmis_clean.csv` for a clean COMPLETED run. Every upload recomputes indicators and re-evaluates alerts automatically.
10. **Data Quality.** Total records (486 plus any uploaded months), uploaded/valid/invalid counts, completeness percentage, upload history, and the last upload's error breakdown.
11. **Roles.** As admin in Swagger, register a BLOCK_OFFICER for one block, log in as them on the site: districts, blocks, facilities, alerts and dashboards show only their area; anything else is 403.

---

## Demo script: the 10-minute story that proves the pipeline

This is the evaluation story: one file upload moves every number on the site. The ready-made file is `backend\data\demo_2026-07_south-recovery.csv` (27 rows, one new month: July 2026). South District recovers to about 93 percent everywhere; one North block dips to about 77 percent.

1. **Before (2 min).** Dashboard: North about 88 NORMAL, South about 59 CRITICAL (immunization about 60, CRITICAL). Alerts: roughly 140 ACTIVE, CRITICAL-heavy. Say: "South needs a review meeting."
2. **Upload (2 min).** Data Upload page, choose the demo CSV, Upload. Result: **COMPLETED, 27 valid, 0 invalid, 27 inserted**, alerts created about 97, resolved about 71. Say: "One upload recomputed 5,616 indicator values and re-ran every alert."
3. **After (4 min).** Dashboard latest period flips to **2026-07**: South about **91 NORMAL**, North dipped to about 84 (the weak block). Alerts: South's CRITICALs now RESOLVED, fresh July alerts ACTIVE, new INFO swing alerts. Indicator trend for TB now extends to July. Data Quality shows 513 records.
4. **Live edit (2 min).** Open the CSV in Excel, change one South facility's `fully_immunized_infants` to `5`, save, upload again: South dips and a new CRITICAL alert appears. Change it back, upload again: it recovers. Say: "DATA to ANALYTICS to ALERTS, end to end, with no silent data loss."

To replay the full drama from scratch, ask the backend developer to reset the July rows first (they are cleanly isolated by month). Re-uploading the same unchanged file is also a valid test: it reports `updated: 27, inserted: 0` — the idempotent upsert, proof uploads never duplicate data.

---

## Backend API overview (for frontend work and evaluation)

Base URL `http://127.0.0.1:8000`. Every endpoint except `/api/health` needs `Authorization: Bearer <token>` (paste the Login token into Swagger's Authorize button). Errors always look like `{"error":{"code":404,"message":"..."}}`.

| Area | Endpoints |
|------|-----------|
| Health | `GET /api/health` |
| Auth | `POST /api/auth/register` (first user open, then ADMIN only), `POST /api/auth/login`, `GET /api/auth/me` |
| Locations | `GET /api/districts[/{id}]`, `GET /api/blocks[/{id}]` (`?district_id`), `GET /api/facilities[/{id}]` (`?block_id&district_id`, `skip/limit` pagination) |
| Indicators | `GET /api/indicators[/{id}]`, `GET /api/indicators/{id}/trend?level&district_id&block_id&facility_id&from&to` |
| Dashboard | `GET /api/dashboard/summary?district_id&period`, `GET /api/dashboard/district/{id}`, `GET /api/dashboard/block/{id}` |
| Alerts | `GET /api/alerts` (`?severity&status&district_id&block_id&indicator_id`), `POST /api/alerts/evaluate` (ADMIN), `PATCH /api/alerts/{id}` (`ACKNOWLEDGED`/`RESOLVED` only) |
| Data | `POST /api/data/upload` (ADMIN, multipart CSV/XLSX), `GET /api/data/quality` |
| Admin + audit | `GET /api/admin/users`, `PATCH /api/admin/users/{id}`, `PATCH /api/admin/indicators/{code}`, `GET /api/audit-logs` (all ADMIN) |

Contract rules the backend guarantees: formulas and thresholds live in the backend only; aggregation sums raw counts (never averages percentages); divide-by-zero yields no value instead of crashing; lower-is-better indicators (malaria, infant mortality) use inverted status logic; response shapes are stable — any shape change is announced to the frontend developer first.

---

## Testing

Backend suite (47 tests). They run against an isolated in-memory database, so they never touch your real PostgreSQL data:

```powershell
cd C:\Users\HP\OneDrive\Desktop\Health_Pulse\backend
.\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe -m pytest tests/ -v
# expect: 47 passed
```

What is covered: health check, table creation and relationships, ETL validation (every error type plus the dirty-file integration), indicator math and thresholds including lower-is-better and divide-by-zero, aggregation correctness, health scores, trends, persistent underperformance, registration/login/JWT/expiry/roles/scope isolation, locations/indicators/trends/dashboards, alert lifecycle and dedupe, uploads, quality, audit logs, admin user and threshold management.

Frontend check:

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Health_Pulse\frontend 2.0"
npm run lint    # expect 0 errors (a few pre-existing warnings in older files are fine)
npm run build   # expect "built in" with no errors
```

---

## Useful backend scripts

```powershell
cd C:\Users\HP\OneDrive\Desktop\Health_Pulse\backend
.\.venv\Scripts\Activate.ps1
.\.venv\Scripts\python.exe -m app.utils.seed
# rebuild demo data: locations, indicators, admin user, clean dataset,
# indicator values, alerts. Safe to re-run (upserts, no duplicates).
.\.venv\Scripts\python.exe -m app.utils.generate_synthetic
# regenerate backend/data/hmis_clean.csv + .xlsx and hmis_dirty.csv (seed 42, reproducible)
```

---

## Troubleshooting (when something breaks)

| Symptom | Most likely cause | Fix |
|---------|-------------------|-----|
| Site shows network error or CORS error | backend terminal not running, or you opened `127.0.0.1:5173` | start backend; use exactly `http://localhost:5173` |
| Login says "Unable to login" | wrong credentials, backend down, or database down | check backend terminal output; confirm `ADMIN_EMAIL`/`ADMIN_PASSWORD` in `backend\.env`; confirm PostgreSQL service running |
| Dashboard says "No data available" | database is empty (fresh install) | run the seed command above, then refresh |
| `pytest` fails on database connection | tests need nothing external, so this means dependencies are missing | `pip install -r requirements.txt` inside the venv, re-run |
| `npm run dev` port busy | another dev server on 5173 | stop the other one (Ctrl+C); run only one frontend at a time |
| Token expired (sudden 401s after about an hour) | access tokens live 60 minutes | log out and log back in |
| `git push` rejected (fetch first) | someone pushed while you worked | `git pull origin main`, resolve if asked, `git push origin main`. Never `--force` on shared branches |
| Uploaded file rejected as wrong type | only `.csv`, `.xls`, `.xlsx` under 10 MB | convert the file, try again |
| Alerts page empty after fresh seed | seed prints `alerts created=0` only if data is all healthy | re-run seed; with the default dataset it reports about 140 |

When reporting a backend error to the backend developer, paste: the terminal error text, the URL you opened, what you clicked, and what you expected.

---

## Branches and team workflow

- `main` — the only working branch. Both developers commit and push here.
- `frontend-v1-archive` — the retired first frontend, kept for history. Not used, not run.
- Backend developers work in `backend/` (plus `docs/` and root config). Frontend developers work in `frontend 2.0/`. Nobody edits the other side's folder without asking first.
- `backend/.env` and `backend/.venv/` are never committed (already gitignored). If `git status` ever shows them, stop and fix `.gitignore` before committing.

---

## Notes for evaluators

- All data is synthetic and deterministic (generator seed 42): North District good, Central moderate with one weak immunization block, South poor with weak ANC, TB, delivery and high malaria, plus a small set of dirty rows for the data-quality demo.
- Analytics are entirely rule-based (thresholds, weighted scores, 3-month persistence, month-over-month swings). There is no machine learning in this project, by design.
- Indicator definitions (formula, target, warning and critical thresholds, higher-vs-lower-is-better) live in exactly one place: `backend/app/analytics/registry.py`. Adding an indicator is one registry entry plus its raw fields.
- The alert lifecycle (ACTIVE to ACKNOWLEDGED to RESOLVED, no reopening, auto-resolve on recovery, no duplicate active alerts) is enforced in `backend/app/services/alert_service.py` and covered by tests.
- Suggested evaluation path: run the [demo script](#demo-script-the-10-minute-story-that-proves-the-pipeline), then ask to see the audit log, which records every login, upload, user change, threshold change, and alert action with user and timestamp.
