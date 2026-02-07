#!/usr/bin/env bash
# Simple daily sync runner for Spotify monthly listeners
# Usage: CRON_SECRET=... BASE_URL=http://localhost:3000 ./scripts/cron/sync-listeners.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "CRON_SECRET is required" >&2
  exit 1
fi

curl -fsS "${BASE_URL}/api/cron/sync-listeners?secret=${CRON_SECRET}" -X POST
