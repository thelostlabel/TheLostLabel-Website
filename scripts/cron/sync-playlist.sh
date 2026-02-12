#!/usr/bin/env bash
# Daily playlist and prerelease sync runner
# Usage: CRON_SECRET=lost_sync_secret_12345 BASE_URL=http://localhost:3000 ./scripts/cron/sync-playlist.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-lost_sync_secret_12345}"

echo "[$(date)] Starting Playlist Sync..."
curl -fsS "${BASE_URL}/api/cron/sync-playlist?secret=${CRON_SECRET}" -X POST
echo "[$(date)] Sync Completed Successfully."
