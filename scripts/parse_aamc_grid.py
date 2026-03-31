#!/usr/bin/env python3
"""
Parse AAMC MCAT/GPA acceptance grid (A-23 style PDF) → acceptance_grid JSON.

Expects a rectangular table: GPA band labels in the first column, MCAT band
labels in the first row, cells containing acceptance percentages.

Output: scripts/output/acceptance_grid_aamc.json
"""

from __future__ import annotations

import argparse
from pathlib import Path

from parsing.grid_a23 import extract_all_tables, parse_a23_pdf_tables

from utils import write_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse AAMC A-23 PDF → acceptance_grid JSON")
    parser.add_argument("pdf", type=Path, help="Path to A-23 PDF")
    parser.add_argument("--year", type=int, required=True, help="Cycle year for this grid")
    parser.add_argument(
        "-o",
        "--output",
        default="acceptance_grid_aamc.json",
        help="Output filename under scripts/output/",
    )
    args = parser.parse_args()

    pdf_path = args.pdf.resolve()
    if not pdf_path.is_file():
        raise SystemExit(f"PDF not found: {pdf_path}")

    tables = extract_all_tables(pdf_path)
    records = parse_a23_pdf_tables(tables, args.year, "AAMC")
    if not records:
        print(
            "No grid cells parsed. The PDF layout may differ from A-23 expectations. "
            "Inspect extract_tables() output or adjust parsing/grid_a23.py."
        )

    path = write_json(records, args.output)
    print(f"Wrote {len(records)} cells to {path}")


if __name__ == "__main__":
    main()
