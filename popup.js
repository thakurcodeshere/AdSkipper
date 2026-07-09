document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const skipCountEl = document.getElementById('skipCount');
  const historyListEl = document.getElementById('historyList');

  // Load toggle state
  chrome.storage.sync.get(['adSkipperEnabled'], (result) => {
    updateButton(result.adSkipperEnabled !== false);
  });

  // Load stats and history
  function loadStats() {
    chrome.storage.local.get(['adSkipCount', 'adSkipHistory'], (result) => {
      skipCountEl.textContent = result.adSkipCount || 0;
      const history = result.adSkipHistory || [];
      
      if (history.length === 0) {
          historyListEl.innerHTML = '<div style="text-align:center; color:#999; padding: 20px 0;">No ads skipped yet. Play a YouTube video!</div>';
      } else {
          historyListEl.innerHTML = history.map(item => `
            <div class="history-item">
              <span class="history-type">${item.type}</span>
              <span class="history-time">${item.time}</span>
            </div>
          `).join('');
      }
    });
  }

  // Initial load
  loadStats();

  // Listen for real-time updates while popup is open
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.adSkipCount || changes.adSkipHistory)) {
        loadStats();
    }
  });

  toggleBtn.addEventListener('click', () => {
    chrome.storage.sync.get(['adSkipperEnabled'], (result) => {
      const newState = result.adSkipperEnabled === false ? true : false;
      chrome.storage.sync.set({ adSkipperEnabled: newState }, () => {
        updateButton(newState);
      });
    });
  });

  function updateButton(enabled) {
    if (enabled) {
      toggleBtn.textContent = 'Enabled (Click to Disable)';
      toggleBtn.classList.remove('disabled');
    } else {
      toggleBtn.textContent = 'Disabled (Click to Enable)';
      toggleBtn.classList.add('disabled');
    }
  }
});
