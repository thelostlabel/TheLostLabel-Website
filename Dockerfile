# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --config.node-linker=hoisted

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm exec prisma generate && pnpm build

# ============================================
# STAGE 3: Runner (Production)
# ============================================
FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV LOG_LEVEL=warn
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_INSTALL_ON_STARTUP=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    dumb-init \
    openssl \
    curl \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libxcb1 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

RUN mkdir -p /app/private/uploads/contracts /app/private/uploads/demos /app/private/uploads/releases && \
    chown -R nextjs:nodejs /app/private && \
    chmod 755 /app/private && \
    chmod 700 /app/private/uploads

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
# Playwright CLI for first-startup browser install via persistent volume
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/playwright ./node_modules/playwright
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/playwright-core ./node_modules/playwright-core
COPY --chown=nextjs:nodejs .env* ./
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh
RUN mkdir -p /ms-playwright && chown -R nextjs:nodejs /ms-playwright

# NOTE: Playwright Chromium is intentionally NOT installed at build time.
# docker-entrypoint.sh handles it at first startup using the persistent
# /ms-playwright volume to avoid re-downloading 167MB on every deploy.

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["dumb-init", "--"]
USER nextjs
EXPOSE 3000
CMD ["./docker-entrypoint.sh"]
