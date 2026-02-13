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
    && npm ci --prefer-offline --no-audit \
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

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tzdata \
    dumb-init \
    openssl \
    curl \
    wget \
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
COPY --chown=nextjs:nodejs .env* ./

# Install Playwright browser binaries for runtime scraping/sync jobs
RUN npx playwright install --with-deps chromium && \
    chown -R nextjs:nodejs /ms-playwright

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Use dumb-init as entrypoint to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
