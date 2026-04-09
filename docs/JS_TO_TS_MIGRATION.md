# JS to TS/TSX Migration Plan

104 `.js` files remaining under `app/`. All should be converted to `.ts` (API routes, utilities, config) or `.tsx` (pages, components with JSX).

## Faz 1 — API Routes: Admin (17 files)
```
app/api/admin/analytics/route.js         → .ts
app/api/admin/announcements/route.js     → .ts
app/api/admin/artist-details/route.js    → .ts
app/api/admin/artists/route.js           → .ts
app/api/admin/change-user-password/route.js → .ts
app/api/admin/communications/mail/route.js  → .ts
app/api/admin/content/route.js           → .ts
app/api/admin/cron/sync-spotify/route.js → .ts
app/api/admin/discord-bridge/route.js    → .ts
app/api/admin/releases/route.js          → .ts
app/api/admin/requests/route.js          → .ts
app/api/admin/scrape/batch/route.js      → .ts
app/api/admin/scrape/refresh/route.js    → .ts
app/api/admin/scrape/route.js            → .ts
app/api/admin/settings/route.js          → .ts
app/api/admin/stats/route.js             → .ts
app/api/admin/webhooks/route.js          → .ts
```

## Faz 2 — API Routes: Public & Artist (14 files)
```
app/api/announcements/route.js           → .ts
app/api/artist/releases/route.js         → .ts
app/api/artist/requests/route.js         → .ts
app/api/contracts/[id]/route.js          → .ts
app/api/contracts/route.js               → .ts
app/api/contracts/sign/route.js          → .ts
app/api/contracts/upload/route.js        → .ts
app/api/demo/[id]/route.js              → .ts
app/api/demo/route.js                   → .ts
app/api/releases/[id]/route.js          → .ts
app/api/requests/[id]/comments/route.js → .ts
app/api/search/route.js                 → .ts
app/api/upload/cover-art/route.js       → .ts
app/api/upload/route.js                 → .ts
```

## Faz 3 — API Routes: Discord & Internal (18 files)
```
app/api/discord/oauth/callback/route.js          → .ts
app/api/discord/oauth/start/route.js             → .ts
app/api/internal/discord/contracts/route.js      → .ts
app/api/internal/discord/demo_status/route.js    → .ts
app/api/internal/discord/demo_submit/route.js    → .ts
app/api/internal/discord/demo-status/route.js    → .ts
app/api/internal/discord/demo-submit/route.js    → .ts
app/api/internal/discord/earnings/route.js       → .ts
app/api/internal/discord/events/ack/route.js     → .ts
app/api/internal/discord/events/pull/route.js    → .ts
app/api/internal/discord/link_url/route.js       → .ts
app/api/internal/discord/link-url/route.js       → .ts
app/api/internal/discord/notify/route.js         → .ts
app/api/internal/discord/role_sync/ack/route.js  → .ts
app/api/internal/discord/role_sync/pull/route.js → .ts
app/api/internal/discord/role-sync/ack/route.js  → .ts
app/api/internal/discord/role-sync/pull/route.js → .ts
app/api/internal/discord/runtime-config/route.js → .ts
app/api/internal/discord/support_open/route.js   → .ts
app/api/internal/discord/support-open/route.js   → .ts
app/api/profile/discord-link/route.js            → .ts
```

## Faz 4 — API Routes: Files, Cron, Misc (14 files)
```
app/api/files/asset/route.js                → .ts
app/api/files/contract/[contractId]/route.js → .ts
app/api/files/demo-audio/[demoId]/route.js  → .ts
app/api/files/demo/[fileId]/audio/route.js  → .ts
app/api/files/demo/[fileId]/route.js        → .ts
app/api/files/demo/[fileId]/waveform/route.js → .ts
app/api/files/release/[releaseId]/route.js  → .ts
app/api/cron/sync-artists/route.js          → .ts
app/api/cron/sync-listeners/route.js        → .ts
app/api/cron/sync-playlist/route.js         → .ts
app/api/health/route.js                     → .ts
app/api/soundcloud/oembed/route.js          → .ts
app/api/spotify/album/[id]/route.js         → .ts
app/api/spotify/artist/[id]/route.js        → .ts
app/api/spotify/playlist/[id]/details/route.js → .ts
app/api/spotify/playlist/[id]/route.js      → .ts
app/api/spotify/track/[id]/route.js         → .ts
app/api/webhook/test/route.js               → .ts
```

## Faz 5 — Components (9 files)
```
app/components/BackgroundEffects.js  → .tsx
app/components/Footer.js             → .tsx
app/components/PageLoader.js         → .tsx
app/components/Player.js             → .tsx
app/components/PlayerContext.js       → .tsx
app/components/ReleaseCard.js        → .tsx
app/components/ScrollEffects.js      → .tsx (or .ts if no JSX)
app/components/SmoothScroll.js       → .tsx (or .ts if no JSX)
app/components/ToastContext.js       → .tsx
```

## Faz 6 — Pages & Client Components (22 files)
```
app/layout.js                              → .tsx
app/page.js                                → .tsx
app/artists/page.js                        → .tsx
app/artists/[id]/page.js                   → .tsx
app/artists/[id]/ArtistDetailClient.js     → .tsx
app/artists/ArtistsClient.js               → .tsx
app/auth/login/page.js                     → .tsx
app/auth/register/page.js                  → .tsx
app/auth/forgot-password/page.js           → .tsx
app/auth/reset-password/page.js            → .tsx
app/auth/verify-email/page.js              → .tsx
app/auth/verify-pending/page.js            → .tsx
app/auth/cinematic-auth-styles.js          → .ts
app/auth/head.js                           → .tsx
app/dashboard/head.js                      → .tsx
app/faq/page.js                            → .tsx
app/join/page.js                           → .tsx
app/privacy/page.js                        → .tsx
app/terms/page.js                          → .tsx
app/releases/page.js                       → .tsx
app/releases/[id]/page.js                  → .tsx
app/releases/[id]/ReleaseDetailClient.js   → .tsx
app/releases/ReleasesClient.js             → .tsx
app/robots.js                              → .ts
app/sitemap.js                             → .ts
```

## Rules
- API routes → `.ts` (no JSX)
- Components/pages with JSX → `.tsx`
- Pure JS utilities/config → `.ts`
- Add proper types for request/response, props, state
- Use existing project types from `@/lib/` where available
- Do NOT change logic, only add types and rename
