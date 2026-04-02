#!/usr/bin/env python3
"""
Post-load checks for key tables (Dev B focus: ut_outcomes, acceptance_grid).

Requires `.env.local` with Supabase URL + service role key.
"""

from __future__ import annotations

import argparse
import sys
"""
Post-load data validation for all Supabase tables.

Checks row counts, NULL density, enum values, numeric ranges,
and FK integrity. Designed to be run by any dev after seeding.

Usage:
    python validate_data.py
"""

from utils import get_supabase_client


def _count(client, table: str) -> int:
    r = client.table(table).select("id", count="exact").limit(1).execute()
    return r.count if r.count is not None else -1


def _sample_grid(client) -> list[dict]:
    r = client.table("acceptance_grid").select("acceptance_rate").limit(5000).execute()
    return r.data or []


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate Supabase row counts and value ranges")
    parser.add_argument("--min-ut", type=int, default=1, help="Minimum ut_outcomes rows")
    parser.add_argument("--min-grid", type=int, default=1, help="Minimum acceptance_grid rows")
    args = parser.parse_args()

    client = get_supabase_client()
    errors: list[str] = []

    n_ut = _count(client, "ut_outcomes")
    n_grid = _count(client, "acceptance_grid")
    n_schools = _count(client, "schools")

    print(f"ut_outcomes rows:      {n_ut}")
    print(f"acceptance_grid rows:  {n_grid}")
    print(f"schools rows:           {n_schools}")

    if n_ut < args.min_ut:
        errors.append(f"ut_outcomes count {n_ut} < {args.min_ut}")
    if n_grid < args.min_grid:
        errors.append(f"acceptance_grid count {n_grid} < {args.min_grid}")

    for row in _sample_grid(client):
        rate = row.get("acceptance_rate")
        if rate is None:
            continue
        try:
            x = float(rate)
        except (TypeError, ValueError):
            errors.append(f"acceptance_grid non-numeric rate: {rate!r}")
            continue
        if x < 0 or x > 100:
            errors.append(f"acceptance_grid rate out of 0–100: {x}")

    if errors:
        print("\nValidation failed:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)
    print("\nValidation OK.")
# Expected minimums per table (update as data grows)
MIN_ROWS = {
    "schools": 200,
    "ut_outcomes": 0,
    "acceptance_grid": 0,
    "interview_data": 0,
}

# Enum constraints
ENUM_CHECKS = {
    "schools": {"type": ("MD", "DO"), "system": ("TMDSAS", "AMCAS", "AACOMAS")},
    "ut_outcomes": {"application_system": ("TMDSAS", "AMCAS", "AACOMAS")},
    "acceptance_grid": {"source": ("AAMC", "AACOM")},
    "interview_data": {"format": ("MMI", "Traditional", "Panel")},
}

# Numeric range constraints: (min, max)
RANGE_CHECKS = {
    "schools": {
        "median_gpa": (0.0, 4.0),
        "median_mcat": (472, 528),
        "acceptance_rate": (0, 100),
    },
}


def check_row_counts(client) -> list[str]:
    """Check each table meets its minimum row count."""
    errors = []
    for table, minimum in MIN_ROWS.items():
        try:
            result = client.table(table).select("id", count="exact").execute()
            count = result.count
            status = "PASS" if count >= minimum else "FAIL"
            print(f"  [{status}] {table}: {count} rows (min {minimum})")
            if count < minimum:
                errors.append(f"{table} has {count} rows, expected >= {minimum}")
        except Exception as e:
            print(f"  [FAIL] {table}: {e}")
            errors.append(f"{table} query failed: {e}")
    return errors


def check_null_density(client) -> list[str]:
    """Report NULL percentage for key columns in the schools table."""
    errors = []
    result = client.table("schools").select("*").execute()
    rows = result.data
    if not rows:
        print("  [SKIP] No schools data to check")
        return errors

    total = len(rows)
    columns = [
        "name", "type", "system", "state",
        "median_gpa", "median_mcat", "acceptance_rate",
        "class_size", "tuition_in_state", "tuition_oos",
    ]
    print(f"  Schools NULL density ({total} rows):")
    for col in columns:
        nulls = sum(1 for r in rows if r.get(col) is None)
        pct = (nulls / total) * 100
        flag = " <-- HIGH" if col in ("name", "type", "system", "state") and nulls > 0 else ""
        print(f"    {col}: {nulls}/{total} ({pct:.0f}%){flag}")
        if col in ("name", "type", "system", "state") and nulls > 0:
            errors.append(f"schools.{col} has {nulls} NULLs (required field)")
    return errors


def check_enums(client) -> list[str]:
    """Verify enum columns only contain allowed values."""
    errors = []
    for table, checks in ENUM_CHECKS.items():
        try:
            result = client.table(table).select("*").execute()
        except Exception:
            continue
        rows = result.data
        if not rows:
            continue

        for col, allowed in checks.items():
            bad = [r for r in rows if r.get(col) is not None and r[col] not in allowed]
            if bad:
                vals = set(r[col] for r in bad)
                print(f"  [FAIL] {table}.{col}: invalid values {vals}")
                errors.append(f"{table}.{col} has invalid values: {vals}")
            else:
                print(f"  [PASS] {table}.{col}: all values in {allowed}")
    return errors


def check_ranges(client) -> list[str]:
    """Verify numeric columns are within expected ranges."""
    errors = []
    for table, checks in RANGE_CHECKS.items():
        result = client.table(table).select("*").execute()
        rows = result.data
        if not rows:
            continue

        for col, (lo, hi) in checks.items():
            bad = [
                r for r in rows
                if r.get(col) is not None and (float(r[col]) < lo or float(r[col]) > hi)
            ]
            if bad:
                vals = [(r["name"], r[col]) for r in bad]
                print(f"  [FAIL] {table}.{col}: {len(bad)} out of range [{lo}, {hi}]")
                for name, val in vals[:5]:
                    print(f"    {name}: {val}")
                errors.append(f"{table}.{col}: {len(bad)} values out of range")
            else:
                non_null = sum(1 for r in rows if r.get(col) is not None)
                print(f"  [PASS] {table}.{col}: {non_null} values in [{lo}, {hi}]")
    return errors


def check_fk_integrity(client) -> list[str]:
    """Verify interview_data.school_id references existing schools."""
    errors = []
    try:
        interviews = client.table("interview_data").select("id, school_id").execute()
    except Exception:
        print("  [SKIP] interview_data table not accessible")
        return errors

    if not interviews.data:
        print("  [SKIP] No interview data to check")
        return errors

    schools = client.table("schools").select("id").execute()
    school_ids = {r["id"] for r in schools.data}

    orphans = [r for r in interviews.data if r["school_id"] not in school_ids]
    if orphans:
        print(f"  [FAIL] interview_data: {len(orphans)} orphaned school_id references")
        errors.append(f"interview_data has {len(orphans)} orphaned FK references")
    else:
        print(f"  [PASS] interview_data: all {len(interviews.data)} school_ids valid")
    return errors


def main():
    print("=" * 60)
    print("Data Validator — Shared")
    print("=" * 60)

    client = get_supabase_client()
    all_errors = []

    print("\n1. Row Counts")
    all_errors += check_row_counts(client)

    print("\n2. NULL Density")
    all_errors += check_null_density(client)

    print("\n3. Enum Values")
    all_errors += check_enums(client)

    print("\n4. Numeric Ranges")
    all_errors += check_ranges(client)

    print("\n5. FK Integrity")
    all_errors += check_fk_integrity(client)

    print("\n" + "=" * 60)
    if all_errors:
        print(f"RESULT: {len(all_errors)} issue(s) found:")
        for e in all_errors:
            print(f"  - {e}")
    else:
        print("RESULT: All checks passed")
    print("=" * 60)


if __name__ == "__main__":
    main()
