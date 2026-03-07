# Ledger Chrome Extension Scaffold

This folder contains a plain Manifest V3 scaffold for the Ledger capture flow.

## Local install

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `extension/` folder

## Connect flow

1. Open Ledger at `http://localhost:3000/settings`
2. Make sure the account is on `Pro` or `Pro+`
3. In the `Capture and export access` section, click `Connect Chrome extension`
4. Copy the one-time connection token
5. Open the extension popup and paste:
   - the app URL
   - the one-time token
   - the device name
6. Click `Connect extension`

The popup will exchange the short-lived token for a persistent extension access token stored in Chrome local storage.

## Current scope

- connect extension to a Ledger account
- capture a draft from the active tab
- heuristic parser for `Bet365`
- preview normalization through the app backend
- save the draft as an open bet in Ledger

## Current limitations

- Bet365 parsing is still best-effort and depends on DOM stability
- no second bookmaker parser yet
- no CLV or settlement automation
- no icon assets
- popup is plain HTML/CSS/JS, not bundled
