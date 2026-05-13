# Database Schema

PostgreSQL via Prisma ORM. Connection managed via `packages/db/prisma/schema.prisma`.

## Models

### User
Core user account.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | Display name |
| `email` | String (unique) | Email address |
| `emailVerified` | Boolean | Whether email is verified |
| `role` | String | `"user"` or `"admin"` |
| `banned` | Boolean | Account ban status |
| `twoFactorEnabled` | Boolean | 2FA enabled |

Relations: `sessions`, `accounts`, `orders`, `services`, `tickets`

---

### Plan
Hosting plans shown on the pricing page.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | Display name (e.g. "Iron") |
| `slug` | String (unique) | URL slug (e.g. "iron") |
| `type` | PlanType | `MINECRAFT`, `DISCORD_BOT`, `CUSTOM` |
| `eggId` | Int? | Pelican egg ID (null = auto-detect) |
| `ramMb` | Int | RAM in MB |
| `cpuPercent` | Int | CPU limit % |
| `diskMb` | Int | Disk in MB |
| `playerSlots` | Int | Max player slots |
| `backupSlots` | Int | Backup slots |
| `priceMonthly` | Int | Price in **cents** |
| `priceQuarterly` | Int? | Quarterly price in cents |
| `priceAnnual` | Int? | Annual price in cents |
| `stripePriceIdMonthly` | String? | Stripe Price ID for monthly |
| `isActive` | Boolean | Whether shown to users |
| `sortOrder` | Int | Display order |

---

### Order
Created when a user initiates checkout. One order per service.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `userId` | String | Owner |
| `planId` | String | Selected plan |
| `status` | OrderStatus | `PENDING → PAID → PROVISIONED` |
| `billingCycle` | BillingCycle | `MONTHLY`, `QUARTERLY`, `ANNUAL` |
| `amountCents` | Int | Amount charged in cents |
| `stripeSessionId` | String? | Stripe Checkout session ID |
| `stripeSubscriptionId` | String? | Stripe subscription ID |

---

### Service
A provisioned server. Created after an order is paid.

| Field | Type | Description |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `userId` | String | Owner |
| `planId` | String | Plan |
| `orderId` | String (unique) | Linked order |
| `status` | ServiceStatus | `PENDING → PROVISIONING → ACTIVE` |
| `name` | String | Server name |
| `externalServerId` | String? | Pelican server ID (integer as string) |
| `externalServerUuid` | String? | Pelican server UUID |
| `ipAddress` | String? | Server IP |
| `port` | Int? | Server port |
| `stripeSubscriptionId` | String? | Active Stripe subscription |
| `suspendedAt` | DateTime? | When suspended (payment failure) |
| `cancelledAt` | DateTime? | When cancelled |
| `deletedAt` | DateTime? | Soft delete timestamp |

**Status flow:**
```
PENDING → PROVISIONING → ACTIVE
                              ↓
                         SUSPENDED (payment failed)
                              ↓
                         CANCELLED (subscription ended)
                              ↓
                    [auto-deleted after 3 days]
```

---

### Node
Pelican game nodes.

| Field | Type | Description |
|---|---|---|
| `fqdn` | String | e.g. `node.novally.tech` |
| `pelicanNodeId` | Int? | ID in Pelican panel |
| `maxMemoryMb` | Int | Total RAM capacity |
| `usedMemoryMb` | Int | Currently allocated RAM |
| `status` | NodeStatus | `ACTIVE`, `MAINTENANCE`, `OFFLINE` |

---

### SupportTicket / TicketMessage
User support tickets with message threads.

---

### NewsletterSubscriber
Email newsletter signups from the marketing page.

## Enums

| Enum | Values |
|---|---|
| `PlanType` | `MINECRAFT`, `DISCORD_BOT`, `CUSTOM` |
| `BillingCycle` | `MONTHLY`, `QUARTERLY`, `ANNUAL` |
| `OrderStatus` | `PENDING`, `PAID`, `PROVISIONED`, `FAILED`, `REFUNDED`, `CANCELLED` |
| `ServiceStatus` | `PENDING`, `PROVISIONING`, `ACTIVE`, `SUSPENDED`, `CANCELLED`, `FAILED` |
| `NodeStatus` | `ACTIVE`, `MAINTENANCE`, `OFFLINE` |
| `TicketStatus` | `OPEN`, `IN_PROGRESS`, `WAITING_REPLY`, `RESOLVED`, `CLOSED` |
| `TicketPriority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |

## Migrations

```bash
cd packages/db
bunx prisma migrate dev     # dev
bunx prisma migrate deploy  # production
bunx prisma studio          # GUI
```
