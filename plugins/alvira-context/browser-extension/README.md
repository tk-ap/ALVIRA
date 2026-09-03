# ALVIRA Connect — browser extension MVP

This extension is the free browser-level adapter for ALVIRA Context. It is intentionally simple and local-first for the first implementation.

## What it does

- Stores one reviewed ALVIRA portable Context View in `chrome.storage.local`.
- Adds a `Use ALVIRA Context` button on explicitly supported AI sites.
- Inserts the saved Context into the visible prompt field only when the user clicks the button.
- Never submits or sends the prompt.

## What it does not do

- It does not read conversation history.
- It does not read cookies, passwords, or account credentials.
- It does not call ALVIRA APIs in this MVP.
- It does not modify the source Context in ALVIRA.
- It does not claim compatibility with every AI site.

## Current compatibility targets

- ChatGPT (`chatgpt.com`)
- Claude (`claude.ai`)
- Gemini (`gemini.google.com`)
- Perplexity (`perplexity.ai`)

Each target must be manually regression-tested before a store release because prompt DOMs can change without notice.

## Local test install

1. Open `chrome://extensions` in a Chromium browser.
2. Enable Developer mode.
3. Choose **Load unpacked** and select this directory.
4. In ALVIRA, create a portable Context View from `/bridge/use-elsewhere` and copy it.
5. Open the extension popup, paste the reviewed Context View, and save it.
6. Visit a supported AI site, click inside its prompt, then click **Use ALVIRA Context**.
7. Confirm the Context is inserted but not sent.

## Distribution plan

This unpacked flow is for preview/QA only. A production free-user experience should be signed and distributed through the relevant browser extension store. Native platform adapters should replace the browser extension wherever a destination offers a better free installation surface.
