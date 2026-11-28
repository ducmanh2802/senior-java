/*
 * TOEIC Listening & Reading (#/toeiclr) + tips 4 kỹ năng. Spec: docs/TOEIC-LR.md, task T2858.
 * Data (group 'toeic-lr'): window.TOEIC_LR (units), window.TOEIC_TIPS (tips).
 * Routes:
 *   #/toeiclr                      danh sách đề + tiến độ
 *   #/toeiclr/t/<test>             các part của một đề
 *   #/toeiclr/t/<test>/p<part>     luyện một part (có giải thích ngay, nghe lại thoải mái)
 *   #/toeiclr/t/<test>/exam        thi thử: không giải thích, audio phát 1 lần, bấm giờ, chấm điểm ước lượng
 *   #/toeiclr/wrong                ôn lại câu sai
 *   #/toeiclr/tips[/<skill>]       tips 4 kỹ năng + chiến lược
 * Lưu: App.store.data.toeicLr = { history: [{test, l, r, lt, rt, at, byPart}], wrong: { '<unitId>#<n>': at }, tips: { '<tipId>:<i>': true } }
 * Audio: speechSynthesis (không có thì hiện script). Nội dung tiếng Anh gắn lang="en".
 */
(function () {
  'use strict';
  const esc = s => App.esc(s == null ? '' : String(s));
  const PARTS = {
    1: { name: 'Part 1 · Mô tả tranh', L: true, n: 6 }, 2: { name: 'Part 2 · Hỏi – đáp', L: true, n: 25 },
    3: { name: 'Part 3 · Hội thoại', L: true, n: 39 }, 4: { name: 'Part 4 · Bài nói', L: true, n: 30 },
    5: { name: 'Part 5 · Điền câu', L: false, n: 30 }, 6: { name: 'Part 6 · Điền đoạn văn', L: false, n: 16 },
    7: { name: 'Part 7 · Đọc hiểu', L: false, n: 54 },
  };
  const SKILLS = [['listening', '🎧 Listening'], ['reading', '📖 Reading'], ['speaking', '🗣️ Speaking'], ['writing', '✍️ Writing'], ['overall', '🧭 Chiến lược']];
  const LETTER = 'ABCD';
  const ACCENT = { us: 'en-US', uk: 'en-GB', au: 'en-AU', ca: 'en-CA' };

  function st() {
    const d = App.store.data;
    d.toeicLr = d.toeicLr || {};
    d.toeicLr.history = d.toeicLr.history || [];
    d.toeicLr.wrong = d.toeicLr.wrong || {};
    d.toeicLr.tips = d.toeicLr.tips || {};
    return d.toeicLr;
  }
  const units = () => (window.TOEIC_LR || []).filter(u => u && u.questions);
  const tests = () => [...new Set(units().map(u => u.test))].sort((a, b) => a - b);
  const unitsOf = (t, p) => units().filter(u => u.test === t && (p == null || u.part === p))
    .sort((a, b) => a.questions[0].n - b.questions[0].n);
  const qCount = list => list.reduce((s, u) => s + u.questions.length, 0);

  // ---------- speech ----------
  const synth = typeof window !== 'undefined' && window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : null;
  function voicesFor(lang) {
    const all = synth ? synth.getVoices() : [];
    const exact = all.filter(v => v.lang && v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
    return exact.length ? exact : all.filter(v => /^en/i.test(v.lang || ''));
  }
  /** Speak lines [{sp, text}] one after another; resolves when done or stopped. */
  function speak(lines, accent, onEnd) {
    if (!synth) { if (onEnd) onEnd(); return; }
    synth.cancel();
    const lang = ACCENT[accent] || 'en-US';
    const vs = voicesFor(lang);
    const voiceOf = sp => vs.length ? vs[({ M: 0, W: 1, M2: 2, W2: 3, N: 0 }[sp] || 0) % vs.length] : null;
    lines.forEach((l, i) => {
      const u = new window.SpeechSynthesisUtterance(l.text);
      u.lang = lang; u.rate = 0.95;
      const v = voiceOf(l.sp); if (v) u.voice = v;
      if (l.sp === 'W' || l.sp === 'W2') u.pitch = 1.15; else if (l.sp === 'M' || l.sp === 'M2') u.pitch = 0.9;
      if (i === lines.length - 1 && onEnd) u.onend = onEnd;
      synth.speak(u);
    });
  }
  /** What the test audio says for a unit (Part 1/2 read the options aloud, like the real test). */
  function audioLines(u) {
    const q = u.questions[0];
    if (u.part === 1) return q.options.map((o, i) => ({ sp: 'N', text: '(' + LETTER[i] + ') ' + o }));
    if (u.part === 2) return (u.script || []).concat(q.options.map((o, i) => ({ sp: 'N', text: '(' + LETTER[i] + ') ' + o })));
    return (u.script || []).concat(u.questions.map(x => ({ sp: 'N', text: x.q })));
  }

  // ---------- rendering pieces ----------
  function tabs(active) {
    const t = [['tests', '#/toeiclr', '📝 Đề L&R'], ['tips', '#/toeiclr/tips', '💡 Tips 4 kỹ năng'], ['wrong', '#/toeiclr/wrong', '🔁 Ôn câu sai'], ['sw', '#/toeic', '🎤 Speaking & Writing']];
    return '<nav class="chips tl-tabs" aria-label="TOEIC">' + t.map(([k, h, l]) =>
      '<a class="chip' + (k === active ? ' active' : '') + '" href="' + h + '">' + l + '</a>').join('') + '</nav>';
  }
  function head(sub) {
    return '<section class="page-head"><h2>🎧 TOEIC Listening &amp; Reading</h2><p>' + sub + '</p></section>';
  }

  function viewTests() {
    const ts = tests();
    const s = st();
    const rows = ts.map(t => {
      const parts = Object.keys(PARTS).map(Number).map(p => {
        const n = qCount(unitsOf(t, p));
        const full = n >= PARTS[p].n;
        return '<a class="chip' + (full ? '' : ' tl-partial') + '" href="#/toeiclr/t/' + t + '/p' + p + '" title="' + esc(PARTS[p].name) + '">P' + p +
          (full ? '' : n ? ' (' + n + '/' + PARTS[p].n + ')' : ' · đang soạn') + '</a>';
      }).join('');
      const total = qCount(unitsOf(t));
      const last = s.history.find(h => h.test === t);
      return '<div class="card tl-test"><div class="row"><h3>Đề số ' + t + '</h3><span class="badge">' + total + '/200 câu</span>' +
        (last ? '<span class="small muted">Lần gần nhất: L ' + last.l + ' · R ' + last.r + ' (ước lượng) · ' + esc(App.fmtDate(last.at)) + '</span>' : '') + '</div>' +
        '<div class="chips">' + parts + '</div>' +
        '<div class="row"><a class="btn primary" href="#/toeiclr/t/' + t + '/exam">⏱️ Thi thử ' + (total >= 200 ? 'full 200 câu' : total + ' câu đã có') + '</a>' +
        '<a class="btn" href="#/toeiclr/t/' + t + '">Chọn part để luyện</a></div></div>';
    }).join('');
    return head('Đề luyện theo đúng format ETS mới (7 part, 200 câu, 120 phút). Nội dung tự soạn, không chép đề thật. Audio đọc bằng giọng máy của trình duyệt.') +
      tabs('tests') +
      (synth ? '' : '<p class="card small">Trình duyệt không hỗ trợ đọc giọng nói: phần Listening sẽ hiện script để đọc.</p>') +
      (rows || '<div class="empty">Đề đang được soạn. Trong lúc chờ, xem tab Tips 4 kỹ năng.</div>') +
      '<div class="card small muted">Điểm hiển thị là <b>ước lượng</b> 5–495 mỗi phần theo tỉ lệ đúng, không phải thang quy đổi chính thức của ETS.</div>';
  }

  function viewTest(t) {
    const cards = Object.keys(PARTS).map(Number).map(p => {
      const n = qCount(unitsOf(t, p));
      return '<a class="card tl-part" href="#/toeiclr/t/' + t + '/p' + p + '"><b>' + esc(PARTS[p].name) + '</b>' +
        '<span class="small muted">' + (n ? n + '/' + PARTS[p].n + ' câu' : 'đang soạn') + ' · ' + (PARTS[p].L ? 'Listening' : 'Reading') + '</span></a>';
    }).join('');
    return head('Đề số ' + t + ': chọn part để luyện (có giải thích ngay) hoặc thi thử.') + tabs('tests') +
      '<div class="grid tl-parts">' + cards + '</div>' +
      '<div class="row"><a class="btn primary" href="#/toeiclr/t/' + t + '/exam">⏱️ Thi thử</a><a class="btn" href="#/toeiclr">← Danh sách đề</a></div>';
  }

  function unitBody(u, showScript) {
    let h = '';
    if (u.part === 1) h += '<div class="tl-picture" lang="en"><span class="small muted">🖼️ Mô tả bức ảnh</span><p>' + esc(u.picture) + '</p></div>';
    if (u.graphic) h += '<div class="tl-graphic md">' + App.md(u.graphic) + '</div>';
    (u.passages || []).forEach(p => {
      h += '<div class="tl-passage" lang="en"><div class="small muted">' + esc(p.kind) + (p.title ? ' · ' + esc(p.title) : '') + '</div>' +
        '<div class="tl-text">' + esc(p.text).replace(/\n/g, '<br>') + '</div></div>';
    });
    if (u.script && showScript) {
      h += '<div class="tl-script" lang="en">' + u.script.map(l => '<p><b>' + esc(l.sp) + ':</b> ' + esc(l.text) + '</p>').join('') + '</div>';
    }
    return h;
  }

  function questionHtml(u, q, chosen, reveal) {
    const opts = q.options.map((o, i) => {
      let cls = 'btn tl-opt';
      if (reveal && i === q.answer) cls += ' ok';
      else if (reveal && i === chosen) cls += ' bad';
      else if (chosen === i) cls += ' active';
      // Part 1/2: options are heard, not read, while answering in exam mode
      const hidden = (u.part <= 2) && !reveal;
      return '<button class="' + cls + '" data-opt="' + i + '" data-uid="' + esc(u.id) + '" data-n="' + q.n + '" lang="en">(' + LETTER[i] + ')' +
        (hidden ? '' : ' ' + esc(o)) + '</button>';
    }).join('');
    return '<div class="tl-q"><div class="tl-qn"><b>' + q.n + '.</b> <span lang="en">' + esc(q.q || '') + '</span></div>' +
      '<div class="tl-opts">' + opts + '</div>' +
      (reveal ? '<div class="tl-explain md">' + App.md(q.explain || '') + '</div>' : '') + '</div>';
  }

  // ---------- render ----------
  App.registerView('toeiclr', {
    title: 'TOEIC Listening & Reading',
    render(root, params) {
      params = params || [];
      const cleanups = [];
      const stopAudio = () => { if (synth) synth.cancel(); };
      cleanups.push(stopAudio);
      cleanups.push(() => { root.onclick = null; root.onchange = null; });

      if (params[0] === 'tips') { renderTips(root, params[1]); }
      else if (params[0] === 'wrong') { runSession(root, wrongUnits(), { mode: 'practice', title: 'Ôn câu sai', back: '#/toeiclr' }, cleanups); }
      else if (params[0] === 't' && params[1]) {
        const t = Number(params[1]);
        if (params[2] === 'exam') runSession(root, unitsOf(t), { mode: 'exam', test: t, title: 'Thi thử đề số ' + t, back: '#/toeiclr/t/' + t }, cleanups);
        else if (/^p[1-7]$/.test(params[2] || '')) {
          const p = Number(params[2].slice(1));
          runSession(root, unitsOf(t, p), { mode: 'practice', test: t, title: 'Đề ' + t + ' · ' + PARTS[p].name, back: '#/toeiclr/t/' + t }, cleanups);
        } else root.innerHTML = viewTest(t);
      } else root.innerHTML = viewTests();
      return () => cleanups.forEach(f => { try { f(); } catch (e) { /* ignore */ } });
    },
  });

  function wrongUnits() {
    const w = st().wrong;
    const ids = new Set(Object.keys(w).map(k => k.split('#')[0]));
    return units().filter(u => ids.has(u.id)).slice(0, 40);
  }

  // One session = a list of units. practice: reveal after each answer. exam: answer sheet, reveal at submit.
  function runSession(root, list, opt, cleanups) {
    if (!list.length) {
      root.innerHTML = head(opt.title) + tabs(opt.mode === 'exam' || opt.test ? 'tests' : 'wrong') +
        '<div class="empty">' + (opt.title === 'Ôn câu sai' ? 'Chưa có câu sai nào. Làm một part hoặc thi thử trước.' : 'Phần này đang được soạn.') +
        '</div><a class="btn" href="' + opt.back + '">← Quay lại</a>';
      return;
    }
    const exam = opt.mode === 'exam';
    const answers = {};          // '<uid>#<n>' -> index
    const played = {};           // exam: audio played once
    let idx = 0, showScript = !synth, submitted = false;
    const started = Date.now();
    const limit = exam ? Math.round(120 * 60 * qCount(list) / 200) : 0; // seconds, scaled to the questions present
    let timer = null;

    function key(u, q) { return u.id + '#' + q.n; }
    function draw() {
      const u = list[idx];
      const reveal = submitted || (!exam && u.questions.every(q => answers[key(u, q)] != null));
      const L = u.part <= 4;
      const left = limit ? Math.max(0, limit - Math.floor((Date.now() - started) / 1000)) : 0;
      const audioBtn = L ? (synth
        ? '<button class="btn" data-act="play"' + (exam && played[u.id] && !submitted ? ' disabled' : '') + '>🔊 ' + (exam && !submitted ? (played[u.id] ? 'Đã phát' : 'Phát audio (1 lần)') : 'Nghe') + '</button>'
        : '') + (exam && !submitted ? '' : '<button class="btn" data-act="script">' + (showScript ? 'Ẩn script' : 'Hiện script') + '</button>') : '';
      const sheet = exam ? '<div class="tl-sheet">' + list.map((x, i) => x.questions.map(q => {
        const a = answers[key(x, q)];
        let cls = 'tl-cell' + (i === idx ? ' cur' : '') + (a != null ? ' done' : '');
        if (submitted) cls += a === q.answer ? ' ok' : ' bad';
        return '<button class="' + cls + '" data-go="' + i + '" aria-label="Câu ' + q.n + '">' + q.n + '</button>';
      }).join('')).join('') + '</div>' : '';
      root.innerHTML = head(esc(opt.title)) + tabs(opt.test ? 'tests' : 'wrong') +
        '<div class="card tl-bar row"><span class="badge">' + esc(PARTS[u.part].name) + '</span>' +
        '<span class="small muted">Unit ' + (idx + 1) + '/' + list.length + '</span>' +
        (limit && !submitted ? '<span class="badge tl-timer' + (left < 300 ? ' warn' : '') + '">⏱️ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + '</span>' : '') +
        '<span class="spacer"></span>' + audioBtn + '</div>' +
        '<div class="card tl-unit">' + unitBody(u, showScript || reveal) +
        u.questions.map(q => questionHtml(u, q, answers[key(u, q)], reveal)).join('') +
        (reveal && (u.vi || (u.vocab || []).length) ? '<div class="tl-extra">' + (u.vi ? '<p><b>Dịch:</b> ' + esc(u.vi) + '</p>' : '') +
          ((u.vocab || []).length ? '<div class="chips">' + u.vocab.map(v => '<span class="chip">' + esc(v) + '</span>').join('') + '</div>' : '') + '</div>' : '') +
        '</div>' +
        '<div class="row"><button class="btn" data-act="prev"' + (idx ? '' : ' disabled') + '>← Trước</button>' +
        '<button class="btn primary" data-act="next"' + (idx < list.length - 1 ? '' : ' disabled') + '>Tiếp →</button>' +
        (exam && !submitted ? '<button class="btn warn" data-act="submit">Nộp bài</button>' : '') +
        (submitted ? '<button class="btn" data-act="result">📊 Kết quả</button>' : '') +
        '<a class="btn" href="' + opt.back + '">Thoát</a></div>' + sheet +
        '<p class="small muted">Phím: <kbd>A</kbd>–<kbd>D</kbd> chọn · <kbd>n</kbd>/<kbd>p</kbd> unit sau/trước' + (exam ? '' : ' · <kbd>space</kbd> nghe lại') + '</p>';
    }

    function choose(uid, n, i) {
      const u = list.find(x => x.id === uid); if (!u || submitted) return;
      const q = u.questions.find(x => x.n === n);
      const k = key(u, q);
      if (!exam && answers[k] != null) return;   // practice: first answer counts
      answers[k] = i;
      if (!exam) {
        const w = st().wrong;
        if (i !== q.answer) w[k] = Date.now(); else delete w[k];
        App.store.save();
      }
      draw();
    }
    function play() {
      const u = list[idx];
      if (u.part > 4 || (exam && played[u.id] && !submitted)) return;
      played[u.id] = true;
      speak(audioLines(u), u.accent);
      draw();
    }
    function result(auto) {
      submitted = true;
      if (timer) { clearInterval(timer); timer = null; }
      let lc = 0, lt = 0, rc = 0, rt = 0;
      const byPart = {}, byType = {};
      const w = st().wrong;
      list.forEach(u => u.questions.forEach(q => {
        const ok = answers[key(u, q)] === q.answer;
        if (u.part <= 4) { lt++; if (ok) lc++; } else { rt++; if (ok) rc++; }
        byPart[u.part] = byPart[u.part] || [0, 0]; byPart[u.part][1]++; if (ok) byPart[u.part][0]++;
        const ty = q.type || '?'; byType[ty] = byType[ty] || [0, 0]; byType[ty][1]++; if (ok) byType[ty][0]++;
        if (ok) delete w[key(u, q)]; else w[key(u, q)] = Date.now();
      }));
      const est = (c, t) => t ? Math.max(5, Math.min(495, Math.round((5 + 490 * c / t) / 5) * 5)) : 0;
      const L = est(lc, lt), R = est(rc, rt);
      const s = st();
      s.history.unshift({ test: opt.test, l: L, r: R, lc, lt, rc, rt, at: Date.now(), byPart });
      s.history.length = Math.min(s.history.length, 30);
      App.store.save();
      App.store.log('quiz');
      const rows = (o, label) => Object.keys(o).map(k => {
        const [c, t] = o[k]; const pct = Math.round(100 * c / t);
        return '<tr><td>' + esc(label(k)) + '</td><td>' + c + '/' + t + '</td><td><div class="progress"><i class="' + (pct >= 70 ? 'ok' : pct >= 50 ? 'warn' : 'bad') + '" style="width:' + pct + '%"></i></div></td></tr>';
      }).join('');
      root.innerHTML = head(esc(opt.title) + ': kết quả') + tabs('tests') +
        (auto ? '<p class="card">⏰ Hết giờ, bài đã được nộp tự động.</p>' : '') +
        '<div class="grid tl-score"><div class="stat"><div class="num">' + (lt ? L : '–') + '</div><div class="lbl">Listening (ước lượng) · ' + lc + '/' + lt + ' câu</div></div>' +
        '<div class="stat"><div class="num">' + (rt ? R : '–') + '</div><div class="lbl">Reading (ước lượng) · ' + rc + '/' + rt + ' câu</div></div>' +
        '<div class="stat"><div class="num">' + ((lt ? L : 0) + (rt ? R : 0)) + '</div><div class="lbl">Tổng ước lượng</div></div></div>' +
        '<p class="small muted">Quy đổi tuyến tính theo tỉ lệ đúng, không phải bảng điểm chính thức của ETS.</p>' +
        '<div class="card"><h3>Theo part</h3><table class="tl-table">' + rows(byPart, k => PARTS[k].name) + '</table></div>' +
        '<div class="card"><h3>Theo dạng câu</h3><table class="tl-table">' + rows(byType, k => k) + '</table></div>' +
        '<div class="row"><button class="btn primary" data-act="review">Xem lại từng câu</button><a class="btn" href="#/toeiclr/wrong">🔁 Ôn câu sai</a><a class="btn" href="' + opt.back + '">Xong</a></div>';
    }

    root.onclick = e => {
      const b = e.target.closest('[data-opt],[data-act],[data-go]'); if (!b) return;
      if (b.dataset.opt != null) return choose(b.dataset.uid, Number(b.dataset.n), Number(b.dataset.opt));
      if (b.dataset.go != null) { idx = Number(b.dataset.go); return draw(); }
      const a = b.dataset.act;
      if (a === 'play') play();
      else if (a === 'script') { showScript = !showScript; draw(); }
      else if (a === 'prev' && idx > 0) { idx--; if (synth) synth.cancel(); draw(); }
      else if (a === 'next' && idx < list.length - 1) { idx++; if (synth) synth.cancel(); draw(); }
      else if (a === 'submit') {
        const blank = list.reduce((s, u) => s + u.questions.filter(q => answers[key(u, q)] == null).length, 0);
        if (window.confirm('Nộp bài?' + (blank ? ' Còn ' + blank + ' câu chưa trả lời.' : ''))) result(false);
      } else if (a === 'result') result(false);
      else if (a === 'review') { idx = 0; draw(); }
    };
    cleanups.push(() => { root.onclick = null; });
    cleanups.push(App.onKey(e => {
      const k = e.key.toLowerCase();
      const u = list[idx];
      if (!u || !u.questions) return;
      const i = 'abcd'.indexOf(k);
      if (i >= 0 && i < u.questions[0].options.length) {
        const q = u.questions.find(x => answers[key(u, x)] == null) || u.questions[0];
        choose(u.id, q.n, i); e.preventDefault();
      } else if (k === 'n' && idx < list.length - 1) { idx++; if (synth) synth.cancel(); draw(); }
      else if (k === 'p' && idx > 0) { idx--; if (synth) synth.cancel(); draw(); }
      else if (k === ' ' && !exam) { e.preventDefault(); play(); }
    }));
    if (limit) {
      timer = setInterval(() => {
        if (submitted) return;
        if (Date.now() - started >= limit * 1000) result(true);
        else { const el = root.querySelector('.tl-timer'); if (el) { const left = limit - Math.floor((Date.now() - started) / 1000); el.textContent = '⏱️ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); } }
      }, 1000);
      cleanups.push(() => { if (timer) clearInterval(timer); });
    }
    draw();
  }

  // ---------- tips ----------
  function renderTips(root, skill) {
    const all = (window.TOEIC_TIPS || []).slice().sort((a, b) => a.order - b.order);
    const s = st();
    const list = skill ? all.filter(t => t.skill === skill) : all;
    const filter = '<div class="chips"><a class="chip' + (skill ? '' : ' active') + '" href="#/toeiclr/tips">Tất cả</a>' +
      SKILLS.map(([k, l]) => '<a class="chip' + (skill === k ? ' active' : '') + '" href="#/toeiclr/tips/' + k + '">' + l +
        ' <span class="small">' + all.filter(t => t.skill === k).length + '</span></a>').join('') + '</div>';
    const body = list.map(t => {
      const vids = (t.videos || []).length ? '<div class="tl-videos"><b>🎬 Video hướng dẫn</b><ul>' + t.videos.map(v =>
        '<li><a href="' + esc(v.url) + '" target="_blank" rel="noopener">' + esc(v.title) + '</a>' + (v.note ? ' <span class="small muted">' + esc(v.note) + '</span>' : '') + '</li>').join('') + '</ul></div>' : '';
      const checks = (t.checklist || []).map((c, i) => {
        const k = t.id + ':' + i;
        return '<label class="tl-check"><input type="checkbox" data-tip="' + esc(k) + '"' + (s.tips[k] ? ' checked' : '') + '> ' + esc(c) + '</label>';
      }).join('');
      return '<details class="card tl-tip"><summary><b>' + esc(t.title) + '</b><br><span class="small muted">' + esc(t.summary) + '</span></summary>' +
        '<div class="md">' + App.md(t.body || '') + '</div>' + vids +
        (checks ? '<div class="tl-checklist"><b>✅ Checklist luyện tập</b>' + checks + '</div>' : '') + '</details>';
    }).join('');
    root.innerHTML = head('Mẹo và chiến lược cho cả 4 kỹ năng, kèm checklist luyện tập và video hướng dẫn.') + tabs('tips') + filter +
      (body || '<div class="empty">Tips đang được soạn (task T2856, T2857).</div>');
    root.onchange = e => {
      const c = e.target.closest('[data-tip]'); if (!c) return;
      if (c.checked) s.tips[c.dataset.tip] = true; else delete s.tips[c.dataset.tip];
      App.store.save();
    };
  }
})();
