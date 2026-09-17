# Kontrak layout hasil ekstraksi

**Tidak ada layout contoh pabrik yang dikirim dalam aplikasi.** Impor menerima JSON, bukan DWG biner. DWG diekstrak dengan CAD tool yang sesuai di tahap berikutnya setelah berkas tersedia, kemudian hasilnya dibandingkan dengan gambar sumber.

Field wajib:

| Field | Isi |
| --- | --- |
| schemaVersion | 1 |
| source.type | DWG |
| source.file | Nama DWG asli |
| source.sha256 | SHA-256 64 karakter dari DWG asli |
| source.extractionMethod | Tool, versi, dan langkah ekstraksi sebenarnya |
| transform.sourceUnits | UNKNOWN, mm, cm, m, inch, foot |
| transform.scale | Meter per unit sumber; null jika unknown |
| transform.originX / originY | Titik referensi CAD, bukan ukuran rekaan |
| transform.rotation | Rotasi bidang dalam derajat; default hanya jika sumber mendukung |
| entities | Semua entitas hasil ekstraksi, termasuk yang belum dapat dirender |
| layerMapping | Nama layer yang benar-benar ada → semantik hasil review |
| machineAnchor | Opsional, dengan posisi CAD dan referensi bukti |

Entitas: `id`, `layer`, `confidence`, `semantic`, `points` (pasangan CAD X/Y), `closed`, `raw` (seluruh entity payload). `height` dalam unit sumber hanya boleh digunakan bersama `heightSource` yang dapat ditelusuri. Confidence: VERIFIED, HIGH CONFIDENCE, MEDIUM CONFIDENCE, ESTIMATED, UNKNOWN, UNVERIFIED, APPROXIMATE, CONFLICTING.

Semantik yang dirender: FLOOR, WALL, COLUMN, DOOR, OPENING, CORRIDOR, AREA, FOOTPRINT, BOUNDARY, STAIRS, RAMP. Tanpa tinggi terverifikasi, geometri disajikan sebagai referensi 2D. Closed polygon FLOOR/AREA dapat ditampilkan sebagai permukaan; closed polygon WALL/COLUMN dapat diekstrusi hanya dengan tinggi bersumber. Door/opening tidak menebak pemotongan dinding; batas yang sudah terbuka harus mengikuti polygon sumber. Lengkung/blok/teks/dimensi yang belum diolah tetap berada dalam `raw` dan tidak dibuang.

Hash dan source metadata membantu traceability tetapi **bukan** verifikasi otomatis bahwa klaim berasal dari DWG. Admin wajib meninjau hasil. Sistem tidak memberi semua geometri status VERIFIED secara otomatis.

Untuk UNKNOWN, kalibrasi opsional menyimpan `sourceDistance`, `knownDistance` dalam meter, dan `note` yang memuat referensi titik A/B serta sumber jarak. Skala = knownDistance/sourceDistance. Tanpa kalibrasi, tampilkan SCALE UNKNOWN.

`machineAnchor`: CAD `x`, `y`, `z`, `rotation`, `confidence`, `sourceEntityId`. DWG-VERIFIED hanya diterima jika ID entitas ada. Rotasi CAD berlawanan tanda dengan rotasi Y Three.js setelah mapping sumbu; transformasi diterapkan eksplisit dalam engine.

Override posisi yang disimpan editor menggunakan **koordinat Three.js**, bukan CAD: x, y (vertikal), z; rotation (Y, derajat); scale (skala visual seragam); confidence APPROXIMATE atau USER-CONFIRMED. Editor menampilkan inverse CAD X/Y. Mengubah layout/kalibrasi menghapus override posisi untuk mencegah pencampuran sistem koordinat.

Batas tahap awal: 4 MiB JSON, 30.000 entitas, 20.000 titik per entitas. File besar memerlukan segmentasi/LOD atau pipeline tambahan; jangan menghapus entitas tanpa rekaman alasan.
