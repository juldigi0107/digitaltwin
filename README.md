# OFFSET 5 — Factory Digital Twin

Fondasi aplikasi web dari nol: **frontend GitHub Pages**, **backend Cloudflare Workers + D1**, Vanilla JavaScript dan Three.js. Hanya satu aset: `MACHINE-OFFSET5` / Heidelberg Speedmaster CD 102-8+L.

## Status yang jujur

**Belum memenuhi penerimaan Phase 1 DWG.** Saat penulisan, hanya master prompt yang diberikan; DWG, manual, foto/nameplate, dan model CAD belum tersedia. Aplikasi membuka ruang inspeksi terpisah, bukan denah pabrik rekaan. Model saat ini adalah **selubung visual prosedural APPROXIMATE**, bukan replika teknis mesin atau konfigurasi 8 unit hasil tebakan.

Identitas berasal dari pernyataan pengguna di bagian 2 dan 15 master prompt. Komponen, dimensi, posisi, koneksi utilitas dan status operasi tetap UNKNOWN.

## Sudah tersedia

- Penampil WebGL 2 / Three.js lokal, orbit/pan/zoom, pemilihan, fokus bounding box dengan transisi, top/isometric/reset.
- Satu aset dengan metadata, confidence, sumber dan penjelasan batas bukti.
- Pemisahan bidang geometri visual, transparansi, isolasi dan pengembalian posisi exact. **Bukan** exploded technical assembly.
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
