# Chrome Extension Technical Architecture

## Product goal

Let users capture bets from bookmaker pages and sync them into Ledger with minimal manual input.

## High-level system

### Web app
- TanStack Start application
- auth, bets, bankroll and dashboard logic
- API endpoints or server functions exposed through HTTP-safe handlers for extension use

### Chrome extension
- popup UI
- background service worker
- content scripts for bookmaker pages
- secure auth session or extension token exchange

### Database
- Turso / libSQL
- existing users, bets and bankroll data
- new tables for extension sessions, bookmaker parsers and event logs if needed

## Recommended extension architecture

### 1. Content scripts

Responsibilities:
- detect supported bookmaker pages
- read event name, market, selection, odds and stake from DOM
- normalize fields into a common payload
- send payload to the background worker

Recommended model:
- one parser module per bookmaker
- one shared normalized schema

Normalized payload shape:

```ts
type CapturedBetDraft = {
  bookmakerKey: string
  eventName: string
  market: string
  selection: string
  oddsDecimal?: number
  stakeAmount?: number
  placedAt?: string
  rawSourceUrl: string
  parserConfidence: "high" | "medium" | "low"
}
```

### 2. Background service worker

Responsibilities:
- coordinate messages between content script and popup
- store temporary draft state
- manage authentication token for the extension
- call app endpoints securely

The background worker should be the only extension layer that talks to the app backend.

### 3. Popup UI

Responsibilities:
- show captured draft
- let user edit values before save
- handle fallback manual entry
- display success or error feedback

Popup states:
- not logged in
- on unsupported page
- capture available
- saving
- success
- error

## Auth model

Do not rely on reading the web app cookie directly from bookmaker pages.

Recommended flow:
1. user logs into the Ledger web app
2. user visits Settings
3. app starts `Connect Chrome extension`
4. app generates a short-lived connection token
5. extension exchanges this for a persistent extension access token tied to the user
6. background worker stores token in Chrome local storage
7. extension sends authenticated requests using bearer auth

This avoids brittle cookie sharing and cross-site issues.

## Backend requirements

Add dedicated extension-facing endpoints:
- `POST /api/extension/session/exchange`
- `POST /api/extension/bets/create`
- `POST /api/extension/bets/draft`
- `GET /api/extension/me`

Server should:
- authenticate extension token
- map request to the user
- create bet as `open`
- create corresponding bankroll entry logic through existing service layer

Do not duplicate business logic in a separate extension controller. Reuse the same domain services used by the web app.

## Data model additions

Suggested tables:

### `extension_tokens`
- `id`
- `user_id`
- `name`
- `token_hash`
- `last_used_at`
- `expires_at`
- `created_at`

### `bet_capture_events`
- `id`
- `user_id`
- `bookmaker_key`
- `status`
- `parser_confidence`
- `source_url`
- `payload_json`
- `created_at`

These are useful for debugging parser quality and extension health.

## Bookmaker parser strategy

Start narrow.

Phase 1:
- support one or two bookmakers well
- use stable selectors
- fallback to manual editing in popup

Recommended parser contract:

```ts
type BookmakerParser = {
  bookmakerKey: string
  canRun: (url: string, document: Document) => boolean
  extractDraft: (document: Document, url: string) => CapturedBetDraft | null
}
```

## Reliability strategy

DOM parsers break often. Plan for it.

Mitigations:
- parser versioning by bookmaker
- confidence score in payload
- capture raw source URL
- structured event logging
- graceful fallback to manual edit when fields are missing

## Security requirements

- tokens must be hashed in the database
- extension tokens should be revocable
- connection tokens should expire quickly
- rate limit extension endpoints
- validate all payloads server-side
- never trust bookmaker DOM values without validation

## MVP scope

Include:
- popup UI
- login connect flow
- 1-2 bookmaker parsers
- create bet in Ledger
- fallback edit before save

Exclude:
- auto-settlement
- cross-browser support beyond Chrome
- CLV automation
- broad sportsbook coverage

## Delivery plan

### Phase 1
- extension auth flow
- popup shell
- one parser
- create bet endpoint

### Phase 2
- second and third parser
- event logging
- better field normalization
- premium gating

### Phase 3
- CLV support
- richer bookmaker-specific workflows
- notification and reminder loops
