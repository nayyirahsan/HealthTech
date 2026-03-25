# Data Pipeline Scripts

Python scripts for parsing, scraping, and loading data into Supabase.

## Setup

```bash
cd scripts
pip install -r requirements.txt
cp ../.env.example ../.env.local  # fill in Supabase credentials
```

## Scripts

| Script | Purpose |
|--------|---------|
| `parse_msar_pdf.py` | Parse MSAR PDF reports into structured school stats JSON |
| `scrape_school_data.py` | Scrape secondary prompts and interview data from public sources |
| `load_salary_data.py` | Import BLS physician salary data into Supabase |
| `seed_supabase.py` | Read JSON outputs from other scripts and insert into Supabase tables |

## Usage

Run scripts from the project root:

```bash
python scripts/parse_msar_pdf.py
python scripts/scrape_school_data.py
python scripts/load_salary_data.py
python scripts/seed_supabase.py
```
