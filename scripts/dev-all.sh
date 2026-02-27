#!/bin/bash

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BOT_DIR="$ROOT_DIR/Discord Bot"
BOT_PYTHON="${BOT_PYTHON:-}"

SITE_LOG="$ROOT_DIR/site.log"
BOT_LOG="$BOT_DIR/bot.log"
BOT_PID_FILE="$BOT_DIR/lost-bot.pid"

SITE_PID=""
BOT_PID=""
CLEANED_UP="0"

cleanup() {
  if [ "$CLEANED_UP" = "1" ]; then
    return
  fi
  CLEANED_UP="1"
  echo
  echo "Stopping development services..."
  [ -n "$SITE_PID" ] && kill "$SITE_PID" >/dev/null 2>&1 || true
  [ -n "$BOT_PID" ] && kill "$BOT_PID" >/dev/null 2>&1 || true
}

trap cleanup INT TERM EXIT

resolve_bot_python() {
  local candidates=()
  local py=""

  if [ -n "$BOT_PYTHON" ] && [ -x "$BOT_PYTHON" ]; then
    candidates+=("$BOT_PYTHON")
  fi
  if command -v python3 >/dev/null 2>&1; then
    candidates+=("$(command -v python3)")
  fi
  if [ -x "$BOT_DIR/.venv/bin/python" ]; then
    candidates+=("$BOT_DIR/.venv/bin/python")
  fi

  for py in "${candidates[@]}"; do
    if "$py" -c 'import discord' >/dev/null 2>&1; then
      echo "$py"
      return
    fi
  done

  if [ "${#candidates[@]}" -gt 0 ]; then
    echo "${candidates[0]}"
    return
  fi

  echo "python3"
}

resolve_cert_file() {
  local py="$1"
  local cert_path=""

  cert_path="$("$py" -c 'import certifi; print(certifi.where())' 2>/dev/null || true)"
  if [ -z "$cert_path" ]; then
    cert_path="$(python3 -c 'import certifi; print(certifi.where())' 2>/dev/null || true)"
  fi
  if [ -n "$cert_path" ] && [ -f "$cert_path" ]; then
    echo "$cert_path"
  fi
}

# Ensure no previous bot worker is still holding PID lock.
cleanup_existing_bot_worker() {
  if [ -f "$BOT_PID_FILE" ]; then
    existing_pid="$(cat "$BOT_PID_FILE" 2>/dev/null || true)"
    if [ -n "${existing_pid:-}" ] && kill -0 "$existing_pid" >/dev/null 2>&1; then
      echo "Stopping previous bot worker (PID $existing_pid) ..."
      kill "$existing_pid" >/dev/null 2>&1 || true
      sleep 1
    fi
    rm -f "$BOT_PID_FILE" >/dev/null 2>&1 || true
  fi

  # Fallback: stop stray bot.py workers running from this workspace.
  stray_pids="$(pgrep -f "$BOT_DIR/bot.py" 2>/dev/null || true)"
  if [ -n "$stray_pids" ]; then
    echo "Cleaning stray bot workers ..."
    kill $stray_pids >/dev/null 2>&1 || true
    sleep 1
  fi
}

for port in 3000; do
  pids="$(lsof -ti :$port 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    echo "Freeing port $port ..."
    kill $pids >/dev/null 2>&1 || true
  fi
done

cleanup_existing_bot_worker

PYTHON_BIN="$(resolve_bot_python)"
CERT_FILE="$(resolve_cert_file "$PYTHON_BIN")"
echo "Bot Python: $PYTHON_BIN"
if [ -n "${CERT_FILE:-}" ]; then
  echo "SSL cert bundle: $CERT_FILE"
else
  echo "SSL cert bundle: default Python trust store"
fi

echo "Starting LOST website on http://localhost:3000 ..."
(
  cd "$ROOT_DIR"
  PORT=3000 npm run dev > "$SITE_LOG" 2>&1
) &
SITE_PID=$!

sleep 2

echo "Starting Discord bot worker ..."
(
  cd "$BOT_DIR"
  if [ -n "${CERT_FILE:-}" ]; then
    SSL_CERT_FILE="$CERT_FILE" REQUESTS_CA_BUNDLE="$CERT_FILE" CURL_CA_BUNDLE="$CERT_FILE" "$PYTHON_BIN" bot.py > "$BOT_LOG" 2>&1
  else
    "$PYTHON_BIN" bot.py > "$BOT_LOG" 2>&1
  fi
) &
BOT_PID=$!

echo "Running:"
echo " - Website: http://localhost:3000"
echo " - Discord Bot Worker: ON"
echo " - Bot Panel: OFF (managed via LOST admin dashboard)"
echo "Logs:"
echo " - $SITE_LOG"
echo " - $BOT_LOG"
echo "Press CTRL+C to stop all."

wait -n "$SITE_PID" "$BOT_PID"
exit_code=$?
echo "One service exited (code $exit_code)."
exit "$exit_code"
