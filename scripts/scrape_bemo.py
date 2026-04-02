from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import sys
import os
sys.path.append(os.path.dirname(__file__))
from utils import write_json, normalize_school_name

def scrape_bemo():
    print("Scraping BeMo...")
    url = "https://bemoacademicconsulting.com/blog/medical-school-secondary-essays-prompt-list"
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        page.goto(url, wait_until="networkidle", timeout=60000)
        page.wait_for_timeout(3000)
        html = page.content()
        browser.close()
    
    soup = BeautifulSoup(html, "html.parser")
    results = []
    
    # Each state is a <details class="accordion">
    accordions = soup.find_all("details", class_="accordion")
    print(f"Found {len(accordions)} states")
    
    for accordion in accordions:
        content = accordion.find("section", class_="accordion__content")
        if not content:
            continue
        
        # Each school is a <p> with an <a> containing a <strong>
        school_paras = [p for p in content.find_all("p") if p.find("strong") and p.find("a")]
        
        for para in school_paras:
            school_name = para.find("strong").get_text(strip=True)
            if not school_name:
                continue
            
            prompts = []
            for sibling in para.find_next_siblings():
                if sibling.find("a") and sibling.find("strong"):
                    break
                if sibling.name in ["p", "ol", "ul"]:
                    text = sibling.get_text(strip=True)
                    if text and len(text) > 20:
                        prompts.append(text)
            
            if prompts:
                results.append({
                    "school_name": normalize_school_name(school_name),
                    "prompts": prompts,
                    "source": "bemo"
                })
                print(f"  ✓ {school_name} — {len(prompts)} prompts")
    
    print(f"\nTotal schools scraped: {len(results)}")
    write_json(results, "secondaries_bemo.json")
    return results

if __name__ == "__main__":
    scrape_bemo()