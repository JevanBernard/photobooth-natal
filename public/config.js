// ===== Pengaturan booth =====
// Semua ukuran dalam piksel.
window.BOOTH_CONFIG = {
  eventName: 'Photobooth',   // tampil di layar kiosk (nama di halaman tamu diatur lewat EVENT_NAME di server)
  expireDays: 7,             // hanya untuk teks di layar; yang menghapus foto adalah server (EXPIRE_DAYS)

  // Alamat server upload. Kosong = server yang sama dengan halaman kiosk (mode uji lokal).
  // Untuk event: isi dengan alamat Worker Cloudflare-mu, misalnya 'https://fotobooth.namamu.workers.dev'
  apiBase: '',
  // Alamat yang ditulis di QR. Kosong = sama dengan apiBase (atau alamat halaman ini).
  publicBase: '',
  // Upload key bisa diisi di sini, atau lebih aman lewat "Pengaturan operator" di layar kiosk.
  uploadKey: '',

  // ----- Story Instagram (9:16) -----
  // Foto digambar DI BAWAH frame.png, jadi lubang foto di PNG harus transparan.
  // Layout: 4 foto landscape (16:9, sama dengan hasil webcam) ditumpuk ke bawah, 1 kolom, di tengah.
  // Area UI Instagram menutup sekitar y < 250 dan y > 1670; slot paling bawah masuk ~54 px ke area itu.
  // Mau lebih aman atau lebih besar? Ubah y/w/h di bawah (jaga rasio w:h = 16:9 supaya foto tidak terpotong).
  story: {
    width: 1080,
    height: 1920,
    slots: [
      { x: 212, y: 200,  w: 656, h: 369 },
      { x: 212, y: 585,  w: 656, h: 369 },
      { x: 212, y: 970,  w: 656, h: 369 },
      { x: 212, y: 1355, w: 656, h: 369 }
    ]
  },

  // ----- Foto satuan untuk cetak (3:2 = 6x4 inci @300dpi) -----
  // Bingkai/logo opsional: public/frame-print.png (1800x1200, bagian tengah transparan).
  print: { width: 1800, height: 1200 },

  countdownSeconds: 3,
  pauseBetweenShots: 1.5,
  mirrorPreview: true,       // pratinjau seperti cermin; hasil akhir tidak dibalik
  autoResetSeconds: 45,      // kembali ke layar awal setelah QR ditampilkan
  // Kalau laptop punya webcam bawaan dan webcam USB, isi sebagian nama webcam USB-mu
  // (misalnya "C920", "C922", "Brio"). Kosong = kamera default.
  cameraNameMatch: ''
};