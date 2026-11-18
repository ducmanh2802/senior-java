/* Router + các trang: Sân đình (trang chủ), trang chơi, Góc đồng dao. */
(function () {
  'use strict';

  const app = document.getElementById('app');
  let cleanup = null;
  let token = 0;

  const ROOF = `<svg class="roof" viewBox="0 0 600 150" aria-hidden="true">
    <path d="M40 110 Q60 70 110 66 L490 66 Q540 70 560 110 Q520 92 490 92 L110 92 Q80 92 40 110Z" class="r1"/>
    <path d="M90 66 Q110 30 160 28 L440 28 Q490 30 510 66Z" class="r2"/>
    <circle cx="300" cy="18" r="10" class="pearl"/>
    <rect x="130" y="92" width="16" height="50" class="col"/><rect x="454" y="92" width="16" height="50" class="col"/>
    <rect x="250" y="92" width="14" height="50" class="col"/><rect x="336" y="92" width="14" height="50" class="col"/>
    <path d="M40 110 q-14 -24 6 -36" class="curl"/><path d="M560 110 q14 -24 -6 -36" class="curl"/>
  </svg>`;

  function statLine(id) {
    const s = Hub.stats(id);
    const n = s.win + s.lose + s.draw;
    return n ? `<span class="muted small">Đã chơi ${n} · thắng ${s.win}</span>` : '<span class="muted small">Chưa chơi</span>';
  }

  function home() {
    document.title = 'Sân Đình · Trò chơi dân gian';
    const soon = [['🎯', 'Ném còn'], ['🐓', 'Chọi gà lá'], ['🧱', 'Đánh khăng']];
    app.innerHTML = `
      <section class="hero">
        ${ROOF}
        <h1>Sân Đình</h1>
        <p class="lead">Ra sân đình chơi như hồi bé: ô ăn quan dưới gốc đa, cờ gánh đầu ngõ, bầu cua ngày Tết.</p>
      </section>
      <h2 class="sec">🗺️ Dạo quanh làng</h2>
      <div class="vl-wrap"></div>
      <h2 class="sec">🎮 Tất cả trò chơi</h2>
      <div class="grid games">
        ${Hub.games.map((g) => `
          <a class="card game-card" href="#/choi/${g.id}">
            <span class="g-icon" aria-hidden="true">${g.icon}</span>
            <span class="g-body"><b>${Hub.esc(g.name)}</b><span>${Hub.esc(g.tagline)}</span>
              <span class="g-meta"><span class="badge">${Hub.esc(g.players)}</span>${statLine(g.id)}</span></span>
          </a>`).join('')}
      </div>
      <h2 class="sec">🛠️ Sắp ra sân</h2>
      <div class="chips soon">${soon.map(([i, n]) => `<span class="chip">${i} ${n}</span>`).join('')}</div>
      <a class="card memory-link" href="#/dong-dao">
        <span class="g-icon">📜</span>
        <span class="g-body"><b>Góc ký ức &amp; đồng dao</b><span>Những trò chạy nhảy ngoài sân, cách chơi và lời đồng dao đi kèm.</span></span>
      </a>`;
    Hub.village.render(app.querySelector('.vl-wrap'));
  }

  function play(id) {
    const g = Hub.game(id);
    if (!g) return notFound();
    document.title = g.name + ' · Sân Đình';
    app.innerHTML = `
      <div class="page-head"><a href="#/" class="back">← Sân đình</a><h1>${g.icon} ${Hub.esc(g.name)}</h1></div>
      <details class="card rules"><summary>📖 Cách chơi</summary><div class="rules-body">${g.rules}</div></details>
      <section class="card stage game-${g.id}"></section>`;
    const my = token;
    const ret = g.render(app.querySelector('.stage'), { alive: () => my === token });
    cleanup = typeof ret === 'function' ? ret : null;
    if (!Hub.store.get('seen:' + id, false)) {
      app.querySelector('.rules').open = true;
      Hub.store.set('seen:' + id, true);
    }
  }

  function lore() {
    document.title = 'Góc ký ức · Sân Đình';
    app.innerHTML = `
      <div class="page-head"><a href="#/" class="back">← Sân đình</a><h1>📜 Góc ký ức &amp; đồng dao</h1></div>
      <p class="lead">Những trò không cần màn hình: chỉ cần một khoảng sân, vài người bạn và tiếng hát. Lời đồng dao có nhiều dị bản, mỗi vùng hát một khác.</p>
      <div class="lore">
        ${window.LORE.map((x) => `
          <article class="card lore-item" id="${x.id}">
            <h3>${x.icon} ${Hub.esc(x.name)} <span class="badge">${Hub.esc(x.people)}</span></h3>
            <p>${Hub.esc(x.how)}</p>
            ${x.verse ? `<blockquote class="verse">${x.verse.map(Hub.esc).join('<br>')}</blockquote>
              <button class="btn sm" data-read="${x.id}">🔊 Nghe đọc</button>` : ''}
          </article>`).join('')}
      </div>`;
    app.onclick = (e) => {
      const b = e.target.closest('[data-read]');
      if (!b || !('speechSynthesis' in window)) return;
      const item = window.LORE.find((x) => x.id === b.dataset.read);
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(item.verse.join(', '));
      u.lang = 'vi-VN'; u.rate = 0.9;
      const v = speechSynthesis.getVoices().find((x) => /^vi/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    };
    if (!('speechSynthesis' in window)) app.querySelectorAll('[data-read]').forEach((b) => { b.hidden = true; });
    cleanup = () => { app.onclick = null; if ('speechSynthesis' in window) speechSynthesis.cancel(); };
  }

  function notFound() {
    app.innerHTML = '<div class="card center"><p>Không tìm thấy trò này 🤔</p><a class="btn" href="#/">Về sân đình</a></div>';
  }

  function route() {
    if (cleanup) { try { cleanup(); } catch (e) { /* bỏ qua */ } cleanup = null; }
    token++;
    const parts = (location.hash.replace(/^#\/?/, '').split('?')[0] || '').split('/');
    app.className = 'view-' + (parts[0] || 'home');
    if (!parts[0]) home();
    else if (parts[0] === 'choi') play(parts[1]);
    else if (parts[0] === 'dong-dao') lore();
    else notFound();
    window.scrollTo(0, 0);
    document.querySelectorAll('.top nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#/' + (parts[0] || '')));
  }

  // Giao diện sáng / tối
  const themeBtn = document.getElementById('theme');
  function applyTheme(t) {
    if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
    const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    themeBtn.textContent = dark ? '☀️' : '🌙';
    themeBtn.setAttribute('aria-label', dark ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối');
  }
  themeBtn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const t = cur === 'dark' ? 'light' : 'dark';
    Hub.store.set('theme', t); applyTheme(t);
  });
  applyTheme(Hub.store.get('theme', null));

  // Âm thanh làng quê (mặc định tắt)
  const sndBtn = document.getElementById('sound');
  function drawSound(on) {
    sndBtn.textContent = on ? '🔊' : '🔈';
    sndBtn.setAttribute('aria-label', on ? 'Tắt âm thanh' : 'Bật âm thanh làng quê');
    sndBtn.setAttribute('aria-pressed', String(on));
  }
  if (Hub.sound && Hub.sound.supported) {
    sndBtn.addEventListener('click', () => drawSound(Hub.sound.toggle()));
    drawSound(Hub.sound.on);
    Hub.sound.resumeOnGesture();
  } else sndBtn.hidden = true;

  window.addEventListener('hashchange', route);
  route();
})();
