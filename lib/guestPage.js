// Halaman tamu (/p/<id>) dan halaman pesan (link tidak valid / error).
// Gaya bersama ada di public/theme.css, sama dengan layar kiosk.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsStr = (s) => JSON.stringify(String(s)).replace(/</g, '\\u003c');
const TOTAL = 5; // 1 story + 4 foto cetak
const PRINTS = 4;

const head = (title) => `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="theme-color" content="#050c32">
<title>${esc(title)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/cinzel.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/theme.css">
<style>
  body { min-height: 100svh; display: flex; flex-direction: column;
    padding: max(var(--s-5), env(safe-area-inset-top)) var(--gutter) max(var(--s-6), env(safe-area-inset-bottom)); }
  .top { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s-4);
    padding-bottom: var(--s-4); border-bottom: 1px solid var(--line); }
  .top .star { color: var(--candle); }
  main { flex: 1; width: 100%; max-width: 1180px; margin: 0 auto; }
  .hero { margin: var(--s-5) 0 0; border-radius: var(--r-l); overflow: hidden; aspect-ratio: 16 / 9;
    box-shadow: 0 0 0 1px oklch(83% 0.14 78 / 0.25), 0 30px 60px -30px oklch(0% 0 0 / 0.8); }
  .hero img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .intro { padding: var(--s-6) 0 var(--s-5); }
  .intro h1 { font-size: var(--step-4); margin-top: var(--s-3); }
  .lede { max-width: 34ch; margin: var(--s-4) 0 0; color: var(--paper-dim); text-wrap: pretty; }

  /* kartu Story di atas alas kertas */
  .card { margin: 0; width: min(100%, 360px); aspect-ratio: 9 / 16; border-radius: var(--r-s);
    background: var(--night-2); box-shadow: 0 1px 0 oklch(100% 0 0 / 0.06) inset, 0 30px 60px -20px oklch(0% 0 0 / 0.6); }
  .card img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .actions { display: flex; flex-wrap: wrap; gap: var(--s-3); margin-top: var(--s-5); }
  .actions .btn { flex: 1 1 12rem; }

  .prints { margin-top: var(--s-7); }
  .prints-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: var(--s-2) var(--s-4);
    padding-bottom: var(--s-3); border-bottom: 1px solid var(--line); }
  .prints-head h2 { font: 600 var(--step-2)/1.1 var(--display-face); letter-spacing: 0.02em; margin: 0; }
  .grid { list-style: none; margin: var(--s-5) 0 0; padding: 0; display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-5) var(--s-4); }
  .grid figure { margin: 0; }
  .shot { aspect-ratio: 3 / 2; border-radius: var(--r-s); overflow: hidden; background: var(--night-2); }
  .shot img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .grid figcaption { display: flex; justify-content: space-between; align-items: center; gap: var(--s-2);
    margin-top: var(--s-2); }
  .grid figcaption .label { letter-spacing: 0.1em; }
  .dl { display: inline-flex; align-items: center; min-height: 44px; padding: 0 var(--s-1);
    color: var(--paper); font-weight: 600; text-decoration: underline; text-decoration-color: var(--candle);
    text-decoration-thickness: 2px; text-underline-offset: 5px; }
  @media (hover: hover) and (pointer: fine) { .dl:hover { color: var(--candle); } }

  /* menunggu upload */
  .waiting { position: relative; display: grid; place-items: center; text-align: center; padding: var(--s-4);
    border: 1.5px dashed var(--line); background: transparent; box-shadow: none; }
  .waiting span { animation: breathe 2.4s ease-in-out infinite; }
  @keyframes breathe { 50% { opacity: 0.45; } }
  .status { display: flex; align-items: center; gap: var(--s-3); margin-top: var(--s-5); color: var(--paper-dim); }
  .meter { flex: 0 0 7rem; height: 3px; border-radius: 3px; background: var(--line); overflow: hidden; }
  .meter i { display: block; height: 100%; background: var(--candle); transform-origin: left; }

  footer { max-width: 1180px; width: 100%; margin: var(--s-7) auto 0; padding-top: var(--s-4);
    border-top: 1px solid var(--line); color: var(--paper-dim); font-size: var(--step--1); }
  footer p { max-width: 60ch; margin: 0 0 var(--s-2); text-wrap: pretty; }
  footer .credit { margin-top: var(--s-5); }

  /* layar lebar: kartu menempel di kiri, foto satuan di kanan */
  @media (min-width: 900px) {
    .layout { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--s-7); align-items: start; }
    .story-col { position: sticky; top: var(--s-5); }
    .prints { margin-top: 0; }
    .card { width: min(380px, calc((100svh - 9rem) * 9 / 16)); }
    .hero { aspect-ratio: auto; height: min(42svh, 460px); }
    .actions { width: min(380px, calc((100svh - 9rem) * 9 / 16)); }
  }
</style>
</head>`;

const credit = `<p class="credit">Sistem photobooth dikembangkan oleh <b>JC Flow Media</b></p>`;
const hero = (event) => `
  <figure class="hero"><img src="/brand/dayspring.webp" width="1200" height="675" fetchpriority="high"
    alt="Key visual ${esc(event)}: tulisan emas The Dayspring di langit malam berbintang"></figure>`;

const top = (event, days) => `
<header class="top">
  <span class="label"><span class="star" aria-hidden="true">✦</span> ${esc(event)}</span>
  ${days != null ? `<span class="label">Berlaku ${esc(days)} hari</span>` : ''}
</header>`;

function render({ event, days, names, urls }) {
  const hasStory = names.includes('story.jpg');
  const prints = names.filter((n) => /^print-\d\.jpg$/.test(n)).sort();
  const done = names.length >= TOTAL;
  const ready = names.length;

  const story = hasStory ? `
      <figure class="card print-in" id="story">
        <img src="${esc(urls['story.jpg'].view)}" width="1080" height="1920" decoding="async" fetchpriority="high"
          alt="Story 9:16 berisi empat fotomu di ${esc(event)}">
      </figure>
      <div class="actions">
        <a class="btn btn-primary" href="${esc(urls['story.jpg'].download)}" download>Simpan Story</a>
        <button id="share" class="btn btn-ghost" type="button" hidden>Bagikan</button>
      </div>` : `
      <figure class="card waiting"><span class="label">Story sedang dicetak…</span></figure>`;

  const slots = Array.from({ length: PRINTS }, (_, i) => {
    const n = `print-${i + 1}.jpg`;
    const no = String(i + 1).padStart(2, '0');
    if (!prints.includes(n)) return `
        <li><figure>
          <div class="shot waiting"><span class="label">Menunggu</span></div>
          <figcaption><span class="label num">${no} / 04</span></figcaption>
        </figure></li>`;
    return `
        <li><figure>
          <div class="shot"><img src="${esc(urls[n].view)}" width="1800" height="1200" loading="lazy" decoding="async"
            alt="Foto ${i + 1} dari 4, ukuran cetak 6×4 inci"></div>
          <figcaption>
            <span class="label num">${no} / 04</span>
            <a class="dl" href="${esc(urls[n].download)}" download>Unduh<span class="sr-only"> foto ${i + 1}</span></a>
          </figcaption>
        </figure></li>`;
  }).join('');

  const status = done ? '' : `
      <div class="status" role="status" id="pending">
        <span class="meter" aria-hidden="true"><i style="transform:scaleX(${(ready / TOTAL).toFixed(2)})"></i></span>
        <span class="num">${ready ? `${ready} dari ${TOTAL} file siap. Halaman ini memperbarui diri.` : 'Sedang diunggah dari booth. Halaman ini memperbarui diri.'}</span>
      </div>`;

  return `${head(`${event} — Kartu Natal kamu`)}
<body>
${top(event, days)}
<main>${hero(event)}
  <section class="intro">
    <p class="label">Empat pose, satu kartu</p>
    <h1 class="display">${done ? 'Kartumu <em>sudah jadi.</em>' : 'Kartumu <em>sedang dicetak.</em>'}</h1>
    <p class="lede">Simpan Story-nya untuk Instagram, atau unduh empat foto satuan untuk dicetak.</p>
    ${status}
  </section>
  <div class="layout">
    <div class="story-col">${story}
    </div>
    <section class="prints" aria-labelledby="prints-title">
      <div class="prints-head">
        <h2 id="prints-title">Foto satuan</h2>
        <span class="label">6×4 inci · siap cetak</span>
      </div>
      <ol class="grid">${slots}
      </ol>
    </section>
  </div>
</main>
<footer>
  <p>Foto ini hanya bisa dibuka lewat link atau QR ini, dan dihapus otomatis setelah ${esc(days)} hari.</p>
  <p>Di iPhone, kalau unduhan tidak masuk ke Galeri: tahan lama pada foto, lalu pilih “Simpan ke Foto”.</p>
  ${credit}
</footer>
<script>
  var DONE = ${done ? 'true' : 'false'};
  var STORY = ${hasStory ? jsStr(urls['story.jpg'].view) : 'null'};
  var STORY_DL = ${hasStory ? jsStr(urls['story.jpg'].download) : 'null'};

  // Kartu "tercetak" sekali saja, tidak diulang saat halaman memperbarui diri
  var card = document.getElementById('story');
  if (card) {
    var seen = false;
    try { seen = sessionStorage.getItem('printed') === '1'; } catch (e) {}
    if (!seen) {
      var img = card.querySelector('img');
      var go = function () { card.classList.add('is-printing'); try { sessionStorage.setItem('printed', '1'); } catch (e) {} };
      (img.decode ? img.decode() : Promise.resolve()).then(go, go);
    }
  }

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
      if (p) p.lastElementChild.textContent = 'Foto belum lengkap. Muat ulang nanti atau tanyakan ke petugas booth. Kalau sudah lewat ${esc(days)} hari, fotonya sudah dihapus.';
    }
  }
</script>
</body>
</html>`;
}

// Halaman pesan singkat (link tidak valid, error server) dengan gaya yang sama
function renderMessage({ event, title, body }) {
  return `${head(`${event} — ${title.replace(/<[^>]+>/g, '')}`)}
<body>
${top(event)}
<main>
  <section class="intro">
    <h1 class="display">${title}</h1>
    <p class="lede">${esc(body)}</p>
  </section>
</main>
<footer>${credit}</footer>
</body>
</html>`;
}

module.exports = render;
module.exports.renderMessage = renderMessage;
