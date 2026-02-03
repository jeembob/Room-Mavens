#!/usr/bin/env python3
"""Generate cards.json manifest from images folder structure."""

import json
from pathlib import Path


def generate_cards_manifest():
    scanner_dir = Path(__file__).parent
    repo_root = scanner_dir.parent.parent
    images_dir = repo_root / "images"
    output_file = repo_root / "tools" / "card-injector" / "cards.json"
    
    cards = {}
    
    for folder_path in sorted(images_dir.iterdir()):
        if not folder_path.is_dir():
            continue
        
        folder_name = folder_path.name
        card_names = []
        for image_file in sorted(folder_path.iterdir()):
            if image_file.suffix.lower() in ('.jpeg', '.jpg', '.png', '.webp'):
                card_names.append(image_file.stem)
        
        if card_names:
            cards[folder_name] = card_names
        else:
            print(f"  Warning: No images in {folder_name}")
    
    with open(output_file, 'w') as f:
        json.dump(cards, f, indent=2)
    
    total_cards = sum(len(c) for c in cards.values())
    print(f"Generated cards.json with {len(cards)} character(s) and {total_cards} card(s)")
    for char, char_cards in cards.items():
        print(f"  {char}: {len(char_cards)} cards")


if __name__ == "__main__":
    generate_cards_manifest()
