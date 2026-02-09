#!/bin/bash

# Configuration
# This script monitors your files and automatically deploys them to the server on every save.
# Requires 'fswatch' (brew install fswatch) or similar.

echo "🔄 Monitoring files for changes... (Press CTRL+C to stop)"

# Use fswatch if available, otherwise suggest it.
if ! command -v fswatch &> /dev/null
then
    echo "❌ error: 'fswatch' is not installed."
    echo "💡 Run: 'brew install fswatch' to enable auto-sync."
    exit 1
fi

# Run deploy once at start
npm run deploy

# Watch and deploy
fswatch -o . -e "node_modules" -e ".git" -e ".next" | while read num ; do
    echo "⚡ Change detected! Syncing..."
    npm run deploy
done
