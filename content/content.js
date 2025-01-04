// content.js

let boldEnabled = false;
let minWords = 4; // Default value
let mutationObserver = null;

// Add a WeakSet to keep track of processed nodes
const processedNodes = new WeakSet();

// List of HTML tag names to process (whitelist)
const WHITELIST = [
    'P', 'LI', 'SPAN', 'DIV', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'TD', 'TH', 'BLOCKQUOTE', 'PRE', 'LABEL', 'BUTTON', 'ARTICLE', 'SECTION'
];

// Regular expression to split text into sentences
const SENTENCE_REGEX = /[^.!?]+[.!?]+[\])'"`’”]*|.+$/g;

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

// Helper function to check if a node is inside a marked element
function isInsideMarkedElement(node) {
    let current = node.parentElement;
    while (current) {
        if (current.hasAttribute('data-bold-extension')) {
            return true;
        }
        current = current.parentElement;
    }
    return false;
}

// Function to check if a text node's parent is in the whitelist
function isParentWhitelisted(node) {
    const parent = node.parentElement;
    if (!parent) return false;
    return WHITELIST.includes(parent.tagName);
}

// Function to split text into sentences
function splitIntoSentences(text) {
    return text.match(SENTENCE_REGEX) || [];
}

// Function to count words in a sentence
function countWords(sentence) {
    // Split the sentence by whitespace and filter out empty strings
    return sentence.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Function to process a single text node
function processTextNode(node) {
    const parent = node.parentNode;
    if (!parent) return;

    // Skip certain elements
    if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.isContentEditable) {
        return;
    }

    // Avoid reprocessing nodes inside already marked elements
    if (isInsideMarkedElement(node)) {
        return;
    }

    const text = node.nodeValue;
    const sentences = splitIntoSentences(text);

    // Initialize an array to hold processed sentences
    const processedSentences = [];

    sentences.forEach(sentence => {
        const wordCount = countWords(sentence);
        if (wordCount >= minWords) { // Updated condition
            // Process each word in the sentence
            const processedSentence = sentence.replace(/\b\w+\b/g, (word) => {
                // Check if it's a word (letters only)
                if (/^\w+$/.test(word)) {
                    return boldWord(word);
                } else {
                    return word;
                }
            });
            processedSentences.push(processedSentence);
        } else {
            // Leave the sentence unchanged
            processedSentences.push(sentence);
        }
    });

    // Reconstruct the processed text
    const newHTML = processedSentences.join('');

    if (newHTML !== text) {
        // Create a replacement span and mark it
        const span = document.createElement('span');
        span.setAttribute('data-bold-extension', 'true'); // Mark the replacement span
        span.innerHTML = newHTML;
        parent.replaceChild(span, node);
    }
}

// Function to traverse and process text nodes using TreeWalker
function traverseAndProcess() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Filter out empty or whitespace-only text nodes
                if (!node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Skip if already processed
                if (processedNodes.has(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Check if the text node is visible
                const parentElement = node.parentElement;
                if (parentElement) {
                    const style = window.getComputedStyle(parentElement);
                    if (style && (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                }
                // Check if the parent element is in the whitelist
                if (!isParentWhitelisted(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                // Check if inside a marked element
                if (isInsideMarkedElement(node)) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );

    let node;
    const nodesToProcess = [];

    while (node = walker.nextNode()) {
        nodesToProcess.push(node);
    }

    // Process nodes in chunks to avoid blocking
    const chunkSize = 100; // Number of nodes per batch
    let index = 0;

    function processChunk() {
        const end = Math.min(index + chunkSize, nodesToProcess.length);
        for (; index < end; index++) {
            processTextNode(nodesToProcess[index]);
            processedNodes.add(nodesToProcess[index]);
        }
        if (index < nodesToProcess.length) {
            // Use setTimeout to allow the browser to handle other tasks
            setTimeout(processChunk, 0);
        }
    }

    processChunk();
}

// Function to apply bolding to the entire document
function applyBolding() {
    traverseAndProcess();
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
                // Disconnect observer while applying changes
                if (mutationObserver) {
                    mutationObserver.disconnect();
                }

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

    if (request.minWords !== undefined) {
        minWords = request.minWords;
        if (boldEnabled) {
            try {
                // Disconnect observer while reapplying changes
                if (mutationObserver) {
                    mutationObserver.disconnect();
                }

                // Option 1: Reload the page to reset all bolding
                window.location.reload();

                // Option 2: Remove existing bolding and reapply without reloading
                // To implement Option 2, additional logic is needed to remove existing bolding
                // This can be complex and is not covered in this implementation
            } catch (e) {
                console.error('Error updating minWords:', e);
                showReloadNotification();
            }
        }
    }
});

// Function to observe DOM changes for dynamic content
function observeDOMChanges() {
    if (mutationObserver) return;

    mutationObserver = new MutationObserver((mutations) => {
        // Disconnect observer to prevent recursive calls
        mutationObserver.disconnect();

        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (!processedNodes.has(node) && node.nodeValue.trim()) {
                        // Check if the text node is visible
                        const parentElement = node.parentElement;
                        if (parentElement) {
                            const style = window.getComputedStyle(parentElement);
                            if (style && (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')) {
                                return;
                            }
                        }

                        // Check if inside a marked element
                        if (isInsideMarkedElement(node)) {
                            return;
                        }

                        // Check if the parent element is in the whitelist
                        if (!isParentWhitelisted(node)) {
                            return;
                        }

                        processTextNode(node);
                        processedNodes.add(node);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
                    // Traverse child text nodes within the added element
                    const walker = document.createTreeWalker(
                        node,
                        NodeFilter.SHOW_TEXT,
                        {
                            acceptNode: function(textNode) {
                                if (!textNode.nodeValue.trim() || processedNodes.has(textNode)) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                // Check if the text node is visible
                                const parentElement = textNode.parentElement;
                                if (parentElement) {
                                    const style = window.getComputedStyle(parentElement);
                                    if (style && (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')) {
                                        return NodeFilter.FILTER_REJECT;
                                    }
                                }
                                // Check if the parent element is in the whitelist
                                if (!isParentWhitelisted(textNode)) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                // Check if inside a marked element
                                if (isInsideMarkedElement(textNode)) {
                                    return NodeFilter.FILTER_REJECT;
                                }
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        },
                        false
                    );

                    let textNode;
                    const nodesToProcess = [];
                    while (textNode = walker.nextNode()) {
                        nodesToProcess.push(textNode);
                    }

                    nodesToProcess.forEach(textNode => {
                        processTextNode(textNode);
                        processedNodes.add(textNode);
                    });
                }
            });
        });

        // Reconnect the observer
        mutationObserver.observe(document.body, { childList: true, subtree: true });
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
}

// Initialize based on storage
chrome.storage.sync.get(['boldEnabled', 'minWords'], (result) => {
    boldEnabled = result.boldEnabled || false;
    minWords = result.minWords || 4;
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
