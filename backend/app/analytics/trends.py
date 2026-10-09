"""Monthly trend series for charts.

WHY: the React dashboard draws line/bar charts from this exact shape, so
the backend owns the format and the frontend just renders it.
Shape: {"indicator": name, "period": "monthly",
        "data": [{"month": "2026-01", "value": 81.2}, ...]}
"""

from datetime import date


def _month_key(period: date | str) -> str:
    if isinstance(period, str):
        return period[:7]  # tolerate "2026-01-01" or "2026-01"
    return period.strftime("%Y-%m")


def build_monthly_series(
    indicator_name: str, points: list[tuple[date | str, float | None]]
) -> dict:
    """Build a sorted monthly series; None values are kept as None (gaps)."""
    sorted_points = sorted(points, key=lambda p: _month_key(p[0]))
    return {
        "indicator": indicator_name,
        "period": "monthly",
        "data": [
            {"month": _month_key(period), "value": value}
            for period, value in sorted_points
        ],
    }


def series_from_indicator_values(
    indicator_name: str, rows: list, date_attr: str = "period"
) -> dict:
    """Build a series directly from IndicatorValue ORM rows."""
    points = [(getattr(row, date_attr), row.value) for row in rows]
    return build_monthly_series(indicator_name, points)
