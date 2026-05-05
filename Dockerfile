# =============================================================================
# Multi-stage Dockerfile for the Next.js app
#
# NEXT_PUBLIC_* variables are inlined into the JS bundle at build time.
# Pass them as --build-arg flags (or in your CI/CD pipeline):
#
#   docker build \
#     --build-arg NEXT_PUBLIC_APP_URL=https://example.com \
#     --build-arg NEXT_PUBLIC_APP_DOMAIN=example.com \
#     --build-arg NEXT_PUBLIC_IS_TESTNET=false \
#     --build-arg NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<id> \
#     --build-arg NEXT_PUBLIC_CREDIT_VAULT_ADDRESS=0x... \
#     -t myapp .
#
# All other (server-side) env vars — DATABASE_URL, ZG_PRIVATE_KEY, etc. —
# are injected at runtime via -e or an env file; they do NOT belong here.
#
# Two usable targets:
#   (default)  runner  — runs `next start` on port 3000
#   migrate            — runs `drizzle-kit migrate` then exits (init container)
# =============================================================================

# ---- base: shared Node version -----------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# ---- deps-dev: full node_modules (needed for build + migrations) -------------
FROM base AS deps-dev
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ---- builder: compile the Next.js app ----------------------------------------
FROM base AS builder
COPY --from=deps-dev /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be declared as build args — they are baked into the
# JS bundle by `next build` and cannot be changed at runtime.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_DOMAIN
ARG NEXT_PUBLIC_IS_TESTNET
ARG NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
ARG NEXT_PUBLIC_CREDIT_VAULT_ADDRESS

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_DOMAIN=$NEXT_PUBLIC_APP_DOMAIN \
    NEXT_PUBLIC_IS_TESTNET=$NEXT_PUBLIC_IS_TESTNET \
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=$NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID \
    NEXT_PUBLIC_CREDIT_VAULT_ADDRESS=$NEXT_PUBLIC_CREDIT_VAULT_ADDRESS \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ---- migrate: init-container target for DB migrations ------------------------
# Usage:
#   docker build --target migrate -t myapp-migrate .
#   docker run --rm -e DATABASE_URL=... myapp-migrate
FROM base AS migrate
COPY --from=deps-dev /app/node_modules ./node_modules
COPY drizzle.config.ts ./
COPY drizzle/ ./drizzle/
COPY lib/db/schema.ts ./lib/db/schema.ts
ENV NODE_ENV=production
CMD ["npx", "drizzle-kit", "migrate"]

# ---- runner: minimal production image ----------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# standalone output is a self-contained server — copy it plus static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs
EXPOSE 3000

# server.js is the standalone entry point produced by `output: 'standalone'`
CMD ["node", "server.js"]
