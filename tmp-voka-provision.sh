#!/bin/bash
set -uo pipefail
cd /opt/voka

echo "=== Workspace existente (subdomain / customDomain / status) ==="
docker exec voka-crm-db-1 psql -U voka -d voka -c 'SELECT id, "displayName", subdomain, "customDomain", "activationStatus" FROM core.workspace;'

echo "=== Vars de dominio no container server ==="
docker exec voka-crm-server-1 sh -lc 'for v in SERVER_URL FRONTEND_URL DEFAULT_SUBDOMAIN IS_MULTIWORKSPACE_ENABLED DOMAIN; do printf "%s=%s\n" "$v" "$(printenv $v)"; done'

echo "=== .env (chaves relevantes, sem segredos) ==="
grep -E '^(DOMAIN|SERVER_URL|FRONTEND_URL|DEFAULT_SUBDOMAIN|IS_MULTIWORKSPACE_ENABLED|ACME_EMAIL)=' deploy/.env || true
echo -n "Existe CF_DNS_API_TOKEN no .env? "; grep -q '^CF_DNS_API_TOKEN=' deploy/.env && echo SIM || echo NAO

echo "=== Traefik: linhas de ACME / certresolver no compose ==="
grep -nE 'acme|certresolver|dnschallenge|httpchallenge|tls\.' deploy/docker-compose.prod.yml || true

echo "=== Traefik: certificados atuais no volume ==="
docker exec voka-crm-traefik-1 sh -lc 'ls -la /letsencrypt 2>/dev/null; echo "---"; wc -c /letsencrypt/acme.json 2>/dev/null'

echo "=== Traefik version ==="
docker exec voka-crm-traefik-1 traefik version 2>/dev/null | head -5
