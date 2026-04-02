import requests
from bs4 import BeautifulSoup
import sys
import os
import time
sys.path.append(os.path.dirname(__file__))
from utils import write_json, normalize_school_name

def scrape_school_page(url, school_name):
    """Visit individual school page and extract prompts"""
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "html.parser")
    
    prompts = []
    # Prompts are usually in <li> or <p> tags in the main content
    content = soup.find("div", class_="entry-content")
    if not content:
        return prompts
    
    for li in content.find_all("li"):
        text = li.get_text(strip=True)
        if text and len(text) > 20:
            prompts.append(text)
    
    return prompts

def scrape_pd():
    print("Scraping ProspectiveDoctor...")
    url = "https://prospectivedoctor.com/medical-school-secondary-essay-prompts-database"
    
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "html.parser")
    
    table = soup.find("table", id="tablepress-1")
    links = table.find_all("a")
    print(f"Found {len(links)} schools")
    
    results = []
    for i, link in enumerate(links):
        school_name = link.get_text(strip=True)
        school_url = link["href"]
        
        prompts = scrape_school_page(school_url, school_name)
        
        if prompts:
            results.append({
                "school_name": normalize_school_name(school_name),
                "prompts": prompts,
                "source": "prospectivedoctor"
            })
            print(f"  ✓ [{i+1}/{len(links)}] {school_name} — {len(prompts)} prompts")
        else:
            print(f"  - [{i+1}/{len(links)}] {school_name} — no prompts found")
        
        # Be polite — wait a bit between requests so we don't hammer the server
        time.sleep(0.5)
    
    print(f"\nTotal schools scraped: {len(results)}")
    write_json(results, "secondaries_prospectivedoctor.json")
    return results

if __name__ == "__main__":
    scrape_pd()