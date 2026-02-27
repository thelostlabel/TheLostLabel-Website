# Cron helpers

## Daily Spotify monthly listeners sync

1) Set a cron secret in your environment (same as `CRON_SECRET` in the app).
   `CRON_SECRET` is required; there is no default fallback.
2) Add a cron entry:

```
0 3 * * * BASE_URL=http://localhost:3000 CRON_SECRET=YOUR_SECRET /path/to/repo/scripts/cron/sync-listeners.sh >> /var/log/lost-cron.log 2>&1
```

For playlist sync:

```bash
BASE_URL=http://localhost:3000 CRON_SECRET=YOUR_SECRET /path/to/repo/scripts/cron/sync-playlist.sh >> /var/log/lost-cron.log 2>&1
```

If you host on Vercel, you can set a scheduled cron to call:

```
POST /api/cron/sync-listeners?secret=YOUR_SECRET
```
