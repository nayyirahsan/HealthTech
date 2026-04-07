import requests
from bs4 import BeautifulSoup
import sys
import os
import time
sys.path.append(os.path.dirname(__file__))
from utils import write_json, normalize_school_name

def scrape_school_page(url):
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "html.parser")
    
    prompts = []
    for content in soup.find_all("div", class_="elementor-widget-container"):
        for li in content.find_all("li"):
            text = li.get_text(strip=True)
            if text and len(text) > 20:
                prompts.append(text)
    return prompts

def scrape_mis():
    print("Scraping Med School Insiders...")
    url = "https://medschoolinsiders.com/medical-school-secondary-prompts-database/"
    
    response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Links are in <p><a href="...">School Name</a></p>
    links = [a for a in soup.find_all("a") if "secondary-essay-prompts" in a.get("href", "")]
    print(f"Found {len(links)} schools")
    
    results = []
    for i, link in enumerate(links):
        school_name = link.get_text(strip=True)
        school_url = link["href"]
        
        prompts = scrape_school_page(school_url)
        
        if prompts:
            results.append({
                "school_name": normalize_school_name(school_name),
                "prompts": prompts,
                "source": "medschoolinsiders"
            })
            print(f"  ✓ [{i+1}/{len(links)}] {school_name} — {len(prompts)} prompts")
        else:
            print(f"  - [{i+1}/{len(links)}] {school_name} — no prompts found")
        
        time.sleep(0.5)
    
    print(f"\nTotal schools scraped: {len(results)}")
    write_json(results, "secondaries_medschoolinsiders.json")
    return results

if __name__ == "__main__":
    scrape_mis()