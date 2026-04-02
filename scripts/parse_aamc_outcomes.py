"""
Extract MCAT + GPA → outcome data from the AAMC Student Outcomes PDF.

The AAMC publishes a report showing how applicants' MCAT scores and GPAs
relate to outcomes like Step 1 pass rates and graduation rates.

SETUP — before running this script:
  1. Go to: https://www.aamc.org (search "student outcomes MCAT GPA")
     Or try: https://www.aamc.org/data-reports/students-residents/data/
  2. Download the "Medical School Graduation Rates and MD-PhD Program Outcomes" PDF
     (or similar — the title changes each year)
  3. Save it as: scripts/aamc_outcomes.pdf
  4. Run: python parse_aamc_outcomes.py

Output: scripts/output/salary_aamc_outcomes.json
  (named "salary_" so seed_salary.py can find it in the same output folder)
"""

import sys
from pathlib import Path

import pdfplumber

sys.path.insert(0, str(Path(__file__).parent))
from utils import write_json

# ── Configuration ────────────────────────────────────────────────────────────

PDF_PATH = Path(__file__).parent / "aamc_outcomes.pdf"


# ── Helpers ──────────────────────────────────────────────────────────────────

def clean_cell(val) -> str:
    """Strip whitespace and normalize None → empty string."""
    if val is None:
        return ""
    return str(val).strip()


def looks_like_number(s: str) -> bool:
    """Return True if string looks like a percentage or decimal."""
    s = s.replace("%", "").replace(",", "").strip()
    try:
        float(s)
        return True
    except ValueError:
        return False


def parse_pdf(path: Path) -> list[dict]:
    """
    Extract all tables from the PDF and return them as flat records.

    Because AAMC PDFs change format every year, this approach pulls ALL
    tables from the document and saves them with page + table metadata.
    You can inspect the output JSON to find exactly what you need.
    """
    records = []

    with pdfplumber.open(path) as pdf:
        print(f"PDF has {len(pdf.pages)} pages")

        for page_num, page in enumerate(pdf.pages, start=1):
            tables = page.extract_tables()

            if not tables:
                continue

            for table_idx, table in enumerate(tables):
                if not table or len(table) < 2:
                    continue

                # First row is usually the header
                headers = [clean_cell(h) for h in table[0]]
                # Skip tables with no useful headers
                if all(h == "" for h in headers):
                    continue

                for row in table[1:]:
                    cells = [clean_cell(c) for c in row]
                    # Skip blank rows
                    if all(c == "" for c in cells):
                        continue

                    record = {
                        "_page":        page_num,
                        "_table":       table_idx,
                        "_source":      "aamc_outcomes_pdf",
                    }
                    for i, header in enumerate(headers):
                        key = header if header else f"col_{i}"
                        record[key] = cells[i] if i < len(cells) else ""

                    records.append(record)

            # Also extract plain text for pages without tables (charts, etc.)
            # so nothing is lost
            text = page.extract_text() or ""
            if text and not tables:
                records.append({
                    "_page":   page_num,
                    "_table":  None,
                    "_source": "aamc_outcomes_pdf",
                    "_text":   text[:2000],  # cap length
                })

    return records


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("AAMC Outcomes PDF Parser — UT Austin Premed AI Copilot")
    print("=" * 50)

    if not PDF_PATH.exists():
        print(f"\nERROR: PDF not found at {PDF_PATH}")
        print("Download the AAMC Student Outcomes PDF and save it as:")
        print(f"  {PDF_PATH}")
        print("\nSee SETUP instructions at the top of this file.")
        return

    print(f"Parsing {PDF_PATH.name}...")
    records = parse_pdf(PDF_PATH)

    print(f"\nExtracted {len(records)} rows across all tables")

    if records:
        write_json(records, "salary_aamc_outcomes.json")
        print("\nDone!")
        print("TIP: Open scripts/output/salary_aamc_outcomes.json to review what was")
        print("     extracted. The '_page' and '_table' fields tell you where each row")
        print("     came from so you can spot the MCAT/GPA outcome tables.")
    else:
        print("\nNo table data found — the PDF might use scanned images instead of")
        print("real text. If so, you'll need Adobe Acrobat or an OCR tool to extract it.")


if __name__ == "__main__":
    main()
