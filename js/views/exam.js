/*
 * Thi thử kiểu chứng chỉ (T321): #/exam/<topic> (mặc định claude).
 * - 53 câu bốc theo trọng số domain (tag "[Domain]" ở đầu câu hỏi), bấm giờ, không hiện đáp án khi đang thi,
 *   lưới điều hướng, đánh dấu xem lại, câu chọn nhiều đáp án (multi: true).
 * - Chấm thang mô phỏng 100–1000, đậu ≥ 720; điểm theo domain; xem lại câu sai.
 * - "Ôn lại câu sai" / "Luyện domain yếu": chế độ luyện tập (không giờ, hiện giải thích ngay).
 * - Bài đang làm dở lưu trong sessionStorage để reload không mất.
 */
(function () {
  'use strict';

  const EXAM_SIZE = 53, EXAM_MINUTES = 120, PASS = 720;
  // Trọng số domain theo các trang ôn thi CCDV-F (bên thứ ba) — topic khác chia đều.
  const WEIGHTS = {
    claude: { 'Applications': 33, 'Model Selection': 17, 'Agents': 15, 'Prompt': 11, 'Tools': 11, 'Security': 8, 'Claude Code': 3, 'Eval': 2 },
  };
  const OTHER = 'Khác';

  const E = {
    phase: 'setup',        // setup | exam | result
    topic: 'claude',
    practice: false,       // luyện tập: không giờ, hiện đáp án ngay
    list: [],              // [{ q, options, answer: [idx], multi, domain }]
    sel: [],               // sel[i] = [idx đã chọn]
    checked: [],           // practice: câu đã kiểm tra
    flag: [],              // flag[i] = true nếu đánh dấu xem lại
    idx: 0,
    startedAt: 0,
    endAt: 0,              // 0 = không giới hạn giờ
    timer: null,
    result: null,
  };
  let rootEl = null;

  const keyOf = topic => 'sjp.exam.' + topic;
  const mdInline = src => App.md(src).replace(/^<p>/, '').replace(/<\/p>$/, '');

  function domainOf(q) {
    const m = /^\s*\[([^\]]+)\]/.exec(q.q || '');
    return m ? m[1].trim() : OTHER;
  }
  function stripTag(text) { return String(text || '').replace(/^\s*\[[^\]]+\]\s*/, ''); }
  function answerOf(q) { return Array.isArray(q.answer) ? q.answer.slice() : [q.answer]; }
  function pool(topic) { return App.quiz().filter(q => q.topic === topic); }

  /** Xáo options, nhớ index đáp án mới. order[i] = index gốc của option ở vị trí i. */
  function prepare(q, order) {
    const ord = order || App.shuffle(q.options.map((_, i) => i));
    const ans = answerOf(q);
    return {
      q: q,
      order: ord,
      options: ord.map(i => q.options[i]),
      answer: ord.map((orig, i) => (ans.indexOf(orig) >= 0 ? i : -1)).filter(i => i >= 0),
      multi: q.multi === true,
      domain: domainOf(q),
    };
  }

  /** Bốc n câu theo trọng số domain; thiếu thì bù từ domain khác. */
  function pickExam(all, n, topic) {
    const w = WEIGHTS[topic] || {};
    const byDom = {};
    all.forEach(q => { const d = domainOf(q); (byDom[d] = byDom[d] || []).push(q); });
    const doms = Object.keys(byDom);
    const sumW = doms.reduce((s, d) => s + (w[d] || 1), 0);
    let picked = [], rest = [];
    doms.forEach(d => {
      const want = Math.round(n * (w[d] || 1) / sumW);
      const sh = App.shuffle(byDom[d]);
      picked = picked.concat(sh.slice(0, want));
      rest = rest.concat(sh.slice(want));
    });
    if (picked.length < n) picked = picked.concat(App.shuffle(rest).slice(0, n - picked.length));
    return App.shuffle(picked.slice(0, n));
  }

  const isCorrect = (item, sel) => {
    const a = (sel || []).slice().sort((x, y) => x - y);
    return a.length === item.answer.length && a.every((v, i) => v === item.answer[i]);
  };
  const scaled = (c, t) => (t ? Math.round(100 + 900 * c / t) : 100);
  const fmt = sec => { sec = Math.max(0, sec); const m = Math.floor(sec / 60), s = sec % 60; return m + ':' + String(s).padStart(2, '0'); };
  const left = () => (E.endAt ? Math.round((E.endAt - Date.now()) / 1000) : 0);

  // ---------- lưu / khôi phục bài dở ----------
  function save() {
    if (E.phase !== 'exam') return;
    try {
      sessionStorage.setItem(keyOf(E.topic), JSON.stringify({
        practice: E.practice, idx: E.idx, startedAt: E.startedAt, endAt: E.endAt,
        items: E.list.map(it => ({ id: it.q.id, order: it.order })), sel: E.sel, flag: E.flag, checked: E.checked,
      }));
    } catch (e) { /* storage bị chặn: bỏ qua */ }
  }
  function loadSaved(topic) {
    try { const raw = sessionStorage.getItem(keyOf(topic)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function clearSaved(topic) { try { sessionStorage.removeItem(keyOf(topic)); } catch (e) { /* ignore */ } }
  function restore(s) {
    const byId = {};
    App.quiz().forEach(q => { byId[q.id] = q; });
    const list = s.items.filter(x => byId[x.id]).map(x => prepare(byId[x.id], x.order));
    if (!list.length) return false;
    Object.assign(E, { phase: 'exam', practice: !!s.practice, list: list, sel: s.sel || [], flag: s.flag || [],
      checked: s.checked || [], idx: Math.min(s.idx || 0, list.length - 1), startedAt: s.startedAt, endAt: s.endAt || 0, result: null });
    return true;
  }

  // ---------- bắt đầu / kết thúc ----------
  function begin(list, practice) {
    stopTimer();
    Object.assign(E, { phase: 'exam', practice: practice, list: list, sel: list.map(() => []), checked: [], flag: [],
      idx: 0, startedAt: Date.now(), result: null });
    E.endAt = practice ? 0 : Date.now() + Math.max(10, Math.round(EXAM_MINUTES * list.length / EXAM_SIZE)) * 60000;
    save();
    startTimer();
    render();
  }
  function startExam() { begin(pickExam(pool(E.topic), EXAM_SIZE, E.topic).map(q => prepare(q)), false); }
  function startPractice(qs) { if (qs.length) begin(App.shuffle(qs).map(q => prepare(q)), true); }

  function submit(auto) {
    if (E.phase !== 'exam') return;
    if (!auto && !E.practice) {
      const blank = E.sel.filter(s => !s || !s.length).length;
      if (!confirm('Nộp bài?' + (blank ? ' Còn ' + blank + ' câu chưa trả lời.' : ''))) return;
    }
    stopTimer();
    const byDomain = {};
    let correct = 0;
    const wrongIds = [];
    E.list.forEach((it, i) => {
      const d = byDomain[it.domain] = byDomain[it.domain] || { total: 0, correct: 0 };
      d.total += 1;
      if (isCorrect(it, E.sel[i])) { d.correct += 1; correct += 1; } else wrongIds.push(it.q.id);
    });
    const total = E.list.length;
    const seconds = Math.round((Date.now() - E.startedAt) / 1000);
    const score = scaled(correct, total);
    E.result = { total, correct, score, passed: score >= PASS, byDomain, wrongIds, seconds, auto: !!auto };
    if (!E.practice) {
      App.store.addQuizResult({ mode: 'exam', topic: E.topic, total, correct, score, passed: score >= PASS, byDomain, wrongIds, seconds,
        topics: { [E.topic]: total } });
      App.store.save();
    }
    clearSaved(E.topic);
    E.phase = 'result';
    render();
  }

  // ---------- đồng hồ ----------
  function startTimer() {
    stopTimer();
    E.timer = setInterval(() => {
      if (E.phase !== 'exam') return;
      const el = rootEl && rootEl.querySelector('#examTimer');
      if (E.endAt) {
        const s = left();
        if (el) { el.textContent = fmt(s); el.classList.toggle('low', s <= 300); }
        if (s <= 0) submit(true);
      } else if (el) el.textContent = fmt(Math.round((Date.now() - E.startedAt) / 1000));
    }, 1000);
  }
  function stopTimer() { if (E.timer) { clearInterval(E.timer); E.timer = null; } }

  // ---------- thao tác ----------
  function choose(i) {
    const it = E.list[E.idx];
    if (!it || i < 0 || i >= it.options.length) return;
    if (E.practice && E.checked[E.idx]) return;
    let s = (E.sel[E.idx] || []).slice();
    if (it.multi) {
      const p = s.indexOf(i);
      if (p >= 0) s.splice(p, 1); else if (s.length < it.answer.length) s.push(i);
    } else s = [i];
    E.sel[E.idx] = s;
    if (E.practice && !it.multi) E.checked[E.idx] = true;      // luyện tập: chọn là chấm ngay
    save();
    render();
  }
  function go(i) { if (i >= 0 && i < E.list.length) { E.idx = i; save(); render(); } }
  function toggleFlag() { E.flag[E.idx] = !E.flag[E.idx]; save(); render(); }
  function check() { const it = E.list[E.idx]; if (it && (E.sel[E.idx] || []).length === it.answer.length) { E.checked[E.idx] = true; save(); render(); } }

  // ---------- HTML ----------
  function historyRows() {
    return (App.store.data.quizHistory || []).filter(h => h.mode === 'exam' && h.topic === E.topic).slice(0, 5);
  }
  function weakestDomain(h) {
    if (!h || !h.byDomain) return null;
    let best = null;
    Object.keys(h.byDomain).forEach(d => {
      const v = h.byDomain[d], p = v.total ? v.correct / v.total : 1;
      if (!best || p < best.p) best = { d: d, p: p };
    });
    return best;
  }

  function setupHtml() {
    const qs = pool(E.topic);
    const t = App.topic(E.topic) || { name: E.topic, icon: '' };
    const counts = {};
    qs.forEach(q => { const d = domainOf(q); counts[d] = (counts[d] || 0) + 1; });
    const w = WEIGHTS[E.topic] || {};
    const domRows = Object.keys(counts).sort((a, b) => (w[b] || 0) - (w[a] || 0)).map(d =>
      '<tr><td>' + App.esc(d) + '</td><td>' + (w[d] ? w[d] + '%' : '—') + '</td><td>' + counts[d] + '</td></tr>').join('');
    const hist = historyRows();
    const histHtml = hist.map(h => '<li><span class="badge ' + (h.passed ? 'ok' : 'bad') + '">' + h.score + ' · ' + (h.passed ? 'ĐẬU' : 'TRƯỢT') +
      '</span> <span class="small muted">' + h.correct + '/' + h.total + ' · ' + App.esc(App.fmtDate(h.at)) + ' · ' + fmt(h.seconds) + '</span></li>').join('');
    const weak = weakestDomain(hist[0]);
    const saved = loadSaved(E.topic);
    const n = Math.min(EXAM_SIZE, qs.length);
    const minutes = Math.max(10, Math.round(EXAM_MINUTES * n / EXAM_SIZE));
    return '<div class="page-head"><div><h1>📝 Thi thử: ' + App.esc((t.icon ? t.icon + ' ' : '') + t.name) + '</h1>' +
      '<p>' + n + ' câu bốc theo trọng số domain · ' + minutes + ' phút · không hiện đáp án khi đang thi · đậu từ ' + PASS + '/1000.</p></div></div>' +
      (saved ? '<section class="card exam-resume"><strong>Bạn có bài thi đang làm dở.</strong> ' +
        '<button type="button" class="btn primary" data-act="resume">Tiếp tục</button> <button type="button" class="btn ghost" data-act="discard">Bỏ bài dở</button></section>' : '') +
      '<section class="card">' +
        (qs.length ? '<button type="button" class="btn primary lg" data-act="start">Bắt đầu thi</button>' : '<p class="muted">Chưa có câu trắc nghiệm cho chủ đề này.</p>') +
        (weak && weak.p < 0.72 ? ' <button type="button" class="btn" data-act="weak">Luyện domain yếu: ' + App.esc(weak.d) + ' (' + Math.round(weak.p * 100) + '%)</button>' : '') +
        '<p class="small muted exam-note">Thang điểm mô phỏng (100 + 900 × tỉ lệ đúng), không phải cách chấm chính thức. Câu chọn nhiều đáp án chỉ đúng khi chọn đủ và đúng hết.</p>' +
      '</section>' +
      (domRows ? '<section class="card"><h3>Ngân hàng theo domain</h3><table class="exam-table"><thead><tr><th>Domain</th><th>Trọng số đề</th><th>Số câu</th></tr></thead><tbody>' + domRows + '</tbody></table></section>' : '') +
      '<section class="card"><h3>5 lần thi gần nhất</h3>' + (histHtml ? '<ul class="exam-hist">' + histHtml + '</ul>' : '<p class="muted small">Chưa có lần thi nào.</p>') + '</section>';
  }

  function examHtml() {
    const it = E.list[E.idx];
    const sel = E.sel[E.idx] || [];
    const revealed = E.practice && E.checked[E.idx];
    const answered = E.sel.filter(s => s && s.length).length;
    const opts = it.options.map((text, i) => {
      const on = sel.indexOf(i) >= 0;
      let cls = on ? ' selected' : '';
      if (revealed) cls += it.answer.indexOf(i) >= 0 ? ' correct' : on ? ' wrong' : '';
      return '<li><button type="button" class="exam-opt' + cls + '" data-opt="' + i + '" aria-pressed="' + on + '"' + (revealed ? ' disabled' : '') + '>' +
        '<span class="exam-key">' + (it.multi ? (on ? '☑' : '☐') : 'ABCDEF'[i]) + '</span><span class="exam-opt-text">' + mdInline(text) + '</span></button></li>';
    }).join('');
    const grid = E.list.map((x, i) => {
      const c = (i === E.idx ? ' current' : '') + ((E.sel[i] || []).length ? ' done' : '') + (E.flag[i] ? ' flagged' : '') +
        (E.practice && E.checked[i] ? (isCorrect(x, E.sel[i]) ? ' ok' : ' bad') : '');
      return '<button type="button" class="exam-cell' + c + '" data-go="' + i + '" aria-label="Câu ' + (i + 1) + '">' + (i + 1) + '</button>';
    }).join('');
    const timeText = E.endAt ? fmt(left()) : fmt(Math.round((Date.now() - E.startedAt) / 1000));
    return '<div class="card exam-head">' +
        '<span class="badge">' + (E.practice ? 'Luyện tập' : 'Thi thử') + '</span>' +
        '<span class="exam-progress">Câu ' + (E.idx + 1) + '/' + E.list.length + ' · đã làm ' + answered + '</span>' +
        '<span class="exam-timer" id="examTimer" title="' + (E.endAt ? 'Thời gian còn lại' : 'Thời gian đã làm') + '">' + timeText + '</span>' +
        '<button type="button" class="btn sm primary" data-act="submit">' + (E.practice ? 'Kết thúc' : 'Nộp bài') + '</button>' +
      '</div>' +
      '<div class="exam-body">' +
        '<section class="card exam-q">' +
          '<div class="exam-meta"><span class="chip">' + App.esc(it.domain) + '</span>' +
            (it.multi ? '<span class="badge warn">Chọn ' + it.answer.length + ' đáp án</span>' : '') + '</div>' +
          '<div class="md exam-q-text">' + App.md(stripTag(it.q.q)) + '</div>' +
          '<ul class="exam-opts">' + opts + '</ul>' +
          (E.practice && it.multi && !revealed ? '<button type="button" class="btn" data-act="check"' + (sel.length === it.answer.length ? '' : ' disabled') + '>Kiểm tra</button>' : '') +
          (revealed ? '<div class="exam-explain"><h4>' + (isCorrect(it, sel) ? '✅ Chính xác' : '❌ Chưa đúng') + '</h4><div class="md">' + App.md(it.q.explain) + '</div></div>' : '') +
          '<div class="row exam-nav">' +
            '<button type="button" class="btn" data-act="prev"' + (E.idx ? '' : ' disabled') + '>← Trước <kbd>P</kbd></button>' +
            '<button type="button" class="btn' + (E.flag[E.idx] ? ' warn' : '') + '" data-act="flag">' + (E.flag[E.idx] ? '🚩 Bỏ đánh dấu' : '🚩 Đánh dấu xem lại') + ' <kbd>F</kbd></button>' +
            '<button type="button" class="btn primary" data-act="next"' + (E.idx + 1 < E.list.length ? '' : ' disabled') + '>Sau → <kbd>N</kbd></button>' +
          '</div>' +
          '<p class="small muted">Phím <kbd>1</kbd>–<kbd>6</kbd> chọn đáp án.</p>' +
        '</section>' +
        '<aside class="card exam-grid-card"><h4>Danh sách câu</h4><div class="exam-grid">' + grid + '</div>' +
          '<p class="small muted"><span class="exam-dot done"></span> đã làm · <span class="exam-dot flagged"></span> đánh dấu</p></aside>' +
      '</div>';
  }

  function resultHtml() {
    const r = E.result;
    const w = WEIGHTS[E.topic] || {};
    const doms = Object.keys(r.byDomain).sort((a, b) => (w[b] || 0) - (w[a] || 0));
    const rows = doms.map(d => {
      const v = r.byDomain[d], p = v.total ? Math.round(v.correct / v.total * 100) : 0;
      return '<div class="exam-bar"><span class="exam-bar-label">' + App.esc(d) + '</span>' +
        '<span class="progress"><i class="' + (p >= 72 ? 'ok' : p >= 50 ? 'warn' : 'bad') + '" style="width:' + p + '%"></i></span>' +
        '<span class="exam-bar-val">' + v.correct + '/' + v.total + ' (' + p + '%)</span></div>';
    }).join('');
    const wrong = E.list.map((it, i) => ({ it: it, sel: E.sel[i] || [] })).filter(x => !isCorrect(x.it, x.sel));
    const wrongHtml = wrong.map((x, n) =>
      '<details class="card exam-wrong"><summary>' + (n + 1) + '. <span class="chip">' + App.esc(x.it.domain) + '</span> ' + App.esc(stripTag(x.it.q.q)) + '</summary>' +
        '<p class="small"><strong>Bạn chọn:</strong> ' + (x.sel.length ? x.sel.map(i => App.esc(x.it.options[i])).join(' · ') : '<em>bỏ trống</em>') + '</p>' +
        '<p class="small"><strong>Đáp án đúng:</strong> ' + x.it.answer.map(i => App.esc(x.it.options[i])).join(' · ') + '</p>' +
        '<div class="md">' + App.md(x.it.q.explain) + '</div></details>').join('');
    let weakest = null;
    doms.forEach(d => { const v = r.byDomain[d], p = v.correct / v.total; if (!weakest || p < weakest.p) weakest = { d: d, p: p }; });
    return '<div class="page-head"><div><h1>' + (E.practice ? 'Kết quả luyện tập' : 'Kết quả thi thử') + '</h1>' +
      '<p>' + (r.auto ? 'Hết giờ, bài đã được nộp tự động. ' : '') + 'Đúng ' + r.correct + '/' + r.total + ' câu trong ' + fmt(r.seconds) + '.</p></div></div>' +
      '<section class="card exam-score">' +
        (E.practice ? '<div class="exam-score-num">' + Math.round(r.correct / r.total * 100) + '%</div>' :
          '<div class="exam-score-num ' + (r.passed ? 'ok' : 'bad') + '">' + r.score + '<small>/1000</small></div>' +
          '<div class="badge ' + (r.passed ? 'ok' : 'bad') + ' exam-verdict">' + (r.passed ? 'ĐẬU' : 'TRƯỢT') + ' (mốc ' + PASS + ')</div>' +
          '<p class="small muted">Thang điểm mô phỏng, không phải cách chấm chính thức.</p>') +
        '<div class="row exam-actions">' +
          '<button type="button" class="btn primary" data-act="retryWrong"' + (wrong.length ? '' : ' disabled') + '>Ôn lại câu sai (' + wrong.length + ')</button>' +
          (weakest && weakest.p < 0.72 ? '<button type="button" class="btn" data-act="weakNow" data-domain="' + App.esc(weakest.d) + '">Luyện domain yếu: ' + App.esc(weakest.d) + '</button>' : '') +
          '<button type="button" class="btn ghost" data-act="home">Về trang thi thử</button>' +
        '</div>' +
      '</section>' +
      '<section class="card"><h3>Điểm theo domain</h3>' + rows + '<p class="small muted">Dưới 72% (đỏ/vàng) là domain cần ôn thêm.</p></section>' +
      (wrongHtml ? '<section><h3>Câu sai (' + wrong.length + ')</h3>' + wrongHtml + '</section>' : '<section class="card"><p>Không sai câu nào. 🎉</p></section>');
  }

  function render() {
    if (!rootEl) return;
    rootEl.innerHTML = E.phase === 'exam' ? examHtml() : E.phase === 'result' ? resultHtml() : setupHtml();
  }

  // ---------- events (delegation trên root) ----------
  function onClick(e) {
    const opt = e.target.closest('[data-opt]');
    if (opt && E.phase === 'exam') { choose(Number(opt.dataset.opt)); return; }
    const cell = e.target.closest('[data-go]');
    if (cell) { go(Number(cell.dataset.go)); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act === 'start') startExam();
    else if (act === 'resume') { const s = loadSaved(E.topic); if (s && restore(s)) { startTimer(); render(); } }
    else if (act === 'discard') { clearSaved(E.topic); render(); }
    else if (act === 'weak') { const w = weakestDomain(historyRows()[0]); if (w) startPractice(pool(E.topic).filter(q => domainOf(q) === w.d)); }
    else if (act === 'weakNow') startPractice(pool(E.topic).filter(q => domainOf(q) === b.dataset.domain));
    else if (act === 'retryWrong') { const ids = E.result ? E.result.wrongIds : []; startPractice(App.quiz().filter(q => ids.indexOf(q.id) >= 0)); }
    else if (act === 'home') { E.phase = 'setup'; render(); }
    else if (act === 'submit') submit(false);
    else if (act === 'prev') go(E.idx - 1);
    else if (act === 'next') go(E.idx + 1);
    else if (act === 'flag') toggleFlag();
    else if (act === 'check') check();
  }
  function onKey(e) {
    if (E.phase !== 'exam') return;
    if (e.key >= '1' && e.key <= '6') { e.preventDefault(); choose(Number(e.key) - 1); }
    else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') { e.preventDefault(); go(E.idx + 1); }
    else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft') { e.preventDefault(); go(E.idx - 1); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFlag(); }
  }

  App.registerView('exam', {
    title: 'Thi thử chứng chỉ',
    render(root, params) {
      rootEl = root;
      stopTimer();
      E.topic = (params && params[0]) || 'claude';
      E.phase = 'setup';
      E.result = null;
      render();
      root.addEventListener('click', onClick);
      const off = App.onKey(onKey);
      return () => { stopTimer(); save(); off(); root.removeEventListener('click', onClick); };
    },
  });
})();
