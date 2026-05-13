# Security & Rate Limiting

## Middleware (`proxy.ts`)

All requests pass through `src/proxy.ts` (Next.js Edge Middleware) which handles:

### Security Headers

Applied to every response:

| Header | Value |
|---|---|
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | See below |

### Content Security Policy

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
  https://challenges.cloudflare.com
  https://js.stripe.com
  https://dahlia.stripe.com
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https:
font-src 'self' data:
connect-src 'self'
  https://challenges.cloudflare.com
  https://api.resend.com
  https://cdn.jsdelivr.net
  https://api.stripe.com
  https://api.modrinth.com
frame-src
  https://challenges.cloudflare.com
  https://js.stripe.com
  https://hooks.stripe.com
object-src 'none'
base-uri 'self'
```

### Admin Route Headers

Extra headers added to `/admin/*`:

| Header | Value |
|---|---|
| `X-Robots-Tag` | `noindex, nofollow` |
| `Cache-Control` | `no-store` |

## Rate Limiting

Backed by Redis sliding window algorithm (`src/lib/rate-limit.ts`).

### Auth Endpoints (Soft Throttle)

No hard 429 errors — excessive requests receive an artificial **delay** instead:

| Endpoint | Limit | Window |
|---|---|---|
| `sign-in` | 10 requests | 5 minutes |
| `sign-up` | 8 requests | 5 minutes |
| `forget-password` | 5 requests | 5 minutes |
| `reset-password` | 8 requests | 5 minutes |
| `send-verification-email` | 5 requests | 5 minutes |

When limit is exceeded:
- Remaining > 0 → 1 second delay added
- Remaining = 0 → 3 second delay added
- Max delay: 5 seconds

This prevents brute force without showing errors to legitimate users with typos.

### Admin Routes

No rate limiting on `/admin` routes (admin users only).

### Redis Failure

If Redis is unavailable, rate limiting **fails open** — requests are allowed through. This prevents Redis downtime from taking down the app.

## Authentication

Handled by `better-auth`:
- Email/password with verification
- 2FA (TOTP)
- Session-based (HTTP-only cookies)
- Admin impersonation

## CAPTCHA

Cloudflare Turnstile on sign-up and contact forms. Verified server-side via `TURNSTILE_SECRET_KEY`.

## Webhook Security

Stripe webhooks are verified using `STRIPE_WEBHOOK_SECRET` (HMAC signature). Requests without a valid signature return 400.

Cron endpoint (`/api/cron/cleanup`) requires `Authorization: Bearer <CRON_SECRET>` header.
