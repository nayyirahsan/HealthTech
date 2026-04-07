#!/usr/bin/env python3
"""
Deduplicate and merge ut_outcomes JSON files: same logical row keeps the entry with
highest applicants + matriculants (ties keep first).

By default merges scripts/output/ut_outcomes_hpo.json plus
scripts/output/ut_outcomes_facts.json (if present), and writes ut_outcomes_merged.json.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
_OUTPUT = _SCRIPTS / "output"


def _key(r: dict) -> tuple:
    return (
        r.get("report_year"),
        r.get("application_system"),
        r.get("school_name"),
        r.get("gpa_band"),
        r.get("mcat_band"),
        r.get("major"),
    )


def merge_rows(rows: list[dict]) -> list[dict]:
    best: dict[tuple, dict] = {}
    for r in rows:
        k = _key(r)
        score = int(r.get("applicants") or 0) + int(r.get("matriculants") or 0)
        if k not in best:
            best[k] = dict(r)
            continue
        prev = best[k]
        prev_score = int(prev.get("applicants") or 0) + int(prev.get("matriculants") or 0)
        if score > prev_score:
            best[k] = dict(r)
    return list(best.values())


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument(
        "-i",
        "--input",
        type=Path,
        nargs="*",
        help="Input JSON files (default: ut_outcomes_hpo.json + ut_outcomes_facts.json if present)",
    )
    p.add_argument("-o", "--output", type=Path, default=_OUTPUT / "ut_outcomes_merged.json")
    args = p.parse_args()
    inputs = args.input
    if not inputs:
        inputs = [_OUTPUT / "ut_outcomes_hpo.json"]
        facts = _OUTPUT / "ut_outcomes_facts.json"
        if facts.exists():
            inputs.append(facts)

    rows: list[dict] = []
    for path in inputs:
        if not path.exists():
            print(f"Skip missing input: {path}")
            continue
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            raise ValueError(f"{path} must contain a JSON list")
        rows.extend(data)
    out = merge_rows(rows)
    out.sort(key=lambda r: (r["report_year"], r["application_system"], r["school_name"]))
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"Deduped {len(rows)} → {len(out)} rows → {args.output}")


if __name__ == "__main__":
    main()
