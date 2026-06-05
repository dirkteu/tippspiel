#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Erst-Deploy + Updates auf dem Hetzner-Host.
#
# Nutzt nginx-bootstrap.conf (nur HTTP) für die initiale Let's-Encrypt-
# Ausstellung und schwenkt danach auf nginx.conf (HTTP + HTTPS).
#
# Voraussetzung auf der VM:
#   - Docker + Docker Compose installiert
#   - DNS A-Record für $DOMAIN zeigt auf die VM-IP
#   - .env auf dem Server vorhanden (aus .env.example abgeleitet)
#
# Aufruf:
#   ./deploy.sh                # erkennt Erst-Deploy automatisch
# =============================================================================
set -euo pipefail

DOMAIN="${DOMAIN:-tipp.dirkteu.de}"
EMAIL="${LETSENCRYPT_EMAIL:-dirkteu@gmail.com}"

cd "$(dirname "$0")"

if [ ! -f ".env" ]; then
  echo "❌ .env fehlt. Bitte aus .env.example anlegen und Production-Werte eintragen." >&2
  exit 1
fi

CERT_PATH="nginx/certbot/conf/live/$DOMAIN/fullchain.pem"

if [ ! -f "$CERT_PATH" ]; then
  echo "ℹ️  Kein Zertifikat gefunden — starte Bootstrap-Modus für $DOMAIN"
  cp nginx/nginx-bootstrap.conf nginx/nginx.active.conf
  mkdir -p nginx/certbot/www nginx/certbot/conf

  echo "▶ Web + nginx (HTTP-only) hochfahren …"
  docker compose up -d --build web nginx
  sleep 5

  echo "▶ Zertifikat anfordern …"
  docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" --agree-tos --no-eff-email

  echo "✅ Zertifikat erhalten — schwenke auf vollständige Config"
  cp nginx/nginx.conf nginx/nginx.active.conf
  docker compose up -d --build
else
  echo "✓ Zertifikat vorhanden — normaler Deploy"
  cp nginx/nginx.conf nginx/nginx.active.conf
  docker compose up -d --build
fi

echo
echo "✅ Fertig. Status:"
docker compose ps
