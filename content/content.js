// content.js

let boldEnabled = false;
let mutationObserver = null;

// Add a WeakSet to keep track of processed nodes
const processedNodes = new WeakSet();

// Function to determine how many letters to bold based on word length
function getBoldLength(wordLength) {
    if (wordLength === 1 || wordLength === 2) return 1;
    if (wordLength === 3 || wordLength === 4) return 2;
    if (wordLength === 5 || wordLength === 6) return 3;
    if (wordLength === 7 || wordLength === 8) return 4;
    if (wordLength === 9 || wordLength === 10) return 5;
    if (wordLength === 11 || wordLength === 12) return 6;
    if (wordLength === 13 || wordLength === 14) return 7;
    if (wordLength === 15 || wordLength === 16) return 8;
    if (wordLength === 17 || wordLength === 18) return 9;
    if (wordLength === 19 || wordLength === 20) return 10;
    return wordLength; // For words longer than 20 letters
}

// Function to wrap the first few letters in a <b> tag
function boldWord(word) {
    const lengthToBold = getBoldLength(word.length);
    if (lengthToBold <= 0) return word;
    const boldPart = word.substring(0, lengthToBold);
    const remaining = word.substring(lengthToBold);
    return `<b>${boldPart}</b>${remaining}`;
}

// Function to process text nodes
function processTextNode(node) {
    const parent = node.parentNode;
    if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.isContentEditable)) {
        return;
    }

    const text = node.nodeValue;
    const words = text.split(/\b/); // Split by word boundaries

    const newHTML = words.map(word => {
        // Check if it's a word (letters only)
        if (/^\w+$/.test(word)) {
            return boldWord(word);
        } else {
            return word;
        }
    }).join('');

    if (newHTML !== text) {
        const span = document.createElement('span');
        span.innerHTML = newHTML;
        parent.replaceChild(span, node);
    }
}

// Function to traverse and process all text nodes
function traverseNodes(node) {
    if (node.nodeType === Node.TEXT_NODE && !processedNodes.has(node)) {
        processTextNode(node);
        processedNodes.add(node);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
        node.childNodes.forEach(child => traverseNodes(child));
    }
}

// Function to apply bolding to the entire document
function applyBolding() {
    traverseNodes(document.body);
}

// Function to inject notification styles
function injectNotificationStyles() {
    if (document.getElementById('boldNotificationStyles')) return;

    const link = document.createElement('link');
    link.id = 'boldNotificationStyles';
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('styles/notification.css');
    document.head.appendChild(link);
}

// Function to display reload notification
function showReloadNotification() {
    injectNotificationStyles();
    if (document.getElementById('boldReloadNotification')) return;

    const notification = document.createElement('div');
    notification.id = 'boldReloadNotification';
    notification.className = 'bold-reload-notification';
    notification.textContent = 'Please reload the page for bolding to take effect.';
    document.body.appendChild(notification);
}

// Function to remove reload notification
function removeReloadNotification() {
    const notification = document.getElementById('boldReloadNotification');
    if (notification) {
        notification.remove();
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.toggleBold !== undefined) {
        boldEnabled = request.toggleBold;
        if (boldEnabled) {
            try {
                applyBolding();
                removeReloadNotification();
                observeDOMChanges();
            } catch (e) {
                console.error('Error applying bolding:', e);
                showReloadNotification();
            }
        } else {
            // Reload the page to remove bolding
            window.location.reload();
        }
    }
});

// Function to observe DOM changes for dynamic content
function observeDOMChanges() {
    if (mutationObserver) return;

    mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                traverseNodes(node);
            });
        });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
}

// Initialize based on storage
chrome.storage.sync.get(['boldEnabled'], (result) => {
    boldEnabled = result.boldEnabled || false;
    if (boldEnabled) {
        try {
            applyBolding();
            observeDOMChanges();
        } catch (e) {
            console.error('Error applying bolding on load:', e);
            showReloadNotification();
        }
    }
});
