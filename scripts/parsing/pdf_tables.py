"""Lightweight PDF table helpers for HPO / AAMC / AACOM parsers."""

from __future__ import annotations

import re
from pathlib import Path

import pdfplumber


def coerce_int(val: str) -> int:
    s = re.sub(r"[^\d-]", "", val or "")
    if not s or s == "-":
        return 0
    try:
        return int(s)
    except ValueError:
        return 0


def iter_page_tables(pdf_path: Path):
    """Yield (page_index, table_index, table) for every table on every page."""
    with pdfplumber.open(pdf_path) as pdf:
        for pi, page in enumerate(pdf.pages):
            tables = page.extract_tables() or []
            for ti, table in enumerate(tables):
                yield pi, ti, table


def cell_str(cell) -> str:
    if cell is None:
        return ""
    return str(cell).replace("\n", " ").strip()


def normalize_table(table: list[list]) -> list[list[str]]:
    """Convert a pdfplumber table to cleaned strings; drop fully empty rows."""
    out: list[list[str]] = []
    for row in table or []:
        cells = [cell_str(c) for c in row]
        if any(cells):
            out.append(cells)
    return out


def find_header_row(rows: list[list[str]], keywords: list[str]) -> int | None:
    """Return index of first row containing any keyword (case-insensitive)."""
    for i, row in enumerate(rows):
        joined = " ".join(row).lower()
        if any(kw.lower() in joined for kw in keywords):
            return i
    return None
