"""
Scrape UT Austin premed statistics from 3 public guide websites.

Sources:
  1. UT Catalyst Premed Guide  — utcatalyst.org/premedicine-guide
  2. Shemmassian UT Austin Guide — shemmassianconsulting.com/blog/ut-austin-premed
  3. TexAdmissions UT Analysis  — texadmissions.com/blog/...

No downloads needed — this script visits the websites automatically.

Run: python scrape_premed_guides.py

Output: scripts/output/salary_premed_guides.json
  (This file goes to Dev A as supplementary context for the schools table.)
"""

import sys
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).parent))
from utils import write_json

# ── Configuration ────────────────────────────────────────────────────────────

# Identify ourselves politely to the server
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; UT-Premed-Research-Bot/1.0; "
        "educational use only)"
    )
}

# Wait between requests so we don't hammer servers
DELAY_SECONDS = 2

SOURCES = [
    {
        "name": "ut_catalyst",
        "label": "UT Catalyst Premed Guide",
        "url": "https://utcatalyst.org/premedicine-guide",
    },
    {
        "name": "shemmassian_ut",
        "label": "Shemmassian UT Austin Premed Guide",
        "url": "https://www.shemmassianconsulting.com/blog/ut-austin-premed",
    },
    {
        "name": "texadmissions_ut",
        "label": "TexAdmissions UT Austin Premed Analysis",
        "url": "https://www.texadmissions.com/blog/2023/7/27/applying-for-pre-med-to-ut-austin",
    },
]


# ── Helpers ──────────────────────────────────────────────────────────────────

def fetch_page(url: str) -> BeautifulSoup | None:
    """Download a webpage and return a BeautifulSoup parser object."""
    try:
        print(f"  Fetching {url} ...")
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()  # raises if 404, 403, etc.
        return BeautifulSoup(response.text, "html.parser")
    except requests.exceptions.HTTPError as e:
        print(f"  HTTP error: {e}")
    except requests.exceptions.ConnectionError:
        print(f"  Could not connect to {url} — check your internet connection")
    except requests.exceptions.Timeout:
        print(f"  Timeout on {url}")
    return None


def extract_text_blocks(soup: BeautifulSoup) -> list[str]:
    """
    Pull all meaningful text blocks (paragraphs, list items, headings)
    from a page. We store raw text so Dev A can read through it for stats.
    """
    blocks = []
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "p", "li"]):
        text = tag.get_text(separator=" ", strip=True)
        # Skip short/empty strings and navigation/footer noise
        if len(text) > 30:
            blocks.append(text)
    return blocks


def extract_tables(soup: BeautifulSoup) -> list[dict]:
    """Pull HTML tables into a list of dicts: {headers, rows}."""
    tables = []
    for table in soup.find_all("table"):
        headers = [th.get_text(strip=True) for th in table.find_all("th")]
        rows = []
        for tr in table.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all("td")]
            if cells:
                rows.append(cells)
        if rows:
            tables.append({"headers": headers, "rows": rows})
    return tables


def scrape_source(source: dict) -> dict:
    """
    Scrape one source and return a structured record with all
    text blocks and tables from the page.
    """
    soup = fetch_page(source["url"])
    if soup is None:
        return {
            "source_name":  source["name"],
            "source_label": source["label"],
            "url":          source["url"],
            "status":       "failed",
            "text_blocks":  [],
            "tables":       [],
        }

    text_blocks = extract_text_blocks(soup)
    tables = extract_tables(soup)

    print(f"  Got {len(text_blocks)} text blocks, {len(tables)} tables")

    return {
        "source_name":  source["name"],
        "source_label": source["label"],
        "url":          source["url"],
        "status":       "ok",
        "text_blocks":  text_blocks,
        "tables":       tables,
    }


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("Premed Guide Scraper — UT Austin Premed AI Copilot")
    print("=" * 50)
    print("Scraping 3 UT Austin premed guide websites...\n")

    results = []
    for i, source in enumerate(SOURCES):
        print(f"[{i+1}/{len(SOURCES)}] {source['label']}")
        record = scrape_source(source)
        results.append(record)

        # Be polite — wait before next request
        if i < len(SOURCES) - 1:
            print(f"  Waiting {DELAY_SECONDS}s before next request...")
            time.sleep(DELAY_SECONDS)
        print()

    # Summary
    ok = sum(1 for r in results if r["status"] == "ok")
    print(f"Scraped {ok}/{len(SOURCES)} sources successfully")

    if results:
        write_json(results, "salary_premed_guides.json")
        print("\nDone! Hand scripts/output/salary_premed_guides.json to Dev A.")
        print("They'll use it to enrich the schools table with UT-specific context.")

    if ok < len(SOURCES):
        print("\nNOTE: Some sources failed. This can happen if:")
        print("  - The site blocks bots (try visiting in your browser first)")
        print("  - The URL changed (check the site and update SOURCES above)")
        print("  - You're not connected to the internet")


if __name__ == "__main__":
    main()
