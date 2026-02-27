#!/usr/bin/env bash
# Daily playlist and prerelease sync runner
# Usage: CRON_SECRET=YOUR_SECRET BASE_URL=http://localhost:3000 ./scripts/cron/sync-playlist.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "CRON_SECRET is required" >&2
  exit 1
fi

echo "[$(date)] Starting Standalone Node Sync..."
node --env-file=.env scripts/cron/sync.mjs
echo "[$(date)] Sync Completed Successfully."
