<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Finance Assistant Chatbot

This contains everything you need to run your app locally.

This project provides a simple, rate-limited chat interface with basic rule-based responses and persistent session storage.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Optional: create a `.env.local` or `.env` file in the project root for server config.
   - `MAX_REQUESTS_PER_DAY` to cap daily requests (default 5)
   - `PORT` dev server port (default 8787)
   - `COUNTERS_FILE` rate counter file (default `rate-counters.json`)
   - `DB_FILE` chat storage file (default `chat-db.json`)
3. Run the app:
   - Option A: `npm run dev:all` (server + Vite)
   - Option B: In two terminals: `npm run server` and `npm run dev`

## Docker

Build and run locally:

```
docker build -t finance-assistant-chatbot .
docker run --rm -p 8787:8787 \
  -e MAX_REQUESTS_PER_DAY=5 \
  -v $(pwd)/data:/app/data \
  finance-assistant-chatbot
```

Open http://localhost:8787

## Jenkins

This repo includes a Jenkinsfile that:
- Installs deps, builds frontend, builds Docker image
- Optionally pushes the image if `DOCKER_PUSH=true` and Docker Hub credentials `docker-hub` are configured

Set up Jenkins credentials:
- ID `docker-hub`: Username/Password for Docker Hub

Environment overrides:
- `IMAGE_NAME` in Jenkinsfile (e.g., `your-hub-user/finance-assistant-chatbot`)

## Server and rate limiting

The app uses a small Node server to enforce a per-network (per-IP) daily request limit. This prevents bypassing via incognito or different devices.

- Config: set `MAX_REQUESTS_PER_DAY` for the server (default 5).
- Identity: limits by requester IP (`x-forwarded-for` respected when present).
- Behavior: once the cap is reached, the server returns 429 and the UI shows an error.

Example `.env.local`:

Server environment example (in `.env.local` or `.env`):

```
PORT=8787
COUNTERS_FILE=rate-counters.json
MAX_REQUESTS_PER_DAY=5
DB_FILE=chat-db.json
```

Note: client-side limits are best-effort. For strong enforcement, proxy Gemini calls through a server and apply rate limits there.
## Chat history persistence

The app stores chat history in `localStorage` under `finassist_chat_history_v1` so conversations survive browser refreshes. Clear site storage to reset.
## Persistent chat storage (server)

The server persists chat history per `sessionId` in a JSON file.

- Endpoint `POST /api/chat` accepts `{ history, sessionId }` and appends the assistant reply to the stored session.
- Endpoint `POST /api/session/load` accepts `{ sessionId }` and returns `{ history }` for that session.
- Configure DB file path via `DB_FILE` env (default `chat-db.json`).

Client creates a `sessionId` once and reuses it across refreshes, then attempts to restore history from the server on load.

Example server env additions:

```
DB_FILE=chat-db.json
```
# chatbot
