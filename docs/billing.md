# Billing & Stripe

## Overview

Billing is handled entirely via Stripe subscriptions. The app never stores card details.

## Checkout Flow

```
1. User selects plan + billing cycle
2. POST /api/checkout → creates Stripe Checkout session
3. User redirected to Stripe-hosted payment page
4. On success → Stripe fires webhook events
5. invoice.paid webhook → creates Order + provisions Service
```

## Webhook Events

Configure your Stripe webhook at:
`https://novally.tech/api/webhooks/stripe`

Required events:
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.upcoming`
- `invoice.finalized`
- `checkout.session.completed`
- `customer.subscription.deleted`
- `payment_intent.payment_failed`
- `setup_intent.succeeded`

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is baked into the build — requires rebuild if changed.

## Setting Up Stripe Webhook Secret

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://novally.tech/api/webhooks/stripe`
3. Select all events listed above
4. Copy the signing secret (`whsec_...`)
5. Add to `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Restart service: `systemctl restart pobble`

## Plans & Prices

Plans store prices in **cents** in the database. The admin panel accepts **dollars** and converts automatically (`$19` → `1900` cents).

To link a plan to a Stripe Price:
1. Create a recurring price in Stripe Dashboard
2. Copy the Price ID (`price_...`)
3. Set `stripePriceIdMonthly` on the plan via admin panel

## Subscription Lifecycle

| Stripe Event | DB Action | Pelican Action |
|---|---|---|
| `invoice.paid` | Order → PAID, Service → ACTIVE | Server created |
| `invoice.payment_failed` | Service → SUSPENDED | Server suspended |
| `customer.subscription.deleted` | Service → CANCELLED | Server suspended |
| Manual admin delete | Service hard-deleted | Server deleted |
| Cron (3 days) | Service hard-deleted | Server deleted |

## Testing Webhooks Locally

```bash
stripe listen --forward-to localhost:6785/api/webhooks/stripe
```

Use test card `4242 4242 4242 4242` for successful payments.
