# Cron Jobs

## Cleanup Job (`/api/cron/cleanup`)

Runs daily at 3am via system cron. Handles automatic server suspension and deletion.

### What it does

1. **Suspend** — Finds all services with `status = SUSPENDED` that have an `externalServerId` and suspends them on Pelican (catches any that were missed by the webhook).

2. **Auto-delete** — Finds services with `status IN (SUSPENDED, CANCELLED)` where `suspendedAt` or `cancelledAt` is older than **3 days**:
   - Deletes the server from Pelican
   - Hard-deletes the service record from the database

### Setup on Server

```bash
# Generate a secret
SECRET=$(openssl rand -hex 32)
echo "CRON_SECRET=$SECRET" >> /opt/pobble/apps/web/.env

# Create the cron job
echo "0 3 * * * root curl -s -X POST http://localhost:6785/api/cron/cleanup -H \"Authorization: Bearer $SECRET\" >> /var/log/pobble-cleanup.log 2>&1" > /etc/cron.d/pobble-cleanup
chmod 644 /etc/cron.d/pobble-cleanup
```

### Manual Run

```bash
source /opt/pobble/apps/web/.env
curl -X POST http://localhost:6785/api/cron/cleanup \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Response

```json
{
  "ok": true,
  "suspended": 2,
  "deleted": 1,
  "errors": []
}
```

### Security

- Requires `Authorization: Bearer <CRON_SECRET>` header
- Returns `401` if secret is missing or invalid
- Only callable from the server itself (internal `localhost` curl)

### Logs

```bash
tail -f /var/log/pobble-cleanup.log
```
