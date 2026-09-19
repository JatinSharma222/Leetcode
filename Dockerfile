# syntax=docker/dockerfile:1
FROM oven/bun:1.2.0-alpine AS base
WORKDIR /app

# Install native dependencies and OpenSSL for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy root workspace configs and lockfile
COPY package.json bun.lock turbo.json ./
COPY packages/db/package.json ./packages/db/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/worker/package.json ./apps/worker/

# Install workspace dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages ./packages
COPY apps ./apps

# Generate Prisma Client
RUN bun run --cwd packages/db db:generate

# Build frontend and backend distributions
RUN bun run build

# --- Stage: Worker ---
FROM base AS worker
WORKDIR /app
# Install docker-cli so worker can launch sandboxed execution containers
RUN apk add --no-cache docker-cli
ENV NODE_ENV=production
CMD ["bun", "run", "--cwd", "apps/worker", "start"]

# --- Stage: Frontend ---
FROM base AS frontend
WORKDIR /app
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production
CMD ["bun", "run", "--cwd", "apps/frontend", "start"]

# --- Default Stage: Backend ---
FROM base AS backend
WORKDIR /app
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production
CMD ["bun", "run", "--cwd", "apps/backend", "start"]
