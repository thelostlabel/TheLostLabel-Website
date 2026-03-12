#!/bin/sh
set -eu

# Install Playwright browser in the background so it doesn't block startup.
# Uses persistent /ms-playwright volume mount to avoid re-downloading on every deploy.
if [ "${PLAYWRIGHT_INSTALL_ON_STARTUP:-0}" = "1" ]; then
  if ! ls /ms-playwright/chromium-* >/dev/null 2>&1; then
    echo "[startup] Playwright Chromium not found. Installing in background..."
    if [ -f /app/node_modules/playwright/cli.js ]; then
      (node /app/node_modules/playwright/cli.js install chromium && echo "[startup] Playwright Chromium installed successfully.") &
    else
      echo "[startup] Playwright CLI missing in runtime image."
    fi
  fi
fi

exec node server.js
