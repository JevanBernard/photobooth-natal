const ID_RE = /^[A-Za-z0-9_-]{10,32}$/;
const NAMES = ['story.jpg', 'print-1.jpg', 'print-2.jpg', 'print-3.jpg', 'print-4.jpg'];

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Upload-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

// Baca parameter dari req.query (Vercel/Express) atau dari URL
function param(req, key) {
  if (req.query && req.query[key] != null) return String(req.query[key]);
  try { return new URL(req.url, 'http://x').searchParams.get(key); } catch { return null; }
}

async function readBody(req, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) { const e = new Error('File terlalu besar'); e.status = 413; throw e; }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function safeEqual(a, b) {
  const crypto = require('crypto');
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = { ID_RE, NAMES, cors, json, param, readBody, safeEqual };
