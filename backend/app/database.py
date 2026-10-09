"""SQLAlchemy 2.x engine, session, Base and FastAPI dependency.

WHY this exists: single place that owns the DB connection. Routers get a
session via `get_db` and never create engines themselves. This keeps
transactions consistent and makes testing easy (override `get_db`).
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.config import settings


class Base(DeclarativeBase):
    """Declarative base for all ORM models (see app/models/)."""

    pass


# pool_pre_ping=True avoids stale-connection errors after idle periods.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables (dev/demo helper).

    Imports models so their metadata is registered on Base, then issues
    CREATE TABLE IF NOT EXISTS. For production evolution use Alembic
    (ask the team before switching; see docs/database/).
    """
    # Import here to avoid circular imports and to ensure models register.
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
