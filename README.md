# RapidRead Extension
Browser extension that bold parts of words to enhance readability

## Features
### Selective Bolding Based on Sentence Length
+ Automatically bolds the first few letters of each word only within sentences that contain at least X words. The value of X is user-defined, allowing for flexible customization based on reading preferences.

### User-Friendly Popup Interface
+ Provides an intuitive popup with:
  + A toggle switch to enable or disable the bolding feature.
  + A number input field where users can set the minimum number of words per sentence (X) required for bolding to activate.
 
### Dynamic Content Handling with MutationObserver
+ Utilizes the `MutationObserver` API to monitor and process dynamically loaded content on webpages. This ensures that newly added text elements are automatically bolded in real-time without needing to reload the page.

### HTML Elements Whitelisting for Targeted Processing
+ Implements a whitelist of specific HTML tags (e.g., `<p>`, `<div>`, `<span>`) to ensure that only designated elements are processed for bolding. This approach enhances performance and prevents unintended modifications in non-targeted sections like navigation bars or footers.

### Persistent User Preferences with Chrome Storage API
+ Leverages Chrome's `storage.sync` API to save user settings, including the bolding toggle state and the minimum word count (X). This guarantees that user preferences are retained across browser sessions and synchronized across devices if Chrome Sync is enabled.
