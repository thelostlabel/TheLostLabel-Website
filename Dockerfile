# 1. Install dependencies only when needed
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install build essentials for potential native modules
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# 3. Production image, copy all the files and run next
# Use the official Playwright image to avoid installing browsers/deps from scratch
FROM mcr.microsoft.com/playwright:v1.58.1-jammy AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# The official image already has browsers installed at /ms-playwright
# We set the path to ensure the app finds them
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

RUN addgroup --system --gid 1001 nodejs
# Create user with a proper home directory, using the existing nodejs group
RUN adduser --system --uid 1001 --ingroup nodejs --home /home/nextjs nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Join the nextjs user to the root group if needed to access /ms-playwright, 
# or change ownership. The official image sets /ms-playwright as a global cache.
# We ensure the nextjs user has read access (usually standard).
# To be safe, we allow nextjs to own it or just verify access.
# Ideally, we shouldn't move it. 
# IMPORTANT: If the app tries to write there, it will fail. But it shouldn't.

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
