# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (Alpine with build tools)
RUN apk add --no-cache python3 make g++ \
    && npm ci --prefer-offline --no-audit \
    && apk del python3 make g++

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ ca-certificates openssl

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY . .

# Build environment
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Generate Prisma Client and build
RUN npx prisma generate \
    && npm run build \
    && npm prune --production

# ============================================
# STAGE 3: Runner (Production)
# ============================================
FROM mcr.microsoft.com/playwright:v1.58.1-alpine AS runner
WORKDIR /app

# Environment variables
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV LOG_LEVEL warn

# Install runtime dependencies only
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    dumb-init

# Create app user
RUN addgroup -g 1001 nodejs && \
    adduser -S nextjs -u 1001

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
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs .env* ./

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

CMD ["node", "server.js"]
