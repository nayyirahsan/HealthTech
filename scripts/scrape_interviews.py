from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
import sys
import os
import time
sys.path.append(os.path.dirname(__file__))
from utils import write_json, normalize_school_name

def scrape_school_interview(page, url, school_name):
    page.goto(url, wait_until="load", timeout=60000)
    page.wait_for_timeout(2000)
    html = page.content()
    soup = BeautifulSoup(html, "html.parser")
    
    result = {"school_name": normalize_school_name(school_name), "source": "sdn"}
    
    # Get section questions and answers
    sample_questions = []
    tips = []
    
    sections = soup.find_all("p", class_=lambda c: c and "font-semibold" in c)
    for section in sections:
        title = section.get_text(strip=True)
        # Find the answers list after this section
        answers_ul = section.find_next("ul")
        if answers_ul:
            for li in answers_ul.find_all("li"):
                text = li.get_text(strip=True)
                if text and len(text) > 5:
                    if "prepare" in title.lower():
                        tips.append(text)
                    elif "question" in title.lower():
                        sample_questions.append(text)
    
    # Get interview format
    format_text = None
    modality_div = soup.find("div", string=lambda t: t and "Interview Modality" in t)
    if modality_div:
        format_text = modality_div.find_next("div").get_text(strip=True)
    
    result["sample_questions"] = sample_questions[:5]
    result["tips"] = tips[:5]
    result["format"] = format_text
    
    return result

def scrape_interviews():
    print("Scraping SDN interview feedback...")
    base_url = "https://www.studentdoctor.net/schools-database/medical-school/interview-feedback"
    
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        # Get list of all schools
        page.goto(base_url, wait_until="load", timeout=120000)
        page.wait_for_timeout(5000)
        html = page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        # Find all school links
        school_links = []
        for a in soup.find_all("a", href=True):
            if "/interview-feedback/summary/" in a["href"]:
                name = a.get_text(strip=True)
                if name:
                    school_links.append((name, "https://www.studentdoctor.net" + a["href"] if a["href"].startswith("/") else a["href"]))
        
        print(f"Found {len(school_links)} schools")
        
        results = []
        for i, (name, url) in enumerate(school_links):  # Start with 20 to test
            print(f"  [{i+1}/{len(school_links)}] {name}")
            result = scrape_school_interview(page, url, name)
            if result["sample_questions"] or result["tips"]:
                results.append(result)
            time.sleep(1)
        
        browser.close()
    
    print(f"\nTotal schools scraped: {len(results)}")
    write_json(results, "interviews_sdn.json")
    return results

if __name__ == "__main__":
    scrape_interviews()