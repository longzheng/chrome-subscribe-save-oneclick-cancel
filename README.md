# Amazon Subscribe & Save one-click cancel Chrome extension
Easy way to cancel Amazon Subscribe & Save subscriptions with just one button click.

![Explanation image](https://github.com/longzheng/chrome-subscribe-save-oneclick-cancel/assets/484912/aca44179-f7b8-4fa2-b2ed-3c4770ff82fd)

- Supports Amazon.com, Amazon.ca, Amazon.co.uk, Amazon.com.au (additional country URL need to be added to `manifest.json`)
- Adds "One-click cancel" button to each subscription
- Adds "One-click cancel all" to each delivery and all subscriptions
- Automatically clicks through the subscription dialog to cancel
- After cancellation, redirects users back to the "Deliveries" tab to cancel more subscriptions

### Install from Chrome Web Store

https://chrome.google.com/webstore/detail/lmhmoofhakpnlfighmgfkoonfkbjjgfh?authuser=0&hl=en-AU

### Install locally

1. Build the project with `npm install` and `npm run build`
1. Open Chrome "Manage Extensions" page `chrome://extensions/`
1. Enable "Developer mode" toggle in top right corner
1. Click "Load unpacked" button and select the `dist` folder in the project
