#!/bin/bash
set -e

# ── Colors ─────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Config ─────────────────────────────────────────────────────────
APP_PORT=6785
APP_DIR="/opt/pobble"
DOMAIN="novally.tech"
ADMIN_DOMAIN="admin.novally.tech"
DB_NAME="pobble"
DB_USER="pobble"
SERVICE_NAME="pobble"

# ── Check root ─────────────────────────────────────────────────────
[ "$EUID" -ne 0 ] && error "Run as root: sudo bash install.sh"

info "Starting PobbleHost installation..."

# ── 1. System packages ─────────────────────────────────────────────
info "Installing system dependencies..."
apt update -y
apt install -y curl git unzip ufw fail2ban postgresql postgresql-contrib

# ── 2. Install Bun ─────────────────────────────────────────────────
if ! command -v bun &>/dev/null; then
  info "Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
else
  info "Bun already installed: $(bun --version)"
fi

# ── 3. Install Caddy ───────────────────────────────────────────────
if ! command -v caddy &>/dev/null; then
  info "Installing Caddy..."
  apt install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    | tee /etc/apt/sources.list.d/caddy-stable.list
  apt update -y && apt install -y caddy
else
  info "Caddy already installed: $(caddy version)"
fi

# ── 4. Install Redis ───────────────────────────────────────────────
if ! command -v redis-server &>/dev/null; then
  info "Installing Redis..."
  apt install -y redis-server
  systemctl enable redis-server
  systemctl start redis-server
else
  info "Redis already installed"
fi

# ── 5. PostgreSQL setup ────────────────────────────────────────────
info "Setting up PostgreSQL..."
# If user already exists, read password from existing .env to avoid resetting it
if sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
  info "DB user '${DB_USER}' already exists, reading password from existing .env..."
  EXISTING_ENV="${APP_DIR}/apps/web/.env"
  if [ -f "$EXISTING_ENV" ]; then
    DB_PASS=$(grep '^DATABASE_URL=' "$EXISTING_ENV" | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|')
  else
    DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
    warn "Could not read existing password, generated a new one. Update DATABASE_URL manually if needed."
  fi
else
  DB_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
fi

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

# ── 6. Clone / pull repo ───────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  info "Pulling latest code..."
  git -C "$APP_DIR" pull
else
  info "Cloning repository..."
  read -rp "Enter your git repo URL: " REPO_URL
  git clone "$REPO_URL" "$APP_DIR"
fi

# ── 7. Write .env ──────────────────────────────────────────────────
info "Writing environment file..."
AUTH_SECRET=$(openssl rand -base64 32)

cat > "$APP_DIR/apps/web/.env" <<EOF
DATABASE_URL=${DATABASE_URL}
BETTER_AUTH_SECRET=${AUTH_SECRET}
BETTER_AUTH_URL=https://${DOMAIN}
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
REDIS_URL=redis://localhost:6379
EOF

warn "Edit $APP_DIR/apps/web/.env to add RESEND_API_KEY, STRIPE keys, etc."

# ── 8. Install dependencies & build ───────────────────────────────
info "Installing dependencies..."
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"
cd "$APP_DIR"
bun install

info "Running database migrations..."
cd "$APP_DIR"
./node_modules/.bin/prisma db push --schema=packages/db/prisma/schema.prisma

info "Building app..."
cd "$APP_DIR/apps/web"
bun run build

# ── 9. Systemd service ─────────────────────────────────────────────
info "Creating systemd service..."
cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=PobbleHost Next.js App
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=root
WorkingDirectory=${APP_DIR}/apps/web
ExecStart=${HOME}/.bun/bin/bun run start
Restart=always
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=${APP_DIR}/apps/web/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

# ── 10. Caddy config ───────────────────────────────────────────────
info "Writing Caddy config..."
cat > /etc/caddy/Caddyfile <<EOF
${DOMAIN} {
    @admin path /admin/*
    respond @admin 403

    reverse_proxy localhost:${APP_PORT}
}

${ADMIN_DOMAIN} {
    rewrite * /admin{path}
    reverse_proxy localhost:${APP_PORT}
}
EOF

systemctl reload caddy

# ── 11. Firewall ───────────────────────────────────────────────────
info "Configuring firewall..."
ufw allow 22/tcp

# Allow only Cloudflare IPs on 80/443
for ip in \
  173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 \
  141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20 \
  197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 \
  104.24.0.0/14 172.64.0.0/13 131.0.72.0/22; do
  ufw allow from "$ip" to any port 80,443 proto tcp 2>/dev/null || true
done

ufw --force enable

# ── 12. Fail2ban ───────────────────────────────────────────────────
info "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
EOF

systemctl restart fail2ban

# ── Done ───────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  PobbleHost installation complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  App URL:    https://${DOMAIN}"
echo -e "  Admin URL:  https://${ADMIN_DOMAIN}"
echo -e "  App port:   ${APP_PORT} (internal)"
echo -e "  DB:         ${DATABASE_URL}"
echo ""
echo -e "${YELLOW}  Next steps:${NC}"
echo -e "  1. Edit ${APP_DIR}/apps/web/.env with your API keys"
echo -e "  2. Point DNS A records for ${DOMAIN} and ${ADMIN_DOMAIN} to this server"
echo -e "  3. Enable Cloudflare proxy (orange cloud) on both records"
echo -e "  4. systemctl restart ${SERVICE_NAME}"
echo ""
