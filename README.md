# Lembayung 23:59 — AU interaktif simulator iPhone

Web game bergaya iOS 26 (Liquid Glass + Dynamic Island). Isinya: Chat, Gram, X, Tok, Jurnal, Jam, Foto, Setelan.
Karakter **chat duluan**, ada jam game (1 detik = 1 menit), ada kejadian yang harus ditunggu berjam-jam, dan tiap karakter dijalankan AI Groq.

## Struktur
```
index.html  style.css  story.js  app.js
api/chat.js   -> proxy Groq (key aman di server)
api/pin.js    -> pencari gambar Pinterest (+ fallback)
package.json  .env.example  .gitignore
```

## Deploy ke Vercel (step by step)

### Cara A — lewat GitHub (paling gampang)
1. Buat akun di https://github.com dan https://vercel.com (login Vercel pakai GitHub).
2. Di GitHub: **New repository** → nama `lembayung-2359` → Create.
3. Upload semua file project ini ke repo (tombol *Add file → Upload files*), pastikan folder `api/` ikut. Klik **Commit**.
4. Di Vercel: **Add New… → Project** → pilih repo `lembayung-2359` → **Import**.
5. Framework Preset: **Other**. Build Command & Output Directory biarkan kosong.
6. Buka **Environment Variables**, tambahkan:
   - `GROQ_API_KEY` = API key Groq kamu
   - `GROQ_MODEL` = `qwen/qwen3.8-27b` (ganti jika nama model di akun Groq kamu beda)
   - `PINTEREST_ACCESS_TOKEN` = (opsional, lihat catatan Pinterest)
7. Klik **Deploy**. Selesai, kamu dapat URL `https://nama-project.vercel.app`.
8. Tiap ganti env variable, buka **Deployments → ⋯ → Redeploy** supaya berlaku.

### Cara B — lewat terminal (Vercel CLI)
1. Install Node.js 18+ dari https://nodejs.org
2. `npm i -g vercel`
3. Masuk ke folder project: `cd lembayung-2359`
4. `vercel login`
5. `vercel` (jawab pertanyaan: link ke project baru, directory `./`, tidak ada build)
6. `vercel env add GROQ_API_KEY` (pilih Production, tempel key) — ulangi untuk `GROQ_MODEL` dan `PINTEREST_ACCESS_TOKEN`
7. `vercel --prod`

### Tes lokal
1. Salin `.env.example` jadi `.env`, isi key.
2. `vercel dev` lalu buka http://localhost:3000

## Cek AI jalan
Buka app **Setelan → Tes koneksi AI**. Kalau gagal, pesan error ditampilkan di situ (key salah, nama model salah, dll).
Kalau AI offline, karakter memakai balasan cadangan supaya game tetap jalan.

## Catatan Pinterest
Pinterest tidak punya API pencarian gambar publik yang bebas. API v5 butuh akun developer, persetujuan aplikasi, dan access token (endpoint pencarian bisa dibatasi). Scraping Pinterest melanggar ketentuannya, jadi tidak dipakai di sini.
- Dengan `PINTEREST_ACCESS_TOKEN`: `api/pin.js` mencari pin sesuai kata kunci tiap postingan (field `q` di `story.js`).
- Tanpa token / jika ditolak: otomatis memakai gambar cadangan (picsum).
Hasil gambar di-cache di browser dan di CDN Vercel.

## Edit cerita
Semua ada di `story.js`: karakter (`CHARS`), bab (`CHAPTERS`), jadwal (`at: T(hari, jam, menit)`), misi, dan kondisi selesai (`done`).
Ganti nama aplikasi/ikon di `app.js` (objek `APPS`).
Kecepatan waktu bisa diubah di app Jam; tombol "Lompat" di Dynamic Island melewati waktu tunggu.
