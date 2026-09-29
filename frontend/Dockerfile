# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# The Nitro output is self-contained, so the runtime image needs no node_modules.
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3011
WORKDIR /app
COPY --from=build /app/.output ./.output
USER node
EXPOSE 3011
CMD ["node", ".output/server/index.mjs"]
