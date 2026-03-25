"""
Read JSON outputs from parser/scraper scripts and insert into Supabase.

This script is the final step in the data pipeline. It reads the
structured JSON files produced by other scripts and upserts them
into the appropriate Supabase tables.
"""

import json
from pathlib import Path

# TODO: from supabase import create_client
# TODO: from dotenv import load_dotenv


def seed_schools(data: list[dict]) -> None:
    """Insert or update school records in Supabase."""
    # TODO: Implement Supabase upsert
    print(f"[STUB] Would seed {len(data)} school records")


def seed_salary_data(data: list[dict]) -> None:
    """Insert salary data records into Supabase."""
    # TODO: Implement Supabase insert
    print(f"[STUB] Would seed {len(data)} salary records")


def main():
    print("Supabase Seeder — UT Austin Premed AI Copilot")
    print("=" * 50)

    output_dir = Path(__file__).parent / "output"

    if not output_dir.exists():
        print("[STUB] No output directory found. Run parser scripts first.")
        return

    print("[STUB] No JSON files to seed yet. Run pipeline scripts first.")


if __name__ == "__main__":
    main()
