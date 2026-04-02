#!/usr/bin/env python3
"""
Parse AAMC FACTS-style PDF tables into ut_outcomes-shaped JSON where possible.

FACTS tables are often national aggregates (not per-school HPO rows). This
script looks for applicant/matriculant columns and builds rows with
`school_name` set to a descriptive label derived from the table title row
or from `--label`.

For precise FACTS metrics you may need to tune `_table_to_records` after
inspecting `pdfplumber` output for your specific PDF year.

Output: scripts/output/ut_outcomes_facts.json
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import pdfplumber

from parsing.pdf_tables import cell_str, coerce_int, iter_page_tables, normalize_table

from utils import write_json

_SCRIPTS = Path(__file__).resolve().parent
_DEFAULT_DATA = _SCRIPTS / "data" / "facts"


def _find_col(headers: list[str], keywords: list[str]) -> int | None:
    lowered = [h.lower() for h in headers]
    for i, h in enumerate(lowered):
        for kw in keywords:
            if kw in h:
                return i
    return None


def _table_to_records(
    table: list[list[str]],
    report_year: int,
    application_system: str,
    default_label: str,
) -> list[dict]:
    rows = normalize_table(table)
    if len(rows) < 2:
        return []

    headers = [cell_str(c).strip() for c in rows[0]]
    i_app = _find_col(headers, ["applicant", "applied", "application"])
    i_mat = _find_col(headers, ["matriculant", "matric", "enrolled", "accepted"])
    if i_app is None and i_mat is None:
        return []

    title_guess = " ".join(headers[:3])[:120] or default_label
    records: list[dict] = []
    for row in rows[1:]:
        applicants = coerce_int(row[i_app]) if i_app is not None and i_app < len(row) else 0
        matriculants = coerce_int(row[i_mat]) if i_mat is not None and i_mat < len(row) else 0
        if applicants == 0 and matriculants == 0:
            continue
        records.append(
            {
                "report_year": report_year,
                "application_system": application_system,
                "school_name": title_guess,
                "gpa_band": None,
                "mcat_band": None,
                "applicants": applicants,
                "matriculants": matriculants,
                "major": None,
            }
        )
    return records


def parse_facts_pdf(
    pdf_path: Path,
    report_year: int,
    application_system: str,
    default_label: str,
) -> list[dict]:
    out_tables: list[dict] = []
    for _, _, raw in iter_page_tables(pdf_path):
        out_tables.extend(_table_to_records(raw, report_year, application_system, default_label))
    out_text = parse_facts_text_a23(pdf_path, report_year, application_system, default_label)
    # A-23 PDFs often yield sparse/incorrect table extraction; prefer richer text parse.
    if len(out_text) >= max(6, len(out_tables)):
        return out_text
    return out_tables


def _last_int_token(line: str) -> int:
    nums = re.findall(r"\d[\d,]*", line or "")
    if not nums:
        return 0
    return int(nums[-1].replace(",", ""))


def parse_facts_text_a23(
    pdf_path: Path,
    report_year: int,
    application_system: str,
    default_label: str,
) -> list[dict]:
    with pdfplumber.open(pdf_path) as pdf:
        text = "\n".join((page.extract_text() or "") for page in pdf.pages)

    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    out: list[dict] = []
    current_band: str | None = None
    in_gpa_block = False

    band_pat = re.compile(
        r"^(Greater than \d\.\d{2}|\d\.\d{2}-\d\.\d{2}|Less than \d\.\d{2}|All Applicants)\b"
    )

    for line in lines:
        if "Total GPA" in line:
            in_gpa_block = True
            continue
        if in_gpa_block and "Total MCAT Scores" in line:
            break
        if not in_gpa_block:
            continue

        m = band_pat.match(line)
        if m:
            raw = m.group(1)
            if raw.startswith("Greater than"):
                n = re.search(r"(\d\.\d{2})", raw)
                current_band = f"{float(n.group(1)) + 0.01:.2f}-4.00" if n else raw
            elif raw.startswith("Less than"):
                n = re.search(r"(\d\.\d{2})", raw)
                current_band = f"<{n.group(1)}" if n else raw
            elif raw == "All Applicants":
                current_band = "All Applicants"
            else:
                current_band = raw
            # line might also contain Acceptees/Applicants totals.

        if current_band is None:
            continue

        low = line.lower()
        if low.startswith("all applicants acceptees"):
            mats = _last_int_token(line)
            if mats > 0:
                out.append(
                    {
                        "report_year": report_year,
                        "application_system": application_system,
                        "school_name": f"{default_label} (GPA totals)",
                        "gpa_band": None,
                        "mcat_band": "All",
                        "applicants": 0,
                        "matriculants": mats,
                        "major": None,
                    }
                )
        elif low.startswith("acceptees"):
            mats = _last_int_token(line)
            if mats > 0:
                out.append(
                    {
                        "report_year": report_year,
                        "application_system": application_system,
                        "school_name": f"{default_label} (GPA totals)",
                        "gpa_band": current_band if current_band != "All Applicants" else None,
                        "mcat_band": "All",
                        "applicants": 0,
                        "matriculants": mats,
                        "major": None,
                    }
                )
        elif low.startswith("applicants"):
            apps = _last_int_token(line)
            if apps > 0:
                out.append(
                    {
                        "report_year": report_year,
                        "application_system": application_system,
                        "school_name": f"{default_label} (GPA totals)",
                        "gpa_band": current_band if current_band != "All Applicants" else None,
                        "mcat_band": "All",
                        "applicants": apps,
                        "matriculants": 0,
                        "major": None,
                    }
                )
    # Parse MCAT-band totals from "All Applicants" section near bottom.
    mcat_header: list[str] = [
        "<486",
        "486-489",
        "490-493",
        "494-497",
        "498-501",
        "502-505",
        "506-509",
        "510-513",
        "514-517",
        "518-528",
    ]
    acceptees_vals: list[int] = []
    applicants_vals: list[int] = []
    reading_mcat = False

    def _normalize_mcat_token(tok: str) -> str | None:
        t = tok.strip()
        if not t:
            return None
        if t == "<486":
            return "<486"
        if t == "518-528":
            return "518-528"
        if re.fullmatch(r"\d{3}-\d{3}", t):
            return t
        return None

    for line in lines:
        if "Less" in line and "than 486" in line and "Greater than 517" in line:
            reading_mcat = True
            tokens = line.replace("Greater than 517", "518-528").split()
            # Build canonical 10 MCAT bins.
            combined: list[str] = []
            i = 0
            while i < len(tokens):
                if i + 2 < len(tokens) and tokens[i].lower() == "less" and tokens[i + 1].lower() == "than":
                    combined.append("<486")
                    i += 3
                    continue
                if re.fullmatch(r"\d{3}-\d{3}", tokens[i]):
                    combined.append(tokens[i])
                elif tokens[i] == "518-528":
                    combined.append("518-528")
                i += 1
            parsed = [_normalize_mcat_token(x) for x in combined]
            parsed = [x for x in parsed if x]
            if len(parsed) >= 10:
                mcat_header = parsed[:10]
            continue

        if (
            not reading_mcat
            and not line.startswith("All Applicants Acceptees")
            and not (acceptees_vals and line.startswith("Applicants "))
        ):
            continue

        if line.startswith("All Applicants Acceptees"):
            nums = [int(x.replace(",", "")) for x in re.findall(r"\d[\d,]*", line)]
            if len(nums) >= 10:
                acceptees_vals = nums[:10]
            continue
        if line.startswith("Applicants "):
            nums = [int(x.replace(",", "")) for x in re.findall(r"\d[\d,]*", line)]
            if len(nums) >= 10:
                applicants_vals = nums[:10]
            continue
        if "Acceptance rate %" in line and acceptees_vals and applicants_vals:
            break

    n = min(len(mcat_header), len(acceptees_vals), len(applicants_vals))
    for i in range(n):
        out.append(
            {
                "report_year": report_year,
                "application_system": application_system,
                "school_name": f"{default_label} (MCAT totals)",
                "gpa_band": "All",
                "mcat_band": mcat_header[i],
                "applicants": applicants_vals[i],
                "matriculants": acceptees_vals[i],
                "major": None,
            }
        )

    return out
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse AAMC FACTS PDF → ut_outcomes JSON")
    parser.add_argument("pdf", type=Path, nargs="*", help="PDF paths")
    parser.add_argument("--year", type=int, required=True)
    parser.add_argument(
        "--system",
        choices=("TMDSAS", "AMCAS", "AACOMAS"),
        default="AMCAS",
    )
    parser.add_argument(
        "--label",
        default="AAMC FACTS (aggregated)",
        help="school_name when the table has no school column",
    )
    parser.add_argument("-o", "--output", default="ut_outcomes_facts.json")
    args = parser.parse_args()

    pdfs = [p.resolve() for p in args.pdf]
    if not pdfs:
        _DEFAULT_DATA.mkdir(parents=True, exist_ok=True)
        pdfs = sorted(_DEFAULT_DATA.glob("*.pdf"))

    if not pdfs:
        print(f"No PDFs. Add files to {_DEFAULT_DATA} or pass paths.")
        write_json([], args.output)
        return

    merged: list[dict] = []
    for pdf_path in pdfs:
        if not pdf_path.is_file():
            print(f"Skip missing file: {pdf_path}")
            continue
        rows = parse_facts_pdf(pdf_path, args.year, args.system, args.label)
        print(f"{pdf_path.name}: extracted {len(rows)} rows")
        merged.extend(rows)

    path = write_json(merged, args.output)
    print(f"Wrote {len(merged)} total records to {path}")


if __name__ == "__main__":
    main()
