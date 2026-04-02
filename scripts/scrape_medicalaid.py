from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import sys
import os
sys.path.append(os.path.dirname(__file__))
from utils import write_json, normalize_school_name

def scrape_medicalaid():
    print("Scraping MedicalAid...")
    url = "https://medicalaid.org/blog/medical-school-secondary-essay-prompts"
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        page.goto(url, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(3000)
        html = page.content()
        browser.close()
    
    soup = BeautifulSoup(html, "html.parser")
    results = []
    
    # Each school is in a div with class "essay-list-item"
    school_items = soup.find_all("div", class_="essay-list-item")
    print(f"Found {len(school_items)} schools")
    
    for item in school_items:
        # School name
        name_tag = item.find("span", class_="text-darkblue")
        if not name_tag:
            continue
        school_name = name_tag.get_text(strip=True)
        
        # Prompts are in essay-panel div
        panel = item.find("div", class_="essay-panel")
        if not panel:
            continue
        
        prompts = []
        for p in panel.find_all(["p", "li"]):
            text = p.get_text(strip=True)
            if text and len(text) > 20:
                prompts.append(text)
        
        if prompts:
            results.append({
                "school_name": normalize_school_name(school_name),
                "prompts": prompts,
                "source": "medicalaid"
            })
            print(f"  ✓ {school_name} — {len(prompts)} prompts")
    
    print(f"\nTotal schools scraped: {len(results)}")
    write_json(results, "secondaries_medicalaid.json")
    return results

if __name__ == "__main__":
    scrape_medicalaid()