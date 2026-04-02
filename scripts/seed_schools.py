"""
Seed the Supabase `schools` table from schools_merged.json.

Reads the merged school data, upserts to Supabase, and outputs
school_id_map.json (name → id) for Dev D to resolve FK references.

Usage:
    python seed_schools.py
"""

import sys
from pathlib import Path

from utils import get_supabase_client, read_json, write_json

# Fields that map directly to the schools table columns
DB_FIELDS = [
    "name", "type", "system", "state",
    "median_gpa", "median_mcat", "acceptance_rate", "class_size",
    "in_state_bias", "tuition_in_state", "tuition_oos", "avg_debt",
    "mission_keywords", "prereqs", "website_url",
]


def prepare_row(school: dict) -> dict | None:
    """Convert a merged school dict to a Supabase-ready row.

    Returns None if required fields are missing.
    """
    name = school.get("name")
    school_type = school.get("type")
    system = school.get("system")
    state = school.get("state")

    if not all([name, school_type, system, state]):
        print(f"  SKIP (missing required fields): {name}")
        return None

    # Validate enum values
    if school_type not in ("MD", "DO"):
        print(f"  SKIP (invalid type '{school_type}'): {name}")
        return None
    if system not in ("TMDSAS", "AMCAS", "AACOMAS"):
        print(f"  SKIP (invalid system '{system}'): {name}")
        return None

    row = {}
    for field in DB_FIELDS:
        val = school.get(field)
        # Convert empty lists/dicts to None for cleaner DB storage
        if val == [] or val == {}:
            val = None
        row[field] = val

    return row


def seed_schools():
    """Read merged JSON, upsert to Supabase, output school_id_map.json."""
    print("Loading schools_merged.json...")
    try:
        schools = read_json("schools_merged.json")
    except FileNotFoundError:
        print("ERROR: schools_merged.json not found. Run merge_schools.py first.")
        return

    print(f"Loaded {len(schools)} schools")

    # Prepare rows
    rows = []
    for school in schools:
        row = prepare_row(school)
        if row:
            rows.append(row)

    print(f"Valid rows to insert: {len(rows)}")
    if not rows:
        print("No valid rows. Check merge output.")
        return

    # Connect to Supabase
    print("Connecting to Supabase...")
    client = get_supabase_client()

    # Upsert in batches (Supabase has payload size limits)
    batch_size = 50
    inserted = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        try:
            result = (
                client.table("schools")
                .upsert(batch, on_conflict="name")
                .execute()
            )
        except Exception:
            # Fallback to insert if upsert fails (e.g., missing unique index)
            result = (
                client.table("schools")
                .insert(batch)
                .execute()
            )
        inserted += len(result.data)
        print(f"  Upserted batch {i // batch_size + 1}: {len(batch)} rows")

    print(f"\nTotal upserted: {inserted} schools")

    # Build school_id_map.json (name → id) for Dev D
    print("Building school_id_map.json...")
    all_schools = client.table("schools").select("id, name").execute()

    id_map = {}
    for row in all_schools.data:
        id_map[row["name"]] = row["id"]

    # Write as a single-object JSON (not an array) for easy lookup
    import json
    from pathlib import Path
    map_path = Path(__file__).parent / "output" / "school_id_map.json"
    map_path.parent.mkdir(exist_ok=True)
    with open(map_path, "w", encoding="utf-8") as f:
        json.dump(id_map, f, indent=2, ensure_ascii=False)
    print(f"Wrote school_id_map.json: {len(id_map)} entries")

    print("\nDone. Dev D can now use school_id_map.json for FK resolution.")


def main():
    print("=" * 60)
    print("School Seeder — Dev A (Schools Master)")
    print("=" * 60)
    print()

    seed_schools()


if __name__ == "__main__":
    main()
