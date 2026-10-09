"""Weighted health score (0-100) for district/block ranking.

WHY: a single number lets officials rank blocks/districts at a glance in
the dashboard, while the underlying indicators stay visible for drill-down.
Formula: 0.25*Immunization + 0.25*ANC + 0.25*TB Success + 0.25*Inst.Delivery.
Each component is capped at 100 so over-achievement can't hide a failure.
"""

# Weights live here (config constants) — change in one place.
SCORE_WEIGHTS: dict[str, float] = {
    "FULL_IMMUNIZATION": 0.25,
    "ANC_COVERAGE": 0.25,
    "TB_SUCCESS": 0.25,
    "INST_DELIVERY": 0.25,
}

# Score bands mirror indicator statuses for consistent colours.
SCORE_BAND_NORMAL = 80.0
SCORE_BAND_WARNING = 60.0


def clamp_component(value: float | None) -> float:
    """Clamp one indicator value to 0-100; missing data counts as 0."""
    if value is None:
        return 0.0
    return max(0.0, min(float(value), 100.0))


def compute_health_score(components: dict[str, float | None]) -> float:
    """Weighted sum of the four scoring indicators, rounded to 2 decimals."""
    total = 0.0
    for code, weight in SCORE_WEIGHTS.items():
        total += clamp_component(components.get(code)) * weight
    return round(total, 2)


def score_band(score: float) -> str:
    """Map a 0-100 score to NORMAL / WARNING / CRITICAL."""
    if score >= SCORE_BAND_NORMAL:
        return "NORMAL"
    if score >= SCORE_BAND_WARNING:
        return "WARNING"
    return "CRITICAL"


def score_with_band(components: dict[str, float | None]) -> dict:
    """Convenience: return score + band + the clamped components used."""
    clamped = {code: clamp_component(components.get(code)) for code in SCORE_WEIGHTS}
    score = compute_health_score(components)
    return {"score": score, "status": score_band(score), "components": clamped}
