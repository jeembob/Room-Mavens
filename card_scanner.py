import easyocr
from PIL import Image
import os
import csv
import argparse
import re
import numpy as np

# Initialize EasyOCR reader (downloads model on first run)
READER = None

def get_reader():
    global READER
    if READER is None:
        print("Loading EasyOCR model...")
        READER = easyocr.Reader(['en'], gpu=False)
    return READER


DEBUG_CROPS = True  # Set to True to save crop images for debugging

def extract_card_data(image_path: str) -> dict:
    """
    Extract initiative and level from a Gloomhaven card image.
    
    Args:
        image_path: Path to the card image
        
    Returns:
        Dict with card_name, initiative, level
    """
    img = Image.open(image_path)
    width, height = img.size
    
    # Level: upper left corner (44, 40), size 32x47
    level_box = (44, 40, 44 + 32, 40 + 47)  # (left, top, right, bottom)
    
    # Initiative: position (331, 520), size 90x85
    initiative_box = (331, 520, 331 + 90, 520 + 85)  # (left, top, right, bottom)
    
    initiative_crop = img.crop(initiative_box)
    level_crop = img.crop(level_box)
    
    # Save debug crops
    if DEBUG_CROPS:
        os.makedirs("debug_crops", exist_ok=True)
        base_name = os.path.splitext(os.path.basename(image_path))[0]
        initiative_crop.save(f"debug_crops/{base_name}_initiative.png")
        level_crop.save(f"debug_crops/{base_name}_level.png")
    
    # Convert crops to numpy arrays for EasyOCR
    initiative_np = np.array(initiative_crop)
    level_np = np.array(level_crop)
    
    reader = get_reader()
    
    # OCR - allowlist only digits
    initiative_results = reader.readtext(initiative_np, allowlist='0123456789')
    level_results = reader.readtext(level_np, allowlist='0123456789')
    
    # Extract text from results
    initiative_text = initiative_results[0][1] if initiative_results else ""
    level_text = level_results[0][1] if level_results else ""
    
    # Validate range
    initiative = None
    if initiative_text.isdigit():
        val = int(initiative_text)
        if 1 <= val <= 99:
            initiative = val
    
    level = None
    if level_text.isdigit():
        val = int(level_text)
        if 1 <= val <= 9:
            level = val
    
    card_name = os.path.splitext(os.path.basename(image_path))[0]
    
    return {
        "card_name": card_name,
        "initiative": initiative,
        "level": level,
        "file": image_path
    }


def scan_cards(image_dir: str, output_csv: str) -> None:
    """
    Scan all card images in a directory and save data to CSV.
    
    Args:
        image_dir: Directory containing card images
        output_csv: Path to output CSV file
    """
    image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.webp')
    
    cards_data = []
    
    for filename in sorted(os.listdir(image_dir)):
        if filename.lower().endswith(image_extensions):
            filepath = os.path.join(image_dir, filename)
            print(f"Scanning: {filename}")
            
            try:
                data = extract_card_data(filepath)
                cards_data.append(data)
                print(f"  Initiative: {data['initiative']}, Level: {data['level']}")
            except Exception as e:
                print(f"  Error: {e}")
                cards_data.append({
                    "card_name": os.path.splitext(filename)[0],
                    "initiative": None,
                    "level": None,
                    "file": filepath
                })
    
    # Write to CSV
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["card_name", "initiative", "level", "file"])
        writer.writeheader()
        writer.writerows(cards_data)
    
    print(f"\nSaved {len(cards_data)} cards to {output_csv}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scan Gloomhaven cards and extract data")
    parser.add_argument("image_dir", nargs="?", default="images", help="Directory containing card images")
    parser.add_argument("-o", "--output", default="cards.csv", help="Output CSV file")
    
    args = parser.parse_args()
    
    scan_cards(args.image_dir, args.output)
