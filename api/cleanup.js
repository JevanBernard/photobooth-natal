// GET /api/cleanup — dipanggil Vercel Cron tiap hari. Menghapus sesi yang lebih tua dari EXPIRE_DAYS.
// Vercel mengirim header Authorization: Bearer <CRON_SECRET> kalau variabel CRON_SECRET diatur.
const storage = require('../lib/storage');
const { json } = require('../lib/util');

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return json(res, 401, { error: 'unauthorized' });
  const days = process.env.EXPIRE_DAYS !== undefined ? Number(process.env.EXPIRE_DAYS) : 7;
  try {
    const removed = await storage.cleanup(days * 86400000);
    return json(res, 200, { removedSessions: removed });
  } catch (e) {
    console.error('cleanup gagal', e);
    return json(res, 500, { error: 'cleanup gagal' });
  }
};
