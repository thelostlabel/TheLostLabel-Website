# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ ca-certificates openssl \
    && npm ci --prefer-offline --no-audit --no-fund \
    && rm -rf /var/lib/apt/lists/*

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY . .

# Build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generate Prisma Client and build
RUN npx prisma generate \
    && npm run build

# ============================================
# STAGE 3: Runner (Production)
# ============================================
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV LOG_LEVEL=warn
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_INSTALL_ON_STARTUP=1

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    dumb-init \
    openssl \
    curl \
    wget \
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

# Create app user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Create upload directories with proper permissions
RUN mkdir -p /app/private/uploads/{contracts,demos,releases} && \
    chown -R nextjs:nodejs /app/private && \
    chmod 755 /app/private && \
    chmod 700 /app/private/uploads

# Copy only necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
# Keep playwright CLI available at runtime for one-time browser install on empty volume.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/playwright ./node_modules/playwright
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/playwright-core ./node_modules/playwright-core
COPY --chown=nextjs:nodejs .env* ./
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh

# Browser cache path used by Playwright.
RUN mkdir -p /ms-playwright && chown -R nextjs:nodejs /ms-playwright

# Install Playwright Chromium during build to ensure it's always available.
# We use the playwright CLI directly from the copied node_modules.
RUN [ -f /app/node_modules/playwright/cli.js ] && \
    node /app/node_modules/playwright/cli.js install chromium && \
    chown -R nextjs:nodejs /ms-playwright

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Start the application
CMD ["./docker-entrypoint.sh"]
