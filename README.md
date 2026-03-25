# UT Austin Premed AI Copilot

> "With my 3.7 GPA and 512 MCAT, which schools did UT students like me get into?"

A data-driven AI copilot that helps UT Austin premeds navigate medical school admissions using 30+ real data sources. Built by a team of 4 vibe coders in 8 weeks.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | SSR, SEO, fast development |
| UI Components | shadcn/ui + Lucide icons | Consistent, accessible component library |
| Database | Supabase (Postgres + Auth + Storage) | Auth, real-time data, row-level security |
| AI | Anthropic Claude API (Sonnet) | Admissions advice, essay coaching, interview prep |
| Charts | Recharts | Data visualization for benchmarks and stats |
| Data Pipeline | Python (pdfplumber, BeautifulSoup, pandas) | PDF parsing, web scraping, CSV transforms |
| Hosting | Vercel | One-click deploy from GitHub |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Python 3.10+ (for data pipeline scripts)
- Supabase account (free tier works)
- Anthropic API key

### Setup

```bash
# Install dependencies
npm install

# Copy environment template and fill in your keys
cp .env.example .env.local

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database Setup

1. Create a new Supabase project
2. Run `supabase/schema.sql` in the SQL editor to create all tables
3. Run `supabase/seed.sql` to load sample data
4. Copy your project URL and anon key into `.env.local`

---

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (chat, chance calculator)
│   │   ├── chance/             # Chance calculator
│   │   ├── chat/               # AI premed advisor
│   │   ├── dashboard/          # Personal dashboard
│   │   ├── essays/             # Essay coach
│   │   ├── interview-prep/     # Mock interviews
│   │   ├── login/              # Authentication
│   │   ├── my-list/            # Saved school list
│   │   ├── onboarding/         # Profile setup wizard
│   │   ├── salary/             # Salary explorer
│   │   ├── schools/            # School explorer + detail + compare
│   │   ├── settings/           # Account settings
│   │   ├── timeline/           # Application timeline
│   │   ├── activity-tracker/   # EC hours tracker
│   │   └── ut-benchmarks/      # UT Austin-specific data
│   ├── components/
│   │   ├── layout/             # Sidebar, top nav, footer
│   │   └── shared/             # Reusable UI components
│   ├── lib/
│   │   ├── supabase/           # Supabase client (browser + server)
│   │   └── anthropic.ts        # Claude API client
│   └── types/                  # TypeScript interfaces for all DB tables
├── supabase/
│   ├── schema.sql              # Full database DDL
│   └── seed.sql                # Sample data
├── scripts/                    # Python data pipeline
│   ├── parse_msar_pdf.py       # PDF parsing
│   ├── scrape_school_data.py   # Web scraping
│   ├── load_salary_data.py     # BLS salary import
│   └── seed_supabase.py        # DB seeding
└── middleware.ts               # Supabase session management
```

---

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero section, feature highlights, CTA |
| `/login` | Auth | Google + email sign-in via Supabase |
| `/onboarding` | Profile Setup | Multi-step wizard for GPA, MCAT, activities |
| `/dashboard` | Dashboard | Journey overview with stats and alerts |
| `/chance` | Chance Calculator | GPA x MCAT acceptance probability grid |
| `/schools` | School Explorer | Searchable table of 170+ med schools |
| `/schools/[id]` | School Detail | Stats, secondaries, interview info, prereqs |
| `/schools/compare` | Compare | Side-by-side comparison of 2-4 schools |
| `/ut-benchmarks` | UT Data | HPO report visualizations and trends |
| `/my-list` | School List | Saved schools with reach/target/safety tiers |
| `/essays` | Essay Coach | AI-powered secondary essay feedback |
| `/interview-prep` | Interview Prep | Mock MMI and traditional interviews |
| `/timeline` | Timeline | AMCAS/TMDSAS/AACOMAS deadline tracker |
| `/salary` | Salary Explorer | Physician salary by specialty and region |
| `/activity-tracker` | Activities | EC hour logging with benchmark indicators |
| `/chat` | AI Advisor | Claude-powered premed chat assistant |
| `/settings` | Settings | Profile, notifications, preferences |

---

## Database Schema

9 tables in Supabase (Postgres):

- **users** — Student profiles (GPA, MCAT, hours, demographics)
- **schools** — 170+ MD and DO programs with stats
- **ut_outcomes** — UT Austin HPO acceptance/matriculation data
- **acceptance_grid** — AAMC/AACOM GPA x MCAT acceptance rates
- **secondary_prompts** — Secondary essay prompts by school and year
- **interview_data** — Interview formats and sample questions by school
- **salary_data** — BLS physician salary data by specialty and region
- **saved_schools** — User school lists with tier classification
- **chat_history** — AI conversation logs with context metadata

Full DDL with indexes and RLS policies: `supabase/schema.sql`

---

## Data Sources

| Source | Type | Trust Level |
|--------|------|-------------|
| AAMC FACTS (A-23) | Acceptance grids | Official |
| UT Austin HPO Reports | Outcomes by school | Official |
| BLS Occupational Data | Physician salaries | Official |
| MSAR Advisor Reports | School prerequisites | Official |
| Shemmassian / Inspira | Secondary prompts | Community |
| SDN Interview Feedback | Interview questions | Community |

---

## Team Roles

| Role | Scope |
|------|-------|
| Coder 1 — Architect | Auth, layout, onboarding, shared components |
| Coder 2 — Data Viz | Dashboards, school explorer, charts |
| Coder 3 — Data Plumber | Scraping, parsing, DB, API endpoints |
| Coder 4 — AI Whisperer | Claude integration, chat, essays, interview prep |

---

## Contributing

1. Branch from `main`: `coder1/feature-name`, `coder2/feature-name`, etc.
2. Merge to `main` daily via PR
3. Keep `main` deployable — hide unfinished features behind flags
4. Every data point shown to users needs a source citation

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
```
