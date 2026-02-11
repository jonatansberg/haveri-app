# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app

# pg + TLS dependencies for managed Postgres providers
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY console/package.json ./console/package.json
RUN pnpm install --filter @haveri/console... --frozen-lockfile

FROM base AS build
COPY console ./console
WORKDIR /app/console
ENV DATABASE_URL=postgres://user:password@localhost:5432/db
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

# Keep full node_modules (including tsx) so worker and migration scripts run in prod image.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/console ./console

WORKDIR /app/console
USER node
EXPOSE 3000

CMD ["node", "build"]
