# BankrollKit Capture Release Checklist

## Product

- confirm login works with an existing production account
- confirm disconnect clears local extension session state
- confirm capture works on at least one live Bet365 page
- confirm unsupported pages fail gracefully with a useful message
- confirm preview and save work against production
- confirm free-plan lock message is understandable when extension capture is blocked

## Permissions

- confirm `manifest.json` no longer uses persistent `content_scripts`
- confirm capture only injects parser code on demand
- confirm requested permissions match actual extension behavior

## Store Assets

- prepare 1280x800 screenshots for the popup and capture flow
- prepare 440x280 small promo tile if needed
- confirm icon set is final enough for store listing
- review name, short description and long description

## Policy

- publish the privacy policy to a public URL
- verify support email is reachable
- confirm store listing matches real extension behavior

## Packaging

- upload [bankrollkit-capture-extension-v0.1.0.zip](/Users/matheuspuppe/Desktop/Projetos/bet-extraction/extension/bankrollkit-capture-extension-v0.1.0.zip)
- confirm archive contains `manifest.json`, popup files, background script, content script and icons
- bump version before each new store submission

## Submission Decision

Launch as beta if:

- auth works
- capture works on supported pages
- errors are readable

Hold public launch if:

- parser success is inconsistent
- store assets are weak
- privacy policy is not public yet
