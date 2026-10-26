const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsStr = (s) => JSON.stringify(String(s)).replace(/</g, '\\u003c');
const TOTAL = 5; // 1 story + 4 foto cetak

module.exports = function render({ event, days, names, urls }) {
  const hasStory = names.includes('story.jpg');
  const prints = names.filter((n) => /^print-\d\.jpg$/.test(n)).sort();
  const done = names.length >= TOTAL;

  const story = hasStory ? `
    <section class="card">
      <h2>Story Instagram <span class="tag">9:16</span></h2>
      <img class="story" src="${esc(urls['story.jpg'].view)}" alt="Foto Story">
      <div class="actions">
        <a class="btn primary" href="${esc(urls['story.jpg'].download)}" download>Unduh Story</a>
        <button id="share" class="btn" hidden>Bagikan ke Instagram</button>
      </div>
    </section>` : '';

  const printCards = prints.map((n, i) => `
      <figure>
        <img src="${esc(urls[n].view)}" alt="Foto ${i + 1}" loading="lazy">
        <a class="btn small" href="${esc(urls[n].download)}" download>Unduh foto ${n.match(/\d/)[0]}</a>
      </figure>`).join('');

  const printSection = prints.length ? `
    <section class="card">
      <h2>Foto satuan <span class="tag">3:2 · siap cetak</span></h2>
      <div class="grid">${printCards}</div>
    </section>` : '';

  const pending = !done ? `
    <p class="note" id="pending">${names.length
      ? `Masih mengunggah… (${names.length} dari ${TOTAL} file siap). Halaman ini akan memperbarui diri.`
      : 'Fotomu sedang diproses. Halaman ini akan memperbarui diri otomatis, tunggu sebentar ya.'}</p>` : '';

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(event)} — Foto kamu</title>
<style>
  :root { --bg:#faf7f2; --fg:#2b2620; --card:#fff; --line:#e6dfd2; }
  @media (prefers-color-scheme: dark) { :root { --bg:#16130f; --fg:#f3eee6; --card:#201c17; --line:#3a332a; } }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
    padding:20px 16px 40px; display:flex; flex-direction:column; align-items:center; gap:16px; }
  h1 { font-size:1.2rem; margin:6px 0 0; }
  h2 { font-size:1rem; margin:0 0 12px; display:flex; align-items:center; gap:8px; }
  .tag { font-size:.72rem; font-weight:600; padding:2px 8px; border:1px solid var(--line); border-radius:99px; opacity:.8; }
  .card { width:100%; max-width:520px; background:var(--card); border:1px solid var(--line); border-radius:16px; padding:16px; }
  img { display:block; width:100%; height:auto; border-radius:8px; }
  img.story { max-width:300px; margin:0 auto; }
  .actions { display:flex; flex-direction:column; gap:10px; margin-top:14px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  figure { margin:0; display:flex; flex-direction:column; gap:8px; }
  .btn { display:block; text-align:center; text-decoration:none; font:inherit; font-weight:700; padding:13px 16px;
    border-radius:12px; border:2px solid var(--fg); color:var(--fg); background:transparent; cursor:pointer; }
  .btn.primary { background:var(--fg); color:var(--bg); }
  .btn.small { padding:9px 10px; font-size:.88rem; }
  .note, small { max-width:520px; text-align:center; opacity:.72; line-height:1.5; font-size:.9rem; margin:0; }
</style>
</head>
<body>
  <h1>${esc(event)}</h1>
  ${pending}
  ${story}
  ${printSection}
  <small>Di iPhone, kalau unduhan tidak masuk ke Galeri, tahan lama pada foto lalu pilih "Simpan ke Foto".
  Foto hanya bisa dibuka lewat link atau QR ini dan dihapus otomatis setelah ${esc(days)} hari.</small>
<script>
  var DONE = ${done ? 'true' : 'false'};
  var STORY = ${hasStory ? jsStr(urls['story.jpg'].view) : 'null'};
  var STORY_DL = ${hasStory ? jsStr(urls['story.jpg'].download) : 'null'};
  var btn = document.getElementById('share');
  if (btn && STORY && navigator.share) {
    btn.hidden = false;
    btn.onclick = async function () {
      try {
        var blob = await (await fetch(STORY)).blob();
        var file = new File([blob], 'story.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); }
        else { location.href = STORY_DL; }
      } catch (e) { if (!e || e.name !== 'AbortError') location.href = STORY_DL; }
    };
  }
  if (!DONE) {
    var n = 0;
    try { n = +(sessionStorage.getItem('r') || 0); } catch (e) {}
    if (n < 40) {
      try { sessionStorage.setItem('r', n + 1); } catch (e) {}
      setTimeout(function () { location.reload(); }, 5000);
    } else {
      var p = document.getElementById('pending');
      if (p) p.textContent = 'Foto belum lengkap. Muat ulang halaman nanti, atau tanyakan ke petugas booth.';
    }
  }
</script>
</body>
</html>`;
};
