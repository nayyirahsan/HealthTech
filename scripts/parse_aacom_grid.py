#!/usr/bin/env python3
"""
Parse AACOM MCAT/GPA acceptance grid PDF → acceptance_grid JSON (source AACOM).

Uses the same grid heuristics as the AAMC A-23 parser; refine parsing/grid_a23.py
if AACOM layouts differ.

Output: scripts/output/acceptance_grid_aacom.json
"""

from __future__ import annotations

import argparse
from pathlib import Path

from parsing.aacom_grid import parse_aacom_pdf
from parsing.grid_a23 import extract_all_tables, parse_a23_pdf_tables

from utils import write_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse AACOM grid PDF → acceptance_grid JSON")
    parser.add_argument("pdf", type=Path, help="Path to AACOM grid PDF")
    parser.add_argument(
        "--year",
        type=int,
        required=True,
        help="Representative cycle year (e.g. mid-year for multi-year aggregates)",
    )
    parser.add_argument(
        "-o",
        "--output",
        default="acceptance_grid_aacom.json",
        help="Output filename under scripts/output/",
    )
    args = parser.parse_args()

    pdf_path = args.pdf.resolve()
    if not pdf_path.is_file():
        raise SystemExit(f"PDF not found: {pdf_path}")

    records = parse_aacom_pdf(pdf_path, args.year)
    if not records:
        tables = extract_all_tables(pdf_path)
        records = parse_a23_pdf_tables(tables, args.year, "AACOM")
    if not records:
        print(
            "No grid cells parsed. Check parsing/aacom_grid.py or parsing/grid_a23.py "
            "for this PDF layout."
        )

    path = write_json(records, args.output)
    print(f"Wrote {len(records)} cells to {path}")


if __name__ == "__main__":
    main()
