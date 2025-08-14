FROM node:18-slim AS builder
WORKDIR /app

# Install build dependencies - use cache mount for faster rebuilds
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt/lists \
    apt-get update && apt-get install -y \
    python3 \
    make \
    g++

# Copy and install dependencies first (better layer caching)
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Copy source files
COPY tsconfig*.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/

# Generate Prisma and build
RUN npx prisma generate
RUN npm run build

# -------------------------------------------------------
FROM node:18-slim AS production

# Use cache mounts and combine RUN commands for faster builds
RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt/lists \
    apt-get update && apt-get install -y \
    dumb-init \
    openssl \
    chromium \
    fonts-liberation \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    libasound2 \
    libxkbcommon0 \
    xdg-utils \
    libu2f-udev \
    && mkdir -p /tmp/chrome-user-data \
    && chmod 755 /tmp/chrome-user-data

# Create user and directories in single layer
RUN addgroup --system nodejs && adduser --system nextjs \
    && mkdir -p /tmp/.X11-unix /home/nextjs/.cache/chromium \
    && chmod 1777 /tmp/.X11-unix \
    && chown -R nextjs:nodejs /home/nextjs

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --no-audit --no-fund \
    && npm cache clean --force

# Copy build artifacts and runtime files
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs public ./public

USER nextjs

# Environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    CHROME_PATH=/usr/bin/chromium \
    DISPLAY=:99 \
    CHROME_DEVEL_SANDBOX=/usr/lib/chromium/chrome_sandbox

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/healthcheck.js || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]