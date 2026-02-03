# Gloomhaven Card Injector

A Chrome extension that replaces placeholder card images on [gloomhaven.smigiel.us](https://gloomhaven.smigiel.us/) with full card artwork.

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `tools/card-injector` folder
6. Visit [gloomhaven.smigiel.us](https://gloomhaven.smigiel.us/) — matched cards will show a magenta border

## Usage

- Click the extension icon in Chrome toolbar to toggle on/off
- Cards with matching artwork will automatically display the full card image
- A magenta border indicates successfully replaced cards

## Adding New Cards

1. Add card images to `images/{CharacterName}/` as `.jpeg` files
2. Use lowercase filenames with hyphens (e.g., `fearsome-taunt.jpeg`)
3. Run `python scripts/generate-cards-json.py` to update the manifest
4. Update `tools/card-injector/cards.js` with the new manifest data

## Updating the Extension

After pulling new changes:
1. Go to `chrome://extensions/`
2. Find "Gloomhaven Card Injector"
3. Click the refresh icon (🔄)
4. Reload the gloomhaven page
