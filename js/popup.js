document.addEventListener('DOMContentLoaded', () => {
    const blockShortsToggle = document.getElementById('blockShortsToggle');
    const blockPlayablesToggle = document.getElementById('blockPlayablesToggle');
    const shortsBlockedCount = document.getElementById('shortsBlockedCount');
    const playablesBlockedCount = document.getElementById('playablesBlockedCount');
    const resetStatsButton = document.getElementById('resetStats');

    // Load initial state from storage
    chrome.storage.local.get(['shortsBlockedCount', 'playablesBlockedCount'], (result) => {
        shortsBlockedCount.textContent = result.shortsBlockedCount || 0;
        playablesBlockedCount.textContent = result.playablesBlockedCount || 0;
    });

    // Update stats periodically
    setInterval(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getStats' }, (response) => {
                if (response) {
                    shortsBlockedCount.textContent = response.shortsBlockedCount;
                    playablesBlockedCount.textContent = response.playablesBlockedCount;
                }
            });
        });
    }, 1000);

    // Handle reset stats button
    resetStatsButton.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'resetStats' }, (response) => {
                if (response && response.success) {
                    shortsBlockedCount.textContent = '0';
                    playablesBlockedCount.textContent = '0';
                }
            });
        });
    });

    // Handle toggle switches
    blockShortsToggle.addEventListener('change', (e) => {
        chrome.storage.local.set({ blockShorts: e.target.checked });
    });

    blockPlayablesToggle.addEventListener('change', (e) => {
        chrome.storage.local.set({ blockPlayables: e.target.checked });
    });

    // Load toggle states
    chrome.storage.local.get(['blockShorts', 'blockPlayables'], (result) => {
        blockShortsToggle.checked = result.blockShorts !== false;
        blockPlayablesToggle.checked = result.blockPlayables !== false;
    });
}); 