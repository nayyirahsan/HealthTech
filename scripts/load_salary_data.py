"""
Load physician salary data from BLS/AAMC sources into Supabase.

Reads CSV files from the Bureau of Labor Statistics and transforms
them into the salary_data table format.
"""

# TODO: import pandas, supabase


def load_bls_csv(csv_path: str) -> list[dict]:
    """Parse BLS occupational employment statistics CSV."""
    # TODO: Implement CSV parsing with pandas
    print(f"[STUB] Would load BLS data from: {csv_path}")
    return []


def main():
    print("Salary Data Loader — UT Austin Premed AI Copilot")
    print("=" * 50)

    # TODO: Add BLS CSV file paths
    print("[STUB] No CSV files configured yet. Add paths to load.")


if __name__ == "__main__":
    main()
