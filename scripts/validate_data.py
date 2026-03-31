#!/usr/bin/env python3
"""
Post-load checks for key tables (Dev B focus: ut_outcomes, acceptance_grid).

Requires `.env.local` with Supabase URL + service role key.
"""

from __future__ import annotations

import argparse
import sys

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


if __name__ == "__main__":
    main()
