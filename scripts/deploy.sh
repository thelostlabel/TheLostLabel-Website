#!/bin/bash

# Configuration
SERVER_USER="thelostlabel"
SERVER_IP="thelostlabel.com"
SERVER_PATH="/home/thelostlabel/htdocs/thelostlabel.com"

echo "🚀 Starting deployment to $SERVER_IP..."

# Sync files
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  ./ $SERVER_USER@$SERVER_IP:$SERVER_PATH

echo "✅ Sync complete!"
echo "Next steps: SSH into the server, run 'npm install', 'npx playwright install chromium', 'npx prisma generate', and 'npm run build'."
