# BankrollKit Capture Privacy Policy

Last updated: March 7, 2026

`BankrollKit Capture` is a Chrome extension that lets users sign in to BankrollKit, capture sportsbook bet drafts from the active tab, and send those drafts to the BankrollKit web application.

## What the extension accesses

The extension accesses:

- account email and password entered by the user in the extension popup
- the active browser tab only when the user explicitly clicks capture
- bet draft information visible on the current sportsbook page, such as bookmaker, event, market, selection, odds and stake when available
- local extension state stored in Chrome, such as session token, connected user, saved draft preview and lightweight account snapshot

## How the data is used

The extension uses this data only to:

- authenticate the user with the BankrollKit web application
- capture and normalize a draft bet from the current page
- send the draft to BankrollKit for preview or save
- show the user a compact account snapshot inside the extension popup

The extension does not use captured data for advertising.

## Data storage

The extension stores a small amount of data locally in Chrome storage, including:

- application URL
- session token
- connected user email
- connected device metadata
- latest draft capture
- compact account summary returned by BankrollKit

This local data is used only to keep the extension signed in and usable between sessions.

## Data sharing

The extension sends data only to the configured BankrollKit backend, which by default is:

- `https://bankrollkit.netlify.app`

Captured draft data is sent only when the user explicitly requests preview or save.

## Page access behavior

The extension does not continuously scrape every page.
It injects the page parser only when the user clicks the capture action in the popup.

## Third parties

The extension does not sell user data.
The extension does not share user data with third-party advertisers or data brokers.

The BankrollKit backend may rely on infrastructure providers required to operate the service, such as hosting, database and billing providers.

## Security

We take reasonable steps to limit retained data inside the extension and to transmit requests only to the BankrollKit backend over HTTPS in production.

## User choices

Users can:

- disconnect the extension at any time
- remove the extension from Chrome
- clear local extension data by disconnecting or uninstalling the extension

## Contact

For privacy questions related to BankrollKit Capture, contact:

- `matheus.puppe@gmail.com`
