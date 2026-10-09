"""ETL pipeline: file -> schema -> row checks -> duplicates -> clean rows.

WHY: HMIS uploads are messy. This pipeline NEVER silently drops data:
every rejected row gets a {row, column, message} error so officials can
fix and re-upload. Steps:
1. file type + size  2. load CSV/XLSX  3. required columns
4. per-row: missing, ranges (counts >= 0, numerator <= denominator),
   valid YYYY-MM dates, known district/block/facility
5. duplicate detection (within file)
DB insertion happens in the caller (seed / upload router) so this module
stays pure and easily testable.
"""

from dataclasses import dataclass, field
from datetime import date
from pathlib import Path

import pandas as pd

MAX_FILE_MB = 10
ALLOWED_SUFFIXES = {".csv", ".xlsx", ".xls"}

REQUIRED_COLUMNS: list[str] = [
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

COUNT_COLUMNS: list[str] = [c for c in REQUIRED_COLUMNS if c not in
    ("district", "block", "facility", "facility_type", "period")]

# (numerator, denominator) pairs where numerator must not exceed denominator.
NUMERATOR_DENOMINATOR_PAIRS: list[tuple[str, str]] = [
    ("anc_4_visits", "total_pregnant_women"),
    ("institutional_deliveries", "total_deliveries"),
    ("fully_immunized_infants", "total_infants"),
    ("tb_treatment_success", "total_tb_patients"),
    ("positioned_health_workers", "sanctioned_health_workers"),
]


@dataclass
class RowError:
    row: int  # 1-based data-row number (header = row 0)
    column: str
    message: str

    def to_dict(self) -> dict:
        return {"row": self.row, "column": self.column, "message": self.message}


@dataclass
class ValidationResult:
    valid_rows: list[dict] = field(default_factory=list)
    errors: list[RowError] = field(default_factory=list)

    @property
    def total_rows(self) -> int:
        return len(self.valid_rows) + len({e.row for e in self.errors})

    def to_summary(self) -> dict:
        invalid_rows = len({e.row for e in self.errors})
        return {
            "total_rows": self.total_rows,
            "valid_rows": len(self.valid_rows),
            "invalid_rows": invalid_rows,
            "errors": [e.to_dict() for e in self.errors],
        }


def validate_extension(filename: str) -> str | None:
    """Return an error message if the file type is not allowed."""
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        return f"Unsupported file type '{suffix}'. Use CSV or XLSX."
    return None


def load_dataframe(path: Path) -> pd.DataFrame:
    """Load CSV or Excel into a DataFrame (all values kept for validation)."""
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path, dtype=str, keep_default_na=True)
    return pd.read_excel(path, dtype=str)


def parse_period(raw: object) -> date | None:
    """Accept 'YYYY-MM' or 'YYYY-MM-DD' or Excel dates -> first of month."""
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return None
    text = str(raw).strip()
    for fmt in ("%Y-%m-%d", "%Y-%m", "%Y/%m", "%d-%m-%Y", "%m/%d/%Y"):
        try:
            from datetime import datetime

            parsed = datetime.strptime(text[:10], fmt)
            return date(parsed.year, parsed.month, 1)
        except ValueError:
            continue
    try:  # last resort: pandas date parsing
        parsed = pd.to_datetime(text)
        return date(int(parsed.year), int(parsed.month), 1)
    except Exception:
        return None


def _is_missing(value: object) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "") or (
        not isinstance(value, str) and pd.isna(value)
    )


def validate_dataframe(
    df: pd.DataFrame,
    known_facilities: set[tuple[str, str, str]] | None = None,
) -> ValidationResult:
    """Validate every row; return clean rows + detailed row-level errors."""
    result = ValidationResult()

    missing_cols = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        result.errors.append(
            RowError(row=0, column="header",
                     message=f"Missing required columns: {missing_cols}")
        )
        return result  # cannot proceed without the schema

    seen_keys: set[tuple[str, str, str, str]] = set()
    for idx, record in df.iterrows():
        row_num = int(idx) + 1  # 1-based data row
        row_errors: list[RowError] = []
        row = {col: record.get(col) for col in REQUIRED_COLUMNS}

        # --- missing checks (location + period + counts) ---
        for col in ("district", "block", "facility", "period"):
            if _is_missing(row[col]):
                row_errors.append(RowError(row_num, col, "Missing value"))
        for col in COUNT_COLUMNS:
            if _is_missing(row[col]):
                row_errors.append(RowError(row_num, col, "Missing value"))

        # --- period ---
        period: date | None = None
        if not _is_missing(row["period"]):
            period = parse_period(row["period"])
            if period is None:
                row_errors.append(
                    RowError(row_num, "period",
                             f"Invalid date '{row['period']}'. Use YYYY-MM.")
                )

        # --- counts: integers >= 0 ---
        counts: dict[str, int] = {}
        for col in COUNT_COLUMNS:
            if _is_missing(row[col]):
                continue
            try:
                number = int(float(str(row[col]).strip()))
            except (ValueError, TypeError):
                row_errors.append(
                    RowError(row_num, col, f"Not a number: '{row[col]}'")
                )
                continue
            if number < 0:
                row_errors.append(
                    RowError(row_num, col, f"Negative count: {number}")
                )
                continue
            counts[col] = number

        # --- numerator <= denominator (percent can never exceed 100) ---
        for num_col, den_col in NUMERATOR_DENOMINATOR_PAIRS:
            if num_col in counts and den_col in counts:
                if counts[num_col] > counts[den_col]:
                    row_errors.append(
                        RowError(
                            row_num, num_col,
                            f"{num_col} ({counts[num_col]}) exceeds "
                            f"{den_col} ({counts[den_col]})",
                        )
                    )

        # --- known location check (when a reference set is provided) ---
        if known_facilities is not None and not any(
            e.column in ("district", "block", "facility") for e in row_errors
        ):
            key = (
                str(row["district"]).strip(),
                str(row["block"]).strip(),
                str(row["facility"]).strip(),
            )
            if key not in known_facilities:
                row_errors.append(
                    RowError(row_num, "facility",
                             f"Unknown location: {key}")
                )

        # --- duplicate detection within the file ---
        dup_key = (
            str(row["district"]).strip(),
            str(row["block"]).strip(),
            str(row["facility"]).strip(),
            str(row["period"]).strip(),
        )
        if dup_key in seen_keys:
            row_errors.append(RowError(row_num, "period", "Duplicate record in file"))
        else:
            seen_keys.add(dup_key)

        if row_errors:
            result.errors.extend(row_errors)
            continue

        clean = {
            "district": str(row["district"]).strip(),
            "block": str(row["block"]).strip(),
            "facility": str(row["facility"]).strip(),
            "facility_type": str(row.get("facility_type") or "PHC").strip() or "PHC",
            "period": period,
            **counts,
        }
        result.valid_rows.append(clean)

    return result


def validate_file(
    path: Path,
    known_facilities: set[tuple[str, str, str]] | None = None,
) -> ValidationResult:
    """Full pipeline for a file on disk: size -> load -> validate."""
    result = ValidationResult()
    ext_error = validate_extension(path.name)
    if ext_error:
        result.errors.append(RowError(row=0, column="file", message=ext_error))
        return result
    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > MAX_FILE_MB:
        result.errors.append(
            RowError(row=0, column="file",
                     message=f"File too large: {size_mb:.1f}MB (max {MAX_FILE_MB}MB)")
        )
        return result
    try:
        df = load_dataframe(path)
    except Exception as exc:
        result.errors.append(
            RowError(row=0, column="file", message=f"Could not read file: {exc}")
        )
        return result
    return validate_dataframe(df, known_facilities)
