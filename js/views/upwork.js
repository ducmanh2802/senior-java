/*
 * Cẩm nang Freelance & Upwork (#/upwork). Hai tab: Cẩm nang (chương đọc theo thứ tự) và Case khó (tình huống + xử lý
 * từng bước + tin nhắn mẫu). Data: window.UPWORK_GUIDE (js/data/upwork-guide.js) + window.UPWORK_CASES
 * (js/data/upwork-cases-*.js), nhóm 'upwork' trong data-manifest. Schema: docs/UPWORK-GUIDE.md.
 * Routes: #/upwork, #/upwork/cases, #/upwork/<uw-ch-NN>, #/upwork/<uw-case-NNN>.
 * Lưu: App.store.data.upwork = { read: { '<chapterId>': ts }, done: { '<caseId>': ts }, check: { '<chapterId>:<i>': true },
 *   drafts: { '<caseId>': 'text...' }, scores: { '<caseId>': { score, at } } }.
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
  let draftDebounceTimer = null;
  let speechHandle = null;
  let aiGrading = false;

  function chapters() { return (window.UPWORK_GUIDE || []).slice().sort((a, b) => a.order - b.order); }
  function cases() { return window.UPWORK_CASES || []; }
  function S() {
    const d = App.store.data;
    if (!d.upwork || typeof d.upwork !== 'object') d.upwork = {};
    const u = d.upwork;
    u.read = u.read || {}; u.done = u.done || {}; u.check = u.check || {};
    u.drafts = u.drafts || {}; u.scores = u.scores || {};
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

  function statsHtml() {
    const u = S();
    const chList = chapters();
    const caList = cases();
    const nRead = chList.filter(c => u.read[c.id]).length;
    const nCheck = chList.reduce((sum, c) => sum + ((c.checklist || []).filter((_, i) => u.check[c.id + ':' + i]).length), 0);
    const totalCheck = chList.reduce((sum, c) => sum + (c.checklist || []).length, 0);
    const nDone = caList.filter(c => u.done[c.id]).length;
    const scores = Object.values(u.scores).filter(s => typeof s.score === 'number');
    const avgScore = scores.length ? (scores.reduce((s, x) => s + x.score, 0) / scores.length).toFixed(1) : '—';
    const byCat = {};
    caList.forEach(c => {
      if (!byCat[c.category]) byCat[c.category] = { total: 0, done: 0 };
      byCat[c.category].total++;
      if (u.done[c.id]) byCat[c.category].done++;
    });
    const catBars = Object.keys(CATS).filter(k => byCat[k]).map(k => {
      const b = byCat[k];
      const pct = b.total ? Math.round((b.done / b.total) * 100) : 0;
      return '<div class="uw-stat-cat"><span class="uw-stat-cat-label">' + esc(CATS[k]) + ' <span class="muted">(' + b.done + '/' + b.total + ')</span></span>' +
        '<div class="progress"><div class="progress-bar ' + (pct === 100 ? 'ok' : '') + '" style="width:' + pct + '%"></div></div>' +
        '<span class="uw-stat-cat-pct">' + pct + '%</span></div>';
    }).join('');
    return '<section class="uw-stats card">' +
      '<h3>📊 Thống kê</h3>' +
      '<div class="uw-stats-grid">' +
        '<div class="uw-stat"><span class="uw-stat-value">' + nRead + '/' + chList.length + '</span><span class="uw-stat-label">Chương đã đọc</span></div>' +
        '<div class="uw-stat"><span class="uw-stat-value">' + nCheck + '/' + totalCheck + '</span><span class="uw-stat-label">Checklist đã tick</span></div>' +
        '<div class="uw-stat"><span class="uw-stat-value">' + nDone + '/' + caList.length + '</span><span class="uw-stat-label">Case đã nắm</span></div>' +
        '<div class="uw-stat"><span class="uw-stat-value">' + avgScore + '</span><span class="uw-stat-label">Điểm AI trung bình</span></div>' +
      '</div>' +
      (catBars ? '<h4>Tiến độ theo nhóm</h4><div class="uw-stat-cats">' + catBars + '</div>' : '') +
    '</section>';
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
    return statsHtml() +
      '<ol class="uw-chapters">' + list.map(c =>
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
      '<label class="uw-hide"><input type="checkbox" id="uwHideDone"' + (ui.hideDone ? ' checked' : '') + '> Ẩn case đã nắm</label>' +
      '<button type="button" class="btn uw-random" id="uwRandom" title="Case ngẫu nhiên chưa nắm (phím tắt: R)"><kbd>R</kbd> 🎲 Case ngẫu nhiên chưa nắm</button></div>';
    const list = filtered();
    const items = list.length ? '<div class="uw-cases">' + list.map(c => {
      const sev = SEV[c.severity] || SEV.medium;
      const scoreObj = u.scores[c.id];
      const badge = scoreObj && typeof scoreObj.score === 'number' ? App.ui.scoreBadge(scoreObj.score) : '';
      return '<a class="card uw-case' + (u.done[c.id] ? ' done' : '') + '" href="#/upwork/' + esc(c.id) + '">' +
        '<strong>' + esc(c.title) + '</strong>' + badge +
        '<span class="uw-meta"><span class="badge">' + esc(CATS[c.category] || c.category) + '</span>' +
        '<span class="badge ' + sev[1] + '">' + sev[0] + '</span><span class="badge">' + esc((App.LEVELS && App.LEVELS[c.level]) || c.level) + '</span>' +
        (u.done[c.id] ? '<span class="badge ok">Đã nắm</span>' : '') + '</span></a>';
    }).join('') + '</div>' : '<p class="empty">Không có case nào khớp bộ lọc.</p>';
    return statsHtml() + chips + tools + items;
  }

  function caseHtml(c) {
    const u = S();
    const sev = SEV[c.severity] || SEV.medium;
    const li = arr => (arr || []).map(x => '<li>' + esc(x) + '</li>').join('');
    const tpl = (c.templates || []).map((t, j) =>
      '<div class="uw-template"><div class="row"><strong>' + esc(t.name) + '</strong>' +
      '<button class="btn sm" data-act="copy" data-i="' + j + '" aria-label="Chép tin nhắn mẫu: ' + esc(t.name) + '">📋 Chép</button></div>' +
      '<pre lang="en">' + esc(t.text) + '</pre></div>').join('');
    const draft = u.drafts[c.id] || '';
    const scoreObj = u.scores[c.id];
    const scoreHtml = scoreObj && typeof scoreObj.score === 'number'
      ? '<div class="uw-score-show">' + App.ui.scoreBadge(scoreObj.score) + '<span class="muted small">Lần chấm gần nhất: ' + App.fmtDate(scoreObj.at) + '</span></div>'
      : '';
    const practiceHtml = '<section class="uw-practice card" aria-labelledby="uw-practice-title">' +
      '<h3 id="uw-practice-title">✍️ Luyện xử lý case này</h3>' +
      '<p class="muted small">Viết các bước bạn sẽ làm và tin nhắn gửi khách. <kbd>Ctrl+Enter</kbd> để lưu nháp, <kbd>R</kbd> case ngẫu nhiên.</p>' +
      scoreHtml +
      '<textarea class="textarea uw-draft" id="uwDraft" rows="6" placeholder="Ví dụ:\n1. Kiểm tra milestone đã funded chưa...\n2. Submit work kèm link commit...\n3. Gửi tin nhắn: \"Hi Mark, I have submitted...\"\n...">' + esc(draft) + '</textarea>' +
      '<div class="row uw-practice-tools">' +
      '<button type="button" class="btn mic-btn" id="uwMic" aria-label="Đọc chính tả" title="Đọc chính tả (phím tắt: M)"' + (App.speech.supported ? '' : ' hidden') + '><span class="mic-icon" aria-hidden="true">🎙️</span></button>' +
      '<button type="button" class="btn primary" id="uwGrade" data-id="' + esc(c.id) + '">🤖 AI chấm</button>' +
      '<span id="uwGradeStatus" class="ai-loading" hidden>AI đang chấm…</span>' +
      '<div id="uwGradeResult" class="uw-grade-result"></div>' +
      '</div>' +
    '</section>';
    return '<article class="card uw-detail"><p class="muted"><a href="#/upwork/cases">← Case khó</a></p>' +
      '<h2>' + esc(c.title) + '</h2><p class="uw-meta"><span class="badge">' + esc(CATS[c.category] || c.category) + '</span>' +
      '<span class="badge ' + sev[1] + '">' + sev[0] + '</span><span class="badge">' + esc((App.LEVELS && App.LEVELS[c.level]) || c.level) + '</span></p>' +
      '<h3>📍 Tình huống</h3><div class="md">' + App.md(c.situation) + '</div>' +
      '<h3>🚩 Dấu hiệu nhận biết sớm</h3><ul>' + li(c.signals) + '</ul>' +
      practiceHtml +
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

  function saveDraft(caseId, text) {
    const u = S();
    u.drafts[caseId] = text;
    save();
  }

  function debouncedSaveDraft(caseId, text) {
    if (draftDebounceTimer) clearTimeout(draftDebounceTimer);
    draftDebounceTimer = setTimeout(() => saveDraft(caseId, text), 500);
  }

  function startSpeech(textarea) {
    if (!App.speech.supported) return;
    const btn = rootEl.querySelector('#uwMic');
    if (speechHandle) { speechHandle.stop(); speechHandle = null; }
    btn.classList.add('recording');
    btn.setAttribute('aria-pressed', 'true');
    speechHandle = App.speech.start({
      lang: 'vi',
      onText(finalText, interim) {
        textarea.value = finalText + (interim ? ' ' + interim : '');
        debouncedSaveDraft(current.id, textarea.value);
      },
      onError(msg) {
        btn.classList.remove('recording');
        btn.setAttribute('aria-pressed', 'false');
        speechHandle = null;
        App.ui.error({ message: msg, code: 'speech' });
      },
    });
  }

  function stopSpeech() {
    if (!speechHandle) return;
    const metrics = speechHandle.stop();
    speechHandle = null;
    const btn = rootEl.querySelector('#uwMic');
    btn.classList.remove('recording');
    btn.setAttribute('aria-pressed', 'false');
    const textarea = rootEl.querySelector('#uwDraft');
    if (textarea && metrics.text) {
      textarea.value = metrics.text;
      saveDraft(current.id, metrics.text);
    }
  }

  async function gradeAnswer(caseId) {
    const c = byId(caseId);
    if (!c) return;
    const textarea = rootEl.querySelector('#uwDraft');
    const btn = rootEl.querySelector('#uwGrade');
    const status = rootEl.querySelector('#uwGradeStatus');
    const resultBox = rootEl.querySelector('#uwGradeResult');
    const answer = textarea ? textarea.value.trim() : '';
    if (answer.length < 80) {
      resultBox.innerHTML = App.ui.error({ message: 'Câu trả lời quá ngắn (tối thiểu 80 ký tự). Hãy viết thêm chi tiết các bước và tin nhắn.', code: 'short' });
      return;
    }
    if (aiGrading) return;
    aiGrading = true;
    btn.disabled = true;
    status.hidden = false;
    resultBox.innerHTML = '';
    try {
      const res = await App.ai.grade({
        question: c.title + '\n' + c.situation,
        reference: c.steps + '\nSai lầm hay gặp: ' + (c.mistakes || []).join('; '),
        answer: answer,
        lang: 'vi',
        topic: 'remote',
        level: c.level,
      });
      const u = S();
      u.scores[caseId] = { score: res.score, at: Date.now() };
      save();
      resultBox.innerHTML = App.ui.feedback(res, 'vi');
      // Update score badge in place
      const badge = rootEl.querySelector('.uw-score-show');
      if (badge) badge.innerHTML = App.ui.scoreBadge(res.score) + '<span class="muted small">Lần chấm gần nhất: ' + App.fmtDate(u.scores[caseId].at) + '</span>';
    } catch (e) {
      resultBox.innerHTML = App.ui.error(e);
    } finally {
      aiGrading = false;
      btn.disabled = false;
      status.hidden = true;
    }
  }

  function randomUnmasteredCase() {
    const u = S();
    const unmastered = cases().filter(c => !u.done[c.id]);
    if (!unmastered.length) return;
    const c = unmastered[Math.floor(Math.random() * unmastered.length)];
    App.navigate('#/upwork/' + c.id);
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
        else if (b.id === 'uwGrade') { gradeAnswer(b.dataset.id); }
        else if (b.id === 'uwRandom') { randomUnmasteredCase(); }
        else if (b.id === 'uwMic') {
          const textarea = rootEl.querySelector('#uwDraft');
          if (textarea && speechHandle) stopSpeech();
          else if (textarea) startSpeech(textarea);
        }
      };
      const onChange = e => {
        const el = e.target;
        if (el.dataset && el.dataset.check) { const u = S(); if (el.checked) u.check[el.dataset.check] = true; else delete u.check[el.dataset.check]; save(); }
        else if (el.id === 'uwHideDone') { ui.hideDone = el.checked; render(['cases']); }
      };
      const onInput = e => {
        if (e.target.id === 'uwSearch') { ui.q = e.target.value; rerenderCases(); }
        else if (e.target.id === 'uwDraft') { debouncedSaveDraft(current.id, e.target.value); }
      };
      const onKeydown = e => {
        if (e.target.id === 'uwDraft' && e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          saveDraft(current.id, e.target.value);
          const btn = rootEl.querySelector('#uwGrade');
          if (btn) btn.focus();
        }
      };
      root.addEventListener('click', onClick);
      root.addEventListener('change', onChange);
      root.addEventListener('input', onInput);
      root.addEventListener('keydown', onKeydown);
      const offKey = App.onKey(e => {
        if (e.key === '1') App.navigate('#/upwork');
        else if (e.key === '2') App.navigate('#/upwork/cases');
        else if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const activeEl = document.activeElement;
          if (!activeEl || activeEl.tagName !== 'TEXTAREA' && activeEl.tagName !== 'INPUT') {
            e.preventDefault();
            randomUnmasteredCase();
          }
        }
        else if ((e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const activeEl = document.activeElement;
          if (!activeEl || activeEl.tagName !== 'TEXTAREA' && activeEl.tagName !== 'INPUT') {
            const btn = rootEl.querySelector('#uwMic');
            const textarea = rootEl.querySelector('#uwDraft');
            if (btn && textarea && !btn.hidden) {
              e.preventDefault();
              if (speechHandle) stopSpeech(); else startSpeech(textarea);
            }
          }
        }
      });
      return () => {
        root.removeEventListener('click', onClick);
        root.removeEventListener('change', onChange);
        root.removeEventListener('input', onInput);
        root.removeEventListener('keydown', onKeydown);
        offKey();
        if (draftDebounceTimer) clearTimeout(draftDebounceTimer);
        if (speechHandle) { speechHandle.stop(); speechHandle = null; }
        rootEl = null;
      };
    },
  });
})();