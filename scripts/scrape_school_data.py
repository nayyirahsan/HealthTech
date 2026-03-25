"""
Scrape secondary prompts and interview data from public sources.

Sources: Shemmassian, Inspira Advantage, SDN interview feedback.
Outputs deduplicated JSON files per school.
"""

# TODO: import requests, bs4


def scrape_secondary_prompts(school_name: str) -> list[dict]:
    """Scrape secondary essay prompts for a given school."""
    # TODO: Implement web scraping with BeautifulSoup
    print(f"[STUB] Would scrape secondaries for: {school_name}")
    return []


def scrape_interview_feedback(school_name: str) -> list[dict]:
    """Scrape SDN interview feedback for a given school."""
    # TODO: Implement web scraping
    print(f"[STUB] Would scrape interview data for: {school_name}")
    return []


def main():
    print("School Data Scraper — UT Austin Premed AI Copilot")
    print("=" * 50)

    sample_schools = [
        "Dell Medical School",
        "Baylor College of Medicine",
        "UT Southwestern",
    ]

    for school in sample_schools:
        scrape_secondary_prompts(school)
        scrape_interview_feedback(school)


if __name__ == "__main__":
    main()
