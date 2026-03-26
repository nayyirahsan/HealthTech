# Parallel Data Scraping Plan — 4 Developers, 30 Sources

## Context

The scaffold is complete and pushed. The team of 4 now needs to scrape 30 data sources into a shared Supabase database. The challenge: maximize parallelism while respecting foreign key dependencies (`secondary_prompts` and `interview_data` both FK to `schools.id`). Strategy: **everyone scrapes to JSON in parallel, then loads to their owned tables**.

---

## Step 1: Create shared utilities (do first, merge to main)

Create two shared files that ALL scrapers import:

**`scripts/utils.py`** — shared helpers:
- `normalize_school_name(raw)` — canonical name mapping
- `get_supabase_client()` — loads .env, returns authenticated client
- `write_json(data, filename)` / `read_json(filename)` — consistent I/O to `scripts/output/`
- `validate_gpa(val)` — clamps 0.00–4.00
- `validate_mcat(val)` — clamps 472–528

**`scripts/school_name_map.py`** — canonical name dictionary:
```python
CANONICAL_NAMES = {
    "UT Southwestern": "UT Southwestern Medical Center",
    "UTSW": "UT Southwestern Medical Center",
    "UTHealth Houston": "McGovern Medical School (UTHealth)",
    # ... all known aliases
}
```

Both files go in one PR, merged to `main` before anyone starts scraping.

---

## Step 2: Four-person work split

### Dev A — "Schools Master" | owns `schools` table | branch: `data/schools`

**CRITICAL PATH** — everyone downstream needs `schools.id` values.

| Source | Format | What to extract |
|--------|--------|-----------------|
| Shemmassian GPA/MCAT table | HTML | Baseline GPA + MCAT for all 170+ schools |
| Inspira Advantage table | HTML | GPA + MCAT, cross-reference with Shemmassian |
| MedEdits school stats | HTML | Acceptance rates, in/OOS data |
| MedEdits TX guide | HTML | 16 TX schools, in-state bias % |
| CollegeTuitionCompare | HTML | Tuition, acceptance rate, class size |
| ProspectiveDoctor | HTML | MCAT/GPA database |
| SavvyPremed | HTML | OOS-friendliness, interview format |
| Dell Med Admissions page | HTML | Prereqs, class profile |
| Dell Med Demographics | HTML | Class size, residency breakdown |
| MSAR Advisor Reports (22 PDFs) | PDF | Prereq matrix, LOR policies |
| AAMC Tuition/Debt Data | PDF | Debt data, tuition by school |
| TMDSAS Data | Web/PDF | TX-specific acceptance rates |

**Scripts to create:**
- `scripts/scrape_schools_html.py` — scrapes all HTML sources → per-source JSON
- `scripts/parse_msar_schools.py` — parses MSAR PDFs → JSON
- `scripts/merge_schools.py` — merges all sources, deduplicates, outputs `schools_merged.json`
- `scripts/seed_schools.py` — loads to Supabase, outputs `school_id_map.json`

**Merge priority (higher-trust wins conflicts):**
1. MSAR (official) — GPA, MCAT, class_size
2. School website — prereqs, website_url
3. Shemmassian — aggregated stats
4. MedEdits — acceptance rates, in-state bias
5. Others — fill gaps only

---

### Dev B — "UT Outcomes + Grids" | owns `ut_outcomes`, `acceptance_grid` | branch: `data/outcomes-grids`

**NO FK DEPENDENCY** — can scrape AND load to Supabase from Day 1.

| Source | Format | What to extract |
|--------|--------|-----------------|
| UT HPO TMDSAS Report | PDF | GPA bands x school, MCAT x school, majors |
| UT HPO AMCAS Report | PDF | Same for national/out-of-state schools |
| UT HPO AACOMAS Report | PDF | DO pathway data |
| UT HPO EY 2021 TMDSAS | PDF | Older cycle for trend analysis |
| UT HPO EY 2021 AMCAS | PDF | Older cycle comparison |
| AAMC MCAT/GPA Grid (A-23) | PDF | **PRODUCT CORE** — acceptance rates at every score combo |
| AACOM MCAT/GPA Grid | PDF | DO acceptance rates by GPA x MCAT |
| AAMC FACTS Tables | PDF | National applicant/matriculant counts |

**Scripts to create:**
- `scripts/parse_hpo_reports.py` — parses all 5 HPO PDFs → `ut_outcomes` JSON
- `scripts/parse_aamc_grid.py` — parses A-23 grid → `acceptance_grid` JSON
- `scripts/parse_aacom_grid.py` — parses AACOM grid → JSON
- `scripts/seed_outcomes_grids.py` — loads both tables to Supabase

---

### Dev C — "Salary + Guides" | owns `salary_data` | branch: `data/salary`

**NO FK DEPENDENCY** — fully parallel from Day 1.

| Source | Format | What to extract |
|--------|--------|-----------------|
| BLS OEWS Physician Wages | CSV | Salary by specialty/state/metro |
| AAMC Student Outcomes | PDF | MCAT+GPA → Step 1 pass rates, outcomes |
| UT Catalyst Premed Guide | HTML | GPA/MCAT distributions, top majors |
| Shemmassian UT Austin Guide | HTML | 57% TMDSAS rate, top schools for UT grads |
| TexAdmissions UT Analysis | HTML | Pipeline stats, matriculation rates |
| AACOM Applicant Data | PDF | National DO trends 2016-2024 |

**Scripts to create:**
- `scripts/load_bls_salary.py` — parses BLS CSV with pandas → JSON
- `scripts/parse_aamc_outcomes.py` — parses AAMC outcomes PDF
- `scripts/scrape_premed_guides.py` — scrapes 3 UT-focused HTML guides → reference JSON
- `scripts/seed_salary.py` — loads `salary_data` to Supabase

The premed guide data gets handed to Dev A as supplementary context for the `schools` table enrichment.

---

### Dev D — "Secondaries + Interviews" | owns `secondary_prompts`, `interview_data` | branch: `data/secondaries-interviews`

**FK BLOCKED for DB load** — can scrape to JSON immediately, but must wait for Dev A to populate the `schools` table before inserting to Supabase.

| Source | Format | What to extract |
|--------|--------|-----------------|
| Med School Insiders | HTML | Full prompts for MD + DO with tips |
| Shemmassian Prompts | HTML | All schools with word counts |
| BeMo Secondary List | HTML | All MD + DO prompts (single page) |
| ProspectiveDoctor prompts | HTML | Past + current, searchable |
| IMA / MedicalAid | HTML | MD + DO prompt database |
| SDN Interview Feedback | HTML | Per-school Qs, format, impressions |

**Scripts to create:**
- `scripts/scrape_secondaries.py` — scrapes all 5 prompt sources → per-source JSON
- `scripts/scrape_interviews.py` — scrapes SDN interview data → JSON
- `scripts/merge_secondaries.py` — deduplicates prompts across sources
- `scripts/seed_secondaries_interviews.py` — resolves school_id FKs, loads to Supabase

**FK resolution:** The seed script queries `SELECT id, name FROM schools` at runtime to resolve school names to IDs (more robust than depending on a static file).

---

## Step 3: Execution timeline

```
Day 1-3: PARALLEL SCRAPING (all 4 devs, JSON output only)
  Dev A: scraping 12 school sources → scripts/output/schools_*.json
  Dev B: parsing 8 PDFs → scripts/output/ut_outcomes_*.json, acceptance_grid_*.json
  Dev C: parsing BLS CSV + scraping guides → scripts/output/salary_*.json
  Dev D: scraping 6 prompt/interview sources → scripts/output/secondaries_*.json

Day 3-4: FIRST DB LOADS (independent tables)
  Dev A: merge_schools.py → seed_schools.py → schools table populated
  Dev B: seed_outcomes_grids.py → ut_outcomes + acceptance_grid populated
  Dev C: seed_salary.py → salary_data populated
  Dev D: WAITING for schools table...

Day 4-5: FK-DEPENDENT LOADS
  Dev D: seed_secondaries_interviews.py → secondary_prompts + interview_data populated

Day 5: VALIDATION (all 4 devs)
  Run scripts/validate_data.py to verify row counts, FK integrity, value ranges
```

---

## Step 4: Conflict prevention rules

1. **Table ownership is strict** — only your assigned person writes to your tables
2. **File naming** — prefix JSON outputs: `schools_*.json`, `ut_outcomes_*.json`, `secondaries_*.json`, `salary_*.json`
3. **Git branches** — `data/schools`, `data/outcomes-grids`, `data/salary`, `data/secondaries-interviews`
4. **Shared files** — `utils.py` and `school_name_map.py` merged to main first; changes require team PR review

---

## JSON Output Schemas

All scrapers output to `scripts/output/`. Each JSON file is an array of objects.

**schools (canonical merged format):**
```json
{
  "name": "Dell Medical School",
  "type": "MD",
  "system": "TMDSAS",
  "state": "TX",
  "median_gpa": 3.82,
  "median_mcat": 517,
  "acceptance_rate": 3.2,
  "class_size": 50,
  "in_state_bias": 85.0,
  "tuition_in_state": 19200,
  "tuition_oos": 32200,
  "avg_debt": null,
  "mission_keywords": ["primary care", "underserved", "Texas"],
  "prereqs": {"biology": true, "biochemistry": true},
  "website_url": "https://dellmed.utexas.edu",
  "_sources": ["shemmassian", "mededits", "msar"]
}
```

**ut_outcomes:**
```json
{
  "report_year": 2023,
  "application_system": "TMDSAS",
  "school_name": "Dell Medical School",
  "gpa_band": "3.80-4.00",
  "mcat_band": "517-528",
  "applicants": 45,
  "matriculants": 12,
  "major": "Biology"
}
```

**acceptance_grid:**
```json
{
  "gpa_range": "3.80-4.00",
  "mcat_range": "517-528",
  "acceptance_rate": 82.4,
  "source": "AAMC",
  "year": 2023
}
```

**secondary_prompts:**
```json
{
  "school_name": "Dell Medical School",
  "prompt_text": "Describe a meaningful clinical experience...",
  "word_limit": 500,
  "year": 2025,
  "source": "shemmassian"
}
```

**interview_data:**
```json
{
  "school_name": "Dell Medical School",
  "format": "MMI",
  "sample_questions": ["Tell me about a time you faced an ethical dilemma"],
  "tips": "Dress business formal. Arrive 15 min early.",
  "source": "sdn"
}
```

**salary_data:**
```json
{
  "specialty": "Family Medicine",
  "state": "TX",
  "metro_area": "Austin-Round Rock",
  "median_salary": 235000,
  "percentile_25": 200000,
  "percentile_75": 275000,
  "source_year": 2023
}
```

---

## Files to create

| File | Owner | Purpose |
|------|-------|---------|
| `scripts/utils.py` | Shared (merge first) | Common helpers for all scrapers |
| `scripts/school_name_map.py` | Shared (merge first) | Canonical school name mapping |
| `scripts/scrape_schools_html.py` | Dev A | HTML school data scraper |
| `scripts/parse_msar_schools.py` | Dev A | MSAR PDF parser |
| `scripts/merge_schools.py` | Dev A | Multi-source school dedup |
| `scripts/seed_schools.py` | Dev A | Schools → Supabase loader |
| `scripts/parse_hpo_reports.py` | Dev B | UT HPO PDF parser |
| `scripts/parse_aamc_grid.py` | Dev B | AAMC A-23 grid parser |
| `scripts/parse_aacom_grid.py` | Dev B | AACOM grid parser |
| `scripts/seed_outcomes_grids.py` | Dev B | Outcomes + grids → Supabase |
| `scripts/load_bls_salary.py` | Dev C | BLS CSV parser |
| `scripts/parse_aamc_outcomes.py` | Dev C | AAMC outcomes PDF parser |
| `scripts/scrape_premed_guides.py` | Dev C | UT-focused HTML guide scraper |
| `scripts/seed_salary.py` | Dev C | Salary → Supabase loader |
| `scripts/scrape_secondaries.py` | Dev D | 5 secondary prompt scrapers |
| `scripts/scrape_interviews.py` | Dev D | SDN interview scraper |
| `scripts/merge_secondaries.py` | Dev D | Prompt deduplication |
| `scripts/seed_secondaries_interviews.py` | Dev D | Prompts + interviews → Supabase |
| `scripts/validate_data.py` | Shared | Post-load validation checks |

---

## Data Source Reference

### Category 1: UT Austin-Specific
| Source | URL | Format |
|--------|-----|--------|
| UT HPO TMDSAS Report | healthprofessions.utexas.edu/media/277/download | PDF |
| UT HPO AMCAS Report | healthprofessions.utexas.edu/media/337/download | PDF |
| UT HPO AACOMAS Report | healthprofessions.utexas.edu/media/275/download | PDF |
| UT HPO EY 2021 TMDSAS | healthprofessions.utexas.edu/media/231/download | PDF |
| UT HPO EY 2021 AMCAS | healthprofessions.utexas.edu/media/232/download | PDF |
| Dell Med Admissions | dellmed.utexas.edu/education/how-to-apply/admissions-criteria | HTML |
| Dell Med Demographics | dellmed.utexas.edu/education/academics/undergraduate-medical-education/student-demographics | HTML |
| UT Catalyst Guide | utcatalyst.org/premedicine-guide | HTML |
| Shemmassian UT Guide | shemmassianconsulting.com/blog/ut-austin-premed | HTML |
| TexAdmissions Analysis | texadmissions.com/blog/2023/7/27/applying-for-pre-med-to-ut-austin | HTML |

### Category 2: Official National
| Source | URL / Notes | Format |
|--------|-------------|--------|
| AAMC FACTS Tables | aamc.org/data-reports | PDF |
| AAMC MCAT/GPA Grid (A-23) | aamc.org/media/6091/download | PDF |
| AAMC Student Outcomes | aamc.org (outcomes page) | PDF |
| MSAR Advisor Reports (22 PDFs) | students-residents.aamc.org | PDF |
| AACOM Applicant Data | aacom.org/reports | PDF |
| AACOM MCAT/GPA Grid | aacom.org (via PDF) | PDF |
| TMDSAS Data | tmdsas.com | Web/PDF |
| BLS OEWS Physician Wages | bls.gov/oes/tables.htm | CSV |
| AAMC Tuition/Debt Data | aamc.org/data-reports | PDF |

### Category 3: School-Level Aggregated
| Source | URL | Format |
|--------|-----|--------|
| Shemmassian GPA/MCAT table | shemmassianconsulting.com/blog/average-gpa-and-mcat-score-for-every-medical-school | HTML |
| MedEdits school stats | mededits.com/medical-school-admissions/statistics | HTML |
| Inspira Advantage table | inspiraadvantage.com/blog/gpa-and-mcat-scores-for-all-medical-schools | HTML |
| ProspectiveDoctor | prospectivedoctor.com/gpa-and-mcat | HTML |
| SavvyPremed | savvypremed.com | HTML |
| CollegeTuitionCompare | collegetuitioncompare.com | HTML |
| MedEdits TX guide | mededits.com/.../schools-by-state/texas | HTML |

### Category 4: Secondary Essays & Interviews
| Source | URL | Format |
|--------|-----|--------|
| Med School Insiders | medschoolinsiders.com/medical-school-secondary-prompts-database | HTML |
| Shemmassian Prompts | shemmassianconsulting.com/blog/medical-school-secondary-essay-prompts | HTML |
| BeMo Secondary List | bemoacademicconsulting.com/blog/medical-school-secondary-essays-prompt-list | HTML |
| ProspectiveDoctor prompts | prospectivedoctor.com/medical-school-secondary-essay-prompts-database | HTML |
| IMA / MedicalAid | medicalaid.org/blog/medical-school-secondary-essay-prompts | HTML |
| SDN Interview Feedback | studentdoctor.net (interview feedback tool) | HTML |

---

## Legal Reminders

- **AAMC FACTS**: Allows reproduction with attribution for educational use
- **MSAR**: Paid ($28/yr). TOS likely prohibits bulk redistribution. Build derived insights only
- **SDN**: Check TOS before production scraping. May need partnership
- **Reddit**: Use official API. Rate limits apply. TOS updated 2023
- **Consulting blogs**: Extract data points only, never reproduce text
- **UT HPO reports**: Published publicly. Fair game with source citation
