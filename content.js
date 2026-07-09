let isEnabled = true;
let wasMutedByUs = false;
let adWasLogged = false;

chrome.storage.sync.get(['adSkipperEnabled'], (result) => {
  if (result.adSkipperEnabled !== undefined) {
    isEnabled = result.adSkipperEnabled;
  }
});

function logAdSkip(type) {
    if (adWasLogged) return;
    adWasLogged = true; // prevent duplicate logging for the same ad cycle
    
    chrome.storage.local.get(['adSkipCount', 'adSkipHistory'], (res) => {
        const count = (res.adSkipCount || 0) + 1;
        const history = res.adSkipHistory || [];
        history.unshift({
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
            type: type
        });
        if (history.length > 30) history.pop(); // keep last 30
        chrome.storage.local.set({ adSkipCount: count, adSkipHistory: history });
    });
}

function findAndSkipAd() {
  if (!isEnabled) return;

  const skipSelectors = [
    '.ytp-ad-skip-button-modern', 
    '.ytp-ad-skip-button', 
    '.ytp-skip-ad-button', 
    '.videoAdUiSkipButton',
    'button.ytp-ad-skip-button-slot',
    '#skip-button\\:k',
    '[id^="ad-text:"]'
  ];

  for (const selector of skipSelectors) {
    const buttons = document.querySelectorAll(selector);
    for (const btn of buttons) {
      if (btn && btn.offsetParent !== null) { 
        if (selector === '[id^="ad-text:"]' && !btn.innerText.toLowerCase().includes('skip')) continue;
        
        btn.click();
        logAdSkip("Button Clicked");
        console.log('[AdSkipper] Mashed skip button:', selector);
        return;
      }
    }
  }

  const isAdPlaying = document.querySelector('.ad-showing') || document.querySelector('.ad-interrupting');
  const adModule = document.querySelector('.video-ads.ytp-ad-module');
  const hasAdModule = adModule && adModule.children.length > 0;
  
  const currentlyAnAd = !!(isAdPlaying || hasAdModule);
  const video = document.querySelector('video');

  if (currentlyAnAd && video) {
    if (video.currentTime >= 5) {
      if (video.playbackRate !== 16.0) video.playbackRate = 16.0;
      if (!video.muted) {
          video.muted = true;
          wasMutedByUs = true;
      }

      showSkipperOverlay("Accelerating unskippable ad! 🚀");

      if (isFinite(video.duration) && video.duration > 0 && video.currentTime < video.duration - 0.5) {
          video.currentTime = video.duration - 0.5;
          logAdSkip("5s Forced Skip");
          console.log('[AdSkipper] Jumped to end of ad duration.');
      }
    } else {
      showSkipperOverlay(`Waiting to bypass ad... ⏳ (${Math.floor(5 - video.currentTime)}s)`);
    }
  } else if (!currentlyAnAd && video) {
    // Ad is completely gone
    if (video.playbackRate > 2) video.playbackRate = 1.0;
    if (wasMutedByUs) {
        video.muted = false;
        wasMutedByUs = false;
    }
    removeSkipperOverlay();
    adWasLogged = false; // reset logger for the next ad sequence
  }
}

let overlayElem = null;
function showSkipperOverlay(text) {
    if (!overlayElem) {
        overlayElem = document.createElement('div');
        overlayElem.id = 'ad-skipper-visual-overlay';
        overlayElem.style.position = 'absolute';
        overlayElem.style.top = '10px';
        overlayElem.style.left = '50%';
        overlayElem.style.transform = 'translateX(-50%)';
        overlayElem.style.background = 'rgba(255, 0, 0, 0.9)';
        overlayElem.style.color = '#fff';
        overlayElem.style.padding = '8px 16px';
        overlayElem.style.borderRadius = '50px';
        overlayElem.style.zIndex = '999999';
        overlayElem.style.fontWeight = 'bold';
        overlayElem.style.fontSize = '14px';
        overlayElem.style.pointerEvents = 'none';
        
        const player = document.getElementById('movie_player') || document.body;
        if (player) player.appendChild(overlayElem);
    }
    overlayElem.innerText = text;
}

function removeSkipperOverlay() {
    if (overlayElem) {
        overlayElem.remove();
        overlayElem = null;
    }
}

setInterval(findAndSkipAd, 250);
console.log('[AdSkipper] V3 Running with History Tracker.');
