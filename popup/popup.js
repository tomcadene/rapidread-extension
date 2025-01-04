// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleBold');
    const minWordsInput = document.getElementById('minWords');

    // Initialize the checkbox state and minWords from storage
    chrome.storage.sync.get(['boldEnabled', 'minWords'], (result) => {
        toggle.checked = result.boldEnabled || false;
        minWordsInput.value = result.minWords || 4;
    });

    // Listen for checkbox changes
    toggle.addEventListener('change', () => {
        const isEnabled = toggle.checked;
        chrome.storage.sync.set({ boldEnabled: isEnabled }, () => {
            // Notify all tabs about the change
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab.id, { toggleBold: isEnabled });
                });
            });
        });
    });

    // Listen for minWords input changes
    minWordsInput.addEventListener('change', () => {
        let minWords = parseInt(minWordsInput.value, 10);
        if (isNaN(minWords) || minWords < 1) {
            minWords = 1; // Ensure minWords is at least 1
            minWordsInput.value = minWords;
        }
        chrome.storage.sync.set({ minWords: minWords }, () => {
            // Notify all tabs about the minWords change
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab.id, { minWords: minWords });
                });
            });
        });
    });
});
