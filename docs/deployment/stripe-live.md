# Stripe Live Launch

## Required live values

Set these production values in Netlify before enabling paid plans:

```bash
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_YEARLY_PRICE_ID="price_..."
STRIPE_PRO_PLUS_MONTHLY_PRICE_ID="price_..."
STRIPE_PRO_PLUS_YEARLY_PRICE_ID="price_..."
APP_URL="https://bet-extraction.netlify.app"
```

## Stripe dashboard checklist

1. Create live products:
   - `Ledger Pro`
   - `Ledger Pro Plus`
2. Create one monthly and one yearly live price for each product.
3. Enable the Customer Portal in live mode.
4. Create a live webhook pointing to:

```text
https://bet-extraction.netlify.app/api/stripe/webhook
```

## Required webhook events

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## Launch order

1. Put the live secret key in Netlify.
2. Put all live `price_...` IDs in Netlify.
3. Add the live webhook secret.
4. Trigger a production deploy.
5. Run a purchase smoke test with a real low-risk card flow in live mode.

## Smoke test

1. Open `/settings`
2. Start Checkout for `Pro`
3. Complete a live purchase
4. Confirm `billing_subscriptions` updates
5. Confirm `effectivePlanKey` becomes `pro`
6. Confirm CSV export and extension capture unlock

## Rollback

If live billing misbehaves:

1. Remove Stripe env vars from Netlify to disable checkout UI
2. Keep webhook logs for diagnosis
3. Roll back the site deploy if the issue came from code
