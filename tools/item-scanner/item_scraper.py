import asyncio
import json
import re
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL = "https://gloomhaven.smigiel.us"
ANON_URL = "https://gloomhaven.smigiel.us/v2/#/c/s/shop-items/?anon=a14207-09530f8a-a011-49fa-9016-861e7e61f1a6"
REPO_ROOT = Path(__file__).parent.parent.parent
OUTPUT_DIR = REPO_ROOT / "images" / "Items"
JSON_OUTPUT = REPO_ROOT / "extension" / "itemcards.json"


async def scrape_items():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print(f"Navigating to {ANON_URL}")
        await page.goto(ANON_URL, wait_until="networkidle")
        
        # Wait for the overlay-card elements to appear
        print("Waiting for item cards to load...")
        await page.wait_for_selector("div.overlay-card", timeout=30000)
        
        # Give extra time for all cards to render
        await asyncio.sleep(2)
        
        # Extract all item cards
        cards = await page.query_selector_all("div.overlay-card")
        print(f"Found {len(cards)} item cards")
        
        items = []
        for i, card in enumerate(cards):
            try:
                # Extract name
                name_elem = await card.query_selector("p.name")
                name = await name_elem.inner_text() if name_elem else f"Unknown_{i}"
                name = name.strip()
                
                # Extract cost
                cost_elem = await card.query_selector("p.cost")
                cost = await cost_elem.inner_text() if cost_elem else "0"
                cost = cost.strip()
                
                # Extract item code
                code_elem = await card.query_selector("p.code")
                code = await code_elem.inner_text() if code_elem else str(i)
                code = code.strip()
                
                # Extract equip slot icon SVG content (nested svg inside svg.icon)
                equip_slot_elem = await card.query_selector("div.equip-slot svg.icon > svg")
                equip_slot_svg = None
                if equip_slot_elem:
                    equip_slot_svg = await equip_slot_elem.evaluate("el => el.outerHTML")
                
                # Extract image URL from the image tag inside the SVG
                image_elem = await card.query_selector("svg.fs_image image")
                image_href = await image_elem.get_attribute("href") if image_elem else None
                
                if image_href:
                    # Build full URL if relative
                    if image_href.startswith("/"):
                        image_url = BASE_URL + image_href
                    else:
                        image_url = image_href
                    
                    # Generate filename from name
                    safe_name = "".join(c if c.isalnum() or c in " -_" else "" for c in name)
                    safe_name = safe_name.replace(" ", "_")
                    ext = Path(image_href).suffix or ".webp"
                    filename = f"{code}_{safe_name}{ext}"
                    
                    items.append({
                        "name": name,
                        "code": code,
                        "cost": cost,
                        "equip_slot_svg": equip_slot_svg,
                        "image_url": image_url,
                        "local_image": f"images/Items/{filename}"
                    })
                    
                    print(f"  [{code}] {name} - {cost}g")
                    
            except Exception as e:
                print(f"Error processing card {i}: {e}")
        
        # Download images
        print(f"\nDownloading {len(items)} images...")
        for item in items:
            try:
                response = await page.request.get(item["image_url"])
                if response.ok:
                    content = await response.body()
                    filepath = OUTPUT_DIR / Path(item["local_image"]).name
                    with open(filepath, "wb") as f:
                        f.write(content)
                else:
                    print(f"  Failed to download {item['name']}: {response.status}")
            except Exception as e:
                print(f"  Error downloading {item['name']}: {e}")
        
        await browser.close()
    
    # Dedupe equip slot icons and create index
    unique_icons = []
    icon_map = {}  # svg -> index
    
    for item in items:
        svg = item.get("equip_slot_svg")
        if svg and svg not in icon_map:
            icon_map[svg] = len(unique_icons)
            unique_icons.append(svg)
    
    # Replace SVG with index in items
    for item in items:
        svg = item.pop("equip_slot_svg", None)
        item["equip_slot_icon"] = icon_map.get(svg) if svg else None
    
    # Build output with icons array and items
    output = {
        "equip_slot_icons": unique_icons,
        "items": items
    }
    
    # Save JSON
    with open(JSON_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nFound {len(unique_icons)} unique equip slot icons")
    print(f"Saved {len(items)} items to {JSON_OUTPUT}")
    print(f"Images saved to {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(scrape_items())
