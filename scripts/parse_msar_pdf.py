"""
Parse MSAR advisor report PDFs into structured JSON (Dev A — schools pipeline).

Outputs school-oriented records for merge/seed scripts. UT HPO reports are
handled by Dev B: scripts/parse_hpo_reports.py.
"""

from pathlib import Path

# TODO: import pdfplumber


def parse_msar_data(pdf_path: str) -> list[dict]:
    """Parse MSAR advisor report PDF into school stat records."""
    # TODO: Implement PDF parsing with pdfplumber
    print(f"[STUB] Would parse MSAR data: {pdf_path}")
    return []


def main():
    print("MSAR PDF Parser — UT Austin Premed AI Copilot")
    print("=" * 50)

    # TODO: Add PDF file paths and run parsers
    data_dir = Path(__file__).parent / "data"
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)

    print("[STUB] No PDF files configured yet. Add paths to parse.")


if __name__ == "__main__":
    main()
