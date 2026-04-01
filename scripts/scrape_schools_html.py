"""
Scrape medical school data from HTML sources.

Sources:
  1. Shemmassian GPA/MCAT table — baseline stats for 170+ schools
  2. Inspira Advantage table — GPA/MCAT cross-reference
  3. Dell Med admissions + demographics pages

Outputs JSON files to scripts/output/ for merge_schools.py to consume.
"""

import re
import sys

import requests
from bs4 import BeautifulSoup

from utils import normalize_school_name, validate_gpa, validate_mcat, write_json

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_soup(url: str) -> BeautifulSoup:
    """Fetch a URL and return a BeautifulSoup object."""
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def _parse_number(text: str) -> float | int | None:
    """Extract a number from text like '3.78', '517', '3.2%'."""
    if not text:
        return None
    cleaned = text.strip().replace(",", "").replace("%", "")
    try:
        if "." in cleaned:
            return float(cleaned)
        return int(cleaned)
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Source 1: Shemmassian GPA/MCAT table
# ---------------------------------------------------------------------------

def scrape_shemmassian() -> list[dict]:
    """Scrape the Shemmassian average GPA/MCAT table for every medical school.

    Returns a list of school dicts with: name, median_gpa, median_mcat, type.
    """
    url = "https://www.shemmassianconsulting.com/blog/average-gpa-and-mcat-score-for-every-medical-school"
    print(f"Scraping Shemmassian: {url}")
    soup = _get_soup(url)

    schools = []
    tables = soup.find_all("table")
    if not tables:
        print("  WARNING: No tables found on Shemmassian page")
        return schools

    for table in tables:
        rows = table.find_all("tr")
        for row in rows[1:]:  # skip header
            cells = row.find_all(["td", "th"])
            if len(cells) < 3:
                continue

            name_raw = cells[0].get_text(strip=True)
            if not name_raw or name_raw.lower() in ("school", "medical school", "name"):
                continue

            gpa_text = cells[1].get_text(strip=True) if len(cells) > 1 else ""
            mcat_text = cells[2].get_text(strip=True) if len(cells) > 2 else ""

            gpa = validate_gpa(_parse_number(gpa_text))
            mcat = validate_mcat(_parse_number(mcat_text))

            # Determine MD vs DO from name
            name_lower = name_raw.lower()
            school_type = "DO" if any(kw in name_lower for kw in ("osteopathic", "d.o.", " do ")) else "MD"

            name = normalize_school_name(name_raw)
            schools.append({
                "name": name,
                "median_gpa": gpa,
                "median_mcat": mcat,
                "type": school_type,
                "_source": "shemmassian",
            })

    print(f"  Found {len(schools)} schools from Shemmassian")
    return schools


# ---------------------------------------------------------------------------
# Source 2: Inspira Advantage GPA/MCAT table
# ---------------------------------------------------------------------------

def scrape_inspira() -> list[dict]:
    """Scrape the Inspira Advantage GPA/MCAT table.

    Returns a list of school dicts with: name, median_gpa, median_mcat.
    """
    url = "https://www.inspiraadvantage.com/blog/gpa-and-mcat-scores-for-all-medical-schools"
    print(f"Scraping Inspira: {url}")
    soup = _get_soup(url)

    schools = []
    tables = soup.find_all("table")
    if not tables:
        print("  WARNING: No tables found on Inspira page")
        return schools

    for table in tables:
        rows = table.find_all("tr")
        for row in rows[1:]:
            cells = row.find_all(["td", "th"])
            if len(cells) < 3:
                continue

            name_raw = cells[0].get_text(strip=True)
            if not name_raw or name_raw.lower() in ("school", "medical school", "name"):
                continue

            gpa_text = cells[1].get_text(strip=True) if len(cells) > 1 else ""
            mcat_text = cells[2].get_text(strip=True) if len(cells) > 2 else ""

            gpa = validate_gpa(_parse_number(gpa_text))
            mcat = validate_mcat(_parse_number(mcat_text))

            name = normalize_school_name(name_raw)

            # Determine MD vs DO from name
            name_lower = name_raw.lower()
            school_type = "DO" if any(kw in name_lower for kw in ("osteopathic", "d.o.", " do ")) else "MD"

            schools.append({
                "name": name,
                "median_gpa": gpa,
                "median_mcat": mcat,
                "type": school_type,
                "_source": "inspira",
            })

    print(f"  Found {len(schools)} schools from Inspira")
    return schools


# ---------------------------------------------------------------------------
# Source 3: Dell Med admissions + demographics
# ---------------------------------------------------------------------------

def scrape_dell_med() -> list[dict]:
    """Scrape Dell Medical School admissions criteria and demographics.

    Returns a single-element list with Dell Med's detailed profile.
    """
    admissions_url = "https://dellmed.utexas.edu/education/how-to-apply/admissions-criteria"
    demographics_url = "https://dellmed.utexas.edu/education/degrees-and-programs/md-program/student-demographics"

    print(f"Scraping Dell Med Admissions: {admissions_url}")
    print(f"Scraping Dell Med Demographics: {demographics_url}")

    school = {
        "name": "Dell Medical School",
        "type": "MD",
        "system": "TMDSAS",
        "state": "TX",
        "website_url": "https://dellmed.utexas.edu",
        "_source": "dellmed",
    }

    # --- Admissions page ---
    try:
        soup = _get_soup(admissions_url)
        text = soup.get_text(" ", strip=True).lower()

        # Look for prereqs in page text
        prereqs = {}
        prereq_keywords = [
            "biology", "biochemistry", "chemistry", "organic chemistry",
            "physics", "math", "statistics", "english", "psychology", "sociology",
        ]
        for kw in prereq_keywords:
            if kw in text:
                prereqs[kw] = True
        if prereqs:
            school["prereqs"] = prereqs

        # Look for GPA/MCAT in text
        gpa_match = re.search(r"gpa[:\s]*(\d\.\d{1,2})", text)
        if gpa_match:
            school["median_gpa"] = validate_gpa(float(gpa_match.group(1)))

        mcat_match = re.search(r"mcat[:\s]*(\d{3})", text)
        if mcat_match:
            school["median_mcat"] = validate_mcat(int(mcat_match.group(1)))

    except requests.RequestException as e:
        print(f"  WARNING: Failed to scrape Dell Med admissions: {e}")

    # --- Demographics page ---
    try:
        soup = _get_soup(demographics_url)
        text = soup.get_text(" ", strip=True).lower()

        # Try to find class size
        class_match = re.search(r"class\s*size[:\s]*(\d+)", text)
        if class_match:
            school["class_size"] = int(class_match.group(1))

        # Try to find in-state percentage
        instate_match = re.search(r"texas[:\s]*(\d+\.?\d*)%", text)
        if instate_match:
            school["in_state_bias"] = float(instate_match.group(1))

    except requests.RequestException as e:
        print(f"  WARNING: Failed to scrape Dell Med demographics: {e}")

    print(f"  Extracted Dell Med profile: {list(school.keys())}")
    return [school]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("School HTML Scraper — Dev A (Schools Master)")
    print("=" * 60)

    all_results = {
        "shemmassian": scrape_shemmassian,
        "inspira": scrape_inspira,
        "dellmed": scrape_dell_med,
    }

    for source_name, scrape_fn in all_results.items():
        try:
            data = scrape_fn()
            if data:
                write_json(data, f"schools_{source_name}.json")
            else:
                print(f"  WARNING: No data from {source_name}")
        except Exception as e:
            print(f"  ERROR scraping {source_name}: {e}")

    print("\nDone. Check scripts/output/ for JSON files.")


if __name__ == "__main__":
    main()
