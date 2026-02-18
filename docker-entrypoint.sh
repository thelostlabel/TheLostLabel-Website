#!/bin/sh
set -eu

# Install Playwright browser only when missing.
# Use persistent storage mount at /ms-playwright to avoid downloading on every deploy.
if [ "${PLAYWRIGHT_INSTALL_ON_STARTUP:-1}" = "1" ]; then
  if ! ls /ms-playwright/chromium-* >/dev/null 2>&1; then
    echo "[startup] Playwright Chromium not found. Installing once..."
    if [ -f /app/node_modules/playwright/cli.js ]; then
      node /app/node_modules/playwright/cli.js install chromium
    else
      echo "[startup] Playwright CLI missing in runtime image."
      exit 1
    fi
  fi
fi

exec node server.js
