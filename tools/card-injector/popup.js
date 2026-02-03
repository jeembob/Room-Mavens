const toggle = document.getElementById('toggle');
const status = document.getElementById('status');
const refreshBtn = document.getElementById('refresh');

chrome.storage.local.get(['enabled'], (result) => {
  const enabled = result.enabled !== false;
  toggle.checked = enabled;
  updateStatus(enabled);
  updateIcon(enabled);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ enabled }, () => {
    updateStatus(enabled);
    updateIcon(enabled);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes('gloomhaven.smigiel.us')) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});

refreshBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.reload(tabs[0].id);
    }
  });
});

function updateStatus(enabled) {
  status.textContent = enabled ? 'Replacing card images' : 'Disabled';
}

function updateIcon(enabled) {
  const iconPath = enabled ? 'icons/icon-on.png' : 'icons/icon-off.png';
  chrome.action.setIcon({ path: { 16: iconPath, 48: iconPath, 128: iconPath } });
}
