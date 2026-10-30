# syntax=docker/dockerfile:1
FROM node:24.22.2-slim AS base
WORKDIR /app
RUN npm install -g bun@1.4.4

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

RUN groupadd --system app && useradd --system --gid app --home /app app \
  && chown -R app:app /app
USER app

EXPOSE 44100
CMD ["node", "--import", "remix/node-tsx", "server.ts"]
