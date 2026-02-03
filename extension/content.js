const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/jeembob/Room-Mavens/main/images';

let cardNameToCharacter = {};
let normalizedToOriginal = {};
let itemCardsByImageId = {};
let equipSlotIcons = [];

function normalizeForMatch(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')        // strip apostrophes
    .replace(/[^\w\s-]/g, '')     // strip other punctuation
    .replace(/\s+/g, '-')         // spaces to hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
    .replace(/^-|-$/g, '');       // trim lea  ding/trailing hyphens
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = a[j - 1] === b[i - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function findClosestMatch(normalized) {
  let bestMatch = null;
  let bestDistance = Infinity;
  for (const key of Object.keys(normalizedToOriginal)) {
    const dist = levenshtein(normalized, key);
    if (dist < bestDistance && dist <= 2) {
      bestDistance = dist;
      bestMatch = key;
    }
  }
  return bestMatch ? normalizedToOriginal[bestMatch] : null;
}

function buildCardLookup(manifest) {
  for (const [character, cards] of Object.entries(manifest)) {
    for (const cardName of cards) {
      cardNameToCharacter[cardName] = character;
      const normalized = normalizeForMatch(cardName);
      normalizedToOriginal[normalized] = cardName;
    }
  }
}

function buildItemCardLookup(itemCards) {
  for (const item of itemCards) {
    const match = item.image_url.match(/\/(\d+)\.image\.webp$/);
    if (match) {
      itemCardsByImageId[match[1]] = item;
    }
  }
}

function findCardName(svgElement) {
  const textElements = svgElement.querySelectorAll('text');
  for (const textEl of textElements) {
    const text = textEl.textContent.trim();
    if (!text) continue;
    const normalized = normalizeForMatch(text);
    // Try exact match first
    let originalFilename = normalizedToOriginal[normalized];
    // Fall back to fuzzy match (within 2 edits)
    if (!originalFilename) {
      originalFilename = findClosestMatch(normalized);
    }
    if (originalFilename) {
      return { displayName: text, filename: originalFilename };
    }
  }
  return null;
}

function isCardSvg(svgElement) {
  const image = svgElement.querySelector('image');
  if (!image) return false;
  const href = image.getAttribute('href') || image.getAttribute('xlink:href');
  return href && href.includes('/public/images/byid/');
}

function processCard(svgElement) {
  if (!isCardSvg(svgElement)) return;

  const cardInfo = findCardName(svgElement);
  if (!cardInfo) return;

  const character = cardNameToCharacter[cardInfo.filename];
  const newImageUrl = `${IMAGE_BASE_URL}/${character}/${cardInfo.filename}.jpeg`;

  const imageEl = svgElement.querySelector('image');
  const currentHref = imageEl.getAttribute('href') || imageEl.getAttribute('xlink:href');
  
  if (currentHref === newImageUrl) return;

  imageEl.setAttribute('href', newImageUrl);
  if (imageEl.hasAttribute('xlink:href')) {
    imageEl.setAttribute('xlink:href', newImageUrl);
  }

  const textElements = svgElement.querySelectorAll('text');
  for (const textEl of textElements) {
    textEl.style.opacity = '0';
  }

  svgElement.style.outline = '3px solid magenta';
}

function processAllCards() {
  const svgElements = document.querySelectorAll('svg');
  for (const svg of svgElements) {
    processCard(svg);
  }
}

// --- Item Card Injection ---

function getImageIdFromHref(href) {
  if (!href) return null;
  const match = href.match(/\/(\d+)\.image\.webp$/);
  return match ? match[1] : null;
}

function isItemCardButton(button) {
  if (!button.classList.contains('image') || !button.classList.contains('cell')) return false;
  const svg = button.querySelector('svg.item');
  return !!svg;
}

function removeInjectedLabels(button) {
  const labels = button.querySelectorAll('.injected-item-label');
  labels.forEach(label => label.remove());
  const svg = button.querySelector('svg.item');
  if (svg) svg.style.outline = '';
}

function createItemLabel(className, text) {
  const p = document.createElement('p');
  p.className = `${className} top-half germania shadow injected-item-label`;
  p.textContent = text;
  
  const baseStyle = `
    position: absolute;
    margin: 0;
    z-index: 10;
    pointer-events: none;
    color: white;
  `;
  
  if (className === 'name') {
    p.style.cssText = baseStyle + `
      top: 5px;
      left: 5px;
      font-size: 14px;
    `;
  } else if (className === 'cost') {
    p.style.cssText = baseStyle + `
      top: 50%;
      right: 5px;
      transform: translateY(-50%);
      font-size: 16px;
    `;
  }
  
  return p;
}

function createEquipSlotIcon(equipSlotIndex) {
  if (equipSlotIndex === null || equipSlotIndex === undefined || !equipSlotIcons[equipSlotIndex]) return null;
  
  const div = document.createElement('div');
  div.className = 'overlay icon equip-slot injected-item-label';
  const iconSvg = equipSlotIcons[equipSlotIndex];
  div.innerHTML = iconSvg.replace('<svg ', `<svg style="width: 20px; height: 20px; fill: black; stroke: black;" `);
  
  div.style.cssText = `
    position: absolute;
    bottom: 5px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    pointer-events: none;
  `;
  
  return div;
}

function processItemCard(button) {
  if (!isItemCardButton(button)) return;
  
  const svg = button.querySelector('svg.item');
  const image = svg.querySelector('image');
  const href = image?.getAttribute('href') || image?.getAttribute('xlink:href');
  const imageId = getImageIdFromHref(href);
  
  if (!imageId || !itemCardsByImageId[imageId]) {
    removeInjectedLabels(button);
    return;
  }
  
  const item = itemCardsByImageId[imageId];
  const currentInjectedId = button.dataset.injectedImageId;
  
  if (currentInjectedId === imageId) return;
  
  removeInjectedLabels(button);
  
  button.style.position = 'relative';
  button.dataset.injectedImageId = imageId;
  
  if (item.name) {
    button.appendChild(createItemLabel('name', item.name));
  }
  if (item.cost) {
    button.appendChild(createItemLabel('cost', item.cost));
  }
  if (item.equip_slot_icon !== null && item.equip_slot_icon !== undefined) {
    const icon = createEquipSlotIcon(item.equip_slot_icon);
    if (icon) button.appendChild(icon);
  }
  
  svg.style.outline = '3px solid cyan';
  console.log('[Card Injector] Injected item labels for:', item.name);
}

function processAllItemCards() {
  const buttons = document.querySelectorAll('button.image.cell');
  for (const button of buttons) {
    processItemCard(button);
  }
}

function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'svg' || node.tagName === 'SVG') {
              processCard(node);
            }
            const nestedSvgs = node.querySelectorAll?.('svg');
            if (nestedSvgs) {
              for (const svg of nestedSvgs) {
                processCard(svg);
              }
            }
            // Check for item card buttons
            if (node.tagName === 'BUTTON' && node.classList.contains('image') && node.classList.contains('cell')) {
              processItemCard(node);
            }
            const nestedButtons = node.querySelectorAll?.('button.image.cell');
            if (nestedButtons) {
              for (const button of nestedButtons) {
                processItemCard(button);
              }
            }
          }
        }
      } else if (mutation.type === 'attributes') {
        const target = mutation.target;
        if (target.tagName === 'image' || target.tagName === 'IMAGE') {
          const svg = target.closest('svg');
          if (svg) {
            processCard(svg);
            // Also check if this is inside an item card button
            const button = svg.closest('button.image.cell');
            if (button) processItemCard(button);
          }
        } else if (target.tagName === 'svg' || target.tagName === 'SVG') {
          processCard(target);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'xlink:href', 'class']
  });
}

async function init() {
  const result = await chrome.storage.local.get(['enabled']);
  if (result.enabled === false) {
    console.log('[Card Injector] Disabled');
    return;
  }

  // Load ability cards manifest
  const response = await fetch(chrome.runtime.getURL('cards.json'));
  const manifest = await response.json();
  buildCardLookup(manifest);
  console.log('[Card Injector] Loaded ability cards:', Object.keys(manifest).length, 'characters');

  // Load item cards manifest
  const itemResponse = await fetch(chrome.runtime.getURL('itemcards.json'));
  const itemData = await itemResponse.json();
  equipSlotIcons = itemData.equip_slot_icons || [];
  buildItemCardLookup(itemData.items || []);
  console.log('[Card Injector] Loaded item cards:', Object.keys(itemCardsByImageId).length, 'items,', equipSlotIcons.length, 'icons');
  
  processAllCards();
  processAllItemCards();
  setupMutationObserver();
  console.log('[Card Injector] Active and watching for cards');
}

init();
