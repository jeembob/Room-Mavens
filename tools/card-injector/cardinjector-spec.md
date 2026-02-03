# Card Injector Chrome Extension

## Goal

Build a Chrome extension that replaces placeholder card images on https://gloomhaven.smigiel.us/ with full card artwork. The extension detects SVG card elements by matching text content to known card names, then swaps the image source and hides the overlay text.

---

## How It Works

1. **Detect cards**: Find `<svg>` elements containing both an `<image>` tag (with href like `/public/images/byid/...`) and a `<text>` tag with a card name
2. **Match names**: Transform the displayed name (e.g., "Fearsome Taunt") to the image filename format (`fearsome-taunt.jpeg`)
3. **Replace image**: Swap the `<image href>` to point to the GitHub-hosted card artwork
4. **Hide text**: Make all `<text>` elements in the card transparent (non-destructive)
5. **Visual feedback**: Add a magenta border to replaced cards for debugging
6. **Dynamic updates**: Use `MutationObserver` to detect DOM changes as cards move around

---

## Name Transformation

| Web page text | Image filename |
|---------------|----------------|
| `Fearsome Taunt` | `fearsome-taunt.jpeg` |
| `Balanced Measure` | `balanced-measure.jpeg` |

Rule: lowercase, replace spaces with hyphens, append `.jpeg`

---

## Image Hosting

Images are hosted via GitHub raw URLs:
```
https://raw.githubusercontent.com/jeembob/Room-Mavens/main/images/{Character}/{card-name}.jpeg
```

Example:
```
https://raw.githubusercontent.com/jeembob/Room-Mavens/main/images/Bruiser/fearsome-taunt.jpeg
```

---

## Card Manifest

The extension fetches `cards.json` from GitHub to know available cards:
```
https://raw.githubusercontent.com/jeembob/Room-Mavens/main/tools/card-injector/cards.json
```

Format:
```json
{
  "Bruiser": ["balanced-measure", "brute-force", "fearsome-taunt", ...],
  "Tinkerer": [...]
}
```

Regenerate with: `python scripts/generate-cards-json.py`

---

## Target DOM Structure

```html
<svg fill="#5E7EBD" stroke="#5E7EBD" viewBox="0 0 400 560" class="normal status3 svelte-100h3ob selected">
    <image href="/public/images/byid/8946.image.webp" width="100%"></image>
    <text x="50%" y="34" ... font-family: GermaniaOne;">Fearsome Taunt</text>
    <text x="32" y="34" ... font-family: PirataOne;">X</text>
    <text x="50%" y="50%" ... font-family: PirataOne;">10</text>
    <rect ...></rect>
    <svg class="icon" ...>...</svg>
</svg>
```

Key detection points:
- Parent is `<svg>` element
- Contains `<image>` with `href="/public/images/byid/..."`
- Contains `<text>` with card name (use GermaniaOne font-family as hint, or just match against known card names)

---

## Extension Files to Create

```
tools/card-injector/
├── manifest.json      # Chrome extension manifest (v3)
├── content.js         # Main injection logic + MutationObserver
├── cards.json         # Card manifest (auto-generated)
└── cardinjector-spec.md
```

---

## Behavior Notes

- **Fail silently**: If a card name doesn't match any known card, leave it unchanged
- **Magenta border**: Successfully replaced cards get a magenta border for visual confirmation
- **Non-destructive**: Text is hidden via transparency, not removed
- **All character folders**: Extension searches all characters in `cards.json`, not just one

---

## Target Site

https://gloomhaven.smigiel.us/
