#!/usr/bin/env bash
# Daily playlist and prerelease sync runner
# Usage: CRON_SECRET=lost_sync_secret_12345 BASE_URL=http://localhost:3000 ./scripts/cron/sync-playlist.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-lost_sync_secret_12345}"

echo "[$(date)] Starting Standalone Node Sync..."
node --env-file=.env scripts/cron/sync.mjs
echo "[$(date)] Sync Completed Successfully."
