# syntax=docker/dockerfile:1
# Build from repository root:
#   docker build -f web/Dockerfile -t lets-do-it-web:local \
#     --build-arg VITE_API_BASE_URL=http://127.0.0.1:3000 .
#
# VITE_API_BASE_URL is whatever the *browser* uses to reach the API (inlined at vite build).

FROM node:22-bookworm-slim AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=http://127.0.0.1:3000
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
COPY api/package.json api/
COPY web/package.json web/

RUN npm ci -w web

COPY web/tsconfig.json web/tsconfig.app.json web/tsconfig.node.json web/
COPY web/vite.config.ts web/index.html web/
COPY web/public web/public
COPY web/src web/src

RUN npm run build -w web

FROM nginxinc/nginx-unprivileged:1.27-alpine

COPY web/docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/web/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/ || exit 1
