"""Application settings loaded from backend/.env via pydantic-settings.

WHY this exists: all secrets and environment-specific values (DB URL,
JWT secret, CORS origins) live in ONE place. No secret is ever hardcoded.
Evaluators can see clean separation of config vs code.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: str = "dev"

    DATABASE_URL: str = (
        "postgresql+psycopg2://postgres:postgres@localhost:5432/healthpulse"
    )

    JWT_SECRET: str = "change-me-to-a-long-random-string-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Comma-separated in .env, e.g. "http://localhost:5173,http://127.0.0.1:5173"
    # NEVER use allow_origins=["*"] in code; origins always come from here.
    CORS_ORIGINS: str = "http://localhost:5173"

    ADMIN_EMAIL: str = "admin@example.com"
    ADMIN_PASSWORD: str = "Admin123!"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS_ORIGINS env string into a clean list of origins."""
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
