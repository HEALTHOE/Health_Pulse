"""FastAPI application entrypoint.

WHY this exists: wires together config, CORS, error handlers and routers.
Business logic lives in services/analytics, never here.
Run (from backend/):  uvicorn app.main:app --reload --port 8000
"""

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database import get_db
from app.routers import admin, alerts, auth, dashboard, data, indicators, locations

app = FastAPI(
    title="HealthPulse API",
    description=(
        "District Health Monitoring & Analytics Dashboard. "
        "Synthetic HMIS data -> validation/ETL -> indicators -> "
        "analytics -> performance -> alerts -> REST API."
    ),
    version="0.1.0",
    docs_url="/docs",
)

# CORS origins ALWAYS come from env. Never allow_origins=["*"].
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error_payload(code: int, message: str) -> dict:
    return {"error": {"code": code, "message": message}}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(exc.status_code, str(exc.detail)),
    )


@app.exception_handler(HTTPException)
async def fastapi_http_exception_handler(
    request: Request, exc: HTTPException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(exc.status_code, str(exc.detail)),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    # Return a compact, frontend-friendly validation message.
    details = "; ".join(
        f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}"
        for err in exc.errors()
    )
    return JSONResponse(
        status_code=422,
        content=_error_payload(422, f"Validation error: {details}"),
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    # Never leak stack traces in prod; log would go here.
    message = str(exc) if settings.APP_ENV == "dev" else "Internal server error"
    return JSONResponse(
        status_code=500, content=_error_payload(500, message)
    )


@app.get("/api/health", tags=["health"], summary="Health check")
def health_check(db: Session = Depends(get_db)) -> dict:
    """Return ok + DB connectivity. 503 if the database is unreachable."""
    try:
        db.execute(text("SELECT 1"))
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail=f"Database unavailable: {exc}"
        ) from exc
    return {"status": "ok", "database": "connected"}


app.include_router(auth.router)
app.include_router(locations.router)
app.include_router(indicators.router)
app.include_router(dashboard.router)
app.include_router(alerts.router)
app.include_router(data.router)
app.include_router(admin.router)
