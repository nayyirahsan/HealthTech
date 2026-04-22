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
| AI | LangChain + Groq | Admissions Q&A, interview prep, contextual guidance |
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
- Groq API key

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

Required local env for auth:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY` if you want the AI routes to work
- `GROQ_MODEL` (optional) to override the default model
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

### Database Setup

1. Create a new Supabase project
2. Run `supabase/schema.sql` in the SQL editor to create all tables
3. Run `supabase/seed.sql` to load sample data
4. Copy your project URL and anon key into `.env.local`

### Auth Setup

The app now uses Supabase Auth for email/password login, Google login, onboarding, and account settings.

For a fresh project:

1. Run `supabase/schema.sql`
2. Run `supabase/seed.sql`

For an existing project that already has the older `public.users` table:

1. Run `supabase/migrations/20260422_add_auth_profile_fields.sql`

Supabase Auth provider setup:

1. In Supabase, enable Email auth
2. If you want Google sign-in, enable the Google provider
3. Add these redirect URLs in Supabase Auth:
   `http://localhost:3000/auth/callback`
   your production `/auth/callback` URL when deployed

Notes:

- App routes are protected by middleware; `/` and `/login` stay public
- New users are redirected to `/onboarding` until required profile fields are filled
- Account email/password management lives in `/settings`

---

## Project Structure

```
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (chat, chance calculator)
│   │   ├── chance/             # Chance calculator
│   │   ├── chat/               # AI premed advisor
│   │   ├── dashboard/          # Personal dashboard
│   │   ├── interview-prep/     # Mock interviews
│   │   ├── login/              # Authentication
│   │   ├── my-list/            # Saved school list
│   │   ├── onboarding/         # Profile setup wizard
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
│   ├── migrations/             # Incremental SQL migrations for existing projects
│   └── seed.sql                # Sample data
├── scripts/                    # Python data pipeline
│   ├── parse_msar_pdf.py       # PDF parsing
│   ├── scrape_school_data.py   # Web scraping
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
| `/interview-prep` | Interview Prep | Mock MMI and traditional interviews |
| `/timeline` | Timeline | AMCAS/TMDSAS/AACOMAS deadline tracker |
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
- **salary_data** — BLS-style salary rows (optional import; no in-app salary explorer)
- **saved_schools** — User school lists with tier classification
- **chat_history** — AI conversation logs with context metadata

Full DDL with indexes and RLS policies: `supabase/schema.sql`

---

## Data Sources

| Source | Type | Trust Level |
|--------|------|-------------|
| AAMC FACTS (A-23) | Acceptance grids | Official |
| UT Austin HPO Reports | Outcomes by school | Official |
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
| Coder 4 — AI Whisperer | Claude integration, chat, interview prep |

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
