// Penyimpanan foto. Dua adapter dengan antarmuka sama:
//  - local    : folder data/sessions (untuk uji coba di laptop)
//  - supabase : Supabase Storage, bucket PRIVATE, akses lewat signed URL berumur pendek
// Struktur: <id>/story.jpg, <id>/print-1.jpg ... <id>/print-4.jpg
const fs = require('fs');
const path = require('path');
const { NAMES } = require('./util');

function localAdapter() {
  const root = path.join(__dirname, '..', 'data', 'sessions');
  fs.mkdirSync(root, { recursive: true });
  return {
    root,
    async put(id, name, buf) {
      const dir = path.join(root, id);
      fs.mkdirSync(dir, { recursive: true });
      const file = path.join(dir, name);
      if (fs.existsSync(file)) return 'exists';
      fs.writeFileSync(file, buf);
      return 'created';
    },
    async list(id) {
      const dir = path.join(root, id);
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir).filter((n) => NAMES.includes(n));
    },
    async urls(id, names, fileName) {
      const out = {};
      for (const n of names) {
        const view = `/files/${id}/${n}`;
        out[n] = { view, download: `${view}?dl=${encodeURIComponent(fileName(n))}` };
      }
      return out;
    },
    async cleanup(maxAgeMs) {
      const cutoff = Date.now() - maxAgeMs;
      let removed = 0;
      for (const id of fs.readdirSync(root)) {
        const dir = path.join(root, id);
        const files = fs.readdirSync(dir);
        const newest = Math.max(0, ...files.map((f) => fs.statSync(path.join(dir, f)).mtimeMs));
        if (newest < cutoff) { fs.rmSync(dir, { recursive: true, force: true }); removed++; }
      }
      return removed;
    }
  };
}

function supabaseAdapter() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY belum diatur');
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const bucket = process.env.SUPABASE_BUCKET || 'booth';
  const st = () => sb.storage.from(bucket);
  const SIGN_SECONDS = 3600;

  return {
    async put(id, name, buf) {
      const { error } = await st().upload(`${id}/${name}`, buf, { contentType: 'image/jpeg', upsert: false });
      if (error) {
        const dup = String(error.statusCode || error.status) === '409' || /already exists|duplicate/i.test(error.message || '');
        if (dup) return 'exists';
        throw error;
      }
      return 'created';
    },
    async list(id) {
      const { data, error } = await st().list(id, { limit: 100 });
      if (error) throw error;
      return (data || []).map((f) => f.name).filter((n) => NAMES.includes(n));
    },
    async urls(id, names) {
      if (!names.length) return {};
      const { data, error } = await st().createSignedUrls(names.map((n) => `${id}/${n}`), SIGN_SECONDS);
      if (error) throw error;
      return { __data: data };
    },
    async cleanup(maxAgeMs) {
      const cutoff = Date.now() - maxAgeMs;
      const folders = [];
      for (let offset = 0; ; offset += 100) {
        const { data, error } = await st().list('', { limit: 100, offset });
        if (error) throw error;
        if (!data || !data.length) break;
        folders.push(...data.map((d) => d.name));
        if (data.length < 100) break;
      }
      let removed = 0;
      for (const id of folders) {
        const { data: files, error } = await st().list(id, { limit: 100 });
        if (error || !files || !files.length) continue;
        const stamps = files.map((f) => Date.parse(f.created_at || f.updated_at || ''));
        if (stamps.some((t) => !Number.isFinite(t))) continue; // tidak yakin umurnya: jangan hapus
        if (Math.max(...stamps) < cutoff) {
          const { error: rmErr } = await st().remove(files.map((f) => `${id}/${f.name}`));
          if (!rmErr) removed++;
        }
      }
      return removed;
    }
  };
}

// Supabase mengembalikan array; ubah jadi peta {nama: {view, download}} di sini
function wrapSupabaseUrls(adapter) {
  const raw = adapter.urls;
  adapter.urls = async (id, names, fileName) => {
    const res = await raw(id, names, fileName);
    const out = {};
    (res.__data || []).forEach((d, i) => {
      if (d && d.signedUrl) {
        const n = names[i];
        out[n] = { view: d.signedUrl, download: `${d.signedUrl}&download=${encodeURIComponent(fileName(n))}` };
      }
    });
    return out;
  };
  return adapter;
}

let cached;
function getStorage() {
  if (!cached) cached = process.env.STORAGE === 'local' ? localAdapter() : wrapSupabaseUrls(supabaseAdapter());
  return cached;
}

module.exports = new Proxy({}, { get: (_, prop) => getStorage()[prop] });
