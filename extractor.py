import requests
from bs4 import BeautifulSoup
import os
import urllib.parse
import argparse
import time
import re


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}


def create_driver():
    """Create a Selenium Chrome driver."""
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument(f"user-agent={HEADERS['User-Agent']}")
    return webdriver.Chrome(options=options)


def discover_page_elements(driver):
    """Print all interactive elements on the page for debugging."""
    from selenium.webdriver.common.by import By
    
    print("\n=== PAGE ELEMENT DISCOVERY ===")
    
    print("\nRange inputs (sliders):")
    for el in driver.find_elements(By.CSS_SELECTOR, "input[type='range']"):
        print(f"  <input type='range' id='{el.get_attribute('id')}' class='{el.get_attribute('class')}' min='{el.get_attribute('min')}' max='{el.get_attribute('max')}'>")
    
    print("\nElements with 'slider' or 'range' in class:")
    for el in driver.find_elements(By.CSS_SELECTOR, "[class*='slider'], [class*='range'], [class*='level']"):
        print(f"  <{el.tag_name} id='{el.get_attribute('id')}' class='{el.get_attribute('class')}'>")
    
    print("\nSelect dropdowns:")
    for el in driver.find_elements(By.CSS_SELECTOR, "select"):
        print(f"  <select id='{el.get_attribute('id')}' class='{el.get_attribute('class')}'>")
    
    print("=== END DISCOVERY ===\n")


def set_slider(driver, slider_value: int, wait_after: int = 2):
    """Find and set level slider to a specific value."""
    from selenium.webdriver.common.by import By
    
    slider = driver.find_element(By.CSS_SELECTOR, "input#level[type='range']")
    if not slider:
        sliders = driver.find_elements(By.CSS_SELECTOR, "input[type='range']")
        if not sliders:
            print("No range sliders found.")
            return False
        slider = sliders[0]
    
    print(f"Found slider: min={slider.get_attribute('min')}, max={slider.get_attribute('max')}, current={slider.get_attribute('value')}")
    
    driver.execute_script(f"arguments[0].value = {slider_value};", slider)
    driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", slider)
    driver.execute_script("arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", slider)
    
    print(f"Set slider to {slider_value}, waiting {wait_after}s for content to update...")
    time.sleep(wait_after)
    return True


def extract_images(url: str, div_class: str, output_dir: str = "images", wait_time: int = 5) -> list[str]:
    """
    Extract all card images for a character using Selenium.
    Scrolls page to trigger lazy-loading of all images.
    
    Args:
        url: The URL of the character page
        div_class: Class name of elements containing images
        output_dir: Directory to save downloaded images
        wait_time: Seconds to wait for JS to load
    
    Returns:
        List of downloaded image paths
    """
    from selenium.webdriver.common.by import By
    
    print(f"Fetching with Selenium: {url}")
    driver = create_driver()
    
    try:
        driver.get(url)
        time.sleep(wait_time)
        
        # Set slider to max
        driver.execute_script("""
            const slider = document.querySelector('input#level[type="range"]');
            if (slider) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(slider, 9);
                slider.dispatchEvent(new Event('input', { bubbles: true }));
                slider.dispatchEvent(new Event('change', { bubbles: true }));
            }
        """)
        print("Set slider to level 9")
        time.sleep(2)
        
        # Scroll down to trigger lazy loading
        print("Scrolling to load all images...")
        last_height = driver.execute_script("return document.body.scrollHeight")
        while True:
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)
            new_height = driver.execute_script("return document.body.scrollHeight")
            if new_height == last_height:
                break
            last_height = new_height
        
        # Scroll back up and collect all images
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        # Get all image URLs from the page source
        image_urls = driver.execute_script("""
            return Array.from(document.querySelectorAll('img'))
                .map(img => img.src)
                .filter(src => src.includes('character-ability-cards'));
        """)
        
        print(f"Found {len(image_urls)} card images")
        
    finally:
        driver.quit()
    
    os.makedirs(output_dir, exist_ok=True)
    
    downloaded = []
    for i, img_url in enumerate(image_urls):
        try:
            img_response = requests.get(img_url, headers=HEADERS)
            img_response.raise_for_status()
            
            original_name = os.path.basename(urllib.parse.urlparse(img_url).path)
            if not original_name:
                original_name = f"image_{i:04d}.jpg"
            filename = os.path.join(output_dir, original_name)
            
            if os.path.exists(filename):
                print(f"Skipped (exists): {filename}")
                downloaded.append(filename)
                continue
            
            with open(filename, "wb") as f:
                f.write(img_response.content)
            
            downloaded.append(filename)
            print(f"Downloaded: {filename}")
        except Exception as e:
            print(f"Failed to download {img_url}: {e}")
    
    return downloaded


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract images from a webpage by div class")
    parser.add_argument("url", help="URL of the webpage")
    parser.add_argument("--class", dest="div_class", default="card-img", help="Class name of elements containing images (default: card-img)")
    parser.add_argument("-o", "--output", default="images", help="Output directory")
    parser.add_argument("--wait", type=int, default=3, help="Seconds to wait for JS to load (default: 3)")
    
    args = parser.parse_args()
    
    images = extract_images(args.url, args.div_class, args.output, args.wait)
    print(f"\nDownloaded {len(images)} images")
