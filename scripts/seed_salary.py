"""
Load salary data JSON files into the Supabase salary_data table.

Run AFTER load_bls_salary.py has produced scripts/output/salary_bls.json.

Run: python seed_salary.py

Requires a .env.local file in the project root with:
  NEXT_PUBLIC_SUPABASE_URL=...
  SUPABASE_SERVICE_ROLE_KEY=...
"""

import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

OUTPUT_DIR = Path(__file__).parent / "output"

SALARY_FILES = [
    "salary_bls.json",
]

TABLE = "salary_data"
BATCH_SIZE = 100


# ── Helpers ──────────────────────────────────────────────────────────────────

def load_env() -> tuple[str, str]:
    """Load Supabase URL and service role key from .env.local."""
    env_path = Path(__file__).parent.parent / ".env.local"
    load_dotenv(env_path)

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        print("ERROR: Missing Supabase credentials in .env.local")
        print("Make sure these two lines are in C:\\Users\\chris\\HealthTech\\.env.local:")
        print("  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co")
        print("  SUPABASE_SERVICE_ROLE_KEY=your-secret-key")
        sys.exit(1)

    return url, key


def strip_internal_keys(records: list[dict]) -> list[dict]:
    """Remove keys starting with '_' (our internal metadata) before inserting."""
    return [{k: v for k, v in r.items() if not k.startswith("_")} for r in records]


def batch_insert(url: str, key: str, table: str, records: list[dict]) -> int:
    """Insert records in batches via Supabase REST API. Returns count inserted."""
    endpoint = f"{url}/rest/v1/{table}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",  # don't return rows back, faster
    }

    inserted = 0
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        response = requests.post(endpoint, headers=headers, json=batch)

        if response.status_code in (200, 201):
            inserted += len(batch)
            print(f"  Batch {i // BATCH_SIZE + 1}: inserted {len(batch)} rows")
        else:
            print(f"  ERROR on batch {i // BATCH_SIZE + 1}: {response.status_code} {response.text[:200]}")

    return inserted


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("Salary Data Seeder — UT Austin Premed AI Copilot")
    print("=" * 50)

    # Check output files exist
    missing = [f for f in SALARY_FILES if not (OUTPUT_DIR / f).exists()]
    if missing:
        print("\nERROR: Missing output files:")
        for f in missing:
            print(f"  scripts/output/{f}")
        print("\nRun load_bls_salary.py first.")
        return

    # Load credentials
    print("\nLoading Supabase credentials...")
    url, key = load_env()
    print(f"Connecting to {url}")

    # Test connection
    test = requests.get(
        f"{url}/rest/v1/salary_data?limit=1",
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
    )
    if test.status_code == 401:
        print("ERROR: Invalid API key — check SUPABASE_SERVICE_ROLE_KEY in .env.local")
        return
    if test.status_code == 404:
        print("ERROR: salary_data table not found — run schema.sql in Supabase SQL editor first")
        return
    print("Connected!")

    # Load and seed each file
    total_inserted = 0
    for filename in SALARY_FILES:
        print(f"\nLoading {filename}...")
        path = OUTPUT_DIR / filename
        with open(path, encoding="utf-8") as f:
            records = json.load(f)
        print(f"  {len(records)} records loaded")

        if not records:
            print("  Skipping — file is empty")
            continue

        cleaned = strip_internal_keys(records)
        print(f"  Inserting into '{TABLE}' table...")
        inserted = batch_insert(url, key, TABLE, cleaned)
        total_inserted += inserted

    print(f"\n{'='*50}")
    print(f"Done! Total rows inserted: {total_inserted}")
    print("\nNext steps:")
    print("  - Give scripts/output/salary_premed_guides.json to Dev A")
    print("  - Wait for Dev A to finish seeding the schools table")
    print("  - Run scripts/validate_data.py when everyone is done")


if __name__ == "__main__":
    main()
