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
   - `PORT` port server (default 8787)
   - `COUNTERS_FILE` file penyimpan hit harian (default `rate-counters.json`)
   - `DB_FILE` file penyimpan chat (default `chat-db.json`)
3. Jalankan:
   - Opsi A: `npm run dev:all` (menjalankan server + Vite bersama)
   - Opsi B: `npm run server` dan `npm run dev` di dua terminal

UI tersedia di `http://localhost:3000` (dev) dengan proxy ke API `http://localhost:8787`.

## Produksi (tanpa Docker)
1. Build frontend: `npm run build`
2. Jalankan server: `npm run server`
3. Aplikasi dilayani dari port `PORT` (default `8787`).

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

## Jenkins (opsional)
Pipeline di `Jenkinsfile`:
- Checkout → Install → Build → Docker build → (opsional) Push.
- Push aktif jika job memiliki variabel `DOCKER_PUSH=true` dan kredensial Docker Hub `docker-hub` terpasang.

Sesuaikan nama image di `Jenkinsfile` (`IMAGE_NAME`).

## Endpoint API (ringkas)
- `POST /api/chat` body `{ history, sessionId }` → balasan `{ text }` dan riwayat disimpan.
- `GET /api/quota` → `{ remaining, limit }` (sisa kuota IP hari ini).
- `POST /api/session/load` body `{ sessionId }` → `{ history }`.

## Catatan
- Rate limit mengandalkan IP. Di balik reverse proxy, pastikan header `x-forwarded-for` diteruskan.
- Simpan data ke volume saat deploy (mount ke `/app/data`) agar tidak hilang saat container di‑restart.
