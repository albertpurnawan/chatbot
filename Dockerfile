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

# Copy package metadata and production deps
COPY package*.json ./
# Reuse node_modules from builder to ensure @google/genai is present
COPY --from=builder /app/node_modules ./node_modules

# Copy server (runtime code)
COPY server ./server
# Copy built frontend
COPY --from=builder /app/dist ./dist

# Optional: create non-root user
RUN addgroup -S app && adduser -S app -G app
USER app

# Optional build-time args to set defaults (can be overridden at runtime)
ARG ENABLE_GEMINI=false
ARG GEMINI_MODEL=gemini-2.5-flash
ARG MAX_REQUESTS_PER_DAY=5
ARG PORT=8787

ENV PORT=${PORT} \
    STATIC_DIR=/app/dist \
    COUNTERS_FILE=/app/data/rate-counters.json \
    DB_FILE=/app/data/chat-db.json \
    ENABLE_GEMINI=${ENABLE_GEMINI} \
    GEMINI_MODEL=${GEMINI_MODEL} \
    MAX_REQUESTS_PER_DAY=${MAX_REQUESTS_PER_DAY}

EXPOSE ${PORT}

ENTRYPOINT ["node", "server/index.js"]
