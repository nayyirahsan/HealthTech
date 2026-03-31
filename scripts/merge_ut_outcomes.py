#!/usr/bin/env python3
"""
Deduplicate ut_outcomes JSON: same logical row keeps the entry with highest
applicants + matriculants (ties keep first).

Reads scripts/output/ut_outcomes_hpo.json by default; writes ut_outcomes_merged.json.
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
    p.add_argument("-i", "--input", type=Path, default=_OUTPUT / "ut_outcomes_hpo.json")
    p.add_argument("-o", "--output", type=Path, default=_OUTPUT / "ut_outcomes_merged.json")
    args = p.parse_args()
    with open(args.input, encoding="utf-8") as f:
        rows = json.load(f)
    out = merge_rows(rows)
    out.sort(key=lambda r: (r["report_year"], r["application_system"], r["school_name"]))
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"Deduped {len(rows)} → {len(out)} rows → {args.output}")


if __name__ == "__main__":
    main()
