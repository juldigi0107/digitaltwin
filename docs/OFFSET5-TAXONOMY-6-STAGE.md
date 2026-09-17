# OFFSET 5 — taxonomy explode 6 stage dan orientasi v4

## Orientasi terkunci

Sumbu longitudinal scene memakai **+X dari feeder menuju delivery**. Sisi dengan walkway/pijakan berulang pada foto diperlakukan sebagai **operator side (+Z)**; sisi berlawanan ditulis *opposite side* sampai drive-side terverifikasi dari dokumen mesin spesifik.

Koreksi terhadap v3: `IMG_2312.jpeg` adalah acuan ujung **feeder/pile inlet**, sedangkan `IMG_1624.jpeg` dan `IMG_1625.jpeg` adalah acuan **delivery pile end**. Foto `IMG_1629/1631/1633` mengisi transition/deck delivery; `IMG_1630/1633` mengunci gantry FA-Swan; `IMG_1165/0947` memberi detail roller/gauge/hose di zona akhir line. Penempatan detail terakhir ke coating-service zone adalah **INFERRED_POSITION**, bukan pengukuran engineering.

## Taxonomy 6 stage

| Stage | Label | Contoh node | Aturan explode |
| --- | --- | --- | --- |
| 1 | Mesin | OFFSET 5 · CD 102-8+L UV | Root, tidak bergerak saat memilih child |
| 2 | Unit Utama | Feeder, Printing Units Group, Coating Unit, Delivery, Inline Inspection, Platform, Console, Auxiliary | Memisahkan zona besar dari center line |
| 3 | Sub | PU1–PU8, pile inlet, coating roller zone, delivery transfer/pile, bridge/imaging | Memisahkan subsistem dalam Unit Utama |
| 4 | Block | housing, ink/dampening, cylinder zone, hood, support block | Memisahkan kelompok bentuk/fungsi |
| 5 | Part | side cover, ink fountain, step, gauge panel, camera pod | Memisahkan komponen individual yang terlihat |
| 6 | Spesifik Part | panel, roller, gauge 1–3, camera pod housing, tread | Leaf selection; hanya detail yang punya bukti visual/reference |

## Urutan line yang diterapkan

`Feeder → PU1 → PU2 → PU3 → PU4 → PU5 → PU6 → PU7 → PU8 → Coating Unit (L) → Delivery transfer → Inline inspection gantry → Delivery pile`

Identity **CD 102-8+L** mendukung delapan printing units plus coating unit. HEIDELBERG menyebut CD 102 sebagai platform packaging dengan double-diameter impression cylinders dan triple-diameter transfer cylinders; internal cylinders tidak dimodelkan sebagai bentuk terpasang karena foto tidak memperlihatkan keseluruhan mekanisme. Focusight mendeskripsikan FS-SWAN sebagai online inspection system dengan air-blowing leveling, visual imaging, image processing, alarm dan marking/rejection; geometry app hanya meniru bridge/pod yang terlihat pada foto, bukan spesifikasi internalnya.

## Confidence policy

- `PHOTO_VERIFIED`: bentuk/posisi relatif terlihat langsung pada foto pengguna.
- `REFERENCE_PLUS_PHOTO`: nama/fungsi didukung sumber vendor dan bentuk luarnya terlihat pada foto.
- `INFERRED_POSITION`: komponen terlihat, tetapi lokasi presisi di taxonomy ditentukan dari urutan line dan continuity foto; harus dapat direvisi.
- `REFERENCE_ONLY`: taxonomy teknis didukung sumber vendor, tetapi internal geometry tidak diekspos sebagai detail terverifikasi.

Tidak ada angka dimensi visual yang boleh dibaca sebagai meter, clearance, atau toleransi maintenance.
