# Multi-stage Build für Next.js + separater Cron-Worker
ARG NODE_VERSION=22-alpine

# ----------- 1. Dependencies -----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ----------- 2. Builder -----------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
# Kompiliere TypeScript-Worker separat
RUN npx tsc src/workers/sync-results.ts \
    --module nodenext --moduleResolution nodenext \
    --target es2022 --outDir dist --esModuleInterop || true

# ----------- 3. Runner (Next.js Web) -----------
FROM node:${NODE_VERSION} AS web
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]

# ----------- 4. Cron-Worker -----------
FROM node:${NODE_VERSION} AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
CMD ["node", "dist/sync-results.js"]
