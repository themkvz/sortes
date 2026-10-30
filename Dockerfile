# syntax=docker/dockerfile:1
FROM oven/bun:1.4.4-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY server.ts ./
COPY app ./app
COPY public ./public

USER bun

EXPOSE 44100
CMD ["bun", "server.ts"]
