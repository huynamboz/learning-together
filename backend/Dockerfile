# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
# Prisma's query engine links against OpenSSL, which the slim image leaves out.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Full toolchain: compiles the API and doubles as the one-off image for
# `prisma migrate deploy` and the seed, which need the dev dependencies.
FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM build AS prod-deps
RUN npm prune --omit=dev

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3010 \
    STORAGE_LOCAL_ROOT=/app/data/storage
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
# Uploads land in <cwd>/.tmp and are then renamed into the storage root. A rename
# cannot cross mount points, so both must sit under the same volume: run from it.
RUN mkdir -p /app/data && chown node:node /app/data
WORKDIR /app/data
USER node
EXPOSE 3010
CMD ["node", "/app/dist/main.js"]
