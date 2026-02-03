const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/jeembob/Room-Mavens/main/images';

let cardNameToCharacter = {};
let normalizedToOriginal = {};

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
          }
        }
      } else if (mutation.type === 'attributes') {
        const target = mutation.target;
        if (target.tagName === 'image' || target.tagName === 'IMAGE') {
          const svg = target.closest('svg');
          if (svg) processCard(svg);
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

  const response = await fetch(chrome.runtime.getURL('cards.json'));
  const manifest = await response.json();
  
  buildCardLookup(manifest);
  console.log('[Card Injector] Loaded manifest:', Object.keys(manifest).length, 'characters');
  
  processAllCards();
  setupMutationObserver();
  console.log('[Card Injector] Active and watching for cards');
}

init();
