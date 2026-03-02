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
- **Verified Password:** `7jlO3s6HUxET7MhLn28x7Z4sWXgbX8IHqvNMNlOpPPk5TQl7DcaKmuCo7JVTMeUJ`
- **Connection URL:** `postgresql://postgres:7jlO3s6HUxET7MhLn28x7Z4sWXgbX8IHqvNMNlOpPPk5TQl7DcaKmuCo7JVTMeUJ@the-lost-label-lost-website-ccwwn5:5432/postgres`

## ⏰ Cron Jobs (Host Machine)
Automated tasks are set in the root crontab. They target the active container dynamically.
- **Sync Playlist (04:00):** Hits `/api/cron/sync-playlist?secret=lost_sync_secret_12345`
- **Sync Listeners (05:00):** Hits `/api/cron/sync-listeners?secret=lost_sync_secret_12345`

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
*Note to future AI: Always check `.env` in the host project path if credentials fail. The Dokploy UI overrides may be present.*
