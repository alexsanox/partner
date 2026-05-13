# Architecture Overview

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | Bun |
| Database | PostgreSQL via Prisma ORM |
| Auth | better-auth |
| Payments | Stripe (subscriptions + webhooks) |
| Game Panel | Pelican Panel (Pterodactyl fork) |
| Cache / Rate Limiting | Redis (ioredis) |
| Email | Resend |
| CAPTCHA | Cloudflare Turnstile |
| Reverse Proxy | Caddy |
| DNS / CDN | Cloudflare |

## Monorepo Structure

```
partner/
├── apps/
│   └── web/                  # Main Next.js application
│       ├── src/
│       │   ├── app/          # Next.js App Router pages & API routes
│       │   ├── components/   # React components
│       │   ├── lib/          # Server utilities (db, auth, stripe, pelican, redis)
│       │   └── proxy.ts      # Edge middleware (rate limiting, CSP, security headers)
│       └── .env              # Environment variables
└── packages/
    └── db/
        └── prisma/
            └── schema.prisma # Database schema
```

## Request Flow

```
User Browser
    │
    ▼
Cloudflare (DNS + DDoS protection)
    │
    ▼
Caddy (TLS termination, reverse proxy)
    │
    ├── novally.tech → localhost:6785 (Next.js app)
    ├── panel.novally.tech → PHP-FPM (Pelican Panel)
    └── node.novally.tech → localhost:8080 (Wings daemon)
                │
                ▼
        proxy.ts (Next.js Edge Middleware)
        - Rate limiting via Redis
        - Security headers (CSP, HSTS, etc.)
                │
                ▼
        Next.js App Router
        - Pages (dashboard, admin, marketing)
        - API routes (/api/*)
                │
                ├── PostgreSQL (via Prisma)
                ├── Redis (sessions, rate limiting)
                ├── Stripe API
                ├── Pelican API
                └── Resend API
```

## Service Lifecycle

```
User signs up
    │
    ▼
Selects plan → Stripe Checkout
    │
    ▼
Stripe webhook → invoice.paid
    │
    ▼
Order marked PAID → Service created (PENDING)
    │
    ▼
Pelican API → server created (PROVISIONING)
    │
    ▼
Service → ACTIVE (user can access)
    │
    ├── Payment fails → SUSPENDED → Pelican suspended
    ├── Subscription cancelled → CANCELLED → Pelican suspended
    └── 3 days after SUSPENDED/CANCELLED → auto-deleted from Pelican + DB
```
