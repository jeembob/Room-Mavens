const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/jeembob/Room-Mavens/main/images';

let cardNameToCharacter = {};

function transformNameToFilename(displayName) {
  return displayName.toLowerCase().replace(/\s+/g, '-');
}

function buildCardLookup(manifest) {
  for (const [character, cards] of Object.entries(manifest)) {
    for (const cardName of cards) {
      cardNameToCharacter[cardName] = character;
    }
  }
}

function findCardName(svgElement) {
  const textElements = svgElement.querySelectorAll('text');
  for (const textEl of textElements) {
    const text = textEl.textContent.trim();
    if (!text) continue;
    const filename = transformNameToFilename(text);
    if (cardNameToCharacter[filename]) {
      return { displayName: text, filename };
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
  if (svgElement.dataset.cardInjected) return;
  if (!isCardSvg(svgElement)) return;

  const cardInfo = findCardName(svgElement);
  if (!cardInfo) return;

  const character = cardNameToCharacter[cardInfo.filename];
  const newImageUrl = `${IMAGE_BASE_URL}/${character}/${cardInfo.filename}.jpeg`;

  const imageEl = svgElement.querySelector('image');
  imageEl.setAttribute('href', newImageUrl);
  if (imageEl.hasAttribute('xlink:href')) {
    imageEl.setAttribute('xlink:href', newImageUrl);
  }

  const textElements = svgElement.querySelectorAll('text');
  for (const textEl of textElements) {
    textEl.style.opacity = '0';
  }

  svgElement.style.outline = '3px solid magenta';
  svgElement.dataset.cardInjected = 'true';
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
            if (node.tagName === 'svg') {
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
        if (target.tagName === 'svg') {
          processCard(target);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href', 'xlink:href']
  });
}

function init() {
  buildCardLookup(CARD_MANIFEST);
  console.log('[Card Injector] Loaded manifest:', Object.keys(CARD_MANIFEST).length, 'characters');
  
  processAllCards();
  setupMutationObserver();
  console.log('[Card Injector] Active and watching for cards');
}

init();
