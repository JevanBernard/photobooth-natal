# Fotobooth — Story 9:16 + 4 foto cetak + QR

Hasil tiap sesi:

| File | Ukuran | Untuk | Siapa yang bisa unduh |
|---|---|---|---|
| `story.jpg` | 1080×1920 (9:16) | IG Story, 4 foto dalam frame | Tamu (lewat QR) |
| `print-1…4.jpg` | 1800×1200 (3:2, 6×4 inci) | Cetak terpisah, pakai bingkai/logo sederhana | Tamu (lewat QR) |
| `raw-1…4.jpg` | resolusi webcam | Foto mentah tanpa frame | **Hanya operator**, tersimpan di folder laptop |

## Cara kerja

```
Laptop booth (kiosk.html, webcam USB)
  ├─ ambil 4 foto → komposit di browser
  ├─ simpan SEMUA file ke folder di laptop (mentah + berframe)
  ├─ tampilkan QR langsung (id sesi dibuat di laptop)
  └─ upload di latar belakang ke server (antrean + coba ulang kalau internet putus)
Server (Vercel + Supabase Storage, bucket private)
  └─ /p/<id> → halaman tamu: Story + 4 foto, tombol unduh
```

Karena QR dibuat di laptop dan upload berjalan di latar belakang, tamu tetap bisa scan walau internet venue sedang lemot; halaman tamu menampilkan "sedang diproses" dan memperbarui diri otomatis.

## 1. Uji coba di laptop (tanpa akun apa pun)

```bash
npm install
npm run dev
```

Buka `http://localhost:3000/kiosk.html` di **Chrome atau Edge**. Buka "Pengaturan operator", isi Upload key dengan `dev`, lalu pilih folder simpan. Foto disimpan di folder `data/` selama mode lokal.

Kalau `public/frame.png` belum ada, kiosk memakai frame polos sementara.

## 2. Siapkan desain frame

Template panduan ada di folder `desain-template/`:

- **Story:** `frame.png`, 1080×1920 px, simpan di `public/`. Empat lubang foto harus **transparan** dan posisinya sama dengan di `config.js` (default: 460×560 px di x=60/560, y=300/900). Hindari teks/logo penting di y<250 dan y>1670 karena tertutup tampilan Instagram.
- **Cetak:** `frame-print.png`, 1800×1200 px, simpan di `public/`. Bagian tengah transparan; isi bingkai/logo di tepi. Kalau file ini tidak ada, dipakai bingkai putih tipis.

Kalau desainmu memakai ukuran slot lain, ubah koordinat `story.slots` di `public/config.js`.

## 3. Deploy ke internet (Supabase + Vercel)

**A. Supabase (penyimpanan)**
1. Buat project di supabase.com.
2. Storage → New bucket, nama `booth`, **jangan** dicentang Public.
3. Project Settings → API: salin *Project URL* dan kunci *service_role* (rahasia, jangan dibagikan atau ditaruh di kiosk/GitHub publik).

**B. Vercel (server)**
1. Deploy folder ini (`npx vercel` dari laptop, atau import dari GitHub).
2. Environment Variables:

| Nama | Isi |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_KEY` | kunci service_role |
| `SUPABASE_BUCKET` | `booth` |
| `UPLOAD_KEY` | kata sandi acak panjang buatanmu |
| `EVENT_NAME` | nama event (tampil di halaman tamu) |
| `EXPIRE_DAYS` | `7` |
| `CRON_SECRET` | teks acak (untuk pembersihan harian) |

3. Deploy ulang setelah mengisi variabel. Kamu mendapat alamat `https://xxxx.vercel.app`.

**C. Arahkan kiosk ke server**
Di `public/config.js` isi `apiBase: 'https://xxxx.vercel.app'`. Jalankan kiosk dari laptop (`npm run dev`) dan isi Upload key di Pengaturan operator.

> Pembersihan otomatis: `vercel.json` menjadwalkan `/api/cleanup` tiap hari untuk menghapus sesi lebih tua dari `EXPIRE_DAYS`.

## Catatan penting

- **Syarat Vercel Hobby:** paket gratis Vercel dibatasi untuk pemakaian pribadi dan non-komersial. Kalau booth ini disewakan atau dipakai untuk klien JC Flow Media, cek syarat Vercel terbaru; bisa perlu paket Pro atau pindah ke hosting lain. Server ini mudah dipindah karena logika penyimpanan terpisah di `lib/storage.js`.
- **Supabase gratis:** kuota storage 1 GB dan bandwidth 5 GB/bulan (angka bisa berubah, cek di supabase.com/pricing), dan project dijeda setelah 7 hari tanpa aktivitas. Buka dashboard dan pastikan project aktif beberapa hari sebelum event.
- Satu sesi kira-kira 2–4 MB, jadi 1 GB cukup untuk sekitar 250–500 sesi sebelum dibersihkan.
- Foto mentah **tidak** diunggah ke server. Cadangkan folder simpan di laptop setelah event.
- Data foto tamu termasuk data pribadi (UU PDP): pasang tulisan kecil di booth bahwa foto disimpan sementara dan dihapus otomatis.

## Daftar cek sebelum hari H

- [ ] Frame `frame.png` dan `frame-print.png` sudah dipasang dan diuji hasilnya
- [ ] Upload test dari kiosk berhasil, QR bisa dibuka di HP lewat data seluler (bukan Wi-Fi booth)
- [ ] Tombol unduh jalan di iPhone dan Android
- [ ] Folder simpan sudah dipilih (status "Tersimpan di laptop ✓")
- [ ] Project Supabase aktif, `UPLOAD_KEY` sudah diisi di kiosk
- [ ] Hotspot cadangan, power, dan kabel USB webcam siap
