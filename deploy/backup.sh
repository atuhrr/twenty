#!/bin/sh
# FORK: Voka CRM — backup diário do Postgres para Hetzner Object Storage
# Retenção: 14 diários. Roda via cron no container "backup" (03:00 UTC).
set -eu
STAMP=$(date +%Y%m%d-%H%M%S)
ARQ="/tmp/voka-${STAMP}.sql.gz"

pg_dump -h db -U voka -d voka | gzip > "$ARQ"

rclone copy "$ARQ" "hetzner:${S3_BUCKET}/postgres/" --s3-no-check-bucket
rm -f "$ARQ"

# Retenção: apaga backups com mais de 14 dias
rclone delete "hetzner:${S3_BUCKET}/postgres/" --min-age 14d

echo "[backup] ok ${STAMP}"
