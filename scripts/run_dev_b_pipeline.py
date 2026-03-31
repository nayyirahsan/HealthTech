#!/usr/bin/env python3
"""
Fetch Dev B sources, parse to JSON, merge UT outcomes, parse AAMC + AACOM grids.

Run from repo root:
  .venv/bin/python scripts/run_dev_b_pipeline.py

Then seed Supabase (uses your .env.local):
  .venv/bin/python scripts/seed_outcomes_grids.py --ut-outcomes scripts/output/ut_outcomes_merged.json \\
    --replace-all-ut-outcomes \\
    --acceptance-grid scripts/output/acceptance_grid_aamc.json --replace-grid 2023 AAMC
  .venv/bin/python scripts/seed_outcomes_grids.py \\
    --acceptance-grid scripts/output/acceptance_grid_aacom.json --replace-grid 2020 AACOM

  .venv/bin/python scripts/validate_data.py
"""

from __future__ import annotations

import subprocess
import sys
import argparse
from pathlib import Path

_SCRIPTS = Path(__file__).resolve().parent
_ROOT = _SCRIPTS.parent


def _run(args: list[str]) -> None:
    cmd = [sys.executable, str(_SCRIPTS / args[0]), *args[1:]]
    print("+", " ".join(cmd), flush=True)
    subprocess.check_call(cmd, cwd=str(_ROOT))


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Dev B fetch/parse/merge pipeline")
    parser.add_argument(
        "--skip-fetch",
        action="store_true",
        help="Skip downloading sources and parse existing scripts/data PDFs only",
    )
    args = parser.parse_args()

    if not args.skip_fetch:
        _run(["fetch_dev_b_sources.py"])
    _run(["parse_hpo_reports.py"])
    _run(["merge_ut_outcomes.py"])
    a23 = _SCRIPTS / "data" / "aamc" / "A-23_2023.pdf"
    aacom = _SCRIPTS / "data" / "aacom" / "aacom_grid_aggregated_2018_2021.pdf"
    _run(
        [
            "parse_aamc_grid.py",
            str(a23),
            "--year",
            "2023",
            "-o",
            "acceptance_grid_aamc.json",
        ]
    )
    _run(
        [
            "parse_aacom_grid.py",
            str(aacom),
            "--year",
            "2020",
            "-o",
            "acceptance_grid_aacom.json",
        ]
    )
    print("\nPipeline JSON ready under scripts/output/. Next: run seed_outcomes_grids (see docstring).")


if __name__ == "__main__":
    main()
