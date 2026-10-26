const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const EXPIRE_DAYS = Number(process.env.EXPIRE_DAYS || 7);
const EVENT_NAME = process.env.EVENT_NAME || 'Photobooth';
const PHOTO_DIR = path.join(__dirname, 'data', 'photos');
fs.mkdirSync(PHOTO_DIR, { recursive: true });

// Alamat yang ditulis di QR. Isi BASE_URL kalau pakai domain/tunnel,
// kalau kosong dipakai IP laptop di jaringan lokal (tamu harus satu Wi-Fi).
function lanIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return 'localhost';
}
const BASE_URL = (process.env.BASE_URL || `http://${lanIp()}:${PORT}`).replace(/\/$/, '');

const app = express();

app.get('/api/config', (req, res) => {
  res.json({ baseUrl: BASE_URL, eventName: EVENT_NAME, expireDays: EXPIRE_DAYS });
});

// Upload hasil foto (JPEG mentah di body)
app.post('/api/upload', express.raw({ type: 'image/jpeg', limit: '20mb' }), (req, res) => {
  if (!req.body || !req.body.length) return res.status(400).json({ error: 'Tidak ada data foto' });
  const id = crypto.randomBytes(8).toString('base64url'); // tidak bisa ditebak
  fs.writeFileSync(path.join(PHOTO_DIR, `${id}.jpg`), req.body);
  res.json({ id, url: `${BASE_URL}/p/${id}` });
});

const validId = (id) => /^[A-Za-z0-9_-]{6,32}$/.test(id);

function photoPath(id) {
  if (!validId(id)) return null;
  const p = path.join(PHOTO_DIR, `${id}.jpg`);
  return fs.existsSync(p) ? p : null;
}

app.get('/photo/:id.jpg', (req, res) => {
  const p = photoPath(req.params.id);
  if (!p) return res.status(404).send('Foto tidak ditemukan atau sudah kedaluwarsa');
  if (req.query.download) res.setHeader('Content-Disposition', `attachment; filename="${EVENT_NAME.replace(/[^\w-]+/g, '-')}-${req.params.id}.jpg"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.sendFile(p);
});

// Halaman tamu
app.get('/p/:id', (req, res) => {
  if (!photoPath(req.params.id)) return res.status(404).send('Foto tidak ditemukan atau sudah kedaluwarsa');
  const html = fs.readFileSync(path.join(__dirname, 'public', 'guest.html'), 'utf8')
    .replaceAll('{{ID}}', req.params.id)
    .replaceAll('{{EVENT}}', EVENT_NAME)
    .replaceAll('{{DAYS}}', String(EXPIRE_DAYS));
  res.type('html').send(html);
});

app.get('/qr', async (req, res) => {
  const text = String(req.query.text || '');
  if (!text) return res.status(400).end();
  res.type('png').send(await QRCode.toBuffer(text, { width: 600, margin: 1 }));
});

app.use(express.static(path.join(__dirname, 'public')));

// Hapus foto yang sudah melewati masa berlaku
function cleanup() {
  const limit = Date.now() - EXPIRE_DAYS * 86400000;
  for (const f of fs.readdirSync(PHOTO_DIR)) {
    const p = path.join(PHOTO_DIR, f);
    if (fs.statSync(p).mtimeMs < limit) fs.unlinkSync(p);
  }
}
cleanup();
setInterval(cleanup, 3600000);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kiosk : http://localhost:${PORT}/kiosk.html`);
  console.log(`QR mengarah ke: ${BASE_URL}`);
});
