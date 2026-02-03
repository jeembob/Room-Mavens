const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/jeembob/Room-Mavens/main/images';

let cardNameToCharacter = {};
let normalizedToOriginal = {};
let itemCardsByImageId = {};

function normalizeForMatch(name) {
  return name
    .toLowerCase()
    .replace(/[''`]/g, '')        // strip apostrophes
    .replace(/[^\w\s-]/g, '')     // strip other punctuation
    .replace(/\s+/g, '-')         // spaces to hyphens
    .replace(/-+/g, '-')          // collapse multiple hyphens
    .replace(/^-|-$/g, '');       // trim leading/trailing hyphens
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

const EQUIP_SLOT_ICONS = {
  legs: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28.35 0 485.56 485.56"><defs><mask id="legs" fill="#000"><rect width="100%" height="100%" fill="#fff"></rect><path d="m220.74 93.9-.6 3.86c-.95 6.1-1.91 12.34-2.88 18.63-.2 1.28-.4 2.56-.62 3.85H131.9a13.17 13.17 0 1 1 0-26.34zm-6.98 44.65c-.17 1.16-.35 2.31-.54 3.46-1 6.34-2 12.58-2.88 18.63-.22 1.43-.43 2.85-.65 4.25H131.9a13.17 13.17 0 1 1 0-26.34zm-6.83 44.64c-.27 1.84-.54 3.64-.79 5.4-1 6.92-1.86 13.21-2.55 18.64-.1.79-.2 1.55-.29 2.3h-65.59a13.17 13.17 0 0 1 0-26.34zm5.5 70.98h-68.9a13.17 13.17 0 0 1 0-26.34h58.36a28.59 28.59 0 0 0 .73 3.85c1.36 5.16 4.13 11.55 7.79 18.63.66 1.27 1.34 2.56 2 3.86"></path></mask></defs><g mask="url(#legs)"><path d="M428.86 405.21c-87.35 85-193.32 73.36-193.32 73.36s0-5.81-3.49-16.3c-22.13-4.66-75.7-1.16-81.52-1.16s-17.47 18.63-21 24.45c-15.13 0-103.65-25.62-117.62-43.09-7-22.13 15.14-152.56 27.95-211.95C-22.99 61.65 7.29 12.78 7.29 12.78c64-21 101.31-12.82 138.58 1.16s80.35 5.82 83.85 9.31c1.44 1.45-3.13 32.87-9 70.68l-.6 3.86c-.95 6.1-1.91 12.34-2.88 18.63-.2 1.28-.4 2.56-.62 3.85-1 6.11-1.92 12.25-2.88 18.31-.17 1.16-.35 2.31-.54 3.46-1 6.34-2 12.58-2.88 18.63-.22 1.43-.43 2.85-.65 4.25-1 6.38-1.9 12.52-2.76 18.3-.27 1.84-.54 3.64-.79 5.4-1 6.92-1.86 13.21-2.55 18.64-.1.79-.2 1.55-.29 2.3a163.08 163.08 0 0 0-1.53 16.33 17.31 17.31 0 0 0 .12 2 27.21 27.21 0 0 0 .74 3.85c1.35 5.16 4.12 11.55 7.78 18.63.66 1.27 1.34 2.56 2 3.86 15.65 28.81 43.39 66.23 47.53 75.34 74.54-1.16 111.8 17.47 111.8 17.47l33.77-7s22.14 15.14 23.3 65.22"></path></g></svg>`,
  body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 48c-41.6 0-80 16-80 16v80s-48-16-96-16c0 64 16 128 16 128l64 32v176h192V288l64-32s16-64 16-128c-48 0-96 16-96 16V64s-38.4-16-80-16z"/></svg>`,
  head: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 32c-88.4 0-160 71.6-160 160v64c0 53 26 100 66 129v95h188v-95c40-29 66-76 66-129v-64c0-88.4-71.6-160-160-160z"/></svg>`,
  "one-hand": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M384 32L256 160 128 32 64 96l128 128-64 224h256l-64-224L448 96z"/></svg>`,
  "two-hands": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M448 32L320 160 256 96 192 160 64 32 0 96l128 128-64 224h128v-96h128v96h128l-64-224L512 96z"/></svg>`,
  small: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="160"/></svg>`
};

function getImageIdFromHref(href) {
  if (!href) return null;
  const match = href.match(/\/(\d+)\.image\.webp$/);
  return match ? match[1] : null;
}

function isItemCardWithoutLabels(button) {
  if (!button.classList.contains('image') || !button.classList.contains('cell')) return false;
  const svg = button.querySelector('svg.item');
  if (!svg) return false;
  if (button.querySelector('.name, .cost')) return false;
  return true;
}

function createItemLabel(className, text, isRotated) {
  const p = document.createElement('p');
  p.className = `${className} top-half germania shadow injected-item-label`;
  p.textContent = text;
  
  const baseStyle = `
    position: absolute;
    margin: 0;
    z-index: 10;
    pointer-events: none;
  `;
  
  if (className === 'name') {
    if (isRotated) {
      p.style.cssText = baseStyle + `
        top: 5px;
        left: 5px;
        font-size: 14px;
        transform: rotate(90deg);
        transform-origin: top left;
      `;
    } else {
      p.style.cssText = baseStyle + `
        top: 5px;
        left: 5px;
        font-size: 18px;
      `;
    }
  } else if (className === 'cost') {
    if (isRotated) {
      p.style.cssText = baseStyle + `
        bottom: 5px;
        left: 5px;
        font-size: 16px;
        transform: rotate(90deg);
        transform-origin: bottom left;
      `;
    } else {
      p.style.cssText = baseStyle + `
        bottom: 5px;
        left: 5px;
        font-size: 20px;
      `;
    }
  }
  
  return p;
}

function createEquipSlotIcon(equipSlot, isRotated) {
  if (!equipSlot || !EQUIP_SLOT_ICONS[equipSlot]) return null;
  
  const div = document.createElement('div');
  div.className = 'overlay icon equip-slot injected-item-label';
  const size = isRotated ? '20px' : '24px';
  div.innerHTML = `<svg class="icon small" fill="#6B7C9B" stroke="black" style="width: ${size}; height: ${size};">${EQUIP_SLOT_ICONS[equipSlot]}</svg>`;
  
  if (isRotated) {
    div.style.cssText = `
      position: absolute;
      bottom: 50%;
      right: 5px;
      transform: rotate(90deg) translateX(50%);
      z-index: 10;
      pointer-events: none;
    `;
  } else {
    div.style.cssText = `
      position: absolute;
      bottom: 5px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      pointer-events: none;
    `;
  }
  
  return div;
}

function processItemCard(button) {
  if (!isItemCardWithoutLabels(button)) return;
  
  const svg = button.querySelector('svg.item');
  const image = svg.querySelector('image');
  const href = image?.getAttribute('href') || image?.getAttribute('xlink:href');
  const imageId = getImageIdFromHref(href);
  
  if (!imageId || !itemCardsByImageId[imageId]) return;
  
  const item = itemCardsByImageId[imageId];
  const isRotated = svg.classList.contains('rotate');
  
  button.style.position = 'relative';
  
  if (item.name) {
    button.appendChild(createItemLabel('name', item.name, isRotated));
  }
  if (item.cost) {
    button.appendChild(createItemLabel('cost', item.cost, isRotated));
  }
  if (item.equip_slot) {
    const icon = createEquipSlotIcon(item.equip_slot, isRotated);
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
  const itemCards = await itemResponse.json();
  buildItemCardLookup(itemCards);
  console.log('[Card Injector] Loaded item cards:', Object.keys(itemCardsByImageId).length, 'items');
  
  processAllCards();
  processAllItemCards();
  setupMutationObserver();
  console.log('[Card Injector] Active and watching for cards');
}

init();
