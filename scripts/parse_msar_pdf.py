"""
Parse MSAR and UT HPO PDF reports into structured JSON.

Extracts school stats, GPA/MCAT medians, and acceptance data
from PDF sources and outputs JSON files for database seeding.
"""

import json
from pathlib import Path

# TODO: import pdfplumber


def parse_hpo_report(pdf_path: str) -> list[dict]:
    """Parse a UT HPO annual report PDF into structured records."""
    # TODO: Implement PDF parsing with pdfplumber
    print(f"[STUB] Would parse HPO report: {pdf_path}")
    return []


def parse_msar_data(pdf_path: str) -> list[dict]:
    """Parse MSAR advisor report PDF into school stat records."""
    # TODO: Implement PDF parsing with pdfplumber
    print(f"[STUB] Would parse MSAR data: {pdf_path}")
    return []


def main():
    print("PDF Parser — UT Austin Premed AI Copilot")
    print("=" * 50)

    # TODO: Add PDF file paths and run parsers
    data_dir = Path(__file__).parent / "data"
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)

    print("[STUB] No PDF files configured yet. Add paths to parse.")


if __name__ == "__main__":
    main()
