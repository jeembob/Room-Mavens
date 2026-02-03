const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

chrome.storage.local.get(['enabled'], (result) => {
  const enabled = result.enabled !== false;
  toggle.checked = enabled;
  updateStatus(enabled);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ enabled }, () => {
    updateStatus(enabled);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url?.includes('gloomhaven.smigiel.us')) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
});

function updateStatus(enabled) {
  status.textContent = enabled ? 'Replacing card images' : 'Disabled';
}
