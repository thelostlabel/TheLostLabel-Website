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
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# Set Playwright path explicitly
ENV PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

# Install Playwright dependencies for Chromium
# Using debian-specific dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxcb1 \
    libxkbcommon0 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    && rm -rf /var/lib/apt/lists/*

# Install Chromium browser to the specific path
RUN npx playwright install chromium

RUN addgroup --system --gid 1001 nodejs
# Create user with a proper home directory to avoid "/nonexistent" issues
RUN adduser --system --uid 1001 --group nextjs --home /home/nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure the app user owns the browsers and the app dir
RUN chown -R nextjs:nodejs /app/ms-playwright

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
