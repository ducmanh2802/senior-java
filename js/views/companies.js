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
  const state = { type: 'all' };
  // Listener trên #main tái sử dụng giữa các lần render — chỉ gắn một lần.
  let listHandler = null;

  function companies() { return window.COMPANIES || []; }

  function byId(id) { return companies().find(c => c.id === id) || null; }

  function scoreCls(n) { return n < 40 ? 'bad' : n < 70 ? 'warn' : 'ok'; }

  /** Chuỗi câu hỏi: có thể là string hoặc object {q, lang?}. */
  function qText(x) { return typeof x === 'string' ? x : (x && x.q) || String(x); }
  function qLang(x) { return (typeof x === 'object' && x && x.lang) || null; }

  /** Tỉ lệ đã thuộc của một topic: (known + 0.5*review)/total, null nếu không có câu. */
  function topicRatio(topicId) {
    const s = App.stats(topicId);
    if (!s.total) return null;
    return (s.known + 0.5 * s.review) / s.total;
  }

  /**
   * Điểm sẵn sàng 0–100 cho một công ty. Hàm thuần (không side-effect).
   * K = kiến thức các topic focus · A = thuật toán · M = phỏng vấn thử · E = tiếng Anh (nếu bắt buộc).
   */
  function readiness(c) {
    // K — trung bình (known + 0.5*review)/total trên các topic focus có câu.
    const ratios = (c.focus || []).map(topicRatio).filter(r => r != null);
    const K = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;

    // A — số bài known / min(40, tổng số bài), tối đa 1.
    const algos = App.algos();
    const knownAlgo = algos.filter(a => App.store.getStatus(a.id) === 'known').length;
    const A = algos.length ? Math.min(1, knownAlgo / Math.min(40, algos.length)) : 0;

    // M — trung bình avg (1–5) của tối đa 5 phiên gần nhất, đổi sang 0–1.
    const hist = (App.store.data.mockHistory || []).slice(0, 5);
    const M = hist.length
      ? hist.reduce((s, r) => s + (Math.max(1, Math.min(5, r.avg || 0)) - 1) / 4, 0) / hist.length
      : 0;

    // E — chỉ tính khi bắt buộc tiếng Anh: tỉ lệ đã thuộc topic english.
    const E = c.englishRequired ? (App.stats('english').known / Math.max(1, App.stats('english').total)) : 0;

    const wA = (c.algoWeight || 0) * 0.4;
    const wM = 0.2;
    const wE = c.englishRequired ? 0.1 : 0;
    const wK = 1 - wA - wM - wE;

    const score = 100 * (wK * K + wA * A + wM * M + wE * E);
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      K, A, M, E, wK, wA, wM, wE,
      // Giải thích thô dùng cho hiển thị.
      knownAlgo: knownAlgo, algoTotal: algos.length, mockN: hist.length,
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

    const filtered = state.type === 'all' ? all : all.filter(c => c.type === state.type);
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
      '<div class="chips co-type-chips" role="group" aria-label="Lọc theo loại công ty">' + chips + '</div>' +
      (filtered.length
        ? '<div class="grid co-grid">' + cards + '</div>'
        : '<div class="empty"><p>Không có công ty nào thuộc loại này.</p></div>');

    const onClick = e => {
      const chip = e.target.closest('[data-type]');
      if (!chip) return;
      state.type = chip.dataset.type;
      renderList(root);
    };
    if (listHandler) root.removeEventListener('click', listHandler);
    listHandler = onClick;
    root.addEventListener('click', onClick);
    return () => {
      root.removeEventListener('click', onClick);
      if (listHandler === onClick) listHandler = null;
    };
  }

  /** Thanh thành phần điểm (K/A/M/E) kèm giải thích. */
  function partRow(label, ratio, weight, explain) {
    const pct = Math.round(ratio * 100);
    const pts = Math.round(ratio * weight * 100);
    return '<div class="co-part">' +
      '<div class="co-part-head"><b>' + App.esc(label) + '</b>' +
        '<span class="muted small">' + pct + '% × trọng số ' + Math.round(weight * 100) + '% = ' + pts + 'đ</span></div>' +
      '<div class="progress" role="progressbar" aria-label="' + App.esc(label) + '" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
        '<i class="accent" style="width:' + pct + '%"></i></div>' +
      '<p class="small muted co-part-note">' + App.esc(explain) + '</p>' +
    '</div>';
  }

  /** Giải thích thô từng thành phần để người dùng hiểu vì sao được điểm. */
  function explainParts(c, r) {
    const focusN = (c.focus || []).length;
    const kExpl = focusN
      ? 'Trung bình tỉ lệ đã thuộc/cần ôn trên ' + focusN + ' chủ đề trọng tâm.'
      : 'Công ty này chưa gắn chủ đề trọng tâm.';
    const aExpl = r.algoTotal
      ? 'Đã đánh dấu "Đã giải" ' + r.knownAlgo + '/' + r.algoTotal + ' bài thuật toán (mục tiêu ít nhất 40 bài).'
      : 'Chưa có bài thuật toán nào trong ngân hàng.';
    const mExpl = r.mockN
      ? 'Trung bình ' + r.mockN + ' phiên phỏng vấn thử gần nhất (thang 1–5 → 0–1).'
      : 'Bạn chưa làm phiên phỏng vấn thử nào.';
    const eExpl = c.englishRequired
      ? 'Công ty yêu cầu tiếng Anh — tỉ lệ đã thuộc topic Phỏng vấn tiếng Anh.'
      : '';
    return { kExpl: kExpl, aExpl: aExpl, mExpl: mExpl, eExpl: eExpl };
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

  /** Trọng tâm cần ôn: thanh tiến độ + link bank/flash; topic yếu nhất gắn nhãn "Ưu tiên". */
  function focusHtml(c) {
    const ids = c.focus || [];
    if (!ids.length) return '';
    const rows = ids.map(id => {
      const s = App.stats(id);
      const ratio = s.total ? (s.known + 0.5 * s.review) / s.total : null;
      const pct = ratio != null ? Math.round(ratio * 100) : 0;
      const t = App.topic(id);
      return { id: id, name: (t.icon ? t.icon + ' ' : '') + t.name, pct: pct, ratio: ratio, s: s };
    });
    // Topic tỉ lệ thuộc thấp nhất (chỉ tính topic có câu) được đánh dấu Ưu tiên.
    const withQ = rows.filter(x => x.ratio != null);
    const weakest = withQ.length ? withQ.reduce((a, b) => (b.ratio < a.ratio ? b : a)) : null;
    const items = rows.map(x =>
      '<li class="co-focus' + (weakest && x.id === weakest.id ? ' co-priority' : '') + '">' +
        '<div class="co-focus-head">' +
          '<b>' + App.esc(x.name) + '</b>' +
          (weakest && x.id === weakest.id ? '<span class="badge accent">Ưu tiên</span>' : '') +
          '<span class="small muted">' + x.s.known + '/' + x.s.total + ' câu đã thuộc</span>' +
        '</div>' +
        '<div class="progress" role="progressbar" aria-label="' + App.esc(x.name) + '" aria-valuenow="' + x.pct + '" aria-valuemin="0" aria-valuemax="100">' +
          '<i class="accent" style="width:' + x.pct + '%"></i></div>' +
        '<div class="row co-focus-links">' +
          '<a class="btn sm" href="#/bank/' + App.esc(x.id) + '">Câu hỏi</a>' +
          '<a class="btn sm" href="#/flash/' + App.esc(x.id) + '">Flashcard</a>' +
        '</div>' +
      '</li>').join('');
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
    const ex = explainParts(c, r);
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
          '<div class="co-ready-parts">' +
            partRow('Kiến thức (K)', r.K, r.wK, ex.kExpl) +
            partRow('Thuật toán (A)', r.A, r.wA, ex.aExpl) +
            partRow('Phỏng vấn thử (M)', r.M, r.wM, ex.mExpl) +
            (c.englishRequired ? partRow('Tiếng Anh (E)', r.E, r.wE, ex.eExpl) : '') +
          '</div>' +
        '</div>' +
        '<p class="small muted">Điểm = 100 × (trọng số × tỉ lệ của từng thành phần). Học thêm và chấm mock để cải thiện.</p>' +
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
