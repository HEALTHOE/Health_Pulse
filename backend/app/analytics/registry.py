"""Central indicator registry — the ONLY place formulas/thresholds live.

WHY: adding a new indicator = one entry here. Frontend never holds
formulas or thresholds; it only displays what the backend computes.
Seed script and ETL both read from this registry.
"""

from app.models.enums import IndicatorDirection

# Each entry maps 1:1 to an `indicators` DB row (matched by `code`).
# warning_threshold == target for higher-is-better (below target = WARNING).
# For lower-is-better, critical_threshold > target (above critical = CRITICAL).
INDICATOR_DEFINITIONS: list[dict] = [
    {
        "code": "ANC_COVERAGE",
        "name": "ANC Coverage",
        "description": "Pregnant women with 4+ ANC visits out of all registered.",
        "unit": "%",
        "numerator_field": "anc_4_visits",
        "denominator_field": "total_pregnant_women",
        "formula": "anc_4_visits / total_pregnant_women * 100",
        "target": 90.0,
        "warning_threshold": 90.0,
        "critical_threshold": 60.0,
        "direction": IndicatorDirection.HIGHER_IS_BETTER,
        "scale": 100.0,
    },
    {
        "code": "INST_DELIVERY",
        "name": "Institutional Delivery Rate",
        "description": "Deliveries in health facilities out of all deliveries.",
        "unit": "%",
        "numerator_field": "institutional_deliveries",
        "denominator_field": "total_deliveries",
        "formula": "institutional_deliveries / total_deliveries * 100",
        "target": 90.0,
        "warning_threshold": 90.0,
        "critical_threshold": 60.0,
        "direction": IndicatorDirection.HIGHER_IS_BETTER,
        "scale": 100.0,
    },
    {
        "code": "FULL_IMMUNIZATION",
        "name": "Full Immunization Coverage",
        "description": "Fully immunized infants out of all infants.",
        "unit": "%",
        "numerator_field": "fully_immunized_infants",
        "denominator_field": "total_infants",
        "formula": "fully_immunized_infants / total_infants * 100",
        "target": 90.0,
        "warning_threshold": 90.0,
        "critical_threshold": 70.0,
        "direction": IndicatorDirection.HIGHER_IS_BETTER,
        "scale": 100.0,
    },
    {
        "code": "TB_SUCCESS",
        "name": "TB Treatment Success Rate",
        "description": "Successfully treated TB patients out of all TB patients.",
        "unit": "%",
        "numerator_field": "tb_treatment_success",
        "denominator_field": "total_tb_patients",
        "formula": "tb_treatment_success / total_tb_patients * 100",
        "target": 90.0,
        "warning_threshold": 90.0,
        "critical_threshold": 70.0,
        "direction": IndicatorDirection.HIGHER_IS_BETTER,
        "scale": 100.0,
    },
    {
        "code": "MALARIA_INCIDENCE",
        "name": "Malaria Incidence",
        "description": "Malaria cases per 1000 population. Lower is better.",
        "unit": "per_1000",
        "numerator_field": "malaria_cases",
        "denominator_field": "population",
        "formula": "malaria_cases / population * 1000",
        "target": 2.0,
        "warning_threshold": 2.0,
        "critical_threshold": 5.0,
        "direction": IndicatorDirection.LOWER_IS_BETTER,
        "scale": 1000.0,
    },
    {
        "code": "OPD_UTILIZATION",
        "name": "OPD Utilization",
        "description": "OPD visits against expected visits.",
        "unit": "%",
        "numerator_field": "opd_visits",
        "denominator_field": "opd_expected",
        "formula": "opd_visits / opd_expected * 100",
        "target": 80.0,
        "warning_threshold": 80.0,
        "critical_threshold": 50.0,
        "direction": IndicatorDirection.HIGHER_IS_BETTER,
        "scale": 100.0,
    },
    {
        "code": "HW_AVAILABILITY",
        "name": "Health-Worker Availability",
        "description": "Positioned health workers out of sanctioned posts.",
        "unit": "%",
        "numerator_field": "positioned_health_workers",
        "denominator_field": "sanctioned_health_workers",
        "formula": "positioned_health_workers / sanctioned_health_workers * 100",
        "target": 90.0,
        "warning_threshold": 90.0,
        "critical_threshold": 60.0,
        "direction": IndicatorDirection.HIGHER_IS_BETTER,
        "scale": 100.0,
    },
    {
        "code": "IMR",
        "name": "Infant Mortality Rate",
        "description": "Infant deaths per 1000 live births. Lower is better.",
        "unit": "per_1000",
        "numerator_field": "infant_deaths",
        "denominator_field": "live_births",
        "formula": "infant_deaths / live_births * 1000",
        "target": 20.0,
        "warning_threshold": 20.0,
        "critical_threshold": 40.0,
        "direction": IndicatorDirection.LOWER_IS_BETTER,
        "scale": 1000.0,
    },
]


def get_definition(code: str) -> dict:
    """Fetch one indicator definition by code (KeyError if unknown)."""
    for definition in INDICATOR_DEFINITIONS:
        if definition["code"] == code:
            return definition
    raise KeyError(f"Unknown indicator code: {code}")
