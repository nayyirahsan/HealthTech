"""Shared A-23–style GPA × MCAT grid extraction (AAMC and AACOM PDFs)."""

from __future__ import annotations

import re
from pathlib import Path

from parsing.pdf_tables import cell_str, iter_page_tables, normalize_table

GPA_RANGE = re.compile(
    r"(\d\.\d{2})\s*[-–]\s*(\d\.\d{2})|(\d\.\d{2})\s*\+",
    re.IGNORECASE,
)
MCAT_RANGE = re.compile(r"(\d{3})\s*[-–]\s*(\d{3})|(\d{3})\s*\+", re.IGNORECASE)


def _parse_pct(cell: str) -> float | None:
    s = cell_str(cell)
    m = re.search(r"(\d+(?:\.\d+)?)\s*%", s)
    if not m:
        m = re.search(r"^(\d+(?:\.\d+)?)$", s.strip())
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def _fmt_band(a: str | None, b: str | None, plus: str | None) -> str | None:
    if plus:
        return f"{plus}+"
    if a and b:
        return f"{a}-{b}"
    return None


def _row_gpa_label(first_cell: str) -> str | None:
    s = cell_str(first_cell)
    m = GPA_RANGE.search(s)
    if not m:
        return None
    return _fmt_band(m.group(1), m.group(2), m.group(3))


def _header_mcat_labels(header_row: list[str]) -> list[str | None]:
    labels: list[str | None] = []
    for cell in header_row:
        s = cell_str(cell)
        m = MCAT_RANGE.search(s)
        if m:
            labels.append(_fmt_band(m.group(1), m.group(2), m.group(3)))
        else:
            labels.append(None)
    return labels


def parse_a23_tables(
    tables: list[list[list[str]]],
    year: int,
    source: str,
) -> list[dict]:
    records: list[dict] = []
    for table in tables:
        rows = normalize_table(table)
        if len(rows) < 2:
            continue
        header = rows[0]
        mcat_labels = _header_mcat_labels(header)
        if not any(mcat_labels):
            continue

        for row in rows[1:]:
            if not row:
                continue
            gpa_range = _row_gpa_label(row[0])
            if not gpa_range:
                continue
            for j, mcat_range in enumerate(mcat_labels):
                if j == 0 or mcat_range is None:
                    continue
                if j >= len(row):
                    break
                rate = _parse_pct(row[j])
                if rate is None:
                    continue
                records.append(
                    {
                        "gpa_range": gpa_range,
                        "mcat_range": mcat_range,
                        "acceptance_rate": rate,
                        "source": source,
                        "year": year,
                    }
                )
    return records


def extract_all_tables(pdf_path: Path) -> list[list[list[str]]]:
    all_tables: list[list[list[str]]] = []
    for _, _, raw in iter_page_tables(pdf_path):
        all_tables.append(raw)
    return all_tables


def _normalize_mcat_header(cell) -> str | None:
    s = cell_str(cell).replace("\n", " ").strip()
    if not s or s.lower() == "all applicants":
        return None
    low = s.lower()
    if "less" in low and "486" in low:
        return "<486"
    if "greater" in low and "517" in low:
        return "518-528"
    return s


def _normalize_gpa_band_col0(cell) -> str | None:
    s = cell_str(cell).replace("\n", " ").strip()
    if not s or s.lower() == "total gpa":
        return None
    low = s.lower()
    if "greater than 3.79" in low:
        return "3.80-4.00"
    m = re.match(r"(\d\.\d{2})\s*[-–]\s*(\d\.\d{2})", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return None


def _acceptance_rate_floats(line: str) -> list[float | None]:
    m = re.search(r"Acceptance\s+rate\s*%?\s*(.+)", line, re.IGNORECASE | re.DOTALL)
    if not m:
        return []
    out: list[float | None] = []
    for tok in m.group(1).split():
        t = tok.strip()
        if t == "-":
            out.append(None)
            continue
        try:
            out.append(float(t.replace(",", "")))
        except ValueError:
            continue
    return out


def parse_facts_a23_merged_table(
    table: list[list],
    year: int,
    source: str,
) -> list[dict]:
    """AAMC FACTS Table A-23 layout: MCAT headers in row 1, GPA in col 0, rates in col 1."""
    rows = normalize_table(table)
    if len(rows) < 3:
        return []

    mcat_labels: list[str] = []
    header_row_idx: int | None = None
    for i, row in enumerate(rows[:6]):
        labs = [_normalize_mcat_header(c) for c in row[2:12]]
        if len([x for x in labs if x]) >= 3:
            mcat_labels = [x for x in labs if x]
            header_row_idx = i
            break
    if not mcat_labels or header_row_idx is None:
        return []

    records: list[dict] = []
    current_gpa: str | None = None
    for row in rows[header_row_idx + 1 :]:
        col0 = row[0] if row else None
        col1 = row[1] if row and len(row) > 1 else None
        gpa = _normalize_gpa_band_col0(col0)
        if gpa:
            current_gpa = gpa

        line = cell_str(col1) if col1 else ""
        if "acceptance rate" not in line.lower():
            line = cell_str(col0) if col0 else ""
        if "acceptance rate" not in line.lower() or current_gpa is None:
            continue

        rates = _acceptance_rate_floats(line)
        n = min(len(mcat_labels), len(rates))
        for j in range(n):
            r = rates[j]
            if r is None:
                continue
            records.append(
                {
                    "gpa_range": current_gpa,
                    "mcat_range": mcat_labels[j],
                    "acceptance_rate": r,
                    "source": source,
                    "year": year,
                }
            )
    return records


def parse_a23_pdf_tables(
    tables: list[list[list]],
    year: int,
    source: str,
) -> list[dict]:
    """Try simple grid layout first, then FACTS A-23 merged-cell layout."""
    records = parse_a23_tables(tables, year, source)
    if records:
        return records
    for table in tables:
        records.extend(parse_facts_a23_merged_table(table, year, source))
    return records
