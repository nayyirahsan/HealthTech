"""
Parse MSAR Advisor Report PDFs into structured JSON.

Each PDF is a tabular report covering ALL ~170 MD schools for one topic
(prereqs, interview policies, tuition, debt, etc.). This parser extracts
tables from every PDF, groups rows by school, and outputs a consolidated
schools_msar.json with one record per school.

Usage:
    1. Place MSAR PDF files in scripts/data/msar/
    2. Run: python parse_msar_schools.py
"""

import re
from pathlib import Path

import pdfplumber

from utils import normalize_school_name, write_json

_SCRIPTS_DIR = Path(__file__).parent
_DATA_DIR = _SCRIPTS_DIR / "data" / "msar"


# ---------------------------------------------------------------------------
# Table extraction helpers
# ---------------------------------------------------------------------------

def _extract_all_tables(pdf_path: Path) -> list[list[list[str]]]:
    """Extract all tables from a PDF, skipping page 1 (title page)."""
    all_tables = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages[1:]:  # skip title page
            tables = page.extract_tables()
            if tables:
                all_tables.extend(tables)
    return all_tables


def _flatten_tables(tables: list[list[list[str]]]) -> list[list[str]]:
    """Flatten multiple tables into a single row list, dropping header rows.

    Header rows are identified by having 'State' or 'Medical School' in
    the first two cells.
    """
    rows = []
    for table in tables:
        for row in table:
            if not row:
                continue
            # Skip header rows
            first = (row[0] or "").strip().lower()
            second = (row[1] or "").strip().lower() if len(row) > 1 else ""
            if first in ("state", "") and "medical school" in second:
                continue
            if first == "state" and second == "":
                continue
            rows.append(row)
    return rows


def _group_rows_by_school(rows: list[list[str]]) -> dict[str, list[list[str]]]:
    """Group rows by school name using the continuation-row pattern.

    Rows where State and Medical School are both None are continuations
    of the previous school.
    """
    grouped: dict[str, list[list[str]]] = {}
    current_name = None

    for row in rows:
        state = (row[0] or "").strip() if row[0] else ""
        name_raw = (row[1] or "").strip() if len(row) > 1 else ""

        # Clean up newlines in cell text
        name_raw = name_raw.replace("\n", " ").strip()
        state = state.replace("\n", " ").strip()

        if name_raw:
            current_name = name_raw
            if current_name not in grouped:
                grouped[current_name] = []

        if current_name:
            grouped[current_name].append(row)

    return grouped


def _clean_cell(val) -> str:
    """Clean a table cell value."""
    if val is None:
        return ""
    return str(val).replace("\n", " ").strip()


def _parse_money(text: str) -> int | None:
    """Parse a dollar amount like '$35,155' to int."""
    cleaned = text.replace("$", "").replace(",", "").strip()
    try:
        return int(float(cleaned))
    except (ValueError, TypeError):
        return None


def _parse_percent(text: str) -> float | None:
    """Parse a percentage like '88%' to float."""
    cleaned = text.replace("%", "").strip()
    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Per-PDF-type parsers
# ---------------------------------------------------------------------------

def _parse_tuition(pdf_path: Path, schools: dict):
    """Parse 19_tuition_fees_insurance.pdf.

    Header: State, Medical School, In-State Total, In-State Tuition, In-State Insurance,
            Out-of-State Total, Out-of-State Tuition, Out-of-State Insurance
    """
    tables = _extract_all_tables(pdf_path)
    rows = _flatten_tables(tables)

    for row in rows:
        name_raw = _clean_cell(row[1]) if len(row) > 1 else ""
        if not name_raw:
            continue
        name = normalize_school_name(name_raw)

        tuition_in = _parse_money(_clean_cell(row[3])) if len(row) > 3 else None
        tuition_oos = _parse_money(_clean_cell(row[6])) if len(row) > 6 else None

        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}
        if tuition_in is not None:
            schools[name]["tuition_in_state"] = tuition_in
        if tuition_oos is not None:
            schools[name]["tuition_oos"] = tuition_oos


def _parse_debt(pdf_path: Path, schools: dict):
    """Parse 17_debt_information.pdf.

    Header: State, Medical School, % Receiving Aid, Average Graduate Indebtedness
    """
    tables = _extract_all_tables(pdf_path)
    rows = _flatten_tables(tables)

    for row in rows:
        name_raw = _clean_cell(row[1]) if len(row) > 1 else ""
        if not name_raw:
            continue
        name = normalize_school_name(name_raw)

        avg_debt = _parse_money(_clean_cell(row[3])) if len(row) > 3 else None

        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}
        if avg_debt is not None:
            schools[name]["avg_debt"] = avg_debt


def _parse_interview(pdf_path: Path, schools: dict):
    """Parse 15_interview_policies.pdf.

    Header: State, Medical School, Interview Format, Invitations Sent,
            Typical Interview Day, Regional Interviews?, Video Interview?
    """
    tables = _extract_all_tables(pdf_path)
    grouped = _group_rows_by_school(_flatten_tables(tables))

    for name_raw, rows in grouped.items():
        name = normalize_school_name(name_raw)
        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}

        # Extract interview format from first row
        format_text = _clean_cell(rows[0][2]) if len(rows[0]) > 2 else ""
        if format_text:
            fmt_lower = format_text.lower()
            if "mmi" in fmt_lower:
                schools[name]["interview_format"] = "MMI"
            elif "panel" in fmt_lower:
                schools[name]["interview_format"] = "Panel"
            elif "one-on-one" in fmt_lower or "traditional" in fmt_lower:
                schools[name]["interview_format"] = "Traditional"


def _parse_prereqs(pdf_path: Path, schools: dict):
    """Parse 12_premedical_coursework.pdf.

    Header: State, Medical School, Course, Class, Required/Recommended?,
            Additional Info, Credit Hours, Lab?, Pass/Fail, AP Credit,
            Online Course, Community College
    """
    tables = _extract_all_tables(pdf_path)
    grouped = _group_rows_by_school(_flatten_tables(tables))

    for name_raw, rows in grouped.items():
        name = normalize_school_name(name_raw)
        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}

        prereqs = {}
        for row in rows:
            course = _clean_cell(row[2]) if len(row) > 2 else ""
            req_rec = _clean_cell(row[4]).lower() if len(row) > 4 else ""

            if not course:
                continue

            course_lower = course.lower()
            if req_rec == "required":
                prereqs[course_lower] = True
            elif req_rec == "recommended":
                prereqs[course_lower] = "recommended"

        if prereqs:
            schools[name]["prereqs"] = prereqs


def _parse_lor(pdf_path: Path, schools: dict):
    """Parse 09_letter_of_evaluation.pdf.

    Header: State, Medical School, Committee Letter, Letter Packets, Individual Letters
    """
    tables = _extract_all_tables(pdf_path)
    rows = _flatten_tables(tables)

    for row in rows:
        name_raw = _clean_cell(row[1]) if len(row) > 1 else ""
        if not name_raw:
            continue
        name = normalize_school_name(name_raw)
        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}

        # Capture LOR preferences
        committee = _clean_cell(row[2]) if len(row) > 2 else ""
        packets = _clean_cell(row[3]) if len(row) > 3 else ""
        individual = _clean_cell(row[4]) if len(row) > 4 else ""

        lor_parts = []
        if committee:
            lor_parts.append(f"Committee: {committee}")
        if packets:
            lor_parts.append(f"Packets: {packets}")
        if individual:
            lor_parts.append(f"Individual: {individual}")
        if lor_parts:
            schools[name]["lor_policy"] = "; ".join(lor_parts)


def _parse_applications_accepted(pdf_path: Path, schools: dict):
    """Parse 06_applications_accepted.pdf.

    Header: State, Medical School Name, Accepts Applications From, Policy, Additional Information
    """
    tables = _extract_all_tables(pdf_path)
    grouped = _group_rows_by_school(_flatten_tables(tables))

    for name_raw, rows in grouped.items():
        name = normalize_school_name(name_raw)
        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}

        # Check if school accepts out-of-state
        for row in rows:
            accepts_from = _clean_cell(row[2]).lower() if len(row) > 2 else ""
            if "in-state only" in accepts_from or "in state only" in accepts_from:
                schools[name]["in_state_bias"] = 100.0
                break


def _parse_campus_contact(pdf_path: Path, schools: dict):
    """Parse 01_campus_address_contact.pdf.

    Extracts state for each school from the State column.
    """
    tables = _extract_all_tables(pdf_path)
    rows = _flatten_tables(tables)

    for row in rows:
        state = _clean_cell(row[0]) if row[0] else ""
        name_raw = _clean_cell(row[1]) if len(row) > 1 else ""
        if not name_raw or not state or len(state) > 2:
            continue
        name = normalize_school_name(name_raw)
        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}
        schools[name]["state"] = state.upper()


def _parse_admission_policies(pdf_path: Path, schools: dict):
    """Parse 05_admission_policies.pdf — free-text, limited structured extraction."""
    tables = _extract_all_tables(pdf_path)
    rows = _flatten_tables(tables)

    for row in rows:
        state = _clean_cell(row[0]) if row[0] else ""
        name_raw = _clean_cell(row[1]) if len(row) > 1 else ""
        if not name_raw or len(state) > 2:
            continue
        name = normalize_school_name(name_raw)
        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}
        # State is the most reliable structured field here
        if state:
            schools[name].setdefault("state", state.upper())


def _parse_mcat_dates(pdf_path: Path, schools: dict):
    """Parse 11_mcat_test_dates.pdf — latest/oldest MCAT dates considered."""
    tables = _extract_all_tables(pdf_path)
    rows = _flatten_tables(tables)

    for row in rows:
        name_raw = _clean_cell(row[1]) if len(row) > 1 else ""
        if not name_raw:
            continue
        name = normalize_school_name(name_raw)
        if name not in schools:
            schools[name] = {"name": name, "_source": "msar"}
        # Store as metadata — useful for applicants
        latest = _clean_cell(row[2]) if len(row) > 2 else ""
        oldest = _clean_cell(row[3]) if len(row) > 3 else ""
        if latest:
            schools[name]["mcat_latest_date"] = latest
        if oldest:
            schools[name]["mcat_oldest_date"] = oldest


# ---------------------------------------------------------------------------
# PDF-to-parser mapping
# ---------------------------------------------------------------------------

PDF_PARSERS = {
    "01_campus_address_contact.pdf": _parse_campus_contact,
    "05_admission_policies.pdf": _parse_admission_policies,
    "06_applications_accepted.pdf": _parse_applications_accepted,
    "09_letter_of_evaluation.pdf": _parse_lor,
    "11_mcat_test_dates.pdf": _parse_mcat_dates,
    "12_premedical_coursework.pdf": _parse_prereqs,
    "15_interview_policies.pdf": _parse_interview,
    "17_debt_information.pdf": _parse_debt,
    "19_tuition_fees_insurance.pdf": _parse_tuition,
}

# PDFs we skip (useful info but not mapped to schools table columns):
# 02_mission_statement.pdf — long text, not structured enough
# 03_bsmd_programs.pdf — BS/MD info, niche
# 04_gender_sexual_minority_support.pdf — support resources
# 07_secondary_application.pdf — secondary app details
# 08_application_transfer_policies.pdf — transfer policies
# 10_daca_policies.pdf — DACA-specific
# 13_preview_exam_policies.pdf — CASPer/preview policies
# 14_community_college_coursework.pdf — CC policies (captured in prereqs)
# 16_waitlist_procedures.pdf — waitlist info
# 18_deposit_due_date.pdf — deposit dates


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("MSAR PDF Parser — Dev A (Schools Master)")
    print("=" * 60)

    if not _DATA_DIR.exists():
        _DATA_DIR.mkdir(parents=True, exist_ok=True)
        print(f"\nCreated {_DATA_DIR}")
        print("Place MSAR PDF files in this directory, then re-run.")
        return

    pdf_files = sorted(_DATA_DIR.glob("*.pdf"))
    if not pdf_files:
        print(f"\nNo PDF files found in {_DATA_DIR}")
        return

    print(f"\nFound {len(pdf_files)} PDF files")

    # Accumulate all schools across PDFs
    # Key: normalized school name, Value: dict of fields
    schools: dict[str, dict] = {}

    for pdf_path in pdf_files:
        parser = PDF_PARSERS.get(pdf_path.name)
        if parser is None:
            print(f"  SKIP (no parser): {pdf_path.name}")
            continue

        print(f"  Parsing: {pdf_path.name}")
        try:
            parser(pdf_path, schools)
        except Exception as e:
            print(f"    ERROR: {e}")

    if not schools:
        print("\nNo school data extracted.")
        return

    # Set defaults: all MSAR schools are MD / AMCAS
    for school in schools.values():
        school.setdefault("type", "MD")
        school.setdefault("system", "AMCAS")

    output = sorted(schools.values(), key=lambda s: s["name"])
    write_json(output, "schools_msar.json")

    # Summary
    has_prereqs = sum(1 for s in output if s.get("prereqs"))
    has_tuition = sum(1 for s in output if s.get("tuition_in_state"))
    has_debt = sum(1 for s in output if s.get("avg_debt"))
    has_state = sum(1 for s in output if s.get("state"))
    has_interview = sum(1 for s in output if s.get("interview_format"))

    print(f"\n--- MSAR Parse Summary ---")
    print(f"Total schools:    {len(output)}")
    print(f"With state:       {has_state}")
    print(f"With prereqs:     {has_prereqs}")
    print(f"With tuition:     {has_tuition}")
    print(f"With avg debt:    {has_debt}")
    print(f"With interview:   {has_interview}")


if __name__ == "__main__":
    main()
