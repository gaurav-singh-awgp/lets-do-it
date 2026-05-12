# syntax=docker/dockerfile:1
# Build from repository root: docker build -f api/Dockerfile -t lets-do-it-api:local .

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY api/package.json api/

RUN npm ci -w api

COPY api/tsconfig.json api/tsconfig.build.json api/drizzle.config.ts api/
COPY api/src api/src

RUN npm run build -w api

FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends wget ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY api/package.json api/

RUN npm ci -w api --omit=dev

COPY --from=builder /app/api/dist ./api/dist

WORKDIR /app/api

ENV NODE_ENV=production

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD /bin/sh -c "wget -qO- http://127.0.0.1:$${PORT:-3000}/health | grep -q '\"ok\":true' || exit 1"

CMD ["node", "dist/server.js"]
