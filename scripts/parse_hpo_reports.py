#!/usr/bin/env python3
"""
Parse UT HPO TMDSAS / AMCAS / AACOMAS PDF reports into ut_outcomes JSON.

Place PDFs under scripts/data/hpo/ or pass explicit paths. Table layout varies
by report year; this script uses header detection and best-effort row mapping.
Refine column keywords if a new PDF layout returns zero rows.

Output: scripts/output/ut_outcomes_hpo.json (merged from all inputs).
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from parsing.pdf_tables import cell_str, coerce_int, iter_page_tables, normalize_table

from utils import normalize_school_name, write_json

_SCRIPTS = Path(__file__).resolve().parent
_DEFAULT_DATA = _SCRIPTS / "data" / "hpo"

# Heuristic: drop prose / junk rows from HPO PDF table extraction.
_SCHOOLISH = re.compile(
    r"medical|medicine|school|college|university|health|center|centre|institute|"
    r"branch|som\b|com\b|osteopathic|allopathic",
    re.I,
)


def _row_looks_like_school(name: str) -> bool:
    return bool(_SCHOOLISH.search(name))


def _keep_hpo_record(rec: dict) -> bool:
    name = (rec.get("school_name") or "").strip()
    if len(name) < 5 or len(name) > 85:
        return False
    if not re.search(r"[A-Za-z]", name):
        return False
    lower = name.lower()
    bad_openers = (
        "according ",
        "data overview",
        "figure ",
        "table ",
        "note:",
        "source:",
        "http",
        "www.",
        "tmdsas data",
        "students who",
        "percentage",
        "average ",
    )
    if any(lower.startswith(p) or p in lower[:40] for p in bad_openers):
        return False
    if name.isdigit() or re.fullmatch(r"[\d,\s]+", name):
        return False
    if len(name.split()) > 14:
        return False
    apps = int(rec.get("applicants") or 0)
    mats = int(rec.get("matriculants") or 0)
    if apps + mats == 0:
        return False
    return True


def _find_col(headers: list[str], options: list[list[str]]) -> int | None:
    lowered = [h.lower() for h in headers]
    for i, h in enumerate(lowered):
        for group in options:
            if any(kw in h for kw in group):
                return i
    return None


def _looks_like_matriculated_school_table(rows: list[list[str]]) -> bool:
    sample = " ".join(" ".join(r) for r in rows[:4]).lower()
    return (
        "total # students matriculated" in sample
        or ("school" in sample and "matriculated" in sample)
    )


def _extract_school_matriculated_records(
    rows: list[list[str]],
    report_year: int,
    application_system: str,
) -> list[dict]:
    records: list[dict] = []
    pending_school: str | None = None

    for row in rows:
        cleaned = [cell_str(c) for c in row]
        if not any(cleaned):
            continue

        # Last numeric-looking cell is typically matriculant count.
        count_idx: int | None = None
        count_val = 0
        for i in range(len(cleaned) - 1, -1, -1):
            if re.fullmatch(r"\d{1,4}", cleaned[i] or ""):
                count_idx = i
                count_val = int(cleaned[i])
                break

        # Candidate name: longest textual cell (excluding obvious headers/noise).
        candidate = ""
        for i, cell in enumerate(cleaned):
            if count_idx is not None and i == count_idx:
                continue
            low = cell.lower().strip()
            if not cell or low in {"school name", "applied", "matriculated"}:
                continue
            if "detalucirtam" in low or "ot detalucirtam loohcs" in low:
                continue
            if len(cell) > len(candidate):
                candidate = cell

        if not candidate and count_idx is None:
            continue

        # Continuation lines in these PDFs often wrap long school names onto next row.
        if candidate and count_idx is None:
            if pending_school:
                pending_school = f"{pending_school} {candidate}".strip()
            else:
                pending_school = candidate
            continue

        if not candidate and count_idx is not None:
            # Count without text belongs to previous wrapped school line.
            candidate = pending_school or ""

        if pending_school and candidate and pending_school not in candidate:
            candidate = f"{pending_school} {candidate}".strip()
        pending_school = None

        school = re.sub(r"\s+", " ", candidate).strip(" -")
        school = re.sub(r"^Total # Students(?: Matriculated)?\s*", "", school, flags=re.I)
        school = re.sub(r"^School Matriculated to vs Overall GPA Continued\s*", "", school, flags=re.I)
        if not school or len(school) < 5:
            continue
        if school.lower().startswith(("table ", "page ", "continued")):
            continue
        if any(
            x in school.lower()
            for x in ("data overview", "according to the data", "overall gpa analysis")
        ):
            continue
        if count_val <= 0:
            continue

        records.append(
            {
                "report_year": report_year,
                "application_system": application_system,
                "school_name": school,
                "gpa_band": None,
                "mcat_band": None,
                "applicants": 0,
                "matriculants": count_val,
                "major": None,
            }
        )
    return records


def _table_to_records(
    table: list[list[str]],
    report_year: int,
    application_system: str,
) -> list[dict]:
    rows = normalize_table(table)
    if len(rows) < 2:
        return []
    if _looks_like_matriculated_school_table(rows):
        return _extract_school_matriculated_records(rows, report_year, application_system)

    header_idx = 0
    headers = [cell_str(c).strip() for c in rows[header_idx]]
    # If first row doesn't look like headers, try next
    if not any("school" in h.lower() or "institution" in h.lower() for h in headers if h):
        if len(rows) > 1:
            header_idx = 1
            headers = [cell_str(c).strip() for c in rows[header_idx]]

    i_school = _find_col(
        headers,
        [
            ["school", "institution", "medical", "program"],
            ["college", "university"],
        ],
    )
    if i_school is None:
        i_school = 0

    i_app = _find_col(headers, [["applicant", "applied", "# app"]])
    i_mat = _find_col(headers, [["matriculant", "matric", "accepted", "enrolled"]])
    i_gpa = _find_col(headers, [["gpa", "science gpa", "cumulative"]])
    i_mcat = _find_col(headers, [["mcat", "total mcat"]])
    i_major = _find_col(headers, [["major", "discipline", "department"]])

    records: list[dict] = []
    for row in rows[header_idx + 1 :]:
        if i_school >= len(row):
            continue
        school_name = cell_str(row[i_school])
        if not school_name or len(school_name) < 3:
            continue
        # Skip section titles / totals rows that are not school names
        lower = school_name.lower()
        if lower.startswith("table ") or "total" == lower or "note" in lower[:20]:
            continue

        gpa_band = cell_str(row[i_gpa]) if i_gpa is not None and i_gpa < len(row) else None
        mcat_band = cell_str(row[i_mcat]) if i_mcat is not None and i_mcat < len(row) else None
        major = cell_str(row[i_major]) if i_major is not None and i_major < len(row) else None
        if major == "":
            major = None

        applicants = coerce_int(row[i_app]) if i_app is not None and i_app < len(row) else 0
        matriculants = coerce_int(row[i_mat]) if i_mat is not None and i_mat < len(row) else 0

        records.append(
            {
                "report_year": report_year,
                "application_system": application_system,
                "school_name": school_name,
                "gpa_band": gpa_band or None,
                "mcat_band": mcat_band or None,
                "applicants": applicants,
                "matriculants": matriculants,
                "major": major,
            }
        )
    return records


def parse_hpo_pdf(
    pdf_path: Path,
    report_year: int,
    application_system: str,
) -> list[dict]:
    out: list[dict] = []
    for _, _, raw in iter_page_tables(pdf_path):
        out.extend(_table_to_records(raw, report_year, application_system))
    return out


def _infer_meta(stem: str) -> tuple[int | None, str | None]:
    """Infer (year, system) from filename like tmdsas_2023.pdf."""
    lower = stem.lower()
    system = None
    if "tmdsas" in lower:
        system = "TMDSAS"
    elif "amcas" in lower:
        system = "AMCAS"
    elif "aacom" in lower or "aacomas" in lower:
        system = "AACOMAS"

    year_match = re.search(r"(20\d{2})", stem)
    year = int(year_match.group(1)) if year_match else None
    return year, system


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse UT HPO PDFs → ut_outcomes JSON")
    parser.add_argument(
        "pdfs",
        nargs="*",
        type=Path,
        help="PDF paths (default: all PDFs under scripts/data/hpo/)",
    )
    parser.add_argument("--year", type=int, help="Override report year for all PDFs")
    parser.add_argument(
        "--system",
        choices=("TMDSAS", "AMCAS", "AACOMAS"),
        help="Override application system for all PDFs",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="ut_outcomes_hpo.json",
        help="Output filename under scripts/output/",
    )
    args = parser.parse_args()

    pdf_paths = args.pdfs
    if not pdf_paths:
        _DEFAULT_DATA.mkdir(parents=True, exist_ok=True)
        pdf_paths = sorted(_DEFAULT_DATA.glob("*.pdf"))

    if not pdf_paths:
        print(f"No PDFs found. Add files to {_DEFAULT_DATA} or pass paths as arguments.")
        write_json([], args.output)
        return

    merged: list[dict] = []
    for pdf_path in pdf_paths:
        pdf_path = pdf_path.resolve()
        y, s = _infer_meta(pdf_path.stem)
        year = args.year or y
        system = args.system or s
        if not year or not system:
            print(
                f"Skip {pdf_path.name}: could not infer year/system. "
                "Use --year and --system or rename file (e.g. tmdsas_2023.pdf)."
            )
            continue
        rows = parse_hpo_pdf(pdf_path, year, system)
        kept = []
        for r in rows:
            if not _keep_hpo_record(r):
                continue
            r = dict(r)
            r["school_name"] = normalize_school_name(r["school_name"])
            kept.append(r)
        print(f"{pdf_path.name}: extracted {len(rows)} rows, kept {len(kept)} after filter")
        merged.extend(kept)

    path = write_json(merged, args.output)
    print(f"Wrote {len(merged)} total records to {path}")


if __name__ == "__main__":
    main()
