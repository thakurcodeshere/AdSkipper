// Handle basic initialization
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ adSkipperEnabled: true });
});
