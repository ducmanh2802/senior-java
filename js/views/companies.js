/* View "companies" — owner: task T21. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  const TYPES = [
    { id: 'all', label: 'Tất cả' },
    { id: 'bank', label: 'Ngân hàng' },
    { id: 'fintech', label: 'Fintech' },
    { id: 'bigtech', label: 'Big tech' },
    { id: 'product', label: 'Product' },
  ];
  const TYPE_LABEL = { bank: 'Ngân hàng', fintech: 'Fintech', bigtech: 'Big tech', product: 'Product' };
  const CONF_LABEL = { high: 'Cao', medium: 'Trung bình', low: 'Thấp' };
  const CONF_CLS = { high: 'ok', medium: 'warn', low: 'bad' };

  // Bộ lọc loại công ty giữ giữa các lần render.
  const state = { type: 'all', sort: 'desc' };
  // Listener trên #main tái sử dụng giữa các lần render — chỉ gắn một lần.
  let listHandler = null;
  let listChangeHandler = null;

  function companies() { return window.COMPANIES || []; }

  function byId(id) { return companies().find(c => c.id === id) || null; }

  function scoreCls(n) { return n < 40 ? 'bad' : n < 70 ? 'warn' : 'ok'; }

  /** Chuỗi câu hỏi: có thể là string hoặc object {q, lang?}. */
  function qText(x) { return typeof x === 'string' ? x : (x && x.q) || String(x); }
  function qLang(x) { return (typeof x === 'object' && x && x.lang) || null; }

  const RECENT_DAYS = 90;

  function timeOf(entry) {
    const value = entry && (entry.at || entry.date || entry.updatedAt);
    const time = typeof value === 'number' ? value : Date.parse(value || '');
    return Number.isFinite(time) ? time : 0;
  }

  /** Lịch sử phù hợp trong 90 ngày: điểm mock chung theo topic, interview AI theo company id. */
  function recentInterviewScore(c) {
    const cutoff = Date.now() - RECENT_DAYS * 86400000;
    const history = App.store.data.mockHistory || [];
    const mockRows = history.filter(x => {
      if (timeOf(x) < cutoff) return false;
      const topics = x.topics || [];
      const companyMatches = x.kind === 'ai-interview' && x.company === c.id;
      const topicMatches = topics.length > 0 && (c.focus || []).some(id => topics.indexOf(id) >= 0);
      return companyMatches || topicMatches;
    }).map(x => {
      const value = x.kind === 'ai-interview' ? x.score : (x.aiAvg || x.avg);
      return { at: timeOf(x), score: Number(value) };
    }).filter(x => Number.isFinite(x.score) && x.score >= 1 && x.score <= 5);
    const rows = mockRows.sort((a, b) => b.at - a.at);
    if (!rows.length) return null;
    const values = rows.slice(0, 5).map(x => Math.max(0, Math.min(1, x.score / 5)));
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Điểm readiness: độ thuộc theo tổng số câu của từng topic, kèm lịch sử phỏng vấn gần đây nếu có.
   */
  function readiness(c) {
    // Cân trọng số từng topic theo số câu trong ngân hàng, để topic lớn đóng góp tương ứng.
    const topics = (c.focus || []).map(id => ({ id: id, stats: App.stats(id) })).filter(x => x.stats.total > 0);
    const total = topics.reduce((sum, x) => sum + x.stats.total, 0);
    const knownEquivalent = topics.reduce((sum, x) =>
      sum + x.stats.known + 0.5 * x.stats.review, 0);
    const knowledge = total ? knownEquivalent / total : 0;
    const interview = recentInterviewScore(c);
    // Khi có phiên gần đây, dành 20% trọng số cho điểm phiên; nếu không thì readiness phản ánh kiến thức.
    const score = 100 * (interview == null ? knowledge : knowledge * 0.8 + interview * 0.2);
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      knowledge: knowledge, interview: interview, topicCount: topics.length,
      topics: topics.map(x => ({ id: x.id, stats: x.stats,
        ratio: (x.stats.known + 0.5 * x.stats.review) / x.stats.total })),
    };
  }

  /** Vòng tròn điểm sẵn sàng (SVG). */
  function ring(score, size) {
    const s = Math.max(0, Math.min(100, Math.round(score)));
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const off = circ * (1 - s / 100);
    const cls = scoreCls(s);
    return '<svg class="co-ring co-ring-' + cls + '" width="' + size + '" height="' + size + '"' +
      ' viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Điểm sẵn sàng ' + s + ' trên 100">' +
      '<circle class="co-ring-bg" cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" stroke-width="6"/>' +
      '<circle class="co-ring-fg" cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" stroke-width="6"' +
      ' stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"' +
      ' transform="rotate(-90 ' + (size / 2) + ' ' + (size / 2) + ')"/>' +
      '<text class="co-ring-num" x="50%" y="50%" text-anchor="middle" dominant-baseline="central">' + s + '</text>' +
      '</svg>';
  }

  App.registerView('companies', {
    title: 'Lộ trình theo công ty',
    render(root, params) {
      if (params && params.length) return renderDetail(root, params[0]);
      return renderList(root);
    },
  });

  function renderList(root) {
    const all = companies();
    if (!all.length) {
      root.innerHTML = '<div class="page-head"><div><h1>Lộ trình theo công ty</h1>' +
        '<p>Thông tin tổng hợp từ nguồn công khai — có thể đã cũ, nên luôn kiểm tra lại.</p></div></div>' +
        '<div class="empty"><h2>Chưa có dữ liệu công ty</h2>' +
        '<p>Kho dữ liệu đang được cập nhật. Quay lại sau nhé.</p></div>';
      return () => {};
    }

    const filtered = (state.type === 'all' ? all : all.filter(c => c.type === state.type))
      .slice().sort((a, b) => (readiness(a).score - readiness(b).score) * (state.sort === 'asc' ? 1 : -1));
    const chips = TYPES.map(t =>
      '<button type="button" class="chip' + (state.type === t.id ? ' active' : '') + '" data-type="' + t.id + '"' +
      ' aria-pressed="' + (state.type === t.id ? 'true' : 'false') + '">' + App.esc(t.label) + '</button>').join('');

    const cards = filtered.map(c => {
      const r = readiness(c);
      const focus = (c.focus || []).slice(0, 3).map(id =>
        '<span class="badge">' + App.esc(App.topic(id).name) + '</span>').join('');
      const conf = CONF_CLS[c.confidence] || '';
      return '<a class="card co-card" href="#/companies/' + App.esc(c.id) + '">' +
        '<div class="co-card-top">' +
          '<span class="co-icon" aria-hidden="true">' + App.esc(c.icon || '🏢') + '</span>' +
          ring(r.score, 64) +
        '</div>' +
        '<h3 class="co-card-name">' + App.esc(c.name) + '</h3>' +
        '<div class="co-card-readiness"><div class="co-ready-label"><b>Readiness</b><span>' + r.score + '%</span></div>' +
          '<div class="progress" role="progressbar" aria-label="Readiness ' + App.esc(c.name) + '" aria-valuenow="' + r.score + '" aria-valuemin="0" aria-valuemax="100"><i class="accent" style="width:' + r.score + '%"></i></div></div>' +
        '<div class="row co-card-meta">' +
          '<span class="badge accent">' + App.esc(TYPE_LABEL[c.type] || c.type || '') + '</span>' +
          '<span class="badge ' + conf + '">Dữ liệu: ' + App.esc(CONF_LABEL[c.confidence] || c.confidence || '?') + '</span>' +
        '</div>' +
        (focus ? '<div class="row co-card-focus">' + focus + '</div>' : '') +
      '</a>';
    }).join('');

    root.innerHTML =
      '<div class="page-head">' +
        '<div><h1>Lộ trình theo công ty</h1>' +
        '<p>Thông tin tổng hợp từ nguồn công khai — có thể đã cũ, nên luôn kiểm tra lại.</p></div>' +
      '</div>' +
      '<div class="row co-list-controls"><div class="chips co-type-chips" role="group" aria-label="Lọc theo loại công ty">' + chips + '</div>' +
      '<label class="co-sort-label">Sắp xếp readiness <select class="select co-sort" aria-label="Sắp xếp theo điểm readiness">' +
        '<option value="desc"' + (state.sort === 'desc' ? ' selected' : '') + '>Cao đến thấp</option>' +
        '<option value="asc"' + (state.sort === 'asc' ? ' selected' : '') + '>Thấp đến cao</option></select></label></div>' +
      (filtered.length
        ? '<div class="grid co-grid">' + cards + '</div>'
        : '<div class="empty"><p>Không có công ty nào thuộc loại này.</p></div>');

    const onClick = e => {
      const chip = e.target.closest('[data-type]');
      if (chip) { state.type = chip.dataset.type; renderList(root); }
    };
    const onChange = e => {
      if (!e.target.matches('.co-sort')) return;
      state.sort = e.target.value;
      renderList(root);
    };
    if (listHandler) root.removeEventListener('click', listHandler);
    if (listChangeHandler) root.removeEventListener('change', listChangeHandler);
    listHandler = onClick;
    listChangeHandler = onChange;
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    return () => {
      if (listHandler) root.removeEventListener('click', listHandler);
      if (listChangeHandler) root.removeEventListener('change', listChangeHandler);
      listHandler = null;
      listChangeHandler = null;
    };
  }

  /** Timeline dọc quy trình phỏng vấn. */
  function processHtml(c) {
    const steps = c.process || [];
    if (!steps.length) return '';
    const items = steps.map((s, i) =>
      '<li class="co-step">' +
        '<span class="co-step-no" aria-hidden="true">' + (i + 1) + '</span>' +
        '<div class="co-step-body"><b>' + App.esc(s.round || 'Vòng ' + (i + 1)) + '</b>' +
        (s.detail ? '<div class="md">' + App.md(s.detail) + '</div>' : '') +
        '</div>' +
      '</li>').join('');
    return '<section class="card co-section"><h2>Quy trình phỏng vấn</h2>' +
      '<ol class="co-timeline">' + items + '</ol></section>';
  }

  /** Ba topic yếu nhất: thanh tiến độ + link bank/flash để bắt đầu ôn ngay. */
  function focusHtml(c) {
    const r = readiness(c);
    const rows = r.topics.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 3);
    if (!rows.length) return '<section class="card co-section"><h2>Trọng tâm cần ôn</h2><p class="muted">Chưa có câu hỏi trong các topic trọng tâm.</p></section>';
    const items = rows.map(x => {
      const s = x.stats;
      const pct = Math.round(x.ratio * 100);
      const t = App.topic(x.id);
      return '<li class="co-focus co-priority">' +
        '<div class="co-focus-head">' +
          '<b>' + App.esc((t.icon ? t.icon + ' ' : '') + t.name) + '</b>' +
          '<span class="badge accent">' + pct + '% thuộc</span>' +
          '<span class="small muted">' + s.known + '/' + s.total + ' câu đã thuộc</span>' +
        '</div>' +
        '<div class="progress" role="progressbar" aria-label="' + App.esc(t.name) + '" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
          '<i class="accent" style="width:' + pct + '%"></i></div>' +
        '<div class="row co-focus-links">' +
          '<a class="btn sm" href="#/bank/' + App.esc(x.id) + '">Ôn câu hỏi</a>' +
          '<a class="btn sm" href="#/flash/' + App.esc(x.id) + '">Ôn flashcard</a>' +
        '</div>' +
      '</li>';
    }).join('');
    return '<section class="card co-section"><h2>Trọng tâm cần ôn</h2>' +
      '<ul class="co-focus-list">' + items + '</ul></section>';
  }

  function renderDetail(root, id) {
    const c = byId(id);
    if (!c) {
      root.innerHTML = '<div class="empty"><h2>Không tìm thấy công ty</h2>' +
        '<p>Mã <code>' + App.esc(id) + '</code> không có trong dữ liệu.</p>' +
        '<p><a class="btn" href="#/companies">← Về danh sách</a></p></div>';
      return () => {};
    }

    const r = readiness(c);
    const stack = (c.stack || []).map(s => '<span class="badge">' + App.esc(s) + '</span>').join('');
    const conf = CONF_CLS[c.confidence] || '';

    root.innerHTML =
      '<div class="page-head co-head">' +
        '<div class="row">' +
          '<a class="link-btn" href="#/companies">← Danh sách</a>' +
          '<span class="co-icon co-icon-lg" aria-hidden="true">' + App.esc(c.icon || '🏢') + '</span>' +
          '<div><h1>' + App.esc(c.name) + '</h1>' +
          '<div class="row co-head-meta">' +
            '<span class="badge accent">' + App.esc(TYPE_LABEL[c.type] || c.type || '') + '</span>' +
            '<span class="badge ' + conf + '">Dữ liệu: ' + App.esc(CONF_LABEL[c.confidence] || c.confidence || '?') + '</span>' +
            (c.englishRequired ? '<span class="badge info">Yêu cầu tiếng Anh</span>' : '') +
          '</div></div>' +
        '</div>' +
        '<button type="button" class="btn primary" id="coMockBtn">Phỏng vấn thử theo công ty này</button>' +
      '</div>' +
      '<section class="card co-summary">' +
        (c.summary ? '<div class="md">' + App.md(c.summary) + '</div>' : '') +
        (stack ? '<div class="row co-stack"><span class="small muted">Stack:</span>' + stack + '</div>' : '') +
      '</section>' +
      '<section class="card co-ready">' +
        '<div class="co-ready-top">' + ring(r.score, 96) +
          '<div class="co-ready-parts"><b>Readiness: ' + r.score + '%</b>' +
            '<div class="progress" role="progressbar" aria-label="Readiness ' + App.esc(c.name) + '" aria-valuenow="' + r.score + '" aria-valuemin="0" aria-valuemax="100"><i class="accent" style="width:' + r.score + '%"></i></div>' +
            '<p class="small muted">Tiến độ kiến thức tính theo số câu trong ' + r.topicCount + ' topic trọng tâm. ' +
            (r.interview == null ? 'Chưa có mock/interview phù hợp trong 90 ngày gần đây.' : 'Điểm mock/interview gần đây chiếm 20% readiness.') + '</p></div>' +
        '</div>' +
      '</section>' +
      '<div id="coBody"></div>';

    renderBody(root.querySelector('#coBody'), c, r);
    return bindDetail(root, c);
  }

  /** Câu hỏi chia sẻ công khai — mỗi câu có khối "Luyện trả lời" với AI. */
  function questionsHtml(c) {
    const qs = c.questions || [];
    if (!qs.length) return '';
    const items = qs.map((x, i) => {
      const text = qText(x);
      const lang = qLang(x);
      return '<li class="co-q" data-qi="' + i + '">' +
        '<p class="co-q-text"' + (lang === 'en' ? ' lang="en"' : '') + '>' + App.esc(text) + '</p>' +
        '<button type="button" class="btn sm" data-practice="' + i + '">✍️ Luyện câu này</button>' +
        '<div class="co-practice" data-practice-box="' + i + '" hidden>' +
          '<label class="field"><span>Câu trả lời của bạn</span>' +
            '<textarea class="textarea" data-answer="' + i + '" rows="5" placeholder="Trả lời thành tiếng rồi ghi lại đây…"' +
            (lang === 'en' ? ' lang="en"' : '') + '></textarea></label>' +
          '<div class="row co-practice-actions">' +
            '<button type="button" class="btn mic-btn" data-mic="' + i + '"' + (App.speech.supported ? '' : ' hidden') +
              ' aria-label="Đọc trả lời bằng giọng nói">🎤</button>' +
            '<button type="button" class="btn primary" data-grade="' + i + '">🤖 Chấm bằng AI</button>' +
          '</div>' +
          '<div class="co-practice-out" data-out="' + i + '"></div>' +
        '</div>' +
      '</li>';
    }).join('');
    return '<section class="card co-section"><h2>Câu hỏi được chia sẻ công khai</h2>' +
      '<p class="small muted">Không có đáp án mẫu — AI chấm theo kỳ vọng interviewer tại công ty này.</p>' +
      '<ul class="co-q-list">' + items + '</ul></section>';
  }

  function tipsHtml(c) {
    const tips = c.tips || [];
    if (!tips.length) return '';
    const items = tips.map(t => '<li>' + App.md(t).replace(/^<p>|<\/p>/g, '') + '</li>').join('');
    return '<section class="card co-section"><h2>Mẹo chuẩn bị</h2><ul class="co-tips">' + items + '</ul></section>';
  }

  function sourcesHtml(c) {
    const src = c.sources || [];
    if (!src.length) return '';
    const items = src.map(s =>
      '<li><a href="' + App.esc(s.url || '#') + '" target="_blank" rel="noopener">' +
      App.esc(s.title || s.url || 'Nguồn') + '</a></li>').join('');
    return '<section class="card co-section"><h2>Nguồn</h2><ul class="co-sources">' + items + '</ul>' +
      '<p class="small muted">Dữ liệu tổng hợp từ nguồn công khai, có thể đã thay đổi.</p></section>';
  }

  function renderBody(body, c, r) {
    if (!body) return;
    body.innerHTML = processHtml(c) + focusHtml(c) + questionsHtml(c) + tipsHtml(c) + sourcesHtml(c);
  }

  /** Dừng mọi buổi ghi âm đang chạy khi rời trang. */
  function stopAllMics(state) {
    Object.keys(state.mics).forEach(k => {
      try { state.mics[k].stop(); } catch (e) { /* ignore */ }
      delete state.mics[k];
    });
  }

  function bindDetail(root, c) {
    const micState = { mics: {} };

    root.querySelector('#coMockBtn').addEventListener('click', () => {
      try {
        localStorage.setItem('sjp.mock.preset', JSON.stringify({
          topics: c.focus || [],
          english: !!c.englishRequired,
        }));
      } catch (e) { /* private mode */ }
      App.navigate('#/mock');
    });

    // Delegation cho các nút luyện câu / mic / chấm AI.
    const onClick = async e => {
      const prac = e.target.closest('[data-practice]');
      if (prac) {
        const i = prac.dataset.practice;
        const box = root.querySelector('[data-practice-box="' + i + '"]');
        if (box) {
          box.hidden = !box.hidden;
          if (!box.hidden) box.querySelector('[data-answer="' + i + '"]').focus();
        }
        return;
      }

      const micBtn = e.target.closest('[data-mic]');
      if (micBtn) {
        const i = micBtn.dataset.mic;
        if (micState.mics[i]) {
          try { micState.mics[i].stop(); } catch (err) { /* ignore */ }
          delete micState.mics[i];
          micBtn.classList.remove('recording');
          return;
        }
        const box = root.querySelector('[data-practice-box="' + i + '"]');
        const ta = box.querySelector('[data-answer="' + i + '"]');
        const q = (c.questions || [])[+i];
        const lang = qLang(q) === 'en' ? 'en' : 'vi';
        try {
          micBtn.classList.add('recording');
          micState.mics[i] = App.speech.start({
            lang: lang,
            onText: (fin, interim) => { ta.value = fin + (interim ? ' ' + interim : ''); },
            onError: () => { micBtn.classList.remove('recording'); delete micState.mics[i]; },
          });
        } catch (err) {
          micBtn.classList.remove('recording');
          const errBox = root.querySelector('[data-out="' + i + '"]');
          if (errBox) errBox.innerHTML = App.ui.error(err);
        }
        return;
      }

      const gradeBtn = e.target.closest('[data-grade]');
      if (gradeBtn && !gradeBtn.disabled) {
        const i = +gradeBtn.dataset.grade;
        const box = root.querySelector('[data-practice-box="' + i + '"]');
        const ta = box.querySelector('[data-answer="' + i + '"]');
        const out = box.querySelector('[data-out="' + i + '"]');
        const answer = ta.value.trim();
        if (!answer) { out.innerHTML = '<div class="ai-error">Hãy nhập hoặc nói câu trả lời trước khi chấm.</div>'; return; }
        const q = (c.questions || [])[+i];
        const lang = qLang(q) === 'en' ? 'en' : 'vi';
        let speech;
        if (micState.mics[i]) {
          try { speech = micState.mics[i].stop(); } catch (err) { /* ignore */ }
          delete micState.mics[i];
          const mb = box.querySelector('[data-mic="' + i + '"]');
          if (mb) mb.classList.remove('recording');
        }
        gradeBtn.disabled = true;
        out.innerHTML = '<span class="ai-loading">AI đang chấm…</span>';
        try {
          const res = await App.ai.grade({
            question: qText(q),
            reference: 'Không có đáp án mẫu; hãy chấm theo kỳ vọng của interviewer Senior Java tại ' + c.name,
            answer: answer,
            lang: lang,
            topic: (c.focus && c.focus[0]) || 'scenario',
            level: 'senior',
            speech: speech || undefined,
          });
          out.innerHTML = App.ui.feedback(res, lang) + App.ui.speechStats(speech);
        } catch (err) {
          out.innerHTML = App.ui.error(err);
        } finally {
          gradeBtn.disabled = false;
        }
      }
    };

    root.addEventListener('click', onClick);

    return () => {
      root.removeEventListener('click', onClick);
      stopAllMics(micState);
    };
  }
})();
