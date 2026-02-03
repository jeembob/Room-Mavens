#!/usr/bin/env python3
"""Download card images for all characters listed in linksandnames.md."""

import sys
from pathlib import Path

from scraper import extract_images


BASE_URL = "https://gloomhavencards.com/gh2/characters/"


def parse_linksandnames(filepath: Path) -> list[tuple[str, str]]:
    """Parse linksandnames.md and return list of (folder_name, url_part) tuples."""
    entries = []
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('Folder name'):
                continue
            parts = [p.strip() for p in line.split(',')]
            if len(parts) == 2:
                entries.append((parts[0], parts[1]))
    return entries


def main():
    scanner_dir = Path(__file__).parent
    repo_root = scanner_dir.parent.parent
    images_dir = repo_root / "images"
    linksandnames_file = scanner_dir / "linksandnames.md"
    
    characters = parse_linksandnames(linksandnames_file)
    print(f"Found {len(characters)} characters to download")
    
    for folder_name, url_part in characters:
        url = BASE_URL + url_part
        output_dir = images_dir / folder_name
        
        print(f"\n{'='*60}")
        print(f"Downloading: {folder_name} from {url}")
        print(f"Output: {output_dir}")
        print('='*60)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            images = extract_images(url, "card-img", str(output_dir))
            print(f"Downloaded {len(images)} cards for {folder_name}")
        except Exception as e:
            print(f"Error downloading {folder_name}: {e}")
    
    print("\n" + "="*60)
    print("All downloads complete!")


if __name__ == "__main__":
    main()
