// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('toggleBold');

    // Initialize the checkbox state from storage
    chrome.storage.sync.get(['boldEnabled'], (result) => {
        toggle.checked = result.boldEnabled || false;
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
});
