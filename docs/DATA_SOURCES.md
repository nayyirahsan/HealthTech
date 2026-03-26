# UT Austin Premed Data Sources

Complete Database Cheat Sheet for the AI Career Copilot

- **Home Base:** UT Austin
- **Scope:** National
- **Target:** Premed Students
- **Date:** March 2026
- **Sources:** 30
- **Trustworthiness Rated & Scrapeability Assessed**

---

## 1. UT Austin-Specific Data (Your Secret Weapon)

These sources give you something no competitor has: data on what happens to UT Austin premeds specifically.

| Source | What You Get | Trust | Scrape? | Format | Cost | URL |
|--------|-------------|-------|---------|--------|------|-----|
| UT HPO TMDSAS Report | UT students → TX med schools. GPA bands x school, MCAT x school, science GPA, major breakdown. ~609 applicants, 275 matriculants/yr | ★★★★ | PDF extract | PDF | FREE | healthprofessions.utexas.edu/media/277/download |
| UT HPO AMCAS Report | UT students → national med schools. Same GPA/MCAT/major breakdowns. Shows Baylor, Vanderbilt, Stanford, etc. | ★★★★ | PDF extract | PDF | FREE | healthprofessions.utexas.edu/media/337/download |
| UT HPO AACOMAS Report | UT students → DO schools. GPA/MCAT breakdowns for osteopathic pathway | ★★★★ | PDF extract | PDF | FREE | healthprofessions.utexas.edu/media/275/download |
| UT HPO EY 2021 TMDSAS | Same as above but for entering year 2021 (older cycle for trend analysis) | ★★★★ | PDF extract | PDF | FREE | healthprofessions.utexas.edu/media/231/download |
| UT HPO EY 2021 AMCAS | Older AMCAS cycle data for trend comparison | ★★★★ | PDF extract | PDF | FREE | healthprofessions.utexas.edu/media/232/download |
| Dell Medical School Admissions | Prereqs (11 hrs bio, 14 hrs chem, 8 hrs physics, 6 hrs English), video secondary, class profile: avg GPA 3.92, MCAT 515, 98% TX residents | ★★★★★ | YES - scrape | HTML | FREE | dellmed.utexas.edu/education/how-to-apply/admissions-criteria |
| Dell Med Student Demographics | Class size, gender split (54% M / 44% F), residency breakdown, founding year (2013) | ★★★★★ | YES - scrape | HTML | FREE | dellmed.utexas.edu/education/academics/undergraduate-medical-education/student-demographics |
| UT Catalyst Premed Guide | Student org that analyzed HPO data: GPA distribution, MCAT distribution, top majors, matriculation rates | ★★★ | YES - scrape | HTML | FREE | utcatalyst.org/premedicine-guide |
| Shemmassian UT Austin Guide | Deep analysis of HPO data: 57% TMDSAS matriculation rate, McGovern most common school (60 students), GPA/MCAT sweet spots | ★★★ | YES - scrape | HTML | FREE | shemmassianconsulting.com/blog/ut-austin-premed |
| TexAdmissions UT Premed Analysis | UT premed pipeline: ~1 in 15-20 freshmen become physicians, 45% matriculation rate, comparison to TX A&M and UT-Dallas | ★★★ | YES - scrape | HTML | FREE | texadmissions.com/blog/2023/7/27/applying-for-pre-med-to-ut-austin |

### Key UT Austin Stats to Extract

- **Overall matriculation rate:** ~45% (609 applicants → 275 enrollees). Well above national avg of ~35%
- **TMDSAS success rate:** 57% of first-time UT applicants matriculated to Texas med schools
- **Applicant volume:** ~1,000 med school applicants per year. Second only to UCLA nationally
- **Top TX schools for UT grads:** McGovern (60), UT San Antonio (48), UT Southwestern (48), Dell (19), UTMB Galveston (46)
- **Top AMCAS schools:** Baylor (41 of 87 AMCAS matriculants), plus Vanderbilt, Stanford, Dartmouth, Oklahoma, TCU
- **GPA sweet spot:** 3.91-4.00 had 93 matriculants; 3.81-3.90 had 82; 3.71-3.80 had 47. Drops sharply below 3.7
- **MCAT sweet spot:** 509-511 range produced both the most applicants and most matriculants
- **Top majors:** Biology, Biochemistry, Neuroscience (in order)

---

## 2. Official National Admissions Data

| Source | What You Get | Trust | Scrape? | Format | Cost | URL / Notes |
|--------|-------------|-------|---------|--------|------|-------------|
| AAMC FACTS Tables | Applicant/matriculant counts, MCAT means, GPAs by race, sex, major, state. ~52K applicants/yr | ★★★★★ | PDF extract | PDF | FREE | aamc.org/data-reports |
| AAMC MCAT/GPA Grid (A-23) | Acceptance rates at every MCAT x GPA combo. 3-year rolling data. **Core of your product** | ★★★★★ | PDF extract | PDF | FREE | aamc.org/media/6091/download |
| AAMC Student Outcomes | How MCAT+GPA predict Step 1 pass, graduation rates | ★★★★★ | PDF extract | PDF grids | FREE | aamc.org (outcomes page) |
| AAMC MSAR (full DB) | 170+ MD schools: median MCAT, GPA, class size, prereqs, in-state bias | ★★★★★ | TOS check | Web app | $28/yr | mec.aamc.org |
| MSAR Advisor Reports (22 PDFs) | Prereq coursework matrix, LOR policies, MCAT date cutoffs, community college policies | ★★★★★ | PDF extract | PDF | FREE | students-residents.aamc.org |
| AACOM Applicant Data | DO school MCAT (avg ~500), GPA (avg 3.59), 2016-2024 trends | ★★★★★ | PDF extract | PDF | FREE | aacom.org/reports |
| AACOM MCAT/GPA Grid | DO acceptance rates by MCAT x GPA | ★★★★★ | PDF extract | PDF | FREE | aacom.org (via PDF) |
| TMDSAS Data | Texas-specific app data for 14 TX med schools, acceptance rates | ★★★★★ | Limited | Web/PDF | FREE | tmdsas.com |
| BLS OEWS Physician Wages | Salaries by specialty/state/metro. CSV download | ★★★★★ | CSV download | CSV | FREE | bls.gov/oes/tables.htm |
| AAMC Tuition/Debt Data | Med school debt ($215K median), tuition by school | ★★★★★ | PDF extract | PDF | FREE | aamc.org/data-reports |

---

## 3. School-Level Data (Scrapeable Websites)

| Source | What You Get | Trust | Scrape? | Format | Cost | URL / Notes |
|--------|-------------|-------|---------|--------|------|-------------|
| 170+ Med school admissions pages | Mean GPA, MCAT, class size, demographics, mission | ★★★★ | YES | HTML | FREE | Per school — build scraper, run quarterly |
| Shemmassian GPA/MCAT table | Pre-compiled avg GPA + MCAT for every US med school | ★★★ | YES | HTML table | FREE | shemmassianconsulting.com/blog/average-gpa-and-mcat-score-for-every-medical-school |
| MedEdits school stats | Acceptance rates, interview rates, in/OOS data | ★★★ | YES | HTML | FREE | mededits.com/medical-school-admissions/statistics |
| Inspira Advantage table | GPA + MCAT for every school, compiled from MSAR + school sites | ★★★ | YES | HTML table | FREE | inspiraadvantage.com/blog/gpa-and-mcat-scores-for-all-medical-schools |
| ProspectiveDoctor | MCAT/GPA database + acceptance rate calculator | ★★★ | YES | HTML | FREE | prospectivedoctor.com/gpa-and-mcat |
| SavvyPremed school profiles | Per-school: secondary format, timeline, OOS-friendliness, interview type | ★★★ | YES | HTML | FREE | savvypremed.com |
| CollegeTuitionCompare | Tuition, acceptance rate, matriculant count per school | ★★★ | YES | HTML | FREE | collegetuitioncompare.com |
| MedEdits TX guide | All 16 TX med schools with stats, rankings, in-state bias % | ★★★ | YES | HTML | FREE | mededits.com/.../schools-by-state/texas |

---

## 4. Community Forums (High Volume Scrapes)

| Source | What You Get | Trust | Scrape? | Format | Cost | How to Use |
|--------|-------------|-------|---------|--------|------|-----------|
| SDN WAMC Forum | 10,000+ structured applicant profiles: GPA, MCAT, state, ECs, hours, school list, expert feedback | ★★ | YES | Forum | FREE | Train AI advisor + build benchmark models |
| SDN Interview Feedback | Real interview Qs, school impressions, format details for 170+ schools | ★★★ | YES | Structured | FREE | Interview prep feature by school |
| SDN Secondary Prompts DB | Secondary essay prompts by school, updated yearly | ★★★ | YES | Structured | FREE | Secondary essay tracker |
| SDN School-Specific Threads | Per-school megathreads with timeline data (when IIs sent, decisions) | ★★ | YES | Forum | FREE | Application timeline intelligence |
| SDN TX "Republic of Texas" Threads | Texas-specific cycle megathreads, TMDSAS timeline data, interview dates | ★★ | YES | Forum | FREE | TX cycle intelligence for UT users |
| Reddit r/premed | WAMC posts, cycle recaps, accepted w/ X stats, school list advice | ★★ | Reddit API | Posts | FREE | AI training + sentiment data |
| Reddit r/MCAT | Score reports, study schedules, practice test progressions | ★★ | Reddit API | Posts | FREE | MCAT study planning feature |
| Reddit r/premed cycle recaps | End-of-cycle: stats, school list, IIs, acceptances, rejections | ★★ | Reddit API | Posts | FREE | Outcome prediction model training |
| SDN DO school spreadsheet | Community Google Sheet with all DO school GPA/MCAT/LOR reqs | ★★ | Google Sheets | Sheet | FREE | DO school quick reference |

---

## 5. Secondary Essay & Interview Databases

| Source | What You Get | Trust | Scrape? | Format | Cost | URL |
|--------|-------------|-------|---------|--------|------|-----|
| Med School Insiders | Full secondary prompts for every MD + DO school, w/ expert tips. Updated annually | ★★★ | YES | HTML | FREE | medschoolinsiders.com/medical-school-secondary-prompts-database |
| Shemmassian Prompts | Complete secondary prompts for all US med schools w/ word counts | ★★★ | YES | HTML | FREE | shemmassianconsulting.com/blog/medical-school-secondary-essay-prompts |
| BeMo Secondary List | All MD + DO prompts in single long page | ★★★ | YES | HTML | FREE | bemoacademicconsulting.com/blog/medical-school-secondary-essays-prompt-list |
| ProspectiveDoctor | Past + current prompts, searchable by school | ★★★ | YES | HTML | FREE | prospectivedoctor.com/medical-school-secondary-essay-prompts-database |
| IMA / MedicalAid | Complete MD + DO prompt database | ★★★ | YES | HTML | FREE | medicalaid.org/blog/medical-school-secondary-essay-prompts |
| Individual school pages | Some schools publish prompts directly (Harvard, UCSF, UChicago, etc.) | ★★★★ | YES | HTML | FREE | Per school admissions page |

---

## 6. Extracurricular & Experience Benchmarks

No single official dataset exists for "how many clinical hours do I need." Build from these sources:

| Source | What You Get | Trust | Scrape? | Format | Cost | Benchmark Data |
|--------|-------------|-------|---------|--------|------|---------------|
| AAMC Matriculating Student Questionnaire | National survey: research hrs, volunteer hrs, clinical experience, gap year rates | ★★★★ | PDF extract | PDF | FREE | Official averages (summary only public) |
| SDN WAMC threads (aggregated) | Self-reported hours from thousands of applicants with outcomes | ★★ | YES | Forum | FREE | Clinical: 100-500 hrs, Shadowing: 50-100, Research: 300-2000 |
| SDN volunteer hours threads | Advisor benchmarks from verified experts (LizzyM, Goro) | ★★★ | YES | Forum | FREE | 150 clinical + 150 non-clinical + 50-100 shadowing |
| Admissions consulting blogs | Aggregated benchmarks from MedSchoolCoach, JackWestin, Blueprint, IMA | ★★★ | YES | HTML | FREE | 150 clinical, 100 non-clinical, 50 shadow, 300+ research (T20) |
| Reddit r/premed cycle recaps | Hours reported alongside acceptance outcomes | ★★ | Reddit API | Posts | FREE | Real outcome-linked hour data |

---

## 7. Trustworthiness Rating Guide

Show users where each data point comes from. Use official data as the spine, community data as context.

| Rating | Label | Examples | Display to Users | Use in Product |
|--------|-------|---------|------------------|---------------|
| ★★★★★ | Official / Authoritative | AAMC, AACOM, TMDSAS, BLS, med school pages | No disclaimer needed. Cite source | Hard numbers: acceptance rates, salary, GPA/MCAT grids |
| ★★★★ | Institutional | UT Austin HPO reports, Dell Med admissions | "Source: [Institution]" tag | School-specific stats, UT benchmarks |
| ★★★ | Curated / Aggregated | Shemmassian, MedEdits, SDN tools, consulting blogs | "Compiled from multiple sources" tag | School comparison tables, essay prompts, interview prep |
| ★★ | Community / Self-Reported | SDN WAMC threads, Reddit r/premed, cycle recaps | "Based on community-reported data (unverified)" disclaimer | AI advisor training, qualitative guidance, hour benchmarks |
| ★ | Anecdotal | Individual blog posts, TikTok, single Reddit comments | Do not surface directly | Background context for AI, never displayed as data |

---

## 8. Recommended Scraping Priority

### Sprint 1 (Week 1-2): Foundation
- AAMC MCAT/GPA acceptance grid → structured JSON (product core)
- UT Austin HPO reports (all 6 PDFs) → structured JSON (differentiation)
- Shemmassian + Inspira GPA/MCAT tables → school database (baseline for 170+ schools)
- BLS wage CSV download (salary/ROI calculator)

### Sprint 2 (Week 3-4): Enrich
- Scrape 5 secondary essay databases → deduplicated prompt DB
- Scrape SDN Interview Feedback → interview prep by school
- MSAR Advisor Reports (22 free PDFs) → prereq tracker + checklist
- AACOM + DO data → DO pathway support
- MedEdits TX guide → Texas school comparison features

### Sprint 3 (Week 5-6): Community Data + AI
- SDN WAMC forum scrape → train AI advisor on 10K+ real profiles
- Reddit r/premed cycle recaps → outcome prediction model training
- Extracurricular benchmarks (SDN + blogs) → red/yellow/green dashboard
- AAMC tuition/debt data → cost comparison + ROI calculator

### Sprint 4 (Week 7-8): Polish + Scale
- 170+ med school website scraper → enrich profiles beyond MSAR
- AMCAS/AACOMAS/TMDSAS timeline data → deadline tracker with alerts
- SDN school-specific + TX Republic threads → cycle timeline intelligence
- Consider MSAR license ($28) → richest school-level data if TOS allows

---

## Legal Reminders

- **AAMC FACTS:** Explicitly allows reproduction with attribution for educational, noncommercial purposes
- **MSAR:** Paid subscription ($28/yr). TOS likely prohibits bulk redistribution. Build derived insights, not mirror
- **SDN:** Check TOS before production scraping. May need partnership or API agreement
- **Reddit:** Use official API. Rate limits apply. TOS updated in 2023 — review before scraping at scale
- **Consulting blogs:** Copyrighted content. Extract data points and benchmarks; don't reproduce text
- **UT HPO reports:** Published publicly on university website. Fair game for extraction. Cite source
