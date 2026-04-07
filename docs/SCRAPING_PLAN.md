# Parallel Data Scraping Plan — 4 Developers (Revised)

## Context

Salary and secondary essays features are fully cut. The `salary_data` and `secondary_prompts` tables have been removed from the schema. The 4 devs are redistributed across the remaining data: **schools**, **UT outcomes**, **acceptance grids**, and **interview data**.

Strategy: **everyone scrapes to JSON in parallel, then loads to their owned tables**.

Shared utilities (`scripts/utils.py` and `scripts/school_name_map.py`) are already on main.

---

## 4-Person Work Split

### Dev A (Avery) — "Schools Master" | owns `schools` table | branch: `data/schools`

**CRITICAL PATH** — Dev D needs `schools.id` for interview data FK.

| Source | Format | Extract |
|--------|--------|---------|
| Shemmassian GPA/MCAT table | HTML | Baseline GPA + MCAT for 170+ schools |
| Inspira Advantage table | HTML | GPA + MCAT cross-reference |
| Dell Med Admissions page | HTML | Prereqs, class profile |
| Dell Med Demographics | HTML | Class size, residency breakdown |
| MSAR Advisor Reports (22 PDFs) | PDF | Prereq matrix, LOR policies |
| TMDSAS Data | Web/PDF | TX-specific acceptance rates |

**Scripts:**
- `scripts/scrape_schools_html.py` — Shemmassian, Inspira, Dell Med pages
- `scripts/parse_msar_schools.py` — MSAR PDFs + TMDSAS
- `scripts/merge_schools.py` — merge all school sources (from Dev A + Dev C)
- `scripts/seed_schools.py` — load to Supabase, output `school_id_map.json`

**Merge priority (higher-trust wins conflicts):**
1. MSAR (official) — GPA, MCAT, class_size
2. School website — prereqs, website_url
3. Shemmassian — aggregated stats
4. MedEdits — acceptance rates, in-state bias
5. Others — fill gaps only

---

### Dev B — "UT Outcomes + Grids" | owns `ut_outcomes`, `acceptance_grid` | branch: `data/outcomes-grids`

**NO FK DEPENDENCY** — fully parallel from Day 1.

| Source | Format | Extract |
|--------|--------|---------|
| UT HPO TMDSAS Report | PDF | GPA bands x school, MCAT x school, majors |
| UT HPO AMCAS Report | PDF | National/out-of-state schools |
| UT HPO AACOMAS Report | PDF | DO pathway data |
| UT HPO EY 2021 TMDSAS | PDF | Older cycle for trends |
| UT HPO EY 2021 AMCAS | PDF | Older cycle comparison |
| AAMC MCAT/GPA Grid (A-23) | PDF | **PRODUCT CORE** — acceptance rates at every score combo |
| AACOM MCAT/GPA Grid | PDF | DO acceptance rates |
| AAMC FACTS Tables | PDF | National applicant/matriculant counts |

**Scripts:**
- `scripts/parse_hpo_reports.py` — all 5 HPO PDFs → `ut_outcomes` JSON
- `scripts/parse_aamc_grid.py` — A-23 grid → `acceptance_grid` JSON
- `scripts/parse_aacom_grid.py` — AACOM grid → JSON
- `scripts/seed_outcomes_grids.py` — load both tables to Supabase

---

### Dev C — "School Data Support" | helps populate `schools` table | branch: `data/schools-enrichment`

**NO FK DEPENDENCY** — scrapes to JSON, Dev A merges into the canonical schools list.

| Source | Format | Extract |
|--------|--------|---------|
| MedEdits school stats | HTML | Acceptance rates, in/OOS data |
| MedEdits TX guide | HTML | 16 TX schools, in-state bias % |
| CollegeTuitionCompare | HTML | Tuition, acceptance rate, class size |
| ProspectiveDoctor | HTML | MCAT/GPA database |
| SavvyPremed | HTML | OOS-friendliness, interview format |
| AAMC Tuition/Debt Data | PDF | Debt data, tuition by school |
| AACOM Applicant Data | PDF | National DO trends 2016-2024 |

**Scripts:**
- `scripts/scrape_schools_enrichment.py` — MedEdits, CollegeTuitionCompare, ProspectiveDoctor, SavvyPremed
- `scripts/parse_aamc_tuition.py` — AAMC tuition/debt PDF
- Outputs: `schools_mededits.json`, `schools_tuition_compare.json`, `schools_prospective.json`, `schools_savvypremed.json`, `schools_mededits_tx.json`, `schools_aamc_tuition.json`

Dev A's `merge_schools.py` reads all of these + Dev A's own JSON files.

---

### Dev D — "Interviews + Guides" | owns `interview_data` | branch: `data/interviews`

**FK BLOCKED for DB load** — can scrape to JSON immediately, but must wait for Dev A to populate `schools` before inserting.

| Source | Format | Extract |
|--------|--------|---------|
| SDN Interview Feedback | HTML | Per-school Qs, format, impressions |
| UT Catalyst Premed Guide | HTML | GPA/MCAT distributions, top majors |
| Shemmassian UT Austin Guide | HTML | 57% TMDSAS rate, top schools |
| TexAdmissions UT Analysis | HTML | Pipeline stats, matriculation rates |
| AAMC Student Outcomes | PDF | MCAT+GPA → Step 1 pass, graduation rates |

**Scripts:**
- `scripts/scrape_interviews.py` — SDN interview feedback → JSON
- `scripts/scrape_premed_guides.py` — 3 UT-focused guide sites → reference JSON
- `scripts/parse_aamc_outcomes.py` — AAMC student outcomes PDF
- `scripts/seed_interviews.py` — resolve school_id FKs, load to Supabase

**FK resolution:** The seed script queries `SELECT id, name FROM schools` at runtime to resolve school names to IDs.

---

## Execution Timeline

```
Day 1-3: PARALLEL SCRAPING (all 4, JSON output only)
  Dev A: Shemmassian, Inspira, Dell Med, MSAR PDFs → schools_*.json
  Dev B: 5 HPO PDFs + AAMC/AACOM grids → ut_outcomes_*.json, acceptance_grid_*.json
  Dev C: MedEdits, CollegeTuition, ProspectiveDoctor, SavvyPremed, AAMC tuition → schools_*.json
  Dev D: SDN interviews, 3 premed guides, AAMC outcomes → interviews_*.json, guide_*.json

Day 3-4: DB LOADS
  Dev A: merge_schools.py (reads Dev A + Dev C JSON) → seed_schools.py → schools table populated
  Dev B: seed_outcomes_grids.py → ut_outcomes + acceptance_grid populated
  Dev D: WAITING for schools...

Day 4-5: FK-DEPENDENT LOADS
  Dev D: seed_interviews.py → interview_data populated

Day 5: VALIDATION (all 4)
  scripts/validate_data.py
```

---

## Conflict Prevention

1. **Table ownership:** Dev A → `schools`, Dev B → `ut_outcomes` + `acceptance_grid`, Dev D → `interview_data`
2. **Dev C has no table** — outputs JSON that Dev A consumes via merge_schools.py
3. **File prefixes:** `schools_*.json`, `ut_outcomes_*.json`, `acceptance_grid_*.json`, `interviews_*.json`, `guide_*.json`
4. **Git branches:** `data/schools`, `data/outcomes-grids`, `data/schools-enrichment`, `data/interviews`
5. **Shared files** — `utils.py` and `school_name_map.py` are on main; changes require team PR review

---

## JSON Output Schemas

All scrapers output to `scripts/output/`. Each JSON file is an array of objects.

**schools:**
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

---

## Files to Create

| File | Owner | Purpose |
|------|-------|---------|
| `scripts/scrape_schools_html.py` | Dev A | Shemmassian, Inspira, Dell Med scraper |
| `scripts/parse_msar_schools.py` | Dev A | MSAR PDF + TMDSAS parser |
| `scripts/merge_schools.py` | Dev A | Merge all school JSON sources |
| `scripts/seed_schools.py` | Dev A | Schools → Supabase |
| `scripts/parse_hpo_reports.py` | Dev B | HPO PDF parser |
| `scripts/parse_aamc_grid.py` | Dev B | AAMC A-23 grid parser |
| `scripts/parse_aacom_grid.py` | Dev B | AACOM grid parser |
| `scripts/seed_outcomes_grids.py` | Dev B | Outcomes + grids → Supabase |
| `scripts/scrape_schools_enrichment.py` | Dev C | MedEdits, CollegeTuition, ProspectiveDoctor, SavvyPremed |
| `scripts/parse_aamc_tuition.py` | Dev C | AAMC tuition/debt PDF parser |
| `scripts/scrape_interviews.py` | Dev D | SDN interview scraper |
| `scripts/scrape_premed_guides.py` | Dev D | 3 UT guide sites |
| `scripts/parse_aamc_outcomes.py` | Dev D | AAMC student outcomes PDF |
| `scripts/seed_interviews.py` | Dev D | Interviews → Supabase |
| `scripts/validate_data.py` | Shared | Post-load validation |

---

## Data Source URLs

### UT Austin-Specific
| Source | URL | Format |
|--------|-----|--------|
| UT HPO TMDSAS Report | healthprofessions.utexas.edu/media/277/download | PDF |
| UT HPO AMCAS Report | healthprofessions.utexas.edu/media/337/download | PDF |
| UT HPO AACOMAS Report | healthprofessions.utexas.edu/media/275/download | PDF |
| UT HPO EY 2021 TMDSAS | healthprofessions.utexas.edu/media/231/download | PDF |
| UT HPO EY 2021 AMCAS | healthprofessions.utexas.edu/media/232/download | PDF |
| Dell Med Admissions | dellmed.utexas.edu/education/how-to-apply/admissions-criteria | HTML |
| Dell Med Demographics | dellmed.utexas.edu/.../student-demographics | HTML |
| UT Catalyst Guide | utcatalyst.org/premedicine-guide | HTML |
| Shemmassian UT Guide | shemmassianconsulting.com/blog/ut-austin-premed | HTML |
| TexAdmissions Analysis | texadmissions.com/blog/2023/7/27/applying-for-pre-med-to-ut-austin | HTML |

### Official National
| Source | URL / Notes | Format |
|--------|-------------|--------|
| AAMC FACTS Tables | aamc.org/data-reports | PDF |
| AAMC MCAT/GPA Grid (A-23) | aamc.org/media/6091/download | PDF |
| AAMC Student Outcomes | aamc.org (outcomes page) | PDF |
| MSAR Advisor Reports (22 PDFs) | students-residents.aamc.org | PDF |
| AACOM Applicant Data | aacom.org/reports | PDF |
| AACOM MCAT/GPA Grid | aacom.org (via PDF) | PDF |
| TMDSAS Data | tmdsas.com | Web/PDF |
| AAMC Tuition/Debt Data | aamc.org/data-reports | PDF |

### School-Level Aggregated
| Source | URL | Format |
|--------|-----|--------|
| Shemmassian GPA/MCAT table | shemmassianconsulting.com/blog/average-gpa-and-mcat-score-for-every-medical-school | HTML |
| MedEdits school stats | mededits.com/medical-school-admissions/statistics | HTML |
| Inspira Advantage table | inspiraadvantage.com/blog/gpa-and-mcat-scores-for-all-medical-schools | HTML |
| ProspectiveDoctor | prospectivedoctor.com/gpa-and-mcat | HTML |
| SavvyPremed | savvypremed.com | HTML |
| CollegeTuitionCompare | collegetuitioncompare.com | HTML |
| MedEdits TX guide | mededits.com/.../schools-by-state/texas | HTML |

### Interviews
| Source | URL | Format |
|--------|-----|--------|
| SDN Interview Feedback | studentdoctor.net (interview feedback tool) | HTML |

---

## Legal Reminders

- **AAMC FACTS:** Allows reproduction with attribution for educational use
- **MSAR:** Paid ($28/yr). TOS likely prohibits bulk redistribution. Build derived insights only
- **SDN:** Check TOS before production scraping. May need partnership
- **Consulting blogs:** Extract data points only, never reproduce text
- **UT HPO reports:** Published publicly. Fair game with source citation
