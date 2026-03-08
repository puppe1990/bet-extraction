# BankrollKit Chrome Extension

This folder contains the Manifest V3 extension used to capture sportsbook drafts and sync them into BankrollKit.

## Release assets

- privacy policy draft: [release/privacy-policy.md](./release/privacy-policy.md)
- Chrome Web Store copy: [release/chrome-web-store-copy.md](./release/chrome-web-store-copy.md)
- release checklist: [release/release-checklist.md](./release/release-checklist.md)

## Local install

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `extension/` folder

## Sign-in flow

1. Open the extension popup
2. Enter your email and password
3. Click `Sign in`

The popup creates a persistent extension session token and stores it in Chrome local storage. No copy-paste token is required.

## Current scope

- connect extension to a BankrollKit account
- sign in with email and password directly from the popup
- show plan, balance and recent bets after auth
- capture a draft from the active tab with on-demand script injection
- heuristic parser for `Bet365`
- preview normalization through the app backend
- save the draft as an open bet in BankrollKit

## Current limitations

- Bet365 parsing is still best-effort and depends on DOM stability
- no second bookmaker parser yet
- no CLV or settlement automation
- popup is plain HTML/CSS/JS, not bundled
- Chrome Web Store release still needs privacy policy, listing copy and broader parser validation
