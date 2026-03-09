# 🤖 AI Server Management Guide - Lost Website

This file is designed for AI agents to understand and manage the server infrastructure for the Lost Website project.

## 🛠️ System Overview
- **Server IP:** `152.53.142.222`
- **User:** `root`
- **Architecture:** Docker Swarm managed by Dokploy.
- **Project Path (Host):** `/etc/dokploy/applications/the-lost-label-website-mwaq2s/code`
- **Project Path (Local):** `/Users/abdullah/Desktop/Projeler/Lost website`

## 🗄️ Database (PostgreSQL)
- **Hostname (Internal):** `the-lost-label-lost-website-ccwwn5`
- **Verified Password:** Stored only in Dokploy/host secrets. Do not commit it here.
- **Connection URL:** Stored only in `DATABASE_URL` runtime secret.

## ⏰ Cron Jobs (Host Machine)
Automated tasks are set in the root crontab. They target the active container dynamically.
- **Sync Playlist (04:00):** Calls `/api/cron/sync-playlist` with `Authorization: Bearer $CRON_SECRET`
- **Sync Listeners (05:00):** Calls `/api/cron/sync-listeners` with `Authorization: Bearer $CRON_SECRET`

## 🏗️ Docker & Deployment
- **Dockerfile:** Bakes Playwright Chromium into the production image.
- **Entrypoint:** `docker-entrypoint.sh` handles startup checks.
- **Clean Registry:** Run `docker container prune -f && docker image prune -f` to reclaim space.

## 🔍 Common Management Commands
### 1. Execute Command in Running Container
```bash
docker exec $(docker ps -q --filter name=the-lost-label-website-mwaq2s.1 --filter status=running | head -n 1) [COMMAND]
```

### 2. View Real-time Logs
```bash
docker service logs the-lost-label-website-mwaq2s --tail 100 -f
```

### 3. Manual Scraper Trigger (Prisma)
```bash
docker exec $(docker ps -q --filter name=the-lost-label-website-mwaq2s.1 --filter status=running | head -n 1) node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.artist.findMany({ take: 5 }).then(console.log).finally(() => prisma.\$disconnect());"
```

---
*Note to future AI: Secrets must stay in Dokploy/host environment variables only. Never commit them into repository docs or helper scripts.*
