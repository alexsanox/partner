# Pelican Panel Integration

## Overview

Pelican Panel (a Pterodactyl fork) manages the actual game servers. The app communicates with it via the Pelican admin API.

## Infrastructure

```
panel.novally.tech  → Pelican Panel (PHP/Laravel + PHP-FPM via Caddy)
node.novally.tech   → Wings daemon (Go binary, port 8080)
```

> **Important:** `node.novally.tech` must be **DNS Only (grey cloud)** in Cloudflare — not proxied. Wings requires direct TLS.

## Caddyfile Configuration

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

## Pelican `.env` Requirements

```env
APP_URL=https://panel.novally.tech
TRUSTED_PROXIES=*
```

## API Key

Generate an admin API key in Pelican Panel:
1. Login to `panel.novally.tech`
2. Admin → API → Create key with full permissions
3. Add to `.env`: `PELICAN_API_KEY=ptla_...`

## Server Provisioning

When `invoice.paid` fires, the app:
1. Finds the best node (most free RAM)
2. Calls `POST /api/application/servers` on Pelican
3. Creates the server with the plan's RAM/CPU/disk limits
4. Sets `externalServerId` and `externalServerUuid` on the Service record

## Eggs

Eggs define the server software (Minecraft vanilla, Paper, Fabric, etc.).

- Eggs are fetched from Pelican via `GET /api/admin/eggs`
- Plans can have a specific `eggId` or use the default per type
- Default eggs are configured in `src/lib/pelican.ts`

## WebSocket Bridge (`ws-bridge.mjs`)

Console streaming uses a Node.js child process (`ws-bridge.mjs`) that:
1. Connects to the Pelican WebSocket for the server
2. Forwards messages to the browser via SSE

The bridge exits within 2 seconds of SIGTERM to prevent service shutdown hangs.

## Useful Pelican API Endpoints

All prefixed with `PELICAN_URL/api/application`:

| Method | Path | Description |
|---|---|---|
| GET | `/servers` | List all servers |
| POST | `/servers` | Create server |
| DELETE | `/servers/{id}` | Delete server |
| POST | `/servers/{id}/suspend` | Suspend server |
| POST | `/servers/{id}/unsuspend` | Unsuspend server |
| GET | `/nodes` | List nodes |
| GET | `/nodes/{id}/allocations` | List available ports |
