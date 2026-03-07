# Ledger Chrome Extension Scaffold

This folder contains a plain Manifest V3 scaffold for the Ledger capture flow.

## Local install

1. Open `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select the `extension/` folder

## Sign-in flow

1. Open the extension popup
2. Confirm the Ledger app URL (`https://bet-extraction.netlify.app` by default)
3. Enter your email and password
4. Optionally rename the device
5. Click `Sign in`

The popup will create a persistent extension session token and store it in Chrome local storage. No copy-paste token is required.

## Sign-up flow

1. Switch the popup to `Signup`
2. Confirm the Ledger app URL (`https://bet-extraction.netlify.app` by default)
3. Enter your email, password and password confirmation
4. Click `Create account`

The extension creates the account, signs in immediately and shows a compact account snapshot.

## Current scope

- connect extension to a Ledger account
- sign in with email and password directly from the popup
- create an account directly from the popup
- show plan, balance and recent bets after auth
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
