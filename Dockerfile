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
COPY --from=builder /app/node_modules ./node_modules

# Copy server (runtime code)
COPY server ./server
# Copy built frontend
COPY --from=builder /app/dist ./dist

# Default build-time args
ARG ENABLE_GEMINI=false
ARG GEMINI_MODEL=gemini-2.5-flash
ARG MAX_REQUESTS_PER_DAY=5
ARG PORT=80

# Set environment variables
ENV PORT=${PORT} \
    STATIC_DIR=/app/dist \
    COUNTERS_FILE=/app/data/rate-counters.json \
    DB_FILE=/app/data/chat-db.json \
    ENABLE_GEMINI=${ENABLE_GEMINI} \
    GEMINI_MODEL=${GEMINI_MODEL} \
    MAX_REQUESTS_PER_DAY=${MAX_REQUESTS_PER_DAY}

# Create app directory for data and give ownership
RUN mkdir -p /app/data && chown -R node:node /app

# Switch back to root only for port 80 binding
USER root

EXPOSE 80

ENTRYPOINT ["node", "server/index.js"]
