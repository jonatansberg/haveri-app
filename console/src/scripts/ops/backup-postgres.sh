#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
mkdir -p "$BACKUP_DIR"

TS="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$BACKUP_DIR/haveri-$TS.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$FILE"
find "$BACKUP_DIR" -type f -name 'haveri-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete

echo "Backup created: $FILE"
