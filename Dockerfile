# syntax=docker/dockerfile:1.7

# --- Build stage: compile frontend ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# --- Runtime stage: serve static + API ---
FROM node:20-alpine AS runtime
WORKDIR /app

# Copy server (no external deps required)
COPY server ./server
# Copy built frontend
COPY --from=builder /app/dist ./dist

# Optional: create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

ENV PORT=8787 \
    STATIC_DIR=/app/dist \
    COUNTERS_FILE=/app/data/rate-counters.json \
    DB_FILE=/app/data/chat-db.json \
    MAX_REQUESTS_PER_DAY=5

EXPOSE 8787

ENTRYPOINT ["node", "server/index.js"]

