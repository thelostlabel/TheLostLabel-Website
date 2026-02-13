# 1. Base image for dependencies
FROM node:20-bookworm-slim AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# 2. Dependencies - Install ALL dependencies (including dev) for build
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN npm ci

# 3. Builder - Build the Next.js app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client and build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate
RUN npm run build

# 4. Runner - Production image
FROM mcr.microsoft.com/playwright:v1.58.1-jammy AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Create user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Create private directories with proper permissions
RUN mkdir -p /app/private/uploads/contracts /app/private/uploads/demos /app/private/uploads/releases
RUN chown -R nextjs:nodejs /app/private
RUN chmod -R 755 /app/private

# Copy essential files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Manually copy prisma schema and scripts for sync
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/.env* ./

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
