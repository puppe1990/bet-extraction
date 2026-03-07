# Production Deploy

## Target stack

- Hosting: Netlify
- Database: Turso production database
- Billing: Stripe live mode
- Runtime URL: public HTTPS domain used by `APP_URL`

## Required environment variables

Set these in Netlify for the production context:

```bash
TURSO_DATABASE_URL="libsql://your-production-db-<org>.turso.io"
TURSO_AUTH_TOKEN="..."
SESSION_COOKIE_SECRET="use-a-random-secret-with-32-plus-characters"
APP_URL="https://your-production-domain.com"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_YEARLY_PRICE_ID="price_..."
STRIPE_PRO_PLUS_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_PLUS_YEARLY_PRICE_ID="price_..."
VITE_APP_TITLE="Ledger"
```

Notes:

- `SESSION_COOKIE_SECRET` must not use the local default in production.
- `APP_URL` must be the final public HTTPS URL because Checkout, Customer Portal and extension auth rely on it.
- `BOOTSTRAP_EMAIL` and `BOOTSTRAP_PASSWORD` should stay unset in production unless you intentionally want one startup bootstrap account.

## Turso production setup

1. Create a dedicated production database.
2. Generate a production token with least privilege required for the app.
3. Apply the Drizzle schema before the first public deploy.

Suggested flow:

```bash
pnpm db:generate
pnpm db:push
```

Run those commands with production Turso env vars loaded in your shell.

## Stripe production setup

1. Create live products and prices for `Pro` and `Pro+`.
2. Copy the live `price_...` IDs into Netlify env vars.
3. Create a Stripe webhook pointing to:

```text
https://your-production-domain.com/api/stripe/webhook
```

4. Subscribe to at least:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## Netlify setup

1. Connect the GitHub repo to a Netlify site.
2. Use the default build command from `netlify.toml`.
3. Set all production env vars in the Netlify UI.
4. Deploy `main`.

Useful production checks:

- app home loads
- login/signup works
- `/api/health` returns `200`
- Stripe checkout opens
- Stripe webhook updates `billing_subscriptions`

## Post-deploy smoke test

1. Open `https://your-production-domain.com/api/health`
2. Create a fresh account
3. Create one deposit and one bet
4. Settle the bet
5. Open `Settings` and confirm billing state loads
6. Run one real Stripe test purchase in live-safe conditions only when you are ready

## Rollback

If production breaks after deploy:

1. Roll back the site in Netlify to the previous successful deploy.
2. Keep the database untouched unless a schema change caused the incident.
3. If the issue is billing-related, temporarily disable Stripe checkout from the UI by removing the Stripe env vars in Netlify.
