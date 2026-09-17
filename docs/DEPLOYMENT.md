# Deployment GitHub + Cloudflare

## 1. Frontend GitHub Pages

Repositori: `juldigi0107/digitaltwin`.

1. Buka Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Workflow **Build and deploy GitHub Pages** berjalan saat push ke `main`.
3. Build menginstal Three.js versi terkunci, membuat `dist`, menjalankan test, lalu mengunggah artefak Pages.
4. Jika repository private, pastikan paket GitHub mendukung Pages untuk repository tersebut; tidak perlu mengubah visibilitas repository untuk memperbaiki izin secara diam-diam.

## 2. Backend Cloudflare Workers + D1

Backend tidak memakai Apps Script, R2 atau layanan AI. D1 menyimpan satu snapshot state berversi; cocok untuk tahap satu mesin, bukan klaim arsitektur database inventori besar final.

Melalui Cloudflare Dashboard:

1. Buat database D1 bernama `offset5-digital-twin`.
2. Jalankan SQL `backend/migrations/0001_initial.sql` di D1 Console.
3. Buat Worker `offset5-digital-twin-api` melalui integrasi GitHub/Workers Builds. Gunakan root proyek; entrypoint `backend/worker.js` dengan konfigurasi `backend/wrangler.toml`. Atur deployment command `npx wrangler deploy --config backend/wrangler.toml`.
4. Ganti `REPLACE_WITH_D1_DATABASE_ID` pada konfigurasi dengan ID database sebenarnya. Binding harus bernama `DB`.
5. Atur variable `ALLOWED_ORIGINS` ke origin GitHub Pages yang aktual. Contoh origin akun ini: `https://juldigi0107.github.io` (tanpa path repository).
6. Atur dua **secret** berbeda: `ADMIN_TOKEN` dan `VIEWER_TOKEN`, masing-masing acak kuat setidaknya 32 byte. Jangan masukkan token ke GitHub, HTML, URL, chat, atau screenshot. Simpan dan distribusikan melalui sarana aman Anda sendiri.
7. Deploy lalu periksa `/api/health`: `ready` harus `true`.
8. Di aplikasi, buka **Koneksi**, masukkan origin Workers (tanpa `/api`) dan token sesuai peran.

Alternatif GitHub Actions tanpa terminal di komputer Anda:

1. Di Settings → Secrets and variables → Actions, siapkan secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` dan variable `CLOUDFLARE_D1_DATABASE_ID`. API token hanya diberi izin Workers Scripts Edit dan D1 Edit untuk akun tujuan.
2. Jalankan workflow **Deploy Cloudflare Workers** secara manual.
3. Workflow menerapkan migrasi idempoten lalu deploy. `ADMIN_TOKEN` dan `VIEWER_TOKEN` tetap dikonfigurasi langsung sebagai secret Worker melalui dashboard.
4. Isi `frontend/config.json` dengan `apiBase` origin Worker setelah deploy, lalu commit; pengguna masih dapat mengatur URL melalui Koneksi.

## Verifikasi end-to-end setelah deployment

- GET `/api/state` tanpa token → 401.
- Token viewer → dapat membaca, perubahan → 403.
- Admin mengimpor JSON dari DWG yang benar → state tersimpan.
- Admin menyimpan posisi → reload dan viewer melihat nilai yang sama.
- Dua sesi memakai revisi sama → penulisan kedua mendapat 409, bukan menimpa data.
- Uji origin tidak diizinkan → 403.
- Uji mobile, WebGL, kontrol kamera, cache offline, dan pulih online.

## Hal yang masih dibutuhkan

DWG asli wajib untuk menghasilkan layout nyata. Manual/foto/CAD dibutuhkan untuk meningkatkan envelope prosedural menjadi representasi mesin yang dapat diverifikasi. Jangan menandai Phase 1 selesai sebelum uji fidelity DWG.
