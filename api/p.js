// GET /p/<id>  (di-rewrite ke /api/p?id=<id>) — halaman tamu
const storage = require('../lib/storage');
const render = require('../lib/guestPage');
const { ID_RE, param } = require('../lib/util');

const slug = (s) => String(s).replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'foto';

module.exports = async (req, res) => {
  let id = param(req, 'id');
  if (!id) id = ((req.url || '').match(/\/p\/([A-Za-z0-9_-]+)/) || [])[1];

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  const event = process.env.EVENT_NAME || 'Photobooth';
  if (!ID_RE.test(id || '')) {
    res.statusCode = 404;
    return res.end(render.renderMessage({ event, title: 'Link ini <em>tidak dikenal.</em>',
      body: 'Coba scan ulang QR di booth, atau pastikan link yang kamu buka lengkap.' }));
  }

  const days = process.env.EXPIRE_DAYS !== undefined ? Number(process.env.EXPIRE_DAYS) : 7;
  try {
    const names = await storage.list(id);
    const urls = await storage.urls(id, names, (n) => `${slug(event)}-${n}`);
    const ready = names.filter((n) => urls[n]);
    res.statusCode = 200;
    return res.end(render({ event, days, names: ready, urls }));
  } catch (e) {
    console.error('halaman tamu gagal', e);
    res.statusCode = 500;
    return res.end(render.renderMessage({ event, title: 'Sebentar, <em>ada gangguan.</em>',
      body: 'Server sedang tidak bisa mengambil fotomu. Muat ulang halaman ini dalam satu menit.' }));
  }
};
