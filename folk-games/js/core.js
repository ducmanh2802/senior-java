/* Sân Đình — lõi dùng chung: đăng ký trò chơi, lưu trữ, tiện ích. */
(function () {
  'use strict';

  const PREFIX = 'sandinh:';
  const games = [];

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) { /* bỏ qua */ }
    },
  };

  const Hub = {
    games,
    store,
    /** meta: {id, name, icon, tagline, players, rules (html), render(root, ctx) → cleanup?} */
    register(meta) { games.push(meta); },
    game(id) { return games.find((g) => g.id === id); },

    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    sleep(ms) { return new Promise((r) => setTimeout(r, ms)); },
    rand(n) { return Math.floor(Math.random() * n); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    /** Ghi kết quả một ván: 'win' | 'lose' | 'draw' */
    record(gameId, result) {
      const all = store.get('stats', {});
      const s = all[gameId] || { win: 0, lose: 0, draw: 0 };
      s[result] = (s[result] || 0) + 1;
      all[gameId] = s;
      store.set('stats', all);
      document.dispatchEvent(new CustomEvent('hub:stats', { detail: { gameId } }));
      document.dispatchEvent(new CustomEvent('hub:result', { detail: { gameId, result } }));
    },
    stats(gameId) {
      const all = store.get('stats', {});
      return all[gameId] || { win: 0, lose: 0, draw: 0 };
    },

    toast(msg, kind) {
      let box = document.getElementById('toasts');
      if (!box) {
        box = document.createElement('div');
        box.id = 'toasts';
        box.setAttribute('role', 'status');
        box.setAttribute('aria-live', 'polite');
        document.body.appendChild(box);
      }
      const el = document.createElement('div');
      el.className = 'toast ' + (kind || '');
      el.textContent = msg;
      box.appendChild(el);
      setTimeout(() => el.classList.add('out'), 2400);
      setTimeout(() => el.remove(), 2900);
    },

    /** Hộp chọn chế độ dùng chung (đấu máy / 2 người, độ khó). */
    modeBar(opts) {
      const { modes, levels, mode, level } = opts;
      const btns = (list, cur, attr) => list.map(([v, label]) =>
        `<button class="chip${v === cur ? ' active' : ''}" data-${attr}="${v}">${label}</button>`).join('');
      return `<div class="mode-bar">
        ${modes ? `<div class="chips" role="group" aria-label="Chế độ">${btns(modes, mode, 'mode')}</div>` : ''}
        ${levels ? `<div class="chips" role="group" aria-label="Độ khó">${btns(levels, level, 'level')}</div>` : ''}
      </div>`;
    },

    /** Phát hiệu ứng âm thanh nếu đã bật (an toàn khi chưa nạp sound.js). */
    sfx(name) { if (Hub.sound && Hub.sound.on) Hub.sound[name](); },

    onKey(fn) {
      const h = (e) => {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        fn(e);
      };
      document.addEventListener('keydown', h);
      return () => document.removeEventListener('keydown', h);
    },
  };

  window.Hub = Hub;
})();
