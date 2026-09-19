# OFFSET 5 — rekonstruksi geometri dari foto

## Perubahan

Model tujuh balok diganti dengan rekonstruksi bentuk luar yang bisa dipilih:

- Feeder berupa portal terbuka, rel, kepala feeder dan selang yang terlihat, pile lembar, serta meja kontrol.
- Meja transfer feeder, deretan housing melengkung, kisi pelindung, bak tinta dan roller atas.
- Pijakan antarunit, platform dengan pola pelat bordes berupa instanced geometry, dan tangga akses.
- Passage ke delivery, rangka delivery, panel terang, jendela gelap, serta pagar batang vertikal.
- Baseline V9 memperinci jalur feeder sampai PU1: guide pile, linkage kepala feeder, rear-edge separator, suction tape/pressure roller, front/side lay, infeed gripper, serta referensi roller dampening, plate-clamp, dan distribusi tinta PU1.

Acuan: sembilan foto pengguna. Tidak ada foto asli atau berkas DWG pabrik yang diterbitkan bersama frontend.

## Bukti dan batas

| Foto | Acuan bentuk |
| --- | --- |
| IMG_1624.jpeg / IMG_1625.jpeg | Portal feeder, pile, kepala feeder dan selang |
| IMG_1626.jpeg | Meja transfer, kisi dan roller terlihat |
| IMG_1627.jpeg / IMG_1628.jpeg | Cover melengkung, pola deretan, pijakan dan platform |
| IMG_1970.jpeg / IMG_1971.jpeg | Bak tinta dan roller atas terbuka |
| IMG_2312.jpeg / IMG_1656.jpeg | Delivery, panel atas, jendela, pagar dan tangga |

Seluruh dimensi adalah **VISUAL_ONLY / APPROXIMATE**. Delapan housing merupakan susunan rekonstruksi yang masih perlu verifikasi; jumlah/penomoran unit, coating, dryer, spesifikasi inspeksi dan komponen internal tidak dinyatakan terverifikasi. Warna tinta adalah ilustrasi. Foto tidak memberikan pengukuran dimensi aktual.

Istilah dan urutan fungsi feeder–PU1 diperkaya dari brosur Speedmaster CD 102, paten Heidelberg untuk suction-belt feed table (US5697606A), paten sheet alignment (US6681697B2), dan manual Preset Plus Feeder yang diarsipkan. Referensi tersebut tidak membuktikan konfigurasi terpasang, jumlah roller, diameter, nip, timing, phasing, atau setting mesin Offset 5; semua detail yang tidak tampak pada foto tetap ditandai **REFERENCE_ONLY** atau **MEDIUM_CONFIDENCE**.

DWG `250804 layout offset(1).dwg` berhasil diproses dengan @mlightcad/libredwg-web 0.7.11. Hasil awal: 37.943 entitas database; header INSUNITS=4; teks OFFSET 5 ditemukan pada handle 2337F. Angka tersebut adalah hasil ekstraksi awal, bukan jumlah objek fisik terverifikasi. Posisi teks bukan bukti footprint atau titik pusat mesin. Layout dan transformasi penempatan tidak diubah pada revisi geometri ini.

## Interaksi

- Pilih kelompok utama atau subkelompok pada tab Struktur; raycast mesh mengarah ke subkelompok pemiliknya.
- Slider tanpa pilihan memisahkan kelompok utama. Dengan pilihan, hanya anak langsung pilihan (atau pilihan jika merupakan leaf) yang bergerak. Bagian lain menjadi transparan.
- Isolasi mempertahankan visibility ancestor agar objek pilihan tetap terlihat.
- Rakit kembali, Reset, dan klik ganda mengembalikan transformasi tersimpan.
- Mode ringan menghilangkan detail pola bordes dan bayangan.
- Geometri statis digabung per kelompok/material. Baseline V9 memiliki 326 mesh/instance batches, 42 instanced mesh, 87 node geometri yang bisa dipilih, dan 632 node taxonomy enam tingkat.

## Validasi

Build lokal dan 43 pengujian Node lulus, termasuk resolusi taxonomy feeder–PU1, explode terpilih, reset berulang, hierarki, isolasi, nilai geometri finite, batas envelope, anggaran mesh mobile, serta regression backend. Envelope visual tetap 15,72 × 2,83 × 4,19 m. QA visual pada perangkat fisik dan verifikasi terhadap pengukuran mesin nyata tetap diperlukan.
