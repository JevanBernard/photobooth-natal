// Server lokal untuk uji coba dan untuk menyajikan kiosk dari laptop (http://localhost:3000/kiosk.html).
// Di produksi, folder api/ dijalankan Vercel; file ini tidak dipakai di sana.
process.env.STORAGE = process.env.STORAGE || (process.env.SUPABASE_URL ? 'supabase' : 'local');
process.env.UPLOAD_KEY = process.env.UPLOAD_KEY || 'dev';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { ID_RE, NAMES } = require('./lib/util');
const upload = require('./api/upload');
const page = require('./api/p');
const cleanup = require('./api/cleanup');

const PORT = process.env.PORT || 3000;
const app = express();
const run = (h) => (req, res) => Promise.resolve(h(req, res)).catch((e) => {
  console.error(e);
  if (!res.headersSent) { res.statusCode = 500; res.end('error'); }
});

app.all('/api/upload', run(upload));
app.all('/api/cleanup', run(cleanup));
app.get('/p/:id', run((req, res) => { req.query.id = req.params.id; return page(req, res); }));

// Padanan "signed URL" untuk mode lokal
app.get('/files/:id/:name', (req, res) => {
  const { id, name } = req.params;
  if (process.env.STORAGE !== 'local' || !ID_RE.test(id) || !NAMES.includes(name)) return res.status(404).end();
  const file = path.join(__dirname, 'data', 'sessions', id, name);
  if (!fs.existsSync(file)) return res.status(404).end();
  if (req.query.dl) res.setHeader('Content-Disposition', `attachment; filename="${String(req.query.dl).replace(/[^\w.-]+/g, '_')}"`);
  res.sendFile(file);
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kiosk   : http://localhost:${PORT}/kiosk.html`);
  console.log(`Storage : ${process.env.STORAGE}   Upload key: ${process.env.UPLOAD_KEY === 'dev' ? 'dev (default, hanya untuk uji lokal)' : '(dari env)'}`);
});
