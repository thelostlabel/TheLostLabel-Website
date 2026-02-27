#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BOT_DIR="$ROOT_DIR/Discord Bot"

if [ ! -d "$BOT_DIR/.git" ]; then
  echo "Discord Bot klasorunde ayri git repo bulunamadi: $BOT_DIR/.git"
  exit 1
fi

MESSAGE="${1:-bot update}"

cd "$BOT_DIR"
echo "[bot] repo: $(pwd)"
git status --short

git add .
if git diff --cached --quiet; then
  echo "[bot] commitlenecek degisiklik yok."
  exit 0
fi

git commit -m "$MESSAGE"
git push
echo "[bot] push tamamlandi."

