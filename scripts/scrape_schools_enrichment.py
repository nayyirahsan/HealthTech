"""
Scrape school enrichment data from secondary sources.

Sources:
  1. MedEdits school stats table — GPA, MCAT, state, degree for ~213 schools
  2. MedEdits TX guide — 16 TX schools with acceptance rate, in-state bias, tuition
  3. CollegeTuitionCompare — tuition, acceptance rate, class size for 163 MD schools

Outputs JSON files to scripts/output/ for merge_schools.py to consume.

Usage:
    python scrape_schools_enrichment.py
    python scrape_schools_enrichment.py mededits       # MedEdits only
    python scrape_schools_enrichment.py mededits_tx    # MedEdits TX only
    python scrape_schools_enrichment.py tuition        # CollegeTuitionCompare only
"""

import re
import sys
import time

import requests
from bs4 import BeautifulSoup

from utils import normalize_school_name, validate_gpa, validate_mcat, write_json

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


def _get_soup(url: str) -> BeautifulSoup:
    """Fetch a URL and return a BeautifulSoup object."""
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def _parse_number(text: str) -> float | int | None:
    """Extract a number from text like '3.78', '517', '$23,409', '3.2%'."""
    if not text:
        return None
    cleaned = text.strip().replace(",", "").replace("%", "").replace("$", "")
    try:
        if "." in cleaned:
            return float(cleaned)
        return int(cleaned)
    except ValueError:
        return None


def _parse_dollar(text: str) -> int | None:
    """Extract a dollar amount as an integer."""
    if not text:
        return None
    cleaned = text.strip().replace(",", "").replace("$", "").replace(" ", "")
    try:
        return int(float(cleaned))
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Source 1: MedEdits school statistics table
# ---------------------------------------------------------------------------

def scrape_mededits_stats() -> list[dict]:
    """Scrape the MedEdits medical school statistics table.

    Returns ~213 schools with: name, state, median_gpa, median_mcat, type.
    """
    url = "https://mededits.com/medical-school-admissions/statistics"
    print(f"Scraping MedEdits stats: {url}")
    soup = _get_soup(url)

    schools = []
    tables = soup.find_all("table")
    if not tables:
        print("  WARNING: No tables found on MedEdits stats page")
        return schools

    for table in tables:
        rows = table.find_all("tr")
        for row in rows[1:]:  # skip header
            cells = row.find_all(["td", "th"])
            if len(cells) < 4:
                continue

            name_raw = cells[0].get_text(strip=True)
            if not name_raw or name_raw.lower() in ("school", "medical school", "name"):
                continue

            state = cells[1].get_text(strip=True) if len(cells) > 1 else None
            gpa_text = cells[2].get_text(strip=True) if len(cells) > 2 else ""
            mcat_text = cells[3].get_text(strip=True) if len(cells) > 3 else ""
            degree = cells[4].get_text(strip=True) if len(cells) > 4 else ""

            gpa = validate_gpa(_parse_number(gpa_text))
            mcat = validate_mcat(_parse_number(mcat_text))

            # Determine type from degree column
            school_type = None
            if degree:
                degree_upper = degree.upper().strip()
                if degree_upper in ("DO", "D.O.", "D.O"):
                    school_type = "DO"
                elif degree_upper in ("MD", "M.D.", "M.D"):
                    school_type = "MD"

            # Fallback: infer from name
            if not school_type:
                name_lower = name_raw.lower()
                school_type = "DO" if any(kw in name_lower for kw in ("osteopathic", "d.o.")) else "MD"

            # Validate state abbreviation (2 uppercase letters)
            if state and (len(state) != 2 or not state.isalpha()):
                state = None
            elif state:
                state = state.upper()

            name = normalize_school_name(name_raw)
            schools.append({
                "name": name,
                "state": state,
                "median_gpa": gpa,
                "median_mcat": mcat,
                "type": school_type,
                "_source": "mededits",
            })

    print(f"  Found {len(schools)} schools from MedEdits stats")
    return schools


# ---------------------------------------------------------------------------
# Source 2: MedEdits Texas medical schools guide
# ---------------------------------------------------------------------------

def scrape_mededits_tx() -> list[dict]:
    """Scrape the MedEdits Texas medical schools guide.

    Extracts acceptance rate, in-state bias, tuition for ~16 TX schools.
    Page uses bold school names as section headers followed by label/value pairs.
    """
    url = "https://mededits.com/medical-school-admissions/schools-by-state/texas"
    print(f"Scraping MedEdits TX: {url}")
    soup = _get_soup(url)

    schools = []

    # Find bold/strong elements that look like school names
    # The page uses <strong> or <b> tags for school name headings
    bold_elements = soup.find_all(["strong", "b"])

    # School name keywords to identify headers
    school_keywords = [
        "college of medicine", "medical school", "school of medicine",
        "medical branch", "medical center", "dell medical",
    ]

    school_headers = []
    for el in bold_elements:
        text = el.get_text(strip=True)
        if not text or len(text) < 10 or len(text) > 150:
            continue
        if any(kw in text.lower() for kw in school_keywords):
            school_headers.append(el)

    for header_el in school_headers:
        name_raw = header_el.get_text(strip=True)
        school = {
            "name": normalize_school_name(name_raw),
            "type": "MD",
            "state": "TX",
            "_source": "mededits_tx",
        }

        # Collect text from siblings/following elements until next school header
        context_text = ""
        el = header_el.parent
        for _ in range(30):  # look at up to 30 following elements
            el = el.find_next_sibling() if el else None
            if not el:
                break
            t = el.get_text(" ", strip=True)
            # Stop if we hit another school header
            bold = el.find(["strong", "b"])
            if bold and any(kw in bold.get_text(strip=True).lower() for kw in school_keywords):
                break
            context_text += " " + t

        ctx = context_text.lower()

        # Acceptance rate
        acc = re.search(r"acceptance\s*rate[:\s]*(\d+\.?\d*)\s*%", ctx)
        if acc:
            school["acceptance_rate"] = float(acc.group(1))

        # In-state percentage (from "percent of entering class in-state" or "in-state" + %)
        isp = re.search(r"(?:class\s+in[- ]?state|in[- ]?state)[:\s]*(\d+\.?\d*)\s*%", ctx)
        if isp:
            school["in_state_bias"] = float(isp.group(1))

        # Tuition - look for dollar amounts near "in-state" and "out-of-state"
        tuition_is = re.search(r"\$([\d,]+)\s*\(in[- ]?state\)", ctx)
        if tuition_is:
            val = _parse_dollar(tuition_is.group(1))
            if val and val > 1000:
                school["tuition_in_state"] = val

        tuition_oos = re.search(r"\$([\d,]+)\s*\(out[- ]?of[- ]?state\)", ctx)
        if tuition_oos:
            val = _parse_dollar(tuition_oos.group(1))
            if val and val > 1000:
                school["tuition_oos"] = val

        # GPA
        gpa = re.search(r"(?:average\s+)?gpa[:\s]*(\d\.\d{1,2})", ctx)
        if gpa:
            school["median_gpa"] = validate_gpa(float(gpa.group(1)))

        # MCAT
        mcat = re.search(r"(?:average\s+)?mcat[:\s]*(\d{3})", ctx)
        if mcat:
            school["median_mcat"] = validate_mcat(int(mcat.group(1)))

        # Only add if we extracted at least one data field beyond name/type/state
        data_fields = [k for k in school if k not in ("name", "type", "state", "_source")]
        if data_fields:
            schools.append(school)

    print(f"  Found {len(schools)} TX schools from MedEdits")
    return schools


# ---------------------------------------------------------------------------
# Source 3: CollegeTuitionCompare individual school pages
# ---------------------------------------------------------------------------

# Full list of school slugs from sitemap
CTC_SLUGS = [
    "university-of-alabama-school-of-medicine",
    "university-of-south-alabama-college-of-medicine",
    "mayo-clinic-alix-school-of-medicine",
    "university-of-arizona-college-of-medicine-tucson",
    "the-university-of-arizona-college-of-medicine-phoenix",
    "uarms-college-of-medicine",
    "california-northstate-university-college-of-medicine",
    "california-university-of-science-and-medicine",
    "charles-r-drew-university-of-medicine-and-science",
    "kaiser-permanente-school-of-medicine",
    "keck-school-of-medicine-of-university-of-southern-california",
    "loma-linda-university-school-of-medicine",
    "stanford-university-school-of-medicine",
    "university-of-california-davis-school-of-medicine",
    "university-of-california-irvine-school-of-medicine",
    "david-geffen-school-of-medicine-at-ucla",
    "university-of-california-riverside-school-of-medicine",
    "university-of-california-san-diego-school-of-medicine",
    "ucsf-school-of-medicine",
    "university-of-colorado-school-of-medicine",
    "frank-h-netter-md-school-of-medicine-at-quinnipiac-university",
    "university-of-connecticut-school-of-medicine",
    "yale-school-of-medicine",
    "george-washington-university-medical-school",
    "georgetown-university-school-of-medicine",
    "howard-university-college-of-medicine",
    "florida-atlantic-university-charles-e-schmidt-college-of-medicine",
    "florida-international-university-herbert-wertheim-college-of-medicine",
    "florida-state-university-college-of-medicine",
    "nova-southeastern-university-dr-kiran-c-patel-college-of-allopathic-medicine",
    "university-of-central-florida-college-of-medicine",
    "university-of-florida-college-of-medicine",
    "university-of-miami-leonard-m-miller-school-of-medicine",
    "university-of-south-florida-college-of-medicine",
    "emory-university-school-of-medicine",
    "medical-college-of-georgia-at-augusta-university",
    "mercer-university-school-of-medicine",
    "morehouse-school-of-medicine",
    "university-of-hawaii-at-manoa-john-a-burns-school-of-medicine",
    "university-of-illinois-at-urbana-champaign-carle-illinois-college-of-medicine",
    "loyola-university-chicago-stritch-school-of-medicine",
    "northwestern-university-feinberg-school-of-medicine",
    "chicago-medical-school-of-rosalind-franklin-university-of-medicine-and-science",
    "rush-medical-college",
    "southern-illinois-university-school-of-medicine",
    "university-of-chicago-pritzker-school-of-medicine",
    "university-of-illinois-college-of-medicine",
    "indiana-university-school-of-medicine-evansville",
    "indiana-university-school-of-medicine",
    "university-of-iowa-roy-j-and-lucille-a-carver-college-of-medicine",
    "university-of-kansas-school-of-medicine",
    "university-of-kentucky-college-of-medicine",
    "university-of-louisville-school-of-medicine",
    "louisiana-state-university-school-of-medicine-in-new-orleans",
    "louisiana-state-university-school-of-medicine-in-shreveport",
    "tulane-university-school-of-medicine",
    "johns-hopkins-university-school-of-medicine",
    "uniformed-services-university-of-the-health-sciences-f-edward-hebert-school-of-medicine",
    "university-of-maryland-school-of-medicine",
    "boston-university-school-of-medicine",
    "harvard-medical-school",
    "tufts-university-school-of-medicine",
    "university-of-massachusetts-medical-school",
    "central-michigan-university-college-of-medicine",
    "michigan-state-university-college-of-human-medicine",
    "university-of-michigan-medical-school",
    "oakland-university-william-beaumont-school-of-medicine",
    "wayne-state-university-school-of-medicine",
    "western-michigan-university-homer-stryker-md-school-of-medicine",
    "university-of-minnesota-medical-school",
    "university-of-mississippi-school-of-medicine",
    "saint-louis-university-school-of-medicine",
    "university-of-missouri-columbia-school-of-medicine",
    "university-of-missouri-kansas-city-school-of-medicine",
    "washington-university-school-of-medicine",
    "creighton-university-school-of-medicine",
    "university-of-nebraska-college-of-medicine",
    "university-of-nevada-las-vegas-school-of-medicine",
    "university-of-nevada-reno-school-of-medicine",
    "dartmouth-college-geisel-school-of-medicine",
    "cooper-medical-school-of-rowan-university",
    "hackensack-meridian-school-of-medicine",
    "rutgers-new-jersey-medical-school",
    "rutgers-robert-wood-johnson-medical-school",
    "university-of-new-mexico-school-of-medicine",
    "albany-medical-college",
    "albert-einstein-college-of-medicine",
    "columbia-university-roy-and-diana-vagelos-college-of-physicians-and-surgeons",
    "cuny-school-of-medicine",
    "donald-and-barbara-school-of-medicine-at-hofstra-northwell",
    "icahn-school-of-medicine-at-mount-sinai",
    "new-york-medical-college",
    "new-york-university-school-of-medicine",
    "new-york-university-long-island-school-of-medicine",
    "stony-brook-university-school-of-medicine",
    "state-university-of-new-york-upstate-medical-university",
    "state-university-of-new-york-downstate-medical-center-college-of-medicine",
    "jacobs-school-of-medicine-and-biomedical-sciences-university-at-buffalo",
    "university-of-rochester-school-of-medicine-and-dentistry",
    "weill-cornell-medical-college",
    "the-brody-school-of-medicine-at-east-carolina-university",
    "duke-university-school-of-medicine",
    "university-of-north-carolina-school-of-medicine",
    "wake-forest-school-of-medicine",
    "university-of-north-dakota-school-of-medicine-and-health-sciences",
    "boonshoft-school-of-medicine-at-wright-state-university",
    "case-western-reserve-university-school-of-medicine",
    "cleveland-clinic-lerner-college-of-medicine",
    "northeast-ohio-medical-university-college-of-medicine",
    "the-ohio-state-university-college-of-medicine",
    "university-of-cincinnati-college-of-medicine",
    "university-of-toledo-college-of-medicine-and-life-sciences",
    "university-of-oklahoma-college-of-medicine",
    "university-of-oklahoma-school-of-community-medicine",
    "oregon-health-and-science-university-school-of-medicine",
    "geisinger-commonwealth-school-of-medicine",
    "drexel-university-college-of-medicine",
    "pennsylvania-state-university-college-of-medicine",
    "perelman-school-of-medicine-at-the-university-of-pennsylvania",
    "sidney-kimmel-medical-college-at-thomas-jefferson-university",
    "lewis-katz-school-of-medicine-temple-university",
    "university-of-pittsburgh-school-of-medicine",
    "universidad-central-del-caribe-school-of-medicine",
    "ponce-school-of-medicine",
    "san-juan-bautista-school-of-medicine",
    "university-of-puerto-rico-school-of-medicine",
    "alpert-medical-school-at-brown-university",
    "medical-university-of-south-carolina-college-of-medicine",
    "university-of-south-carolina-school-of-medicine",
    "university-of-south-carolina-school-of-medicine-greenville",
    "sanford-school-of-medicine-of-the-university-of-south-dakota",
    "east-tennessee-state-university-james-h-quillen-college-of-medicine",
    "meharry-medical-college-school-of-medicine",
    "university-of-tennessee-college-of-medicine",
    "vanderbilt-university-school-of-medicine",
    "baylor-college-of-medicine",
    "texas-a-and-m-health-science-center-college-of-medicine",
    "tcu-and-unthsc-school-of-medicine",
    "texas-tech-university-health-sciences-center-paul-l-foster-school-of-medicine",
    "texas-tech-university-health-sciences-center-school-of-medicine",
    "university-of-houston-college-of-medicine",
    "the-university-of-texas-medical-branch",
    "uthealth-john-p-and-katherine-g-mcgovern-medical-school",
    "ut-health-san-antonio-joe-r-and-teresa-lozano-long-school-of-medicine",
    "university-of-texas-rio-grande-valley-school-of-medicine",
    "university-of-texas-southwestern-medical-school-at-dallas",
    "dell-medical-school-at-the-university-of-texas-at-austin",
    "the-university-of-texas-at-tyler-school-of-medicine",
    "thomas-f-frist-jr-college-of-medicine-at-belmont-university",
    "university-of-utah-school-of-medicine",
    "university-of-vermont-college-of-medicine",
    "eastern-virginia-medical-school",
    "university-of-virginia-school-of-medicine",
    "vcu-school-of-medicine-medical-college-of-virginia-health-sciences-division",
    "virginia-tech-carilion-school-of-medicine-and-research-institute",
    "university-of-washington-school-of-medicine",
    "washington-state-university-elson-s-floyd-college-of-medicine",
    "joan-c-edwards-school-of-medicine-at-marshall-university",
    "west-virginia-university-school-of-medicine",
    "medical-college-of-wisconsin",
    "university-of-wisconsin-school-of-medicine-and-public-health",
]


def _scrape_ctc_page(slug: str) -> dict | None:
    """Scrape a single CollegeTuitionCompare school page."""
    url = f"https://www.collegetuitioncompare.com/medical-schools/{slug}/"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=20)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"    SKIP {slug}: {e}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    text = soup.get_text(" ", strip=True)
    text_lower = text.lower()

    # Extract school name from h1 or title
    h1 = soup.find("h1")
    name_raw = h1.get_text(strip=True) if h1 else slug.replace("-", " ").title()

    school = {
        "name": normalize_school_name(name_raw),
        "type": "MD",
        "_source": "tuition_compare",
    }

    # Acceptance rate
    acc_match = re.search(r"acceptance\s*rate[:\s]*(\d+\.?\d*)\s*%", text_lower)
    if acc_match:
        school["acceptance_rate"] = float(acc_match.group(1))

    # Tuition: page has table with "In-Sate" (typo) and "Out-of-State" columns.
    # Find all dollar amounts on the page and use table structure to distinguish.
    # Strategy: find tuition table rows and parse the two columns.
    tuition_tables = [t for t in soup.find_all("table") if "tuition" in t.get_text(" ", strip=True).lower()]
    for tt in tuition_tables:
        rows = tt.find_all("tr")
        for row in rows:
            cells = row.find_all(["td", "th"])
            cell_texts = [c.get_text(strip=True) for c in cells]
            # Look for a row with "Tuition" in first cell and dollar amounts
            if any("tuition" in ct.lower() for ct in cell_texts[:1]):
                dollar_vals = []
                for ct in cell_texts[1:]:
                    val = _parse_dollar(ct)
                    if val and val > 1000:
                        dollar_vals.append(val)
                if len(dollar_vals) >= 2:
                    school["tuition_in_state"] = min(dollar_vals)
                    school["tuition_oos"] = max(dollar_vals)
                elif len(dollar_vals) == 1:
                    school["tuition_oos"] = dollar_vals[0]
                break
        if "tuition_in_state" in school or "tuition_oos" in school:
            break

    # Fallback: regex on text if table parsing didn't find tuition
    if "tuition_in_state" not in school and "tuition_oos" not in school:
        toos_match = re.search(r"out[- ]?of[- ]?state[^$\d]{0,50}\$([\d,]+)", text_lower)
        if toos_match:
            val = _parse_dollar(toos_match.group(1))
            if val and val > 1000:
                school["tuition_oos"] = val

    # Class size: "Enrolled (First-year Students): 196"
    enrolled_match = re.search(r"enrolled\s*\(?first[- ]?year[^)]*\)?[:\s]*(\d{2,4})", text_lower)
    if enrolled_match:
        school["class_size"] = int(enrolled_match.group(1))
    else:
        matric_match = re.search(r"matriculat\w*[:\s]*(\d{2,4})", text_lower)
        if matric_match:
            school["class_size"] = int(matric_match.group(1))

    # GPA
    gpa_match = re.search(r"(?:average\s+)?gpa[:\s]*(\d\.\d{1,2})", text_lower)
    if gpa_match:
        school["median_gpa"] = validate_gpa(float(gpa_match.group(1)))

    # MCAT: "MCAT Scores: 509" or "MCAT Score 509.0"
    mcat_match = re.search(r"mcat\s*scores?[:\s]*(\d{3})", text_lower)
    if mcat_match:
        school["median_mcat"] = validate_mcat(int(mcat_match.group(1)))

    # In-state matriculant percentage
    ism_match = re.search(r"in[- ]?state\s*matriculant\w*[:\s]*(\d+\.?\d*)\s*%", text_lower)
    if ism_match:
        school["in_state_bias"] = float(ism_match.group(1))

    # State from location text
    state_match = re.search(r",\s*([A-Z]{2})\b", text)
    if state_match:
        school["state"] = state_match.group(1)

    return school


def scrape_college_tuition_compare() -> list[dict]:
    """Scrape all CollegeTuitionCompare school pages.

    Iterates through 163 school slugs with rate limiting.
    Returns schools with: tuition, acceptance_rate, class_size, GPA, MCAT.
    """
    print(f"Scraping CollegeTuitionCompare: {len(CTC_SLUGS)} schools")
    schools = []
    errors = 0

    for i, slug in enumerate(CTC_SLUGS):
        if i > 0 and i % 10 == 0:
            print(f"  Progress: {i}/{len(CTC_SLUGS)} ({len(schools)} scraped, {errors} errors)")
            time.sleep(1)  # rate limit

        school = _scrape_ctc_page(slug)
        if school:
            schools.append(school)
        else:
            errors += 1

        # Brief pause between requests
        time.sleep(0.5)

    print(f"  Found {len(schools)} schools from CollegeTuitionCompare ({errors} errors)")
    return schools


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 60)
    print("School Enrichment Scraper — Dev C (School Data Support)")
    print("=" * 60)

    # Determine which sources to scrape
    sources = sys.argv[1:] if len(sys.argv) > 1 else ["mededits", "mededits_tx", "tuition"]

    scrapers = {
        "mededits": ("schools_mededits.json", scrape_mededits_stats),
        "mededits_tx": ("schools_mededits_tx.json", scrape_mededits_tx),
        "tuition": ("schools_tuition_compare.json", scrape_college_tuition_compare),
    }

    for source in sources:
        if source not in scrapers:
            print(f"Unknown source: {source}")
            print(f"Available: {', '.join(scrapers.keys())}")
            continue

        filename, scrape_fn = scrapers[source]
        print(f"\n--- {source} ---")
        try:
            data = scrape_fn()
            if data:
                write_json(data, filename)
            else:
                print(f"  WARNING: No data from {source}")
        except Exception as e:
            print(f"  ERROR scraping {source}: {e}")
            import traceback
            traceback.print_exc()

    print("\nDone. Check scripts/output/ for JSON files.")


if __name__ == "__main__":
    main()
