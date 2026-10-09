"""Persistent-underperformance detection.

WHY: one bad month can be noise; three consecutive months below target
signals a systemic problem worth an alert and a review meeting.
Rule: below target (status WARNING/CRITICAL, i.e. not NORMAL and not
NO_DATA) for `window` consecutive months. Configurable window, default 3.
"""

from app.analytics.indicator_engine import evaluate_status
from app.models.enums import IndicatorDirection


def is_persistently_underperforming(
    monthly_values: list[tuple[str, float | None]],
    target: float,
    critical_threshold: float,
    direction: IndicatorDirection | str,
    window: int = 3,
) -> bool:
    """True if the LAST `window` months are all below target."""
    if len(monthly_values) < window:
        return False
    recent = monthly_values[-window:]
    for _, value in recent:
        status = evaluate_status(value, target, critical_threshold, direction)
        if status in ("NORMAL", "NO_DATA"):
            return False
    return True


def find_persistent_streaks(
    monthly_values: list[tuple[str, float | None]],
    target: float,
    critical_threshold: float,
    direction: IndicatorDirection | str,
    window: int = 3,
) -> list[dict]:
    """Return every window where underperformance persisted (for alerts)."""
    streaks: list[dict] = []
    for i in range(len(monthly_values) - window + 1):
        chunk = monthly_values[i : i + window]
        if is_persistently_underperforming(
            chunk, target, critical_threshold, direction, window
        ):
            streaks.append(
                {
                    "start_month": chunk[0][0],
                    "end_month": chunk[-1][0],
                    "months": [m for m, _ in chunk],
                    "values": [v for _, v in chunk],
                }
            )
    return streaks
