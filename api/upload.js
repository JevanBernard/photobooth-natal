// POST /api/upload?id=<sessionId>&name=<story.jpg|print-1.jpg..print-4.jpg>
// Header: X-Upload-Key: <UPLOAD_KEY>, Content-Type: image/jpeg, body = JPEG mentah.
const storage = require('../lib/storage');
const { ID_RE, NAMES, cors, json, param, readBody, safeEqual } = require('../lib/util');

const MAX_BYTES = 4.4 * 1024 * 1024; // batas body fungsi Vercel ~4.5 MB

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') return json(res, 405, { error: 'Gunakan POST' });

  const serverKey = process.env.UPLOAD_KEY;
  if (!serverKey) return json(res, 500, { error: 'UPLOAD_KEY belum diatur di server' });
  if (!safeEqual(req.headers['x-upload-key'], serverKey)) return json(res, 401, { error: 'Upload key salah' });

  const id = param(req, 'id');
  const name = param(req, 'name');
  if (!ID_RE.test(id || '') || !NAMES.includes(name)) return json(res, 400, { error: 'id atau nama file tidak valid' });

  let body;
  try { body = await readBody(req, MAX_BYTES); }
  catch (e) { return json(res, e.status || 400, { error: e.message }); }

  const isJpeg = body.length > 1000 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff;
  if (!isJpeg) return json(res, 400, { error: 'File bukan JPEG' });

  try {
    const status = await storage.put(id, name, body); // 'created' atau 'exists' (aman diulang)
    return json(res, 200, { ok: true, status });
  } catch (e) {
    console.error('upload gagal', e);
    return json(res, 500, { error: 'Gagal menyimpan' });
  }
};
