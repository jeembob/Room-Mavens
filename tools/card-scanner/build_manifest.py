#!/usr/bin/env python3
"""Generate cards.json manifest from images folder structure."""

import json
from pathlib import Path


def parse_linksandnames(filepath: Path) -> list[tuple[str, str]]:
    """Parse linksandnames.md and return list of (folder_name, url_part) tuples."""
    entries = []
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            # Skip header or empty lines
            if not line or line.startswith('Folder name'):
                continue
            parts = [p.strip() for p in line.split(',')]
            if len(parts) == 2:
                entries.append((parts[0], parts[1]))
    return entries


def generate_cards_manifest():
    scanner_dir = Path(__file__).parent
    repo_root = scanner_dir.parent.parent
    images_dir = repo_root / "images"
    output_file = repo_root / "tools" / "card-injector" / "cards.json"
    linksandnames_file = scanner_dir / "linksandnames.md"
    
    # Get character list from linksandnames.md
    characters = parse_linksandnames(linksandnames_file)
    
    cards = {}
    
    for folder_name, url_part in characters:
        folder_path = images_dir / folder_name
        if not folder_path.is_dir():
            print(f"  Warning: Folder not found: {folder_name}")
            continue
        
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
