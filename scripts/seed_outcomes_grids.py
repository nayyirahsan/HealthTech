#!/usr/bin/env python3
"""
Load ut_outcomes and acceptance_grid JSON files into Supabase.

Requires `.env.local` at repo root with NEXT_PUBLIC_SUPABASE_URL and
SUPABASE_SERVICE_ROLE_KEY (see scripts/utils.py).

Optional `--replace-*` flags delete existing rows before insert so you can
re-seed without duplicates. Use carefully against production.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from utils import get_supabase_client

_SCRIPTS = Path(__file__).resolve().parent

SYSTEMS = frozenset({"TMDSAS", "AMCAS", "AACOMAS"})
GRID_SOURCES = frozenset({"AAMC", "AACOM"})


def _load_json(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"{path} must contain a JSON array")
    return data


def _validate_ut(rows: list[dict]) -> None:
    for i, row in enumerate(rows):
        for key in ("report_year", "application_system", "school_name"):
            if key not in row:
                raise ValueError(f"ut_outcomes row {i}: missing {key}")
        if row["application_system"] not in SYSTEMS:
            raise ValueError(f"ut_outcomes row {i}: invalid application_system")
        if not isinstance(row["report_year"], int):
            raise ValueError(f"ut_outcomes row {i}: report_year must be int")


def _validate_grid(rows: list[dict]) -> None:
    for i, row in enumerate(rows):
        for key in ("gpa_range", "mcat_range", "acceptance_rate", "source", "year"):
            if key not in row:
                raise ValueError(f"acceptance_grid row {i}: missing {key}")
        if row["source"] not in GRID_SOURCES:
            raise ValueError(f"acceptance_grid row {i}: source must be AAMC or AACOM")


def _chunked(seq: list, size: int):
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed ut_outcomes + acceptance_grid in Supabase")
    parser.add_argument(
        "--ut-outcomes",
        type=Path,
        help="JSON array file (e.g. scripts/output/ut_outcomes_hpo.json)",
    )
    parser.add_argument(
        "--acceptance-grid",
        type=Path,
        help="JSON array file (e.g. scripts/output/acceptance_grid_aamc.json)",
    )
    parser.add_argument(
        "--replace-ut-year",
        type=int,
        metavar="YEAR",
        help="Delete ut_outcomes with this report_year before loading ut_outcomes file",
    )
    parser.add_argument(
        "--replace-all-ut-outcomes",
        action="store_true",
        help="Delete all ut_outcomes rows before loading (use when reloading full Dev B dump)",
    )
    parser.add_argument(
        "--replace-grid",
        nargs=2,
        metavar=("YEAR", "SOURCE"),
        help="Delete acceptance_grid for this year and source (AAMC|AACOM) before grid load",
    )
    parser.add_argument("--batch-size", type=int, default=500)
    args = parser.parse_args()

    if not args.ut_outcomes and not args.acceptance_grid:
        parser.error("Provide --ut-outcomes and/or --acceptance-grid")

    client = get_supabase_client()

    if args.ut_outcomes:
        path = args.ut_outcomes.resolve()
        rows = _load_json(path)
        _validate_ut(rows)
        if args.replace_all_ut_outcomes:
            client.table("ut_outcomes").delete().neq("id", 0).execute()
            print("Deleted all ut_outcomes rows")
        elif args.replace_ut_year is not None:
            client.table("ut_outcomes").delete().eq("report_year", args.replace_ut_year).execute()
            print(f"Deleted ut_outcomes where report_year={args.replace_ut_year}")
        for batch in _chunked(rows, args.batch_size):
            client.table("ut_outcomes").insert(batch).execute()
        print(f"Inserted {len(rows)} ut_outcomes rows from {path}")

    if args.acceptance_grid:
        path = args.acceptance_grid.resolve()
        rows = _load_json(path)
        _validate_grid(rows)
        if args.replace_grid:
            year_s, src = args.replace_grid
            year = int(year_s)
            if src not in GRID_SOURCES:
                raise SystemExit("replace-grid SOURCE must be AAMC or AACOM")
            client.table("acceptance_grid").delete().eq("year", year).eq("source", src).execute()
            print(f"Deleted acceptance_grid where year={year} and source={src}")
        for batch in _chunked(rows, args.batch_size):
            client.table("acceptance_grid").insert(batch).execute()
        print(f"Inserted {len(rows)} acceptance_grid rows from {path}")


if __name__ == "__main__":
    main()
