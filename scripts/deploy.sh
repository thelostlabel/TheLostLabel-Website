#!/bin/bash

# Configuration
SERVER_USER="site1"
SERVER_IP="87-248-157-4.sslip.io"
SERVER_PATH="/home/site1/htdocs/87-248-157-4.sslip.io"

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
echo "Next steps: SSH into the server, run 'npm install', 'npx prisma generate', and 'npm run build'."
