# Multi-stage build: Node to build the SPA, Caddy to serve it (and proxy the API, with TLS).
FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so source-only changes reuse this layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist/budget-app-front/browser /srv
