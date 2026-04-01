"""
Merge all school JSON sources into a single canonical schools_merged.json.

Reads JSON files from Dev A (shemmassian, inspira, dellmed, msar) and
Dev C (mededits, tuition_compare, prospective, savvypremed, mededits_tx,
aamc_tuition) and merges them with a trust-priority system.

Merge priority (higher-trust wins conflicts):
  1. MSAR (official)       — GPA, MCAT, class_size
  2. School website         — prereqs, website_url
  3. Shemmassian            — aggregated stats
  4. MedEdits               — acceptance rates, in-state bias
  5. Others                 — fill gaps only

Usage:
    python merge_schools.py
"""

import sys
from pathlib import Path

from utils import normalize_school_name, read_json, write_json

# Source files in trust-priority order (highest first).
# Each entry: (filename, trust_rank, source_key)
# Lower rank number = higher trust.
SOURCE_FILES = [
    ("schools_msar.json", 1, "msar"),
    ("schools_dellmed.json", 2, "dellmed"),
    ("schools_shemmassian.json", 3, "shemmassian"),
    ("schools_inspira.json", 4, "inspira"),
    # Dev C files
    ("schools_mededits.json", 5, "mededits"),
    ("schools_mededits_tx.json", 5, "mededits"),
    ("schools_tuition_compare.json", 6, "tuition_compare"),
    ("schools_prospective.json", 6, "prospective"),
    ("schools_savvypremed.json", 6, "savvypremed"),
    ("schools_aamc_tuition.json", 4, "aamc_tuition"),
]

# TX MD schools that participate in AMCAS (not TMDSAS-only).
# Baylor accepts both TMDSAS and AMCAS; it's the main exception.
TMDSAS_EXCEPTIONS = {
    "Baylor College of Medicine",
}

# Manual state overrides for schools whose name doesn't contain a state name.
# Keyed by canonical school name.
SCHOOL_STATE_OVERRIDES = {
    "A.T. Still University of Health Sciences Kirksville College of Osteopathic Medicine": "MO",
    "A.T. Still University School of Osteopathic Medicine Arizona (SOMA)": "AZ",
    "Boston University School of Medicine": "MA",
    "Brown University The Warren Alpert Medical School": "RI",
    "Campbell University Jerry M. Wallace School of Osteopathic Medicine": "NC",
    "Chicago College of Osteopathic Medicine of Midwestern University": "IL",
    "Chicago Medical School at Rosalind Franklin University of Medicine and Science": "IL",
    "Des Moines University College of Osteopathic Medicine": "IA",
    "Drew/UCLA Joint Medical Program Drew University of Medicine and Science": "CA",
    "Drew/UCLA Joint Medical Program Drew University of Medicine and ScienceNote: This joint Program has been discontinued. Drew now has its own MD program.": "CA",
    "Edward Via College of Osteopathic Medicine – Auburn Campus": "AL",
    "Edward Via College of Osteopathic Medicine – Carolinas Campus": "SC",
    "George Washington University School of Medicine and Health Sciences": "DC",
    "Hofstra Northwell School of Medicine": "NY",
    "Kaiser Permanente School of Medicine": "CA",
    "Kansas City University of Medicine and Biosciences College of Osteopathic Medicine": "MO",
    "Lake Erie College of Osteopathic Medicine": "PA",
    "Lake Erie College of Osteopathic Medicine Bradenton Campus": "FL",
    "Liberty University College of Osteopathic Medicine": "VA",
    "Lincoln Memorial University DeBusk College of Osteopathic Medicine": "TN",
    "Marian University College of Osteopathic Medicine": "IN",
    "Meharry Medical College School of Medicine": "TN",
    "Noorda College of Osteopathic Medicine": "UT",
    "Nova Southeastern University Dr. Kiran C. Patel College of Osteopathic Medicine": "FL",
    "Pacific Northwestern University of Health Sciences College of Osteopathic Medicine": "WA",
    "Perelman School of Medicine University of Pennsylvania": "PA",
    "Philadelphia College of Osteopathic Medicine": "PA",
    "Ponce School of Medicine and Health Sciences": "PR",
    "Quinnipiac University Frank H. Netter MD School of Medicine": "CT",
    "Rocky Vista University College of Osteopathic Medicine": "CO",
    "Rowan University School of Osteopathic Medicine": "NJ",
    "Rush Medical College of Rush University": "IL",
    "Rutgers Robert Wood Johnson Medical School": "NJ",
    "SUNY – Downstate Medical Center College of Medicine": "NY",
    "SUNY – Upstate Medical University": "NY",
    "Stony Brook University School of Medicine": "NY",
    "Temple University Lewis Katz School of Medicine": "PA",
    "The Ohio State University College of Medicine": "OH",
    "Touro College of Osteopathic Medicine - Harlem Campus": "NY",
    "Touro College of Osteopathic Medicine - Middletown Campus": "NY",
    "University at Buffalo Jacobs School of Medicine and Biomedical Sciences": "NY",
    "University of Chicago Pritzker School of Medicine": "IL",
    "University of Miami Miller School of Medicine": "FL",
    "University of New England College of Osteopathic Medicine": "ME",
    "University of Pikeville Kentucky College of Osteopathic Medicine": "KY",
    "University of the Incarnate Word School of Osteopathic Medicine": "TX",
    "Virginia Tech Carilion School of Medicine and Research Institute": "VA",
    "Wake Forest School of Medicine": "NC",
    "Washington University School of Medicine": "MO",
    "Weill Cornell Medical College": "NY",
    "Western University of Health Sciences College of Osteopathic Medicine of the Pacific": "CA",
    "Western University of Health Sciences College of Osteopathic Medicine of the Pacific Northwest": "OR",
    "William Carey University College of Osteopathic Medicine": "MS",
    "Sam Houston State University College of Osteopathic Medicine": "TX",
    "TCU and UNTHSC School of Medicine": "TX",
    "University of Houston College of Medicine": "TX",
}

# State name → abbreviation for inferring state from school name.
# Ordered longest-first to avoid partial matches (e.g., "West Virginia" before "Virginia").
_STATE_NAME_TO_ABBR = [
    ("North Carolina", "NC"), ("South Carolina", "SC"), ("North Dakota", "ND"),
    ("South Dakota", "SD"), ("West Virginia", "WV"), ("New Hampshire", "NH"),
    ("New Jersey", "NJ"), ("New Mexico", "NM"), ("New York", "NY"),
    ("Rhode Island", "RI"), ("Puerto Rico", "PR"), ("South Florida", "FL"),
    ("South Alabama", "AL"), ("East Tennessee", "TN"), ("East Carolina", "NC"),
    ("North Texas", "TX"), ("Western Michigan", "MI"),
    ("Alabama", "AL"), ("Alaska", "AK"), ("Arizona", "AZ"), ("Arkansas", "AR"),
    ("California", "CA"), ("Colorado", "CO"), ("Connecticut", "CT"),
    ("Delaware", "DE"), ("Florida", "FL"), ("Georgia", "GA"), ("Hawaii", "HI"),
    ("Idaho", "ID"), ("Illinois", "IL"), ("Indiana", "IN"), ("Iowa", "IA"),
    ("Kansas", "KS"), ("Kentucky", "KY"), ("Louisiana", "LA"), ("Maine", "ME"),
    ("Maryland", "MD"), ("Massachusetts", "MA"), ("Michigan", "MI"),
    ("Minnesota", "MN"), ("Mississippi", "MS"), ("Missouri", "MO"),
    ("Montana", "MT"), ("Nebraska", "NE"), ("Nevada", "NV"),
    ("Ohio", "OH"), ("Oklahoma", "OK"), ("Oregon", "OR"),
    ("Pennsylvania", "PA"), ("Tennessee", "TN"), ("Texas", "TX"),
    ("Utah", "UT"), ("Vermont", "VT"), ("Virginia", "VA"),
    ("Washington", "WA"), ("Wisconsin", "WI"), ("Wyoming", "WY"),
]


def _infer_state(school_name: str) -> str | None:
    """Try to extract a US state from a school's name."""
    # Check manual overrides first
    if school_name in SCHOOL_STATE_OVERRIDES:
        return SCHOOL_STATE_OVERRIDES[school_name]
    # Try to match a state name in the school name
    for state_name, abbr in _STATE_NAME_TO_ABBR:
        if state_name.lower() in school_name.lower():
            return abbr
    return None

# Fields that can be merged from any source
MERGEABLE_FIELDS = [
    "type", "system", "state", "median_gpa", "median_mcat",
    "acceptance_rate", "class_size", "in_state_bias",
    "tuition_in_state", "tuition_oos", "avg_debt",
    "mission_keywords", "prereqs", "website_url",
]


def _load_source(filename: str) -> list[dict]:
    """Try to load a JSON source file. Returns empty list if not found."""
    try:
        data = read_json(filename)
        print(f"  Loaded {len(data)} records from {filename}")
        return data
    except FileNotFoundError:
        print(f"  SKIPPED (not found): {filename}")
        return []


def merge_schools() -> list[dict]:
    """Merge all source files into a canonical school list.

    For each school, fields are filled in trust-priority order:
    higher-trust sources overwrite lower-trust values, but never
    overwrite a value with None/empty.
    """
    # school_name -> {field -> (value, trust_rank)}
    merged: dict[str, dict[str, tuple]] = {}
    # Track which sources contributed to each school
    sources_map: dict[str, set[str]] = {}

    for filename, trust_rank, source_key in SOURCE_FILES:
        records = _load_source(filename)

        for record in records:
            raw_name = record.get("name", "").strip()
            if not raw_name:
                continue

            name = normalize_school_name(raw_name)

            if name not in merged:
                merged[name] = {}
                sources_map[name] = set()

            sources_map[name].add(source_key)
            school_data = merged[name]

            for field in MERGEABLE_FIELDS:
                value = record.get(field)
                if value is None or value == "" or value == []:
                    continue

                existing = school_data.get(field)
                if existing is None:
                    # No existing value — take this one
                    school_data[field] = (value, trust_rank)
                else:
                    # Existing value — only overwrite if new source is more trusted
                    _, existing_rank = existing
                    if trust_rank < existing_rank:
                        school_data[field] = (value, trust_rank)

    # Build final output
    output = []
    for name in sorted(merged.keys()):
        school_data = merged[name]
        school = {"name": name}

        for field in MERGEABLE_FIELDS:
            entry = school_data.get(field)
            if entry is not None:
                value, _ = entry
                school[field] = value
            else:
                school[field] = None

        # Infer missing state from school name
        if not school.get("state"):
            inferred = _infer_state(name)
            if inferred:
                school["state"] = inferred

        # Infer missing system from type
        if not school.get("system") and school.get("type"):
            if school["type"] == "DO":
                school["system"] = "AACOMAS"
            elif school["type"] == "MD":
                school["system"] = "AMCAS"

        # TMDSAS override: TX MD schools use TMDSAS (except Baylor which uses both)
        if school.get("state") == "TX" and school.get("type") == "MD":
            if name not in TMDSAS_EXCEPTIONS:
                school["system"] = "TMDSAS"

        school["_sources"] = sorted(sources_map[name])
        output.append(school)

    return output


def main():
    print("=" * 60)
    print("School Merger — Dev A (Schools Master)")
    print("=" * 60)
    print()

    schools = merge_schools()

    if not schools:
        print("\nNo school data to merge. Run scraper scripts first.")
        return

    write_json(schools, "schools_merged.json")

    # Print summary stats
    has_gpa = sum(1 for s in schools if s.get("median_gpa") is not None)
    has_mcat = sum(1 for s in schools if s.get("median_mcat") is not None)
    has_rate = sum(1 for s in schools if s.get("acceptance_rate") is not None)
    types = {}
    for s in schools:
        t = s.get("type", "unknown")
        types[t] = types.get(t, 0) + 1

    print(f"\n--- Merge Summary ---")
    print(f"Total schools:        {len(schools)}")
    print(f"With GPA:             {has_gpa}")
    print(f"With MCAT:            {has_mcat}")
    print(f"With acceptance rate: {has_rate}")
    print(f"By type:              {types}")

    # Report schools still missing required fields
    missing = [s for s in schools if not all([s.get("name"), s.get("type"), s.get("system"), s.get("state")])]
    if missing:
        print(f"\nWARN: {len(missing)} schools still missing required fields:")
        for s in missing:
            gaps = [f for f in ("type", "system", "state") if not s.get(f)]
            print(f"  {s['name']} — missing: {', '.join(gaps)}")
    else:
        print(f"\nAll {len(schools)} schools have required fields (name, type, system, state)")

    # Check for potential duplicates (similar names)
    names = [s["name"] for s in schools]
    for i, n1 in enumerate(names):
        for n2 in names[i + 1:]:
            if n1.lower() == n2.lower() and n1 != n2:
                print(f"  WARN: Possible duplicate: '{n1}' vs '{n2}'")


if __name__ == "__main__":
    main()
