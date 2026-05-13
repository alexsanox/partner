# API Reference

All API routes live under `src/app/api/`. Authentication is handled via `better-auth` session cookies.

## Authentication

### `POST /api/auth/sign-in/email`
Sign in with email + password.

### `POST /api/auth/sign-up/email`
Register a new account.

### `POST /api/auth/forget-password`
Send password reset email.

### `POST /api/auth/reset-password`
Reset password with token.

---

## Plans

### `GET /api/plans`
Returns all active plans ordered by `sortOrder`.

**Response:**
```json
[
  {
    "id": "...",
    "name": "Iron",
    "slug": "iron",
    "type": "MINECRAFT",
    "ramMb": 4096,
    "priceMonthly": 1600,
    ...
  }
]
```

---

## Billing

### `POST /api/checkout`
Creates a Stripe Checkout session.

**Body:**
```json
{
  "planId": "...",
  "billingCycle": "MONTHLY",
  "serverName": "My Server"
}
```

**Response:** `{ "url": "https://checkout.stripe.com/..." }`

### `POST /api/billing/cancel`
Cancels a subscription at end of billing period.

**Body:** `{ "serviceId": "..." }`

### `POST /api/billing/reactivate`
Removes the scheduled cancellation on a subscription.

**Body:** `{ "serviceId": "..." }`

---

## Webhooks

### `POST /api/webhooks/stripe`
Stripe webhook handler. Verifies signature via `STRIPE_WEBHOOK_SECRET`.

**Handled events:**
| Event | Action |
|---|---|
| `invoice.paid` | Marks order PAID, provisions service on Pelican |
| `checkout.session.completed` | Fallback for checkout completion |
| `invoice.payment_failed` | Suspends service, sends payment failed email |
| `customer.subscription.deleted` | Cancels service, sends cancellation email |
| `invoice.upcoming` | Sends renewal reminder email |

---

## Pelican (Server Management)

All routes require authentication. Operates on servers owned by the authenticated user.

### `GET /api/pelican/servers`
Lists user's servers from Pelican.

### `GET /api/pelican/servers/[id]`
Get a single server's details.

### `POST /api/pelican/servers/[id]/power`
**Body:** `{ "action": "start" | "stop" | "restart" | "kill" }`

### `GET /api/pelican/servers/[id]/console`
SSE stream of console output via `ws-bridge.mjs`.

### `GET /api/pelican/servers/[id]/resources`
CPU, memory, disk usage stats.

### `GET /api/pelican/servers/[id]/files`
List files at a path.

### `POST /api/pelican/servers/[id]/files`
File operations: read, write, delete, rename, create-folder, download.

### `GET /api/pelican/servers/[id]/backups`
List backups.

### `POST /api/pelican/servers/[id]/backups`
Create or delete a backup.

### `GET /api/pelican/servers/[id]/players`
List online players (RCON).

---

## Tickets

### `GET /api/tickets`
List authenticated user's support tickets.

### `POST /api/tickets`
Create a new ticket.

**Body:** `{ "subject": "...", "message": "...", "priority": "MEDIUM" }`

### `POST /api/tickets/[id]`
Reply to a ticket or close it.

---

## Cron

### `POST /api/cron/cleanup`
Requires `Authorization: Bearer <CRON_SECRET>` header.

Suspends services in `SUSPENDED` status on Pelican, then hard-deletes services that have been `SUSPENDED`/`CANCELLED` for 3+ days.

**Response:**
```json
{
  "ok": true,
  "suspended": 2,
  "deleted": 1,
  "errors": []
}
```

---

## Admin Routes

All admin routes require `role === "admin"` on the session.

### `GET /api/admin/services`
List services (excludes deleted).

### `PATCH /api/admin/services`
**Body:** `{ "serviceId": "...", "action": "suspend" | "unsuspend" | "cancel" | "delete" }`

- `suspend` — suspends on Pelican + marks DB
- `unsuspend` — unsuspends on Pelican + marks DB
- `cancel` — suspends on Pelican + marks CANCELLED in DB
- `delete` — **deletes from Pelican** + hard-deletes from DB

### `GET /api/admin/plans`
List all plans.

### `POST /api/admin/plans`
Create a plan. Price in **cents**.

### `PATCH /api/admin/plans`
Update a plan.

### `DELETE /api/admin/plans`
Delete a plan (only if no active services).

### `GET /api/admin/users`
List users.

### `PATCH /api/admin/users/[id]`
Ban/unban user, change role.

### `POST /api/admin/users/impersonate`
Impersonate a user session.

### `GET /api/admin/orders`
List orders.

### `GET /api/admin/eggs`
Fetch available Pelican eggs.
