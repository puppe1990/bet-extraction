# Pricing And Billing Plan

## Positioning

Ledger is not a picks product. It is a workflow and analytics product for serious sports bettors.

That means pricing should map to:
- speed of logging
- depth of analytics
- number of bankrolls
- amount of automation

## Recommended plans

### Free

**Price**
`$0`

**Purpose**
- acquisition
- habit creation
- proof of value

**Included**
- 1 bankroll
- up to 50 bets per month
- manual bet logging
- basic bankroll dashboard
- basic filters
- limited extension support

**Limits**
- no advanced analytics
- no CSV export
- no multi-bankroll
- no premium extension features

### Pro

**Price**
`$12/month`

**Purpose**
- main monetization tier

**Included**
- unlimited bets
- full Chrome extension capture
- advanced analytics
- bookmaker and market breakdowns
- ROI, yield, streak and bankroll views
- CSV export

### Pro+

**Price**
`$29/month`

**Purpose**
- monetize high-volume and power users

**Included**
- everything in Pro
- multiple bankrolls
- advanced reports
- automations
- premium workflows
- priority access to bookmaker integrations

## Annual pricing

Recommended launch structure:
- Pro yearly: `$99/year`
- Pro+ yearly: `$249/year`

This is enough discount to improve cash flow without underpricing the product.

## Packaging strategy

Free should prove the product.

Pro should unlock the extension and advanced breakdowns.

Pro+ should unlock operational leverage, not just cosmetic extras.

If the extension becomes the strongest differentiator, keep full bookmaker-aware capture inside Pro and above.

## Stripe implementation

## Products

Create two core Stripe products:
- `Ledger Pro`
- `Ledger Pro Plus`

## Prices

Recommended Stripe prices:
- `ledger_pro_monthly`
- `ledger_pro_yearly`
- `ledger_pro_plus_monthly`
- `ledger_pro_plus_yearly`

## Billing model

- subscription billing only
- no usage-based pricing at launch
- one seat per account
- free tier enforced in app logic, not Stripe

## Subscription states to support

- `trialing`
- `active`
- `past_due`
- `canceled`
- `unpaid`

## Internal entitlements model

Add a local subscription table instead of reading plan access directly from Stripe objects at runtime.

Suggested local fields:
- `user_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_price_id`
- `plan_key`
- `status`
- `current_period_end`
- `cancel_at_period_end`

That keeps authorization stable even when Stripe payloads change.

## Webhooks to handle

Recommended Stripe webhook events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## Paywall logic

### Free to Pro triggers
- user hits monthly bet cap
- user tries to export
- user opens premium analytics
- user tries to use full extension capture

### Pro to Pro+ triggers
- user wants multiple bankrolls
- user wants automations
- user wants advanced reporting

## Checkout flow

1. User clicks upgrade
2. App creates Stripe Checkout Session
3. User pays in hosted Stripe Checkout
4. Stripe sends webhook
5. Local subscription row is updated
6. App refreshes entitlements

## Recommended launch policy

- no free trial at day one
- offer free plan instead
- add annual plans only after initial monthly conversion data

If conversion is weak, test:
- `7-day Pro trial`
- or `first month at $5`

## Key pricing metrics

- free to paid conversion
- Pro vs Pro+ split
- monthly churn
- annual adoption rate
- extension users to paid conversion
- average bets logged per paid account
