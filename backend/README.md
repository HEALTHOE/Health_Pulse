# HealthPulse Backend

## Setup (Windows PowerShell)

```powershell
# 1. From repo root, go to backend
cd backend

# 2. Create and activate venv
py -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Copy env template and fill REAL values (never commit .env)
copy .env.example .env

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run server
uvicorn app.main:app --reload --port 8000
```

Verify:

- Swagger: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/api/health → `{"status":"ok","database":"connected"}`

## Tests

```powershell
cd backend
pytest -v
```

Tests use isolated in-memory SQLite (see `tests/conftest.py`) and never
touch the dev PostgreSQL database.

## Env vars (backend/.env)

| Key | Example | Purpose |
|-----|---------|---------|
| DATABASE_URL | postgresql+psycopg2://postgres:postgres@localhost:5432/healthpulse | Postgres connection |
| JWT_SECRET | long random string | JWT signing secret (never commit) |
| JWT_ALGORITHM | HS256 | JWT algorithm |
| ACCESS_TOKEN_EXPIRE_MINUTES | 60 | Token lifetime |
| CORS_ORIGINS | http://localhost:5173 | Allowed frontend origins |
| APP_ENV | dev | dev / test / prod |
| ADMIN_EMAIL / ADMIN_PASSWORD | admin@example.com | Seed admin (env only) |
```
