"""
Canonical school name mapping for the UT Austin Premed AI Copilot.

All scrapers import `normalize()` from this module to ensure consistent
school names across data sources. Add new aliases as you encounter them.
"""

# Alias → Canonical Name
# Add entries as scrapers encounter new variations.
CANONICAL_NAMES: dict[str, str] = {
    # --- Texas MD Schools (TMDSAS) ---
    "Dell Med": "Dell Medical School",
    "Dell": "Dell Medical School",
    "UT Austin Dell": "Dell Medical School",
    "Baylor": "Baylor College of Medicine",
    "BCM": "Baylor College of Medicine",
    "Baylor COM": "Baylor College of Medicine",
    "UT Southwestern": "UT Southwestern Medical Center",
    "UTSW": "UT Southwestern Medical Center",
    "UTSouthwestern": "UT Southwestern Medical Center",
    "Southwestern": "UT Southwestern Medical Center",
    "McGovern": "McGovern Medical School (UTHealth)",
    "UTHealth Houston": "McGovern Medical School (UTHealth)",
    "UTHealth": "McGovern Medical School (UTHealth)",
    "UT Houston": "McGovern Medical School (UTHealth)",
    "UTMB": "University of Texas Medical Branch",
    "UTMB Galveston": "University of Texas Medical Branch",
    "UT Medical Branch": "University of Texas Medical Branch",
    "UT San Antonio": "UT Health San Antonio Long School of Medicine",
    "UTHSA": "UT Health San Antonio Long School of Medicine",
    "Long SOM": "UT Health San Antonio Long School of Medicine",
    "UT Health San Antonio": "UT Health San Antonio Long School of Medicine",
    "Texas A&M": "Texas A&M College of Medicine",
    "TAMU": "Texas A&M College of Medicine",
    "TAMU COM": "Texas A&M College of Medicine",
    "Texas Tech": "Texas Tech University Health Sciences Center SOM",
    "TTUHSC": "Texas Tech University Health Sciences Center SOM",
    "Texas Tech El Paso": "Texas Tech University Health Sciences Center El Paso Paul L. Foster SOM",
    "TTUHSC El Paso": "Texas Tech University Health Sciences Center El Paso Paul L. Foster SOM",
    "TCU": "TCU and UNTHSC School of Medicine",
    "TCU UNTHSC": "TCU and UNTHSC School of Medicine",
    "Sam Houston": "Sam Houston State University College of Osteopathic Medicine",
    "SHSU COM": "Sam Houston State University College of Osteopathic Medicine",
    "UTRGV": "University of Texas Rio Grande Valley School of Medicine",
    "UT Rio Grande Valley": "University of Texas Rio Grande Valley School of Medicine",

    # --- Top AMCAS Schools (UT Austin grads frequently attend) ---
    "Harvard": "Harvard Medical School",
    "HMS": "Harvard Medical School",
    "Vanderbilt": "Vanderbilt University School of Medicine",
    "Stanford": "Stanford University School of Medicine",
    "Stanford Med": "Stanford University School of Medicine",
    "Dartmouth": "Geisel School of Medicine at Dartmouth",
    "Geisel": "Geisel School of Medicine at Dartmouth",
    "Johns Hopkins": "Johns Hopkins University School of Medicine",
    "JHU": "Johns Hopkins University School of Medicine",
    "Hopkins": "Johns Hopkins University School of Medicine",
    "Penn": "Perelman School of Medicine at the University of Pennsylvania",
    "UPenn": "Perelman School of Medicine at the University of Pennsylvania",
    "Perelman": "Perelman School of Medicine at the University of Pennsylvania",
    "Columbia": "Columbia University Vagelos College of Physicians and Surgeons",
    "Columbia VP&S": "Columbia University Vagelos College of Physicians and Surgeons",
    "UCSF": "University of California San Francisco School of Medicine",
    "UCLA": "David Geffen School of Medicine at UCLA",
    "Geffen": "David Geffen School of Medicine at UCLA",
    "Duke": "Duke University School of Medicine",
    "WashU": "Washington University in St. Louis School of Medicine",
    "Wash U": "Washington University in St. Louis School of Medicine",
    "WUSTL": "Washington University in St. Louis School of Medicine",
    "Mayo": "Mayo Clinic Alix School of Medicine",
    "Mayo Clinic": "Mayo Clinic Alix School of Medicine",
    "Northwestern": "Northwestern University Feinberg School of Medicine",
    "Feinberg": "Northwestern University Feinberg School of Medicine",
    "Michigan": "University of Michigan Medical School",
    "UMich": "University of Michigan Medical School",
    "Emory": "Emory University School of Medicine",
    "NYU": "NYU Grossman School of Medicine",
    "NYU Grossman": "NYU Grossman School of Medicine",
    "Mount Sinai": "Icahn School of Medicine at Mount Sinai",
    "Sinai": "Icahn School of Medicine at Mount Sinai",
    "Icahn": "Icahn School of Medicine at Mount Sinai",
    "Yale": "Yale School of Medicine",
    "Pittsburgh": "University of Pittsburgh School of Medicine",
    "Pitt": "University of Pittsburgh School of Medicine",
    "UVA": "University of Virginia School of Medicine",
    "Oklahoma": "University of Oklahoma College of Medicine",
    "OU COM": "University of Oklahoma College of Medicine",

    # --- DO Schools ---
    "TCOM": "Texas College of Osteopathic Medicine (UNTHSC)",
    "UNTHSC": "Texas College of Osteopathic Medicine (UNTHSC)",
}


def normalize(raw: str) -> str:
    """Normalize a school name to its canonical form.

    Strips whitespace, checks the alias map, and returns the canonical
    name if found — otherwise returns the cleaned original.
    """
    cleaned = raw.strip()
    return CANONICAL_NAMES.get(cleaned, cleaned)
