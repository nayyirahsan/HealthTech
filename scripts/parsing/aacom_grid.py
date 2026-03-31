"""AACOM GPA × MCAT matriculation grid (table layout used in public AACOM PDFs)."""

from __future__ import annotations

import re
from pathlib import Path

import pdfplumber

from parsing.grid_a23 import _parse_pct  # noqa: SLF001
from parsing.pdf_tables import cell_str, normalize_table


def _normalize_mcat_header_aacom(cell) -> str | None:
    s = cell_str(cell).replace("\n", " ").strip()
    if not s or s.lower() == "total":
        return None
    low = s.lower()
    if "less" in low and "486" in low:
        return "<486"
    if "greater" in low and "517" in low:
        return "518-528"
    m = re.match(r"(\d{3})\s*[-–]\s*(\d{3})", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return None


def _normalize_gpa_row_aacom(col0: str) -> str | None:
    s = cell_str(col0).replace("\n", " ").strip()
    s = re.sub(r"^Greather", "Greater", s, flags=re.I)
    if not s:
        return None
    low = s.lower()
    if "total gpa" in low and "overall" not in low:
        return None
    if "greater than 3.79" in low:
        return "3.80-4.00"
    m = re.match(r"(\d\.\d{2})\s*[-–]\s*(\d\.\d{2})", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    if "less than" in low and re.search(r"\d\.\d{2}", s):
        m2 = re.search(r"(\d\.\d{2})", s)
        return f"<{m2.group(1)}" if m2 else None
    return None


def _extract_mcat_header_row(rows: list[list[str]]) -> tuple[list[str], int] | None:
    for ri, row in enumerate(rows[:6]):
        labs: list[str] = []
        for c in row[2:12]:
            h = _normalize_mcat_header_aacom(c)
            if h:
                labs.append(h)
        if len(labs) >= 4:
            return labs, ri + 1
    return None


def parse_aacom_matriculation_tables(
    tables: list[list[list]],
    year: int,
    source: str = "AACOM",
) -> list[dict]:
    records: list[dict] = []
    for table in tables:
        rows = normalize_table(table)
        parsed = _extract_mcat_header_row(rows)
        if not parsed:
            continue
        mcat_labels, start_ri = parsed
        current_gpa: str | None = None
        for row in rows[start_ri:]:
            c0 = cell_str(row[0]) if row else ""
            c1 = cell_str(row[1]) if len(row) > 1 else ""
            g = _normalize_gpa_row_aacom(c0)
            if g:
                current_gpa = g
            low1 = c1.lower()
            if "matriculation" not in low1 or "rate" not in low1:
                continue
            if not current_gpa:
                continue
            for j, mcat in enumerate(mcat_labels):
                idx = j + 2
                if idx >= len(row):
                    break
                pct = _parse_pct(row[idx])
                if pct is None:
                    continue
                records.append(
                    {
                        "gpa_range": current_gpa,
                        "mcat_range": mcat,
                        "acceptance_rate": pct,
                        "source": source,
                        "year": year,
                    }
                )
    return records


def extract_all_tables_pdf(pdf_path: Path) -> list[list[list]]:
    out: list[list[list]] = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            for t in page.extract_tables() or []:
                out.append(t)
    return out


def parse_aacom_pdf(pdf_path: Path, year: int) -> list[dict]:
    tables = extract_all_tables_pdf(pdf_path)
    return parse_aacom_matriculation_tables(tables, year, "AACOM")
