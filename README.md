# OFFSET 5 — Factory Digital Twin

Fondasi aplikasi web dari nol: **frontend GitHub Pages**, **backend Cloudflare Workers + D1**, Vanilla JavaScript dan Three.js. Hanya satu aset: `MACHINE-OFFSET5` / Heidelberg Speedmaster CD 102-8+L.

## Status rekonstruksi foto

Model Offset 5 sudah direkonstruksi dari sembilan foto aktual pengguna: feeder terbuka, deretan cover melengkung, kisi dan roller atas, platform/tangga, serta delivery dengan pagar. Bentuk dan dimensi tetap **RECONSTRUCTED / APPROXIMATE**, bukan CAD resmi atau ukuran mesin terukur.

**Layout Phase 1 belum lengkap.** DWG asli sudah diterima dan berhasil diekstrak awal; posisi label OFFSET 5 ditemukan. Footprint, orientasi dan transformasi penempatan belum divalidasi sehingga scene tetap ruang inspeksi terpisah. Tidak ada denah pabrik rekaan.

Lihat [rincian geometri dan bukti foto](docs/OFFSET5-PHOTO-RECONSTRUCTION.md). Delapan housing adalah susunan visual yang perlu verifikasi konfigurasi terpasang. Komponen tersembunyi tidak dibuat.

## Sudah tersedia

- Penampil WebGL 2 / Three.js lokal, orbit/pan/zoom, pemilihan, fokus bounding box dengan transisi, top/isometric/reset.
- Satu aset dengan metadata, confidence, sumber dan penjelasan batas bukti.
- Hierarki bentuk luar, explode pilihan, transparansi, isolasi dan reset exact. Bukan katalog part internal terverifikasi.
- UI Bahasa Indonesia, panel desktop dan panel geser mobile, mode ringan.
- Import JSON hasil ekstraksi DWG yang sudah ditinjau; entitas mentah tidak dibuang. Ini **bukan parser DWG biner**.
- Layer mapping, transformasi DWG X/Y → Three X/Z, kalibrasi, anchor, serta editor drag/rotate/scale dan angka.
- Workers API: viewer/admin, origin allowlist, validasi payload, revision guard, persistensi D1.
- Cache shell offline dan salinan data IndexedDB secara opt-in. Tidak ada antrean tulis offline.
- GitHub Actions untuk build/test/Pages, serta workflow manual deployment Workers.

## Menjalankan

Node 24:

```sh
npm ci
npm run build
npm test
npm run dev
```

Buka `http://localhost:4173`. `dist/index.html` memuat UI/CSS/logika aplikasi inline dan menggunakan modul engine di `src/` serta Three.js lokal di `vendor/`. Jangan membuka HTML lewat `file://`.

## Deployment

Lihat [panduan deployment](docs/DEPLOYMENT.md). Backend tidak otomatis aktif sebelum database, origin, dan secrets dikonfigurasi. Frontend tetap menampilkan metadata awal saat backend belum tersambung. Tidak ada token di source code atau penyimpanan browser.

## Sumber layout

Lihat [kontrak layout](docs/LAYOUT-CONTRACT.md). DWG asli dibutuhkan untuk ekstraksi dan pemeriksaan fidelity. JSON hasil ekstraksi harus mempertahankan layer, ID entitas, hash berkas dan raw metadata. Data sintetis hanya terdapat dalam unit test, bukan data aplikasi.

## Batas verifikasi

Unit test menggunakan SQLite lokal untuk endpoint D1; ini tidak menggantikan pengujian pada Workers/D1 produksi. Detail LOD 2–5, GLB resmi, discovery/AI, Google Sheets/Drive dan inventori mesin lain belum diimplementasikan karena di luar fondasi dengan bukti yang tersedia.
