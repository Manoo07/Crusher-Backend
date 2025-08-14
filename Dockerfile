FROM node:18-slim AS builder
WORKDIR /app

# Install build dependencies for native modules if needed
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json tsconfig*.json ./
RUN npm ci
COPY src/ ./src/
COPY prisma/ ./prisma/

RUN npx prisma generate
RUN npm run build

# -------------------------------------------------------
FROM node:18-slim AS production

# Install Chromium + required deps for Puppeteer
RUN apt-get update && apt-get install -y \
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
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    libu2f-udev \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p /tmp/chrome-user-data \
 && chmod 755 /tmp/chrome-user-data

# Create non-root user
RUN addgroup --system nodejs && adduser --system nextjs

# Create directories for Chrome data and temp files
RUN mkdir -p /tmp/.X11-unix && \
    chmod 1777 /tmp/.X11-unix && \
    mkdir -p /home/nextjs/.cache/chromium && \
    chown -R nextjs:nodejs /home/nextjs

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy build and necessary runtime files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs public ./public

USER nextjs

# Puppeteer and Chrome env variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium
ENV DISPLAY=:99
ENV CHROME_DEVEL_SANDBOX=/usr/lib/chromium/chrome_sandbox

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/healthcheck.js || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
