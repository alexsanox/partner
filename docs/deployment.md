# Deployment

## Server Info

| Item | Value |
|---|---|
| Server | Linux (Ubuntu) |
| App path | `/opt/pobble/apps/web` |
| Service | `pobble.service` (systemd) |
| Port | `6785` |
| Runtime | Bun |

## Systemd Service

Location: `/etc/systemd/system/pobble.service`

```ini
[Unit]
Description=PobbleHost Next.js App
After=network.target

[Service]
WorkingDirectory=/opt/pobble/apps/web
ExecStart=/root/.bun/bin/bun run start
Restart=always
EnvironmentFile=/opt/pobble/apps/web/.env
KillMode=mixed
TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
```

## Deploy Process

### Standard deploy (server-side env changes only)
```bash
systemctl restart pobble
```

### Code changes (no public env var changes)
```bash
cd /opt/pobble
git pull
cd apps/web
bun run build
systemctl restart pobble
```

### Public env var changes (`NEXT_PUBLIC_*`)
These are baked into the build — always requires rebuild:
```bash
# 1. Update .env
nano /opt/pobble/apps/web/.env

# 2. Rebuild and restart
cd /opt/pobble && git pull && cd apps/web && bun run build && systemctl restart pobble
```

## Caddy Configuration

Location: `/etc/caddy/Caddyfile`

```caddy
{
    servers :443 {
        timeouts {
            read_body 120s
        }
    }
}

novally.tech, www.novally.tech {
    reverse_proxy localhost:6785
}

panel.novally.tech {
    root * /var/www/pelican/public
    file_server
    php_fastcgi unix//run/php/php8.4-fpm.sock {
        root /var/www/pelican/public
        index index.php
        env HTTPS "on"
        read_timeout 300s
        dial_timeout 300s
        write_timeout 300s
    }
    respond /.ht* 403
}

node.novally.tech {
    reverse_proxy localhost:8080
}
```

After editing:
```bash
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

## Cloudflare DNS Setup

| Record | Type | Proxy |
|---|---|---|
| `novally.tech` | A → server IP | Proxied (orange) |
| `www.novally.tech` | CNAME → novally.tech | Proxied (orange) |
| `panel.novally.tech` | A → server IP | Proxied (orange) |
| `node.novally.tech` | A → server IP | **DNS Only (grey)** |

> `node.novally.tech` must be grey cloud — Wings requires direct TLS.

## Services on the Server

```bash
systemctl status pobble       # Next.js app
systemctl status caddy        # Reverse proxy
systemctl status postgresql   # Database
systemctl status redis        # Cache / rate limiting
systemctl status wings        # Pelican Wings daemon
```

## Logs

```bash
journalctl -u pobble -f          # App logs (live)
journalctl -u caddy -f           # Caddy logs
journalctl -u wings -f           # Wings logs
tail -f /var/log/caddy/pelican.log  # Pelican access log
```

## Database

```bash
sudo -u postgres psql -d pobble    # Connect to DB
bunx prisma studio                  # GUI (run locally with tunnel)
bunx prisma migrate deploy          # Run pending migrations
```
