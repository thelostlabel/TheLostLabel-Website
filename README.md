## LOST Website + Discord Bot

### Local Dev

```bash
npm run dev:all
```

Runs:
- Website: `http://localhost:3000`
- Discord bot worker (no separate bot panel)

### Docker / Coolify

Use root compose file:

```bash
docker compose up -d --build
```

This starts:
- `lost-website` (Next.js)
- `lost-bot` (Discord worker)

Important:
- Bot panel is disabled by design.
- Bot runtime settings are managed from website admin:
  `Dashboard > Discord Bridge`.
- Use the same PostgreSQL instance for both services.
- Keep bot tables isolated with:
  `BOT_DB_SCHEMA=discord_bot`

### DB Model

- Website uses Prisma tables in `public` schema.
- Bot uses asyncpg tables in `BOT_DB_SCHEMA` (default: `discord_bot`).
- This avoids table-name conflicts while keeping a single DB instance.
