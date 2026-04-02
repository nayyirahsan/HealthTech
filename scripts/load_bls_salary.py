"""
Parse physician salary data from BLS Occupational Employment & Wage Statistics.

SETUP — before running this script:
  1. Go to: https://www.bls.gov/oes/tables.htm
  2. Click the most recent year (e.g. "May 2023")
  3. Download "All data" — you'll get a zip file
  4. Unzip it. You'll see files like:
       national_M2023_dl.xlsx  ← national averages
       state_M2023_dl.xlsx     ← by state
       MSA_M2023_dl.xlsx       ← by metro area (e.g. Austin-Round Rock)
  5. Put those .xlsx files in a folder, e.g. scripts/bls_data/
  6. Run: python load_bls_salary.py

Output: scripts/output/salary_bls.json
"""

import sys
from pathlib import Path

import pandas as pd

# Add scripts/ dir to path so we can import utils
sys.path.insert(0, str(Path(__file__).parent))
from utils import write_json

# ── Configuration ────────────────────────────────────────────────────────────

# Folder where you put the downloaded BLS .xlsx files
BLS_DATA_DIR = Path(__file__).parent / "bls_data"

# Physician & surgeon SOC codes all start with "29-12"
PHYSICIAN_SOC_PREFIX = "29-12"

# Columns we care about (BLS uses these exact names)
KEEP_COLUMNS = {
    "OCC_CODE":   "soc_code",
    "OCC_TITLE":  "specialty",
    "AREA_TITLE": "area_name",   # only in state/MSA files
    "PRIM_STATE": "state",       # only in state/MSA files
    "A_MEAN":     "mean_salary",
    "A_PCT25":    "percentile_25",
    "A_MEDIAN":   "median_salary",
    "A_PCT75":    "percentile_75",
}

# BLS uses "*" or "**" for suppressed/confidential values — treat as missing
SUPPRESSED = {"*", "**", "#", "~"}


# ── Helpers ──────────────────────────────────────────────────────────────────

def clean_salary(val) -> int | None:
    """Convert a BLS salary value to int, returning None if suppressed."""
    s = str(val).strip()
    if s in SUPPRESSED or s.lower() in ("nan", ""):
        return None
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return None


def parse_bls_file(path: Path, source_label: str) -> list[dict]:
    """Read one BLS Excel file and return physician rows as dicts."""
    print(f"Reading {path.name}...")

    # BLS files sometimes have the data sheet named differently
    try:
        df = pd.read_excel(path, sheet_name=0, dtype=str)
    except Exception as e:
        print(f"  ERROR reading {path.name}: {e}")
        return []

    # Normalize column names (strip whitespace, uppercase)
    df.columns = [c.strip().upper() for c in df.columns]

    # Keep only physician/surgeon rows
    if "OCC_CODE" not in df.columns:
        print(f"  SKIP — no OCC_CODE column found in {path.name}")
        return []

    df = df[df["OCC_CODE"].str.startswith(PHYSICIAN_SOC_PREFIX, na=False)]
    print(f"  Found {len(df)} physician rows")

    records = []
    for _, row in df.iterrows():
        record = {
            "specialty":     row.get("OCC_TITLE", "").strip(),
            "metro_area":    row.get("AREA_TITLE", "National").strip() if "AREA_TITLE" in df.columns else "National",
            "state":         row.get("PRIM_STATE", "US").strip() if "PRIM_STATE" in df.columns else "US",
            "median_salary": clean_salary(row.get("A_MEDIAN")) or clean_salary(row.get("A_MEAN")) or 0,
            "percentile_25": clean_salary(row.get("A_PCT25")),
            "percentile_75": clean_salary(row.get("A_PCT75")),
            "source_year":   extract_year(path.name) or 2024,
        }
        records.append(record)

    return records


def extract_year(filename: str) -> int | None:
    """Try to pull a 4-digit year out of the filename (e.g. 'state_M2023_dl.xlsx' → 2023)."""
    import re
    match = re.search(r"(20\d{2})", filename)
    return int(match.group(1)) if match else None


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("BLS Salary Loader — UT Austin Premed AI Copilot")
    print("=" * 50)

    if not BLS_DATA_DIR.exists():
        print(f"\nERROR: Folder not found: {BLS_DATA_DIR}")
        print("Create it and put your downloaded BLS .xlsx files inside.")
        print("See the SETUP instructions at the top of this file.")
        return

    xlsx_files = list(BLS_DATA_DIR.glob("*.xlsx"))
    if not xlsx_files:
        print(f"\nNo .xlsx files found in {BLS_DATA_DIR}")
        print("Download BLS data from https://www.bls.gov/oes/tables.htm")
        return

    all_records = []
    for f in xlsx_files:
        # Label: "national", "state", or "msa" based on filename
        label = "national" if "national" in f.name.lower() else \
                "state"    if "state"    in f.name.lower() else \
                "msa"      if "msa"      in f.name.lower() else f.stem
        records = parse_bls_file(f, source_label=label)
        all_records.extend(records)

    print(f"\nTotal physician salary records: {len(all_records)}")

    if all_records:
        write_json(all_records, "salary_bls.json")
        print("\nDone! Next step: run parse_aamc_outcomes.py")
    else:
        print("No records found — double-check that your BLS files have physician SOC codes (29-12xx)")


if __name__ == "__main__":
    main()
