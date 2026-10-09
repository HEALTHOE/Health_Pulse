"""Synthetic HMIS data generator (deterministic, seed=42).

WHY: real patient data is never used. This creates a realistic demo
dataset with intentional variation:
- North District  = mostly good
- Central District = moderate (one block weak in immunization)
- South District  = poor (weak ANC, TB, institutional delivery, high malaria)
plus a few dirty rows (missing, duplicates, >100%, negatives, bad dates)
to demo data-quality validation.

Outputs (backend/data/):
- hmis_clean.csv + hmis_clean.xlsx  (valid rows only — used by seed)
- hmis_dirty.csv  (clean rows + ~10 bad rows — used to demo ETL errors)

Run:  cd backend ; .\\.venv\\Scripts\\python.exe -m app.utils.generate_synthetic
"""

import random
from datetime import date
from pathlib import Path

import pandas as pd

RANDOM_SEED = 42

DISTRICTS = [
    {"district": "North District", "code": "ND", "profile": "good"},
    {"district": "Central District", "code": "CD", "profile": "moderate"},
    {"district": "South District", "code": "SD", "profile": "poor"},
]

BLOCKS = {
    "North District": ["ND Block A", "ND Block B", "ND Block C"],
    "Central District": ["CD Block A", "CD Block B", "CD Block C"],
    "South District": ["SD Block A", "SD Block B", "SD Block C"],
}

# (weak indicator, weak range) per block; None = follows district profile.
BLOCK_WEAKNESS = {
    "CD Block B": ("immunization", (55, 68)),  # weak immunization pocket
    "SD Block A": ("anc", (45, 60)),  # weak ANC pocket
    "SD Block B": ("tb_malaria", None),  # weak TB + high malaria
    "SD Block C": ("delivery", (45, 60)),  # weak institutional delivery
}

FACILITY_TYPES = ["SC", "PHC", "PHC", "CHC"]

PERIODS: list[date] = [date(2025, m, 1) for m in range(1, 13)] + [
    date(2026, m, 1) for m in range(1, 7)
]  # 18 months: 2025-01 .. 2026-06

COLUMNS = [
    "district", "block", "facility", "facility_type", "period",
    "total_pregnant_women", "anc_4_visits",
    "total_deliveries", "institutional_deliveries",
    "total_infants", "fully_immunized_infants",
    "total_tb_patients", "tb_treatment_success",
    "population", "malaria_cases",
    "opd_visits", "opd_expected",
    "sanctioned_health_workers", "positioned_health_workers",
    "live_births", "infant_deaths",
]


def _pct_range(profile: str) -> tuple[int, int]:
    if profile == "good":
        return (86, 95)
    if profile == "moderate":
        return (74, 86)
    return (55, 70)


def _malaria_per_1000(profile: str) -> tuple[float, float]:
    if profile == "good":
        return (0.2, 1.2)
    if profile == "moderate":
        return (1.5, 3.5)
    return (5.0, 10.0)


def _counts_for_block(block: str, profile: str, rng: random.Random) -> dict:
    """Generate one month of raw counts for a facility in this block."""
    lo, hi = _pct_range(profile)
    weak = BLOCK_WEAKNESS.get(block)

    def pct(overrides: tuple[int, int] | None = None) -> float:
        a, b = overrides or (lo, hi)
        return rng.uniform(a, b) / 100.0

    # Denominators scale by facility size.
    total_pregnant = rng.randint(25, 60)
    total_deliveries = rng.randint(20, 55)
    total_infants = rng.randint(25, 60)
    total_tb = rng.randint(6, 20)
    population = rng.randint(4000, 9000)
    opd_expected = rng.randint(400, 900)
    sanctioned = rng.randint(8, 16)
    live_births = total_deliveries

    anc_rate = pct(weak[1] if weak and weak[0] == "anc" else None)
    imm_rate = pct(weak[1] if weak and weak[0] == "immunization" else None)
    tb_rate = pct((58, 72) if weak and weak[0] == "tb_malaria" else None)
    del_rate = pct(weak[1] if weak and weak[0] == "delivery" else None)
    malaria_lo, malaria_hi = _malaria_per_1000(profile)
    if weak and weak[0] == "tb_malaria":
        malaria_lo, malaria_hi = (7.0, 12.0)
    malaria_rate = rng.uniform(malaria_lo, malaria_hi) / 1000.0

    opd_rate = rng.uniform(0.85, 1.05) if profile == "good" else (
        rng.uniform(0.65, 0.9) if profile == "moderate" else rng.uniform(0.4, 0.7)
    )
    hw_rate = rng.uniform(0.85, 1.0) if profile == "good" else (
        rng.uniform(0.7, 0.9) if profile == "moderate" else rng.uniform(0.45, 0.7)
    )
    imr = rng.uniform(8, 16) if profile == "good" else (
        rng.uniform(18, 30) if profile == "moderate" else rng.uniform(35, 60)
    )

    return {
        "total_pregnant_women": total_pregnant,
        "anc_4_visits": min(total_pregnant, int(total_pregnant * anc_rate)),
        "total_deliveries": total_deliveries,
        "institutional_deliveries": min(total_deliveries, int(total_deliveries * del_rate)),
        "total_infants": total_infants,
        "fully_immunized_infants": min(total_infants, int(total_infants * imm_rate)),
        "total_tb_patients": total_tb,
        "tb_treatment_success": min(total_tb, int(total_tb * tb_rate)),
        "population": population,
        "malaria_cases": int(population * malaria_rate),
        "opd_visits": int(opd_expected * opd_rate),
        "opd_expected": opd_expected,
        "sanctioned_health_workers": sanctioned,
        "positioned_health_workers": min(sanctioned, int(sanctioned * hw_rate)),
        "live_births": live_births,
        "infant_deaths": int(live_births * imr / 1000.0),
    }


def build_clean_rows(seed: int = RANDOM_SEED) -> list[dict]:
    """Build all valid rows: 3 districts x 3 blocks x 3 facilities x 18 months."""
    rng = random.Random(seed)
    rows: list[dict] = []
    for entry in DISTRICTS:
        district, profile = entry["district"], entry["profile"]
        for block in BLOCKS[district]:
            for facility_no in range(1, 4):
                facility = f"{block} {'SC' if facility_no == 1 else ('PHC' if facility_no == 2 else 'CHC')}-{facility_no}"
                facility_type = "SC" if facility_no == 1 else ("PHC" if facility_no == 2 else "CHC")
                for period in PERIODS:
                    counts = _counts_for_block(block, profile, rng)
                    rows.append({
                        "district": district, "block": block,
                        "facility": facility, "facility_type": facility_type,
                        "period": period.strftime("%Y-%m"), **counts,
                    })
    return rows


def build_dirty_rows(clean_rows: list[dict]) -> list[dict]:
    """Copy clean rows and append ~10 intentionally bad rows."""
    dirty = list(clean_rows)
    base = dict(clean_rows[0])
    # 2 missing values
    r1 = dict(base); r1["anc_4_visits"] = ""; dirty.append(r1)
    r2 = dict(base); r2["facility"] = "ND Block A PHC-2"; r2["period"] = "2025-01"; r2["opd_visits"] = ""; dirty.append(r2)
    # 2 duplicates of real rows
    dirty.append(dict(clean_rows[5]))
    dirty.append(dict(clean_rows[5]))
    # 2 numerators exceeding denominators (>100%)
    r5 = dict(clean_rows[10]); r5["anc_4_visits"] = int(r5["total_pregnant_women"]) + 20; dirty.append(r5)
    r6 = dict(clean_rows[11]); r6["fully_immunized_infants"] = int(r6["total_infants"]) + 15; dirty.append(r6)
    # 2 negative counts
    r7 = dict(clean_rows[20]); r7["malaria_cases"] = -5; dirty.append(r7)
    r8 = dict(clean_rows[21]); r8["infant_deaths"] = -2; dirty.append(r8)
    # 2 bad dates
    r9 = dict(clean_rows[30]); r9["period"] = "2026-13"; dirty.append(r9)
    r10 = dict(clean_rows[31]); r10["period"] = "not-a-date"; dirty.append(r10)
    return dirty


def write_datasets(data_dir: Path | None = None) -> dict[str, Path]:
    """Generate and write CSV + Excel files. Returns paths written."""
    data_dir = data_dir or Path(__file__).resolve().parents[2] / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    clean_rows = build_clean_rows()
    dirty_rows = build_dirty_rows(clean_rows)

    clean_csv = data_dir / "hmis_clean.csv"
    clean_xlsx = data_dir / "hmis_clean.xlsx"
    dirty_csv = data_dir / "hmis_dirty.csv"

    pd.DataFrame(clean_rows, columns=COLUMNS).to_csv(clean_csv, index=False)
    pd.DataFrame(clean_rows, columns=COLUMNS).to_excel(clean_xlsx, index=False)
    pd.DataFrame(dirty_rows, columns=COLUMNS).to_csv(dirty_csv, index=False)
    return {"clean_csv": clean_csv, "clean_xlsx": clean_xlsx, "dirty_csv": dirty_csv}


if __name__ == "__main__":
    paths = write_datasets()
    for name, path in paths.items():
        print(f"{name}: {path}")
