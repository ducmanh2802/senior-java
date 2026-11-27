/*
 * Cẩm nang Freelance & Upwork (#/upwork). Hai tab: Cẩm nang (chương đọc theo thứ tự) và Case khó (tình huống + xử lý
 * từng bước + tin nhắn mẫu). Data: window.UPWORK_GUIDE (js/data/upwork-guide.js) + window.UPWORK_CASES
 * (js/data/upwork-cases-*.js), nhóm 'upwork' trong data-manifest. Schema: docs/UPWORK-GUIDE.md.
 * Routes: #/upwork, #/upwork/cases, #/upwork/<uw-ch-NN>, #/upwork/<uw-case-NNN>.
 * Lưu: App.store.data.upwork = { read: { '<chapterId>': ts }, done: { '<caseId>': ts }, check: { '<chapterId>:<i>': true } }.
 */
(function () {
  'use strict';
  const esc = s => App.esc(s);
  const CATS = {
    account: '🪪 Tài khoản', proposal: '✉️ Proposal', contract: '📄 Hợp đồng', payment: '💵 Thanh toán',
    client: '🧑‍💼 Khách hàng', scam: '🚨 Lừa đảo', review: '⭐ Review & JSS',
  };
  const SEV = { high: ['Thiệt hại cao', 'bad'], medium: ['Thiệt hại vừa', 'warn'], low: ['Thiệt hại thấp', 'ok'] };
  let rootEl = null;
  const ui = { cat: 'all', q: '', hideDone: false };

  function chapters() { return (window.UPWORK_GUIDE || []).slice().sort((a, b) => a.order - b.order); }
  function cases() { return window.UPWORK_CASES || []; }
  function S() {
    const d = App.store.data;
    if (!d.upwork || typeof d.upwork !== 'object') d.upwork = {};
    const u = d.upwork;
    u.read = u.read || {}; u.done = u.done || {}; u.check = u.check || {};
    return u;
  }
  function save() { try { App.store.save(); } catch (e) { /* storage blocked */ } }
  function byId(id) { return chapters().find(c => c.id === id) || cases().find(c => c.id === id) || null; }

  function relatedHtml(list) {
    const items = (list || []).map(id => {
      const x = byId(id);
      if (x) return '<a class="chip" href="#/upwork/' + esc(id) + '">' + esc((x.icon ? x.icon + ' ' : '') + x.title) + '</a>';
      return '<a class="chip" href="#/bank/' + esc(id) + '">📚 ' + esc(id) + '</a>';
    }).join('');
    return items ? '<h3>Liên quan</h3><div class="chips">' + items + '</div>' : '';
  }

  function tabs(active) {
    const u = S();
    const nRead = chapters().filter(c => u.read[c.id]).length, nDone = cases().filter(c => u.done[c.id]).length;
    return '<div class="page-head"><div><h1>💼 Freelance & Upwork</h1>' +
      '<p>Cẩm nang làm freelance trên Upwork cho dev Java và cách xử lý các tình huống khó: tranh chấp, khách đòi hoàn tiền, lừa đảo, tài khoản bị khoá…</p></div></div>' +
      '<nav class="chips uw-tabs" aria-label="Chọn phần">' +
      '<a class="chip' + (active === 'guide' ? ' active' : '') + '" href="#/upwork">📖 Cẩm nang <span class="badge">' + nRead + '/' + chapters().length + '</span></a>' +
      '<a class="chip' + (active === 'cases' ? ' active' : '') + '" href="#/upwork/cases">🔥 Case khó <span class="badge">' + nDone + '/' + cases().length + '</span></a>' +
      '<span class="uw-keys muted"><kbd>1</kbd> Cẩm nang · <kbd>2</kbd> Case khó</span></nav>';
  }

  function guideHtml() {
    const u = S();
    const list = chapters();
    if (!list.length) return '<p class="empty">Chưa có chương nào.</p>';
    return '<ol class="uw-chapters">' + list.map(c =>
      '<li><a class="card uw-chapter' + (u.read[c.id] ? ' read' : '') + '" href="#/upwork/' + esc(c.id) + '">' +
      '<span class="uw-ch-icon" aria-hidden="true">' + esc(c.icon) + '</span>' +
      '<span class="uw-ch-text"><strong>' + esc(c.order + '. ' + c.title) + '</strong><small>' + esc(c.summary) + '</small></span>' +
      (u.read[c.id] ? '<span class="badge ok">Đã đọc</span>' : '') + '</a></li>').join('') + '</ol>';
  }

  function chapterHtml(c) {
    const u = S();
    const list = chapters(), i = list.findIndex(x => x.id === c.id);
    const prev = list[i - 1], next = list[i + 1];
    const checklist = (c.checklist || []).map((t, j) => {
      const k = c.id + ':' + j;
      return '<li><label><input type="checkbox" data-check="' + esc(k) + '"' + (u.check[k] ? ' checked' : '') + '> <span>' + esc(t) + '</span></label></li>';
    }).join('');
    return '<article class="card uw-detail"><p class="muted"><a href="#/upwork">← Cẩm nang</a></p>' +
      '<h2>' + esc(c.icon + ' ' + c.order + '. ' + c.title) + '</h2><p class="uw-summary">' + esc(c.summary) + '</p>' +
      '<div class="md">' + App.md(c.body) + '</div>' +
      (checklist ? '<h3>✅ Làm ngay sau khi đọc</h3><ul class="uw-checklist">' + checklist + '</ul>' : '') +
      relatedHtml(c.related) +
      '<div class="row uw-actions"><button class="btn ' + (u.read[c.id] ? '' : 'primary') + '" data-act="read" data-id="' + esc(c.id) + '">' +
      (u.read[c.id] ? 'Bỏ đánh dấu đã đọc' : 'Đánh dấu đã đọc') + '</button>' +
      (prev ? '<a class="btn" href="#/upwork/' + esc(prev.id) + '">← ' + esc(prev.title) + '</a>' : '') +
      (next ? '<a class="btn" href="#/upwork/' + esc(next.id) + '">' + esc(next.title) + ' →</a>' : '') + '</div></article>';
  }

  function filtered() {
    const u = S(), q = ui.q.trim().toLowerCase();
    return cases().filter(c => (ui.cat === 'all' || c.category === ui.cat) && (!ui.hideDone || !u.done[c.id]) &&
      (!q || [c.title, c.situation, (c.tags || []).join(' ')].join(' ').toLowerCase().includes(q)));
  }

  function casesHtml() {
    const u = S();
    const counts = {};
    cases().forEach(c => { counts[c.category] = (counts[c.category] || 0) + 1; });
    const chips = '<div class="chips uw-cats"><button class="chip' + (ui.cat === 'all' ? ' active' : '') + '" data-cat="all">Tất cả (' + cases().length + ')</button>' +
      Object.keys(CATS).filter(k => counts[k]).map(k => '<button class="chip' + (ui.cat === k ? ' active' : '') + '" data-cat="' + k + '">' + esc(CATS[k]) + ' (' + counts[k] + ')</button>').join('') + '</div>';
    const tools = '<div class="row uw-tools"><input class="input" id="uwSearch" type="search" placeholder="Tìm case (ví dụ: refund, Telegram, JSS)…" aria-label="Tìm case" value="' + esc(ui.q) + '">' +
      '<label class="uw-hide"><input type="checkbox" id="uwHideDone"' + (ui.hideDone ? ' checked' : '') + '> Ẩn case đã nắm</label></div>';
    const list = filtered();
    const items = list.length ? '<div class="uw-cases">' + list.map(c => {
      const sev = SEV[c.severity] || SEV.medium;
      return '<a class="card uw-case' + (u.done[c.id] ? ' done' : '') + '" href="#/upwork/' + esc(c.id) + '">' +
        '<strong>' + esc(c.title) + '</strong><span class="uw-meta"><span class="badge">' + esc(CATS[c.category] || c.category) + '</span>' +
        '<span class="badge ' + sev[1] + '">' + sev[0] + '</span><span class="badge">' + esc((App.LEVELS && App.LEVELS[c.level]) || c.level) + '</span>' +
        (u.done[c.id] ? '<span class="badge ok">Đã nắm</span>' : '') + '</span></a>';
    }).join('') + '</div>' : '<p class="empty">Không có case nào khớp bộ lọc.</p>';
    return chips + tools + items;
  }

  function caseHtml(c) {
    const u = S();
    const sev = SEV[c.severity] || SEV.medium;
    const li = arr => (arr || []).map(x => '<li>' + esc(x) + '</li>').join('');
    const tpl = (c.templates || []).map((t, j) =>
      '<div class="uw-template"><div class="row"><strong>' + esc(t.name) + '</strong>' +
      '<button class="btn sm" data-act="copy" data-i="' + j + '" aria-label="Chép tin nhắn mẫu: ' + esc(t.name) + '">📋 Chép</button></div>' +
      '<pre lang="en">' + esc(t.text) + '</pre></div>').join('');
    return '<article class="card uw-detail"><p class="muted"><a href="#/upwork/cases">← Case khó</a></p>' +
      '<h2>' + esc(c.title) + '</h2><p class="uw-meta"><span class="badge">' + esc(CATS[c.category] || c.category) + '</span>' +
      '<span class="badge ' + sev[1] + '">' + sev[0] + '</span><span class="badge">' + esc((App.LEVELS && App.LEVELS[c.level]) || c.level) + '</span></p>' +
      '<h3>📍 Tình huống</h3><div class="md">' + App.md(c.situation) + '</div>' +
      '<h3>🚩 Dấu hiệu nhận biết sớm</h3><ul>' + li(c.signals) + '</ul>' +
      '<details class="uw-solution"><summary>🛠️ Xem cách xử lý từng bước (tự nghĩ trước rồi mới mở)</summary>' +
      '<div class="md">' + App.md(c.steps) + '</div>' +
      (tpl ? '<h3>💬 Tin nhắn mẫu (tiếng Anh)</h3>' + tpl : '') +
      '<h3>❌ Sai lầm hay gặp</h3><ul>' + li(c.mistakes) + '</ul>' +
      '<h3>🛡️ Phòng ngừa</h3><div class="md">' + App.md(c.prevention) + '</div></details>' +
      relatedHtml(c.related) +
      '<div class="row uw-actions"><button class="btn ' + (u.done[c.id] ? '' : 'ok') + '" data-act="done" data-id="' + esc(c.id) + '">' +
      (u.done[c.id] ? 'Bỏ đánh dấu' : '✓ Đã nắm case này') + '</button></div></article>';
  }

  let current = null;
  function render(params) {
    if (!rootEl) return;
    const p = (params && params[0]) || '';
    const item = p && p !== 'cases' ? byId(p) : null;
    current = item;
    const tab = p === 'cases' || (item && item.id.startsWith('uw-case-')) ? 'cases' : 'guide';
    let body;
    if (p && p !== 'cases' && !item) body = '<p class="empty">Không tìm thấy mục này. <a href="#/upwork">Về cẩm nang</a></p>';
    else if (item) body = item.id.startsWith('uw-ch-') ? chapterHtml(item) : caseHtml(item);
    else body = tab === 'cases' ? casesHtml() : guideHtml();
    rootEl.innerHTML = tabs(tab) + body;
  }
  function rerenderCases() {
    const box = rootEl.querySelector('.uw-cases, .empty');
    const s = rootEl.querySelector('#uwSearch');
    const pos = s ? s.selectionStart : 0;
    render(['cases']);
    const s2 = rootEl.querySelector('#uwSearch');
    if (s2 && box) { s2.focus(); try { s2.setSelectionRange(pos, pos); } catch (e) { /* type=search */ } }
  }

  App.registerView('upwork', {
    title: 'Freelance & Upwork',
    render(root, params) {
      rootEl = root;
      S();
      render(params);
      const onClick = e => {
        const cat = e.target.closest('[data-cat]');
        if (cat) { ui.cat = cat.dataset.cat; render(['cases']); return; }
        const b = e.target.closest('[data-act]');
        if (!b) return;
        const u = S(), id = b.dataset.id;
        if (b.dataset.act === 'read') { if (u.read[id]) delete u.read[id]; else u.read[id] = Date.now(); save(); render([id]); }
        else if (b.dataset.act === 'done') { if (u.done[id]) delete u.done[id]; else u.done[id] = Date.now(); save(); render([id]); }
        else if (b.dataset.act === 'copy' && current && current.templates) {
          const t = current.templates[+b.dataset.i];
          if (t && navigator.clipboard) navigator.clipboard.writeText(t.text).then(() => { b.textContent = '✓ Đã chép'; }, () => { b.textContent = 'Không chép được'; });
        }
      };
      const onChange = e => {
        const el = e.target;
        if (el.dataset && el.dataset.check) { const u = S(); if (el.checked) u.check[el.dataset.check] = true; else delete u.check[el.dataset.check]; save(); }
        else if (el.id === 'uwHideDone') { ui.hideDone = el.checked; render(['cases']); }
      };
      const onInput = e => { if (e.target.id === 'uwSearch') { ui.q = e.target.value; rerenderCases(); } };
      root.addEventListener('click', onClick);
      root.addEventListener('change', onChange);
      root.addEventListener('input', onInput);
      const offKey = App.onKey(e => {
        if (e.key === '1') App.navigate('#/upwork');
        else if (e.key === '2') App.navigate('#/upwork/cases');
      });
      return () => {
        root.removeEventListener('click', onClick);
        root.removeEventListener('change', onChange);
        root.removeEventListener('input', onInput);
        offKey();
        rootEl = null;
      };
    },
  });
})();
