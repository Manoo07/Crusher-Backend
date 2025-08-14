FROM node:18-slim AS builder
WORKDIR /app

COPY package*.json tsconfig*.json ./
RUN npm ci
COPY src/ ./src/
COPY prisma/ ./prisma/

RUN npx prisma generate
RUN npm run build

FROM node:18-slim AS production

RUN apt-get update && apt-get install -y \
    dumb-init \
    openssl \
    chromium \
    nss \
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
    xdg-utils \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

RUN addgroup --system nodejs && adduser --system nextjs

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY --chown=nextjs:nodejs public ./public

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/healthcheck.js || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
