# Environment Variables

File location: `/opt/pobble/apps/web/.env`

## Required Variables

### Application
| Variable | Example | Description |
|---|---|---|
| `NODE_ENV` | `production` | Node environment |
| `NEXT_PUBLIC_APP_URL` | `https://novally.tech` | Public app URL |
| `BETTER_AUTH_SECRET` | `<32-byte base64>` | Auth secret — generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `https://novally.tech` | Auth base URL |

### Database
| Variable | Example | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://pobble:password@localhost:5432/pobble` | PostgreSQL connection string — **no special chars in password** |

### Redis
| Variable | Example | Description |
|---|---|---|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |

### Stripe
| Variable | Example | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Stripe publishable key (baked into build) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe webhook signing secret |

### Pelican Panel
| Variable | Example | Description |
|---|---|---|
| `PELICAN_URL` | `https://panel.novally.tech` | Pelican Panel base URL |
| `PELICAN_API_KEY` | `ptla_...` | Pelican admin API key |

### Email (Resend)
| Variable | Example | Description |
|---|---|---|
| `RESEND_API_KEY` | `re_...` | Resend API key |
| `EMAIL_FROM` | `noreply@novally.tech` | Sender email address |

### Cloudflare Turnstile
| Variable | Example | Description |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4...` | Turnstile site key (public, baked into build) |
| `TURNSTILE_SECRET_KEY` | `0x4...` | Turnstile secret key |

### Cron
| Variable | Example | Description |
|---|---|---|
| `CRON_SECRET` | `<hex string>` | Secret for `/api/cron/cleanup` — generate with `openssl rand -hex 32` |

## Notes

- Variables prefixed with `NEXT_PUBLIC_` are embedded into the client bundle at **build time** — changing them requires a rebuild.
- All other variables are server-side only and only need a **service restart** to take effect.
- Never use special characters (`@`, `#`, `%`) in `DATABASE_URL` password without URL-encoding them (e.g. `@` → `%40`). Simplest fix: use a plain alphanumeric password.
