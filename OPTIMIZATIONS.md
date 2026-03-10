### 1) Optimization Summary

* Current optimization health is **moderate-to-high risk**: the app works, but several hot paths scale linearly with table size or external API count, and a few request handlers are doing batch-job work.
* Assumptions: production data will keep growing, the app may run on more than one process/container, and there is no dedicated background queue today. Where runtime metrics are missing, findings are labeled as likely bottlenecks based on code structure.
* Top 3 highest-impact improvements:
  1. Normalize release-to-artist lookup and stop querying `artistsJson` with substring matching.
  2. Paginate and slim list endpoints, then split the dashboard into lazy-loaded modules with fewer client fetches.
  3. Move Spotify sync/scrape work out of HTTP request handlers into queued workers with batched writes and persisted retries.
* Biggest risk if no changes are made: dashboard/public API latency and cron reliability will degrade together as data grows, because the same system is paying for full-table scans, oversized responses, and long-running scrape work inside request lifecycles.

### 2) Findings (Prioritized)

* **Title**: Release ownership and artist matching depend on string scans over serialized JSON
* **Category**: DB
* **Severity**: Critical
* **Impact**: Latency, DB CPU, throughput, and correctness under scale.
* **Evidence**: `prisma/schema.prisma:145` stores `artistsJson` as `String?`. User-facing filters then use `contains` plus in-memory JSON parsing in `app/api/artist/releases/route.js:48-73`, `app/api/artist/stats/route.ts:56-81`, `app/api/search/route.js:92-129`, and `app/api/admin/releases/route.js:26-34`.
* **Why it’s inefficient**: `contains` on serialized JSON is non-sargable, so PostgreSQL cannot use a proper relational index for artist membership. The code then pays twice: broad row scans in SQL and exact-match parsing/filtering in Node. This is also brittle because artist-name substring matching in `app/api/artist/stats/route.ts:57-61` can over-match unrelated releases.
* **Recommended fix**: Add a normalized `ReleaseArtist` relation keyed by `releaseId` and `artistId`, backfill it from current release data, dual-write during migration, and switch filters to indexed equality joins. Treat `artistsJson` as a derived cache or remove it after migration.
* **Tradeoffs / Risks**: Requires a backfill, query rewrites, and a temporary compatibility layer while both schemas exist.
* **Expected impact estimate**: High. Expect materially lower scanned rows and a large drop in p95 latency on release-related endpoints once the catalog is non-trivial.
* **Removal Safety**: Needs Verification
* **Reuse Scope**: service-wide; Over-Abstracted Code

* **Title**: Multiple endpoints return full tables with wide includes and no pagination
* **Category**: I/O
* **Severity**: High
* **Impact**: Response size, Node memory, DB load, and egress cost.
* **Evidence**: Unbounded reads appear in public and admin APIs: `app/api/releases/route.ts:7-30`, `app/api/artists/route.ts:7-20`, `app/api/contracts/route.js:84-109`, `app/api/admin/users/route.ts:103-111`, `app/api/admin/artists/route.js:18-47`, `app/api/admin/requests/route.js:31-37`, `app/api/demo/route.js:188-208`, and `app/api/payments/route.ts:43-53`.
* **Why it’s inefficient**: Payload size grows with the entire dataset, not the page the user is viewing. Several of these endpoints also include related records (`user`, `artist`, `files`, `splits`, `_count`) even when the client only needs list metadata. This increases serialization cost and encourages large client-side state stores.
* **Recommended fix**: Introduce cursor pagination on every list endpoint, use narrower `select` projections, and create separate detail endpoints for heavy relations. For public endpoints, cap the result set explicitly and precompute or query only the fields needed for cards.
* **Tradeoffs / Risks**: Requires frontend pagination/infinite-scroll support and some admin-view refactoring.
* **Expected impact estimate**: High. The biggest wins are lower network transfer and less DB/Node work on every list screen.
* **Removal Safety**: Likely Safe
* **Reuse Scope**: service-wide; Reuse Opportunity

* **Title**: The dashboard ships too much JavaScript and fans out into many client-side fetches
* **Category**: Frontend
* **Severity**: High
* **Impact**: Time-to-interactive, main-thread work, and secondary API load.
* **Evidence**: `app/dashboard/page.js:5-6` statically imports both `ArtistView` and `AdminView`. `app/components/dashboard/AdminView.js:19-33` eagerly imports every admin subview, and `app/components/dashboard/AdminView.js:130-150` plus `app/components/dashboard/ArtistView.js:399-510` trigger multiple client fetches per active view. The production build links `/dashboard` to chunk `67b03312c858d8ff.js` in `.next/server/app/dashboard/page_client-reference-manifest.js:2`, and that chunk is 762 KB uncompressed in `.next/static/chunks/67b03312c858d8ff.js`.
* **Why it’s inefficient**: Users pay parse/execute cost for code they do not need yet. Then the mounted view immediately starts several independent network requests, some of which duplicate work (`/api/contracts` is fetched both for the contracts view and again for pending-contract detection in `app/components/dashboard/ArtistView.js:493-506`).
* **Recommended fix**: Split dashboard views with `next/dynamic`, keep only shell/session gating in `app/dashboard/page.js`, and replace multi-request overview loading with one aggregated endpoint per dashboard mode. Keep global layout client wrappers minimal so non-dashboard pages do not inherit dashboard-related runtime cost.
* **Tradeoffs / Risks**: More loading boundaries and a small amount of routing/state plumbing.
* **Expected impact estimate**: High. Initial dashboard JS can likely be cut substantially, and dashboard page-load QPS to internal APIs should drop at the same time.
* **Removal Safety**: Likely Safe
* **Reuse Scope**: module/service-wide; Over-Abstracted Code

* **Title**: Spotify sync and scrape jobs are implemented as long-lived HTTP requests with per-item writes
* **Category**: Reliability
* **Severity**: Critical
* **Impact**: Timeout risk, throughput, retry behavior, and compute cost.
* **Evidence**: `app/api/cron/sync-playlist/route.js:81-525` loops playlists, album batches, release upserts, webhook fan-out, Playwright scraping, and artist-history writes inside one request. Similar duplicate work exists in `app/api/admin/cron/sync-spotify/route.js:24-81` and `app/api/admin/scrape/batch/route.js:30-95`. The scraper itself opens browser contexts and waits up to 45 seconds per navigation in `lib/scraper.js:31-167`.
* **Why it’s inefficient**: Request workers stay occupied while doing batch orchestration, external API calls, browser automation, and row-by-row upserts. Failures are hard to resume safely, retries are coarse, and duplicate sync endpoints increase maintenance drift and redundant compute.
* **Recommended fix**: Move sync orchestration into a queue-backed worker, persist work items and checkpoints, batch release/artist writes where possible, and treat notifications as downstream jobs. Keep the HTTP route as a trigger/status endpoint only.
* **Tradeoffs / Risks**: Requires worker/queue infrastructure and an idempotency strategy for partial runs.
* **Expected impact estimate**: High. Expect much better job reliability and a large drop in request wall time, especially for scrape-heavy runs.
* **Removal Safety**: Needs Verification
* **Reuse Scope**: service-wide; Reuse Opportunity

* **Title**: Public settings are fetched repeatedly from the client and explicitly disable caching
* **Category**: Caching
* **Severity**: Medium
* **Impact**: Extra DB reads, extra client round-trips, slower first render.
* **Evidence**: `app/api/settings/public/route.ts:27-64` reads `SystemSettings` and returns `Cache-Control: no-store`. The same endpoint is fetched independently by `app/components/Navbar.js:18-36`, `app/components/Footer.js:12-26`, `app/HomeClient.js:362-396`, and `app/join/page.js:36-75`.
* **Why it’s inefficient**: This is effectively singleton config, but each mounted client component fetches it again after hydration. Because the route is marked `no-store`, neither Next nor downstream caches can absorb the repeated reads.
* **Recommended fix**: Give public settings a short revalidation window, fetch them once in a server component or shared provider, and pass the data down as props. Reserve `no-store` for admin-only settings that truly must be uncached.
* **Tradeoffs / Risks**: Small staleness window for public copy/social links unless you add explicit cache busting on save.
* **Expected impact estimate**: Medium. This should remove several redundant requests per first pageview and cut steady DB chatter.
* **Removal Safety**: Safe
* **Reuse Scope**: service-wide; Reuse Opportunity

* **Title**: Write paths block on external email/Discord notification fan-out
* **Category**: Network
* **Severity**: Medium
* **Impact**: User-visible write latency, timeout exposure, and duplicate side-effect risk.
* **Evidence**: After creating an earning, `app/api/earnings/route.ts:250-279` loops recipients and awaits `sendMail` plus `queueDiscordNotification` inside the request. Similar external I/O also exists directly after writes in `app/api/demo/route.js:105-168` and `app/api/artist/requests/route.js:66-106`.
* **Why it’s inefficient**: The database transaction is already complete, but the request remains open while waiting on third-party services. A slow mail or Discord provider can turn a fast write into a slow endpoint, and client retries risk duplicate notifications if idempotency is not enforced.
* **Recommended fix**: Write notification intents to an outbox table or queue after the main write commits, then process them asynchronously with bounded concurrency and retry policy. If that is not immediately possible, at least use `Promise.allSettled` with a strict timeout budget.
* **Tradeoffs / Risks**: Notifications become eventually consistent instead of synchronous.
* **Expected impact estimate**: Medium. The main gain is more stable write latency and lower timeout risk on financial/admin actions.
* **Removal Safety**: Likely Safe
* **Reuse Scope**: service-wide; Reuse Opportunity

* **Title**: Admin stats caching does not deduplicate in-flight work and is not shared across instances
* **Category**: Cost
* **Severity**: Medium
* **Impact**: DB spikes, avoidable repeated aggregates, inconsistent cache hit rate.
* **Evidence**: `lib/admin-stats-cache.js:1-20` stores only a single value plus TTL, with no pending-promise dedupe. The cached computation in `app/api/admin/stats/route.js:15-166` runs a large `Promise.all` bundle of counts, aggregates, raw SQL, and grouped trend queries.
* **Why it’s inefficient**: If several admin users hit the endpoint just after cache expiry, each request recomputes the same expensive payload. In a multi-instance deployment, every instance repeats that work independently because the cache lives only in process memory.
* **Recommended fix**: Cache the in-flight promise as well as the resolved value, and move the cache to Redis or a persisted snapshot if the app can run on multiple instances. If freshness requirements are loose, precompute the payload on a timer or on write events.
* **Tradeoffs / Risks**: More cache invalidation logic and a small staleness window.
* **Expected impact estimate**: Medium. The win is largest during concurrent admin usage or after deploy/cold starts.
* **Removal Safety**: Likely Safe
* **Reuse Scope**: service-wide; Reuse Opportunity

* **Title**: Rate limiting is process-local, so expensive submission paths remain horizontally bypassable
* **Category**: Reliability
* **Severity**: Low
* **Impact**: Abuse resistance, upload cost control, and predictable throttling.
* **Evidence**: `lib/rate-limit.ts:16-40` uses an in-memory `LRUCache`. It protects expensive flows such as demo submission in `app/api/demo/route.js:12-16` and `app/api/demo/route.js:45-49`, plus Discord demo submission in `app/api/internal/discord/demo-submit/route.js:10-13` and `app/api/internal/discord/demo-submit/route.js:106-110`.
* **Why it’s inefficient**: In-memory throttling resets on deploy and does not coordinate across multiple app instances, so the same actor can still trigger duplicated upload, email, and disk work by spreading requests across processes.
* **Recommended fix**: Move hot-path rate limiting to Redis, Postgres, or edge middleware with a shared counter, and keep the in-process limiter only as a secondary local guard.
* **Tradeoffs / Risks**: Adds one more infrastructure dependency and a failure mode if the shared limiter backend is unavailable.
* **Expected impact estimate**: Qualitative. This does not speed up normal traffic much, but it materially reduces abuse-driven waste and protects the heavier endpoints.
* **Removal Safety**: Needs Verification
* **Reuse Scope**: service-wide; Reuse Opportunity

### 3) Quick Wins (Do First)

* Add pagination and slim `select` clauses to `users`, `artists`, `contracts`, `payments`, `requests`, `demos`, `releases`, and public catalog endpoints before those tables grow further.
* Add a short cache/revalidation window to `/api/settings/public` and stop fetching it independently in `Navbar`, `Footer`, `HomeClient`, and `JoinUsPage`.
* Split `/dashboard` views with dynamic imports and stop eagerly importing every admin section into one client bundle.
* Memoize in-flight admin-stats computation so one cache miss does not fan out into multiple identical query bundles.
* Move earnings/demo/support notifications to an outbox or, as an intermediate step, send them with bounded `Promise.allSettled` plus timeouts.

### 4) Deeper Optimizations (Do Next)

* Introduce a normalized `ReleaseArtist` table and migrate all ownership/search logic away from `artistsJson`.
* Replace request-driven Spotify sync/scrape routes with a queue/worker pipeline that supports checkpoints, retries, and idempotent batch writes.
* Create dedicated dashboard aggregate endpoints so overview screens stop composing data from many list APIs.
* Reduce global client runtime in `app/layout.js` by limiting client-only wrappers to pages that actually need them.
* Centralize configuration/content loading so public pages receive settings/content from server components instead of re-fetching after hydration.

### 5) Validation Plan

* Benchmarks:
  * Run `autocannon -d 30 -c 20 http://localhost:3000/api/releases` before and after catalog pagination/normalization.
  * Run authenticated load tests for `/api/artist/stats`, `/api/contracts`, `/api/payments`, and `/api/admin/stats` using a saved session cookie.
  * Record end-to-end duration for `/api/cron/sync-playlist`, `/api/admin/cron/sync-spotify`, and `/api/admin/scrape/batch`.
* Profiling strategy:
  * Use `EXPLAIN (ANALYZE, BUFFERS)` on the release/artist lookup queries that currently rely on `artistsJson`.
  * Enable Prisma query logging around admin stats and list endpoints to capture slow queries and payload sizes.
  * Compare `.next/static/chunks` output before and after dashboard code-splitting, especially the `/dashboard` chunk set.
  * Track Node heap and event-loop lag during sync jobs and concurrent uploads.
* Metrics to compare before/after:
  * API p50/p95/p99 latency for `/api/releases`, `/api/artist/stats`, `/api/contracts`, `/api/payments`, and `/api/admin/stats`.
  * Rows scanned, buffer hits, and execution time for release lookups and admin list queries.
  * Response size and transferred bytes for list endpoints and `/dashboard` initial load.
  * Sync-job duration, timeout rate, retry count, and partial-failure count.
* Test cases to ensure correctness is preserved:
  * Release visibility for direct contract owners, linked artists, split collaborators, and unrelated users.
  * Earnings totals and recipient share calculations before vs after notification/outbox changes.
  * Idempotent sync re-runs that do not duplicate releases, stats history, or outbound notifications.
  * Rate-limit behavior across restarts and multi-instance deployments if the limiter backend changes.

### 6) Optimized Code / Patch (when possible)

Not applied to source code per request. Suggested pseudo-patches:

```prisma
model ReleaseArtist {
  releaseId String
  artistId  String
  name      String?
  release   Release @relation(fields: [releaseId], references: [id], onDelete: Cascade)

  @@id([releaseId, artistId])
  @@index([artistId])
}
```

```ts
// Example query rewrite after normalization
const releases = await prisma.release.findMany({
  where: {
    OR: [
      { contracts: { some: { userId } } },
      { artists: { some: { artistId: spotifyId } } },
    ],
  },
  take: 50,
  cursor,
  orderBy: { releaseDate: "desc" },
  select: {
    id: true,
    name: true,
    image: true,
    releaseDate: true,
  },
});
```

```ts
// In-flight dedupe for admin stats cache
let cacheValue: unknown = null;
let cacheExpiresAt = 0;
let inflight: Promise<unknown> | null = null;

export async function getCachedAdminStats(computeFn: () => Promise<unknown>) {
  const now = Date.now();
  if (cacheValue && now < cacheExpiresAt) return cacheValue;
  if (inflight) return inflight;

  inflight = computeFn().then((value) => {
    cacheValue = value;
    cacheExpiresAt = Date.now() + 60_000;
    inflight = null;
    return value;
  }).catch((error) => {
    inflight = null;
    throw error;
  });

  return inflight;
}
```

```ts
// Example pagination shape for admin lists
const take = Math.min(Number(searchParams.get("limit") || 50), 100);
const cursor = searchParams.get("cursor");

const users = await prisma.user.findMany({
  take: take + 1,
  ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  orderBy: { id: "asc" },
  select: USER_LIST_SELECT,
});
```
