chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['enabled'], (result) => {
    const enabled = result.enabled !== false;
    updateIcon(enabled);
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['enabled'], (result) => {
    const enabled = result.enabled !== false;
    updateIcon(enabled);
  });
});

function updateIcon(enabled) {
  const iconPath = enabled ? 'icons/icon-on.png' : 'icons/icon-off.png';
  chrome.action.setIcon({ path: { 16: iconPath, 48: iconPath, 128: iconPath } });
}
