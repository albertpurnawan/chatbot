# Chatbot

Sederhana, praktis, dan siap dipakai. Proyek ini adalah aplikasi chatbot berbasis web dengan server Node yang:
- Membatasi jumlah permintaan per hari per jaringan (IP) agar pemakaian wajar.
- Menyimpan riwayat percakapan per sesi sehingga tetap ada saat browser di‑refresh atau server restart.
- Menyajikan UI statis dan API dari satu server untuk memudahkan deploy.

## Fitur
- Limit harian per IP (konfigurable, default 5 per hari).
- Penyimpanan riwayat percakapan per `sessionId` (file JSON).
- Endpoint kuota untuk menampilkan sisa limit di UI.
- Siap Docker dan Jenkins untuk CI/CD.

## Prasyarat
- Node.js 18+ dan npm.

## Menjalankan (Development)
1. Install dependencies: `npm install`
2. (Opsional) Buat `.env.local` atau `.env` di root dengan konfigurasi:
   - `MAX_REQUESTS_PER_DAY` batas harian (default 5)
   - `PORT` port server API (default 8787). Bisa override juga via argumen CLI `--port` / `-p` saat menjalankan server secara manual.
   - `VITE_DEV_PORT` port dev server Vite (default 3000)
   - `VITE_API_PORT` port API untuk proxy Vite (default 8787, fallback ke `PORT`)
   - `COUNTERS_FILE` file penyimpan hit harian (default `rate-counters.json`)
   - `DB_FILE` file penyimpan chat (default `chat-db.json`)
   - `CORS_ALLOW_ORIGIN` origin CORS (default `*`), `CORS_ALLOW_METHODS` (default `GET, HEAD, POST, OPTIONS`), `CORS_ALLOW_HEADERS` (default `Content-Type`)
   - `STATIC_DIR` direktori file statis (default `dist`), `STATIC_INDEX` nama file index (default `index.html`)
3. Jalankan:
   - Opsi A: `npm run dev:all` (menjalankan server + Vite bersama)
   - Opsi B: `npm run server` dan `npm run dev` di dua terminal

UI tersedia di `http://localhost:${VITE_DEV_PORT||3000}` (dev) dengan proxy ke API `http://localhost:${VITE_API_PORT||PORT||8787}`.

## Produksi (tanpa Docker)
1. Build frontend: `npm run build`
2. Jalankan server: `npm run server`
3. Aplikasi dilayani dari port `PORT` (default `8787`). Anda juga bisa memberi argumen CLI: `node server/index.js --port 9000` atau `-p 9000`.

## Docker
Build dan jalankan lokal:

```
docker build -t chatbot .
docker run --rm -p 8787:8787 \
  -e MAX_REQUESTS_PER_DAY=5 \
  -v $(pwd)/data:/app/data \
  chatbot
```

Buka `http://localhost:8787`.

### Otomasi setup di server (script)

Gunakan script `scripts/setup_server.sh` untuk build & run container di server dengan konfigurasi yang sama seperti lokal.

Contoh pemakaian:

```
# Tanpa AI
PORT=8787 MAX_PER_DAY=5 DATA_DIR=/opt/chatbot/data \
  ./scripts/setup_server.sh

# Dengan Gemini
PORT=8787 MAX_PER_DAY=5 ENABLE_GEMINI=true GEMINI_API_KEY=your_key \
  GEMINI_MODEL=gemini-2.5-flash DATA_DIR=/opt/chatbot/data \
  ./scripts/setup_server.sh
```

Variabel yang tersedia:
- `IMAGE_NAME` (default `chatbot`)
- `IMAGE_TAG` (default `latest`)
- `PORT` (default `8787`)
- `DATA_DIR` (default `./data` pada direktori proyek; pastikan writable)
- `MAX_PER_DAY` (default `5`)
- `ENABLE_GEMINI` (`true|false`, default `false`)
- `GEMINI_API_KEY` (wajib bila `ENABLE_GEMINI=true`)
- `GEMINI_MODEL` (default `gemini-2.5-flash`)

## Jenkins (opsional)
Pipeline di `Jenkinsfile`:
- Checkout → Install → Build → Docker build → (opsional) Push.
- Push aktif jika job memiliki variabel `DOCKER_PUSH=true` dan kredensial Docker Hub `docker-hub` terpasang.

Sesuaikan nama image di `Jenkinsfile` (`IMAGE_NAME`).

Parameter tambahan:
- `ENABLE_GEMINI` (boolean): aktifkan integrasi Gemini saat build (butuh `GEMINI_API_KEY` saat run/deploy)
- `GEMINI_MODEL` (string): model Gemini yang digunakan (default `gemini-2.5-flash`)

## Endpoint API (ringkas)
- `POST /api/chat` body `{ history, sessionId }` → balasan `{ text }` dan riwayat disimpan.
- `GET /api/quota` → `{ remaining, limit }` (sisa kuota IP hari ini).
- `POST /api/session/load` body `{ sessionId }` → `{ history }`.

## Catatan
- Rate limit mengandalkan IP. Di balik reverse proxy, pastikan header `x-forwarded-for` diteruskan.
- Simpan data ke volume saat deploy (mount ke `/app/data`) agar tidak hilang saat container di‑restart.
Bila ingin mengaktifkan Gemini (AI):

Build image dengan argumen opsional:

```
docker build --build-arg ENABLE_GEMINI=true --build-arg GEMINI_MODEL=gemini-2.5-flash -t chatbot .
```

Jalankan container dengan environment:

```
docker run --rm -p 8787:8787 \
  -e ENABLE_GEMINI=true \
  -e GEMINI_API_KEY=your_key \
  -e MAX_REQUESTS_PER_DAY=5 \
  -v $(pwd)/data:/app/data \
  chatbot
```
