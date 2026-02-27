### 1) Optimization Summary

- Overall optimization health is **moderate risk**: core logic works, but several endpoints will degrade quickly with data growth due scan-heavy queries, unbounded payloads, and in-memory aggregation.
- Top 3 highest-impact improvements:
  1. Reshape/query-index hot DB paths (`artistsJson`/`releaseDate` modeling + missing indexes + aggregate pushdown).
  2. Replace JS-side earnings aggregation with DB-side aggregation for `/api/artist/stats` and `/api/artist/withdraw`.
  3. Refactor sync jobs into one queued pipeline with bounded concurrency, retries, and request timeouts.
- Biggest risk if no changes are made: **rising p95 latency + periodic timeouts + infra cost escalation** under normal growth, especially on dashboard stats, sync jobs, and public listing endpoints.

### 2) Findings (Prioritized)

- **Title**: Denormalized release fields force expensive scans (`artistsJson` contains + string `releaseDate`)
- **Category**: DB
- **Severity**: Critical
- **Impact**: Improves query latency, DB CPU, and scalability for releases/artist filtering.
- **Evidence**: `prisma/schema.prisma:137-139` stores `releaseDate` as `String`; `prisma/schema.prisma:138` stores `artistsJson` as `String`. Query patterns use substring matching in `app/api/artist/stats/route.js:69-73`, `app/api/artist/releases/route.js:53-58`, `app/api/admin/releases/route.js:27-34`, `app/api/admin/artist-details/route.js:62-77`.
- **Why it’s inefficient**: Text `contains` filters over serialized JSON are non-sargable and typically scan rows; string dates block robust temporal indexing/operations.
- **Recommended fix**: Migrate to normalized join table (`ReleaseArtist { releaseId, artistId, artistName }`) and `DateTime` for release dates; update filters to indexed equality/joins.
- **Tradeoffs / Risks**: Requires migration/backfill and route refactors; temporary dual-write period recommended.
- **Expected impact estimate**: **High** (often 40-80% latency reduction on affected endpoints at scale).
- **Removal Safety**: Needs Verification
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Over-Abstracted Code (stringified relational data)

- **Title**: Missing indexes on high-frequency filters and sort keys
- **Category**: DB
- **Severity**: High
- **Impact**: Reduces full scans and improves throughput under concurrency.
- **Evidence**: Only `@@index([artistId, date])` and `@@index([baseTitle])` are defined (`prisma/schema.prisma:126`, `prisma/schema.prisma:149`). Hot filters/orderings use unindexed fields across routes: `status/createdAt/userId` in `app/api/demo/route.js:162-177`, `app/api/payments/route.js:22-33`, `app/api/admin/requests/route.js:14-20`, `app/api/earnings/route.js:44-62`, `app/api/contracts/route.js:89-105`.
- **Why it’s inefficient**: Row growth causes scans and sort spill risk; relation FKs are frequently filtered but not explicitly indexed.
- **Recommended fix**: Add targeted composite indexes, e.g. `Payment(userId, createdAt)`, `Payment(status, createdAt)`, `Demo(status, createdAt)`, `Demo(artistId, createdAt)`, `ChangeRequest(status, createdAt)`, `ChangeRequest(userId, createdAt)`, `Earning(contractId, period)`.
- **Tradeoffs / Risks**: Slightly slower writes and larger index storage.
- **Expected impact estimate**: **High** for admin/dashboard listing and user financial pages.
- **Removal Safety**: Likely Safe
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Reuse Opportunity (shared indexing policy)

- **Title**: Earnings/balance computed in application memory with duplicated logic
- **Category**: Algorithm
- **Severity**: High
- **Impact**: Cuts CPU/memory per request and reduces DB payload size.
- **Evidence**: `/api/artist/stats` loads splits including all earnings (`app/api/artist/stats/route.js:85-106`) then loops all earnings in JS (`129-149`); `/api/artist/withdraw` repeats same pattern (`app/api/artist/withdraw/route.js:22-57`).
- **Why it’s inefficient**: Pulls full earnings history into Node for each request; complexity grows with lifetime earnings, not page scope.
- **Recommended fix**: Move totals/trends to SQL aggregation (`SUM`, grouped by period/date), expose shared balance service/query used by both routes.
- **Tradeoffs / Risks**: Must validate split math parity and rounding rules.
- **Expected impact estimate**: **High** (2-10x lower payload/CPU on large accounts).
- **Removal Safety**: Needs Verification
- **Reuse Scope**: module/service-wide
- **Code Health Class (Checklist)**: Reuse Opportunity

- **Title**: Admin stats endpoint performs expensive global aggregates on demand
- **Category**: DB
- **Severity**: High
- **Impact**: Reduces dashboard load time and DB contention.
- **Evidence**: `groupBy` all release base titles then counts in JS (`app/api/admin/stats/route.js:30-33`, `49-51`), multiple global aggregates/raw queries each request (`53-104`).
- **Why it’s inefficient**: Recomputes large cross-table summaries synchronously for each page load.
- **Recommended fix**: Replace `groupBy + length` with `COUNT(DISTINCT baseTitle)` query; introduce cached/materialized stats snapshot refreshed on interval or write events.
- **Tradeoffs / Risks**: Snapshot staleness window (e.g., 1-5 minutes) unless event-driven refresh is added.
- **Expected impact estimate**: **High** for p95 admin dashboard latency.
- **Removal Safety**: Likely Safe
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Reuse Opportunity

- **Title**: Sync pipelines are sequential, duplicated, and timeout-prone
- **Category**: Concurrency
- **Severity**: High
- **Impact**: Improves job duration, reliability, and operational cost.
- **Evidence**: Serial release upserts (`app/api/cron/sync-playlist/route.js:228-246`), serial webhook fanout loop per new release (`263-290`), multiple overlapping sync endpoints with similar logic (`app/api/cron/sync-listeners/route.js`, `app/api/cron/sync-artists/route.js`, `app/api/admin/cron/sync-spotify/route.js`, `app/api/admin/scrape/refresh/route.js`, `app/api/admin/scrape/batch/route.js`).
- **Why it’s inefficient**: Repeated logic causes drift; per-item DB/network operations inflate wall-clock time and timeout risk.
- **Recommended fix**: Consolidate into one job service + queue, use bounded worker concurrency, batch DB writes (`createMany`/bulk upsert strategy), and idempotency keys.
- **Tradeoffs / Risks**: Requires job infrastructure (queue/worker) and migration from route-triggered long tasks.
- **Expected impact estimate**: **High** (substantial runtime reduction, fewer partial failures).
- **Removal Safety**: Needs Verification
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Reuse Opportunity

- **Title**: Upload path allows large in-memory buffering (up to 250MB/request)
- **Category**: Memory
- **Severity**: High
- **Impact**: Lowers OOM risk and improves tail latency under concurrent uploads.
- **Evidence**: Request allows total `250MB` (`app/api/upload/route.js:20`) and each file is fully buffered with `await file.arrayBuffer()` then `Buffer.from` (`127-129`).
- **Why it’s inefficient**: Memory spikes scale with concurrent uploads; GC pressure and potential process crashes.
- **Recommended fix**: Stream multipart file data directly to disk/object storage and validate signatures on initial streamed bytes.
- **Tradeoffs / Risks**: Slightly more complex upload flow and validation pipeline.
- **Expected impact estimate**: **High** for stability under load.
- **Removal Safety**: Needs Verification
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Reuse Opportunity

- **Title**: Public list APIs are unbounded and process full datasets in memory
- **Category**: I/O
- **Severity**: Medium
- **Impact**: Improves response time, reduces payload size and egress cost.
- **Evidence**: `/api/releases` fetches all matching releases and deduplicates/maps in JS (`app/api/releases/route.js:6-64`), `/api/artists` returns full roster (`app/api/artists/route.js:7-29`), `/api/admin/releases` pulls broad result then filters in JS (`app/api/admin/releases/route.js:26-35`).
- **Why it’s inefficient**: Payload and CPU grow linearly with catalog size.
- **Recommended fix**: Add cursor pagination, server-side limits, and minimal field projections; precompute version grouping server-side with indexed query.
- **Tradeoffs / Risks**: Frontend updates needed for pagination UX.
- **Expected impact estimate**: **Medium-High** (especially network/cost improvements).
- **Removal Safety**: Likely Safe
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Reuse Opportunity

- **Title**: Dashboard frontend bundle is oversized due monolithic/eager-loaded views
- **Category**: Frontend
- **Severity**: Medium
- **Impact**: Better TTI/INP and lower JS parse/execute cost.
- **Evidence**: `app/components/dashboard/ArtistView.js` is 3132 lines; `AdminView` eagerly imports all admin sections (`app/components/dashboard/AdminView.js:8-21`) regardless of active `view`.
- **Why it’s inefficient**: Large client bundles are downloaded/executed even when most sections are not opened.
- **Recommended fix**: Split by route/view using dynamic imports (`next/dynamic`) and keep heavy chart sections lazy.
- **Tradeoffs / Risks**: More component boundaries and loading states.
- **Expected impact estimate**: **Medium-High** on first dashboard load.
- **Removal Safety**: Likely Safe
- **Reuse Scope**: module/service-wide
- **Code Health Class (Checklist)**: Over-Abstracted Code (too much behavior in single files)

- **Title**: Duplicate smooth-scroll engines and requestAnimationFrame leak risk
- **Category**: Frontend
- **Severity**: Medium
- **Impact**: Reduces main-thread work and scroll jank.
- **Evidence**: Global `SmoothScroll` is mounted in layout (`app/layout.js:77`), while home page wraps content with `ReactLenis` (`app/HomeClient.js:415`); RAF loop in `SmoothScroll` (`app/components/SmoothScroll.js:24-29`) is started but not canceled explicitly.
- **Why it’s inefficient**: Double smoothing can stack handlers/RAF work; missing RAF cancellation may leak work across navigations.
- **Recommended fix**: Keep one smooth-scroll implementation and explicitly cancel RAF on cleanup.
- **Tradeoffs / Risks**: Scroll feel may change and need tuning.
- **Expected impact estimate**: **Medium** on interaction smoothness.
- **Removal Safety**: Likely Safe
- **Reuse Scope**: module
- **Code Health Class (Checklist)**: Dead Code (one of two smooth-scroll paths is redundant)

- **Title**: External network calls lack timeout budget and controlled retries
- **Category**: Reliability
- **Severity**: Medium
- **Impact**: Prevents hanging workers and improves tail behavior.
- **Evidence**: Spotify and webhook fetches without AbortController/timeout (`lib/spotify.js:19-111`, `app/api/cron/sync-playlist/route.js:280-289`, `lib/discord.js:59-67`), sequential email broadcast sends in request path (`app/api/admin/communications/mail/route.js:79-92`).
- **Why it’s inefficient**: Slow third-party calls tie up request workers; no jitter/backoff policy for transient failures.
- **Recommended fix**: Standardize `fetchWithTimeout` + retry budget with exponential backoff/jitter; move bulk email to background job.
- **Tradeoffs / Risks**: Some requests may fail faster by design and require queue retry handling.
- **Expected impact estimate**: **Medium-High** for reliability and compute efficiency.
- **Removal Safety**: Likely Safe
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Reuse Opportunity

- **Title**: Security-impacting inefficiency: fallback cron secret enables abuse of expensive jobs
- **Category**: Reliability
- **Severity**: Critical
- **Impact**: Reduces abuse risk and compute waste from unauthorized sync triggers.
- **Evidence**: `app/api/cron/sync-artists/route.js:12` uses `process.env.CRON_SECRET || 'dev_secret_123'`.
- **Why it’s inefficient**: Predictable fallback key can allow external triggering of scraping/database-heavy endpoint, amplifying cost and downtime risk.
- **Recommended fix**: Hard-fail when `CRON_SECRET` missing; return 500 and disable endpoint in non-dev environments.
- **Tradeoffs / Risks**: Cron job won’t run until secrets are configured correctly.
- **Expected impact estimate**: **High** risk reduction.
- **Removal Safety**: Safe
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Dead Code (unsafe fallback path)

- **Title**: Dead/duplicated assets and dependencies add build and maintenance cost
- **Category**: Cost
- **Severity**: Low
- **Impact**: Reduces CI/build context size and long-term maintenance overhead.
- **Evidence**: Unused dependencies appear present (e.g., `@supabase/auth-helpers-nextjs`, `@supabase/supabase-js`, `uuid`) in `package.json`; `v0-ref/` is large (~1.9MB) and not excluded by `.dockerignore`.
- **Why it’s inefficient**: Extra dependency graph and files increase install/scan/context cost and cognitive load.
- **Recommended fix**: Remove unused deps, archive/remove `v0-ref` from runtime repository or add to `.dockerignore`/deployment excludes.
- **Tradeoffs / Risks**: Verify no external scripts rely on these artifacts.
- **Expected impact estimate**: **Low-Medium** (mostly CI/cost/maintenance).
- **Removal Safety**: Needs Verification
- **Reuse Scope**: service-wide
- **Code Health Class (Checklist)**: Dead Code

### 3) Quick Wins (Do First)

- Add missing DB indexes on top query paths (`Payment`, `Demo`, `ChangeRequest`, `Earning`, `Contract`) and re-check explain plans.
- Replace `/api/admin/stats` unique album calculation with `COUNT(DISTINCT ...)` and add short TTL caching.
- Move artist balance calculations to DB aggregates and share one helper between `/api/artist/stats` and `/api/artist/withdraw`.
- Remove fallback cron secret (`dev_secret_123`) and require configured secret.
- Add request timeouts (`AbortController`) for Spotify/webhook fetches.
- Stream upload writes instead of buffering full files in memory.

### 4) Deeper Optimizations (Do Next)

- Normalize releases/artists relation and migrate away from `artistsJson` string filtering.
- Introduce a single sync worker pipeline (queue + retries + idempotency) to replace duplicated sync routes.
- Split dashboard into lazy-loaded view modules to cut initial JS execution.
- Create materialized stats tables (or periodic snapshots) for admin dashboard KPIs/trends.

### 5) Validation Plan

- Benchmarks:
  - Baseline and compare p50/p95/p99 latency for `/api/artist/stats`, `/api/artist/withdraw`, `/api/admin/stats`, `/api/releases`.
  - Measure job duration and success ratio for sync routes before/after refactor.
- Profiling strategy:
  - DB: enable slow query logging and run `EXPLAIN (ANALYZE, BUFFERS)` for top 10 queries.
  - Node: capture heap usage and event-loop lag during concurrent uploads and sync runs.
  - Frontend: compare bundle size and Web Vitals (LCP/INP/TBT) after code-splitting.
- Metrics to compare before/after:
  - DB rows scanned, shared buffer hit %, query time, API timeout rate, worker memory high-water mark.
  - Network egress size for list endpoints.
  - Client JS bundle KB and hydration/interaction timings.
- Correctness test cases:
  - Financial parity tests: old vs new balance/earnings outputs for same dataset.
  - Access-control tests across owner/admin/collaborator flows.
  - Sync idempotency tests (re-running same job does not duplicate writes).
  - Upload tests for file type checks and large-file behavior.

### 6) Optimized Code / Patch (when possible)

Not applied to source code per request. Suggested pseudo-patches:

```js
// 1) Replace JS-side earnings loops with DB aggregation (concept)
// old: load all splits->earnings and loop in Node
// new: aggregate directly in SQL/Prisma
const totals = await prisma.$queryRaw`
  SELECT
    COALESCE(SUM(e."artistAmount" * rs."percentage" / 100.0), 0) AS total_earnings,
    COALESCE(SUM(e."streams"), 0) AS total_streams
  FROM "RoyaltySplit" rs
  JOIN "Contract" c ON c.id = rs."contractId"
  JOIN "Earning" e ON e."contractId" = c.id
  WHERE rs."userId" = ${userId} OR rs."email" = ${userEmail}
`;
```

```sql
-- 2) High-ROI index examples
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_user_created_at ON "Payment" ("userId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_demo_status_created_at ON "Demo" ("status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_change_request_status_created_at ON "ChangeRequest" ("status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_earning_contract_period ON "Earning" ("contractId", "period" DESC);
```

```js
// 3) Timeout wrapper for third-party fetches
async function fetchWithTimeout(url, opts = {}, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
```

```js
// 4) Paginated public releases endpoint (concept)
const limit = Math.min(Number(searchParams.get('limit') || 24), 100);
const cursor = searchParams.get('cursor') || undefined;
const releases = await prisma.release.findMany({
  take: limit,
  ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  orderBy: [{ popularity: 'desc' }, { releaseDate: 'desc' }],
  select: { id: true, name: true, baseTitle: true, artistsJson: true, image: true, releaseDate: true, popularity: true, previewUrl: true }
});
```
