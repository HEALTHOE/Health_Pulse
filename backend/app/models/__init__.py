"""Import all models so `Base.metadata.create_all` sees every table.

Importing `app.models` (e.g. in `app.database.init_db`) registers all
tables. Routers/services import from here for convenience.
"""

from app.models.alert import Alert  # noqa: F401
from app.models.enums import (  # noqa: F401
    AggregationLevel,
    AlertSeverity,
    AlertStatus,
    IndicatorDirection,
    UploadStatus,
    UserRole,
)
from app.models.health_record import HealthRecord  # noqa: F401
from app.models.indicator import Indicator, IndicatorValue  # noqa: F401
from app.models.location import Block, District, Facility  # noqa: F401
from app.models.operational import AuditLog, DataUpload  # noqa: F401
from app.models.user import User  # noqa: F401
