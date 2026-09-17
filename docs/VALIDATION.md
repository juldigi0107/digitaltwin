# Validasi — 17 September 2026

## Lulus

- Build frontend dengan Three.js 0.180.0 yang dikemas lokal.
- 12 unit/integration tests: transformasi koordinat, preservasi entitas unknown, invalid layout/position, siklus explode/reset exact, autentikasi, izin viewer/admin, CORS, data position sebelum layout, SQLite persistence, revision conflict, database yang belum terhubung, invalid JSON.
- Test persistence menggunakan SQLite asli lokal dengan adapter API D1; bukan mock penyimpanan berbasis object JavaScript.
- Build dan 12 test juga lulus di GitHub Actions.

Run pertama: https://github.com/juldigi0107/digitaltwin/actions/runs/35223709856

## Belum terverifikasi / terblokir

- Deployment GitHub Pages: gagal 404; log meminta Pages diaktifkan di repository settings.
- Browser GitHub belum dapat mengubah settings; website menyatakan akun tidak mendukung password sign-in.
- Cloudflare: kode dan migrasi siap, tetapi belum deploy. Browser fallback ditolak pemeriksaan persetujuan otomatis setelah koneksi plugin dilewati.
- Uji visual browser: belum selesai. Cloud browser tidak dapat membuka localhost dan frontend belum terbit; jangan menyebut QA desktop/mobile telah lulus.
- DWG: belum tersedia. Ekstraksi, fidelity gedung, unit, skala, posisi dan seluruh footprint belum dapat diuji.
- Manual/CAD mesin: belum tersedia. LOD teknis 2–5 dan konfigurasi terpasang belum dapat diverifikasi.

## Penegasan model

Pemisahan geometri hanya menguji bidang model prosedural, bukan exploded view dari part Heidelberg yang terverifikasi. Semua bidang tetap anak dari satu root MACHINE-OFFSET5 dan reset diuji tepat pada koordinat awal. Dimensi visual tidak dipresentasikan sebagai ukuran mesin.
