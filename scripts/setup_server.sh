#!/usr/bin/env bash
set -euo pipefail

# Build and run the chatbot server in Docker with configurable options.
# Configure via environment variables or inline before invoking this script.
# Example:
#   PORT=9000 MAX_PER_DAY=10 ENABLE_GEMINI=true GEMINI_API_KEY=xxxx ./scripts/setup_server.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

IMAGE_NAME=${IMAGE_NAME:-chatbot}
IMAGE_TAG=${IMAGE_TAG:-latest}
CONTAINER_NAME=${CONTAINER_NAME:-chatbot}
PORT=${PORT:-8787}
DATA_DIR=${DATA_DIR:-"$REPO_ROOT/data"}
MAX_PER_DAY=${MAX_PER_DAY:-5}
ENABLE_GEMINI=${ENABLE_GEMINI:-false}
GEMINI_API_KEY=${GEMINI_API_KEY:-}
GEMINI_MODEL=${GEMINI_MODEL:-gemini-2.5-flash}

usage() {
  cat <<USAGE
Usage: $(basename "$0") [options]

Options (all can also be set via env vars):
  -n, --container-name NAME   Container name (default: ${CONTAINER_NAME}) [ENV: CONTAINER_NAME]
  -i, --image-name NAME       Image name (default: ${IMAGE_NAME}) [ENV: IMAGE_NAME]
  -t, --image-tag TAG         Image tag (default: ${IMAGE_TAG}) [ENV: IMAGE_TAG]
  -p, --port PORT             Server/API port (default: ${PORT}) [ENV: PORT]
      --data-dir DIR          Host data dir to mount (default: ${DATA_DIR}) [ENV: DATA_DIR]
      --max-per-day N         Rate limit per IP per day (default: ${MAX_PER_DAY}) [ENV: MAX_PER_DAY]
      --enable-gemini BOOL    Enable Gemini (true/false, default: ${ENABLE_GEMINI}) [ENV: ENABLE_GEMINI]
      --gemini-api-key KEY    Gemini API key (required if enable true) [ENV: GEMINI_API_KEY]
      --gemini-model MODEL    Gemini model (default: ${GEMINI_MODEL}) [ENV: GEMINI_MODEL]
  -h, --help                  Show this help
USAGE
}

# Parse CLI args (override env/defaults)
while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--container-name) CONTAINER_NAME="$2"; shift 2;;
    --container-name=*) CONTAINER_NAME="${1#*=}"; shift 1;;
    -i|--image-name) IMAGE_NAME="$2"; shift 2;;
    --image-name=*) IMAGE_NAME="${1#*=}"; shift 1;;
    -t|--image-tag) IMAGE_TAG="$2"; shift 2;;
    --image-tag=*) IMAGE_TAG="${1#*=}"; shift 1;;
    -p) PORT="$2"; shift 2;;
    -p*) PORT="${1#-p}"; shift 1;;
    --port) PORT="$2"; shift 2;;
    --port=*) PORT="${1#*=}"; shift 1;;
    --data-dir) DATA_DIR="$2"; shift 2;;
    --data-dir=*) DATA_DIR="${1#*=}"; shift 1;;
    --max-per-day) MAX_PER_DAY="$2"; shift 2;;
    --max-per-day=*) MAX_PER_DAY="${1#*=}"; shift 1;;
    --enable-gemini) ENABLE_GEMINI="$2"; shift 2;;
    --enable-gemini=*) ENABLE_GEMINI="${1#*=}"; shift 1;;
    --gemini-api-key) GEMINI_API_KEY="$2"; shift 2;;
    --gemini-api-key=*) GEMINI_API_KEY="${1#*=}"; shift 1;;
    --gemini-model) GEMINI_MODEL="$2"; shift 2;;
    --gemini-model=*) GEMINI_MODEL="${1#*=}"; shift 1;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown option: $1" >&2; usage; exit 1;;
  esac
done

echo "[setup] Image: $IMAGE_NAME:$IMAGE_TAG"
echo "[setup] Port: $PORT"
echo "[setup] Container: $CONTAINER_NAME"
echo "[setup] Data dir: $DATA_DIR"
echo "[setup] Max/day: $MAX_PER_DAY"
echo "[setup] Enable Gemini: $ENABLE_GEMINI"
echo "[setup] Gemini model: $GEMINI_MODEL"

# Ensure data dir exists (and is writable)
if ! mkdir -p "$DATA_DIR" 2>/dev/null; then
  echo "[setup] Failed to create data dir at '$DATA_DIR' (permission denied)." >&2
  echo "[setup] Please set DATA_DIR to a writable path, e.g.:" >&2
  echo "        DATA_DIR=\$HOME/chatbot-data ./scripts/setup_server.sh" >&2
  exit 1
fi

# Build args for optional Gemini enable
BUILD_ARGS=( )
if [ "$ENABLE_GEMINI" = "true" ]; then
  BUILD_ARGS+=( --build-arg ENABLE_GEMINI=true )
  BUILD_ARGS+=( --build-arg GEMINI_MODEL="$GEMINI_MODEL" )
fi

echo "[setup] Building image from $REPO_ROOT..."
if [ ${#BUILD_ARGS[@]} -gt 0 ]; then
  docker build -f "$REPO_ROOT/Dockerfile" "${BUILD_ARGS[@]}" -t "$IMAGE_NAME:$IMAGE_TAG" "$REPO_ROOT"
else
  docker build -f "$REPO_ROOT/Dockerfile" -t "$IMAGE_NAME:$IMAGE_TAG" "$REPO_ROOT"
fi

# Stop and remove existing container if present
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "[setup] Removing existing container '${CONTAINER_NAME}'"
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

echo "[setup] Starting container..."
RUN_ENV=(
  -e PORT="$PORT"
  -e MAX_REQUESTS_PER_DAY="$MAX_PER_DAY"
  -e ENABLE_GEMINI="$ENABLE_GEMINI"
  -e GEMINI_MODEL="$GEMINI_MODEL"
)

if [ -n "$GEMINI_API_KEY" ]; then
  RUN_ENV+=( -e GEMINI_API_KEY="$GEMINI_API_KEY" )
fi

docker run -d --name "${CONTAINER_NAME}" --restart unless-stopped \
  -p "$PORT":"$PORT" \
  -v "$DATA_DIR":/app/data \
  "${RUN_ENV[@]}" \
  "$IMAGE_NAME:$IMAGE_TAG"

echo "[setup] Done. Visit http://localhost:$PORT (or your server address)."
