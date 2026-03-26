"""
Shared utilities for the UT Austin Premed AI Copilot data pipeline.

All scraper and seeder scripts should import from this module for
consistent Supabase access, JSON I/O, and data validation.
"""

import json
import os
from pathlib import Path

from school_name_map import normalize as _normalize_school

# Resolve paths relative to this file
_SCRIPTS_DIR = Path(__file__).parent
_OUTPUT_DIR = _SCRIPTS_DIR / "output"


# ---------------------------------------------------------------------------
# Supabase client
# ---------------------------------------------------------------------------

def get_supabase_client():
    """Load environment variables and return an authenticated Supabase client.

    Requires `supabase` and `python-dotenv` packages:
        pip install -r requirements.txt
    """
    from dotenv import load_dotenv
    from supabase import create_client

    # Look for .env.local in the project root (one level up from scripts/)
    env_path = _SCRIPTS_DIR.parent / ".env.local"
    load_dotenv(env_path)

    url = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


# ---------------------------------------------------------------------------
# JSON I/O
# ---------------------------------------------------------------------------

def write_json(data: list[dict], filename: str) -> Path:
    """Write a list of dicts to scripts/output/{filename} as formatted JSON.

    Creates the output directory if it doesn't exist.
    Returns the path to the written file.
    """
    _OUTPUT_DIR.mkdir(exist_ok=True)
    path = _OUTPUT_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Wrote {len(data)} records to {path}")
    return path


def read_json(filename: str) -> list[dict]:
    """Read a JSON array from scripts/output/{filename}."""
    path = _OUTPUT_DIR / filename
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------

def validate_gpa(val) -> float | None:
    """Return a float if val is a valid GPA (0.00–4.00), else None."""
    try:
        gpa = float(val)
        return gpa if 0.0 <= gpa <= 4.0 else None
    except (TypeError, ValueError):
        return None


def validate_mcat(val) -> int | None:
    """Return an int if val is a valid MCAT score (472–528), else None."""
    try:
        score = int(val)
        return score if 472 <= score <= 528 else None
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------------
# School name normalization (re-export)
# ---------------------------------------------------------------------------

def normalize_school_name(raw: str) -> str:
    """Normalize a school name to its canonical form.

    Delegates to school_name_map.normalize().
    """
    return _normalize_school(raw)
