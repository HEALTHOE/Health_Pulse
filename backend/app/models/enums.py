"""Shared enums for the HealthPulse domain.

WHY: roles, levels, severities and statuses are part of the contract.
Storing them as DB enums (native on Postgres) prevents typos and keeps
RBAC / alert logic consistent across services and routers.
"""

import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    DISTRICT_HEALTH_OFFICER = "DISTRICT_HEALTH_OFFICER"
    BLOCK_OFFICER = "BLOCK_OFFICER"


class AggregationLevel(str, enum.Enum):
    FACILITY = "FACILITY"
    BLOCK = "BLOCK"
    DISTRICT = "DISTRICT"


class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class UploadStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"


class IndicatorDirection(str, enum.Enum):
    """Whether a higher or lower value is better (e.g. malaria is lower)."""

    HIGHER_IS_BETTER = "HIGHER_IS_BETTER"
    LOWER_IS_BETTER = "LOWER_IS_BETTER"
