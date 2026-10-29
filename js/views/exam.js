/*
 * Thi thử có bấm giờ (T321 + exam registry): #/exam = danh sách đề, #/exam/<id> = một đề trong window.EXAMS
 * (js/data/exams.js). #/exam/<topicId> không có trong registry vẫn chạy (đề tạm 1 topic, như bản cũ).
 * - Bốc câu theo trọng số domain: đề 1 topic có `domains` → domain = tag "[Domain]" đầu câu hỏi;
 *   đề nhiều topic → domain = chủ đề. Bấm giờ, không hiện đáp án khi đang thi, lưới điều hướng,
 *   đánh dấu xem lại, câu chọn nhiều đáp án (multi: true).
 * - Chấm: passScore → thang mô phỏng 100–1000 (đề chứng chỉ); passPct → % đúng. Điểm theo domain; xem lại câu sai.
 * - "Ôn lại câu sai" / "Luyện domain yếu": chế độ luyện tập (không giờ, hiện giải thích ngay).
 * - Bài đang làm dở lưu trong sessionStorage ('sjp.exam.<id>') để reload không mất.
 * - Lịch sử: App.store.data.quizHistory, mode 'exam', topic = id đề.
 */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'exam.title': 'Thi thử',
      'exam.pickTitle': '📝 Thi thử có bấm giờ',
      'exam.pickSub': 'Chọn một đề: câu hỏi bốc ngẫu nhiên theo trọng số chủ đề, bấm giờ, chỉ hiện đáp án sau khi nộp bài.',
      'exam.pickKeys': 'Phím {keys} mở đề tương ứng.',
      'exam.pool': '{n} câu trong ngân hàng',
      'exam.shape': '{n} câu · {m} phút · đậu {pass}',
      'exam.last': 'Lần gần nhất: {score}',
      'exam.never': 'Chưa thi lần nào',
      'exam.resumeBadge': 'Đang làm dở',
      'exam.open': 'Vào thi',
      'exam.none': 'Chưa có đề thi nào.',
      'exam.all': '← Tất cả đề thi',
      'exam.headSub': '{n} câu bốc theo trọng số domain · {m} phút · không hiện đáp án khi đang thi · đậu từ {pass}.',
      'exam.short': 'Ngân hàng mới có {have}/{want} câu nên đề ngắn hơn và thời gian giảm theo tỉ lệ.',
      'exam.resume': 'Bạn có bài thi đang làm dở.',
      'exam.continue': 'Tiếp tục', 'exam.discard': 'Bỏ bài dở', 'exam.start': 'Bắt đầu thi',
      'exam.noQuiz': 'Chưa có câu trắc nghiệm cho đề này.',
      'exam.weak': 'Luyện domain yếu: {d}',
      'exam.noteScaled': 'Thang điểm mô phỏng (100 + 900 × tỉ lệ đúng), không phải cách chấm chính thức. Câu chọn nhiều đáp án chỉ đúng khi chọn đủ và đúng hết.',
      'exam.notePct': 'Điểm = % câu đúng. Câu chọn nhiều đáp án chỉ đúng khi chọn đủ và đúng hết.',
      'exam.byDomain': 'Ngân hàng theo domain', 'exam.colDomain': 'Domain', 'exam.colWeight': 'Trọng số đề', 'exam.colCount': 'Số câu',
      'exam.hist': '5 lần thi gần nhất', 'exam.noHist': 'Chưa có lần thi nào.',
      'exam.pass': 'ĐẬU', 'exam.fail': 'TRƯỢT',
      'exam.badgeExam': 'Thi thử', 'exam.badgePractice': 'Luyện tập',
      'exam.progress': 'Câu {i}/{n} · đã làm {done}',
      'exam.timeLeft': 'Thời gian còn lại', 'exam.timeUsed': 'Thời gian đã làm',
      'exam.submit': 'Nộp bài', 'exam.finish': 'Kết thúc',
      'exam.chooseN': 'Chọn {n} đáp án', 'exam.check': 'Kiểm tra',
      'exam.right': '✅ Chính xác', 'exam.wrongAns': '❌ Chưa đúng',
      'exam.prev': '← Trước', 'exam.next': 'Sau →', 'exam.flag': '🚩 Đánh dấu xem lại', 'exam.unflag': '🚩 Bỏ đánh dấu',
      'exam.keys': 'Phím {k} chọn đáp án.',
      'exam.list': 'Danh sách câu', 'exam.legendDone': 'đã làm', 'exam.legendFlag': 'đánh dấu', 'exam.cell': 'Câu {n}',
      'exam.confirm': 'Nộp bài?', 'exam.blank': ' Còn {n} câu chưa trả lời.',
      'exam.resPractice': 'Kết quả luyện tập', 'exam.resExam': 'Kết quả thi thử',
      'exam.auto': 'Hết giờ, bài đã được nộp tự động. ', 'exam.resLine': 'Đúng {c}/{t} câu trong {time}.',
      'exam.mark': 'mốc {pass}', 'exam.scaledNote': 'Thang điểm mô phỏng, không phải cách chấm chính thức.',
      'exam.retryWrong': 'Ôn lại câu sai ({n})', 'exam.home': 'Về trang đề thi',
      'exam.domainScore': 'Điểm theo domain', 'exam.domainHint': 'Dưới 72% (đỏ/vàng) là domain cần ôn thêm.',
      'exam.wrongList': 'Câu sai ({n})', 'exam.perfect': 'Không sai câu nào. 🎉',
      'exam.youChose': 'Bạn chọn:', 'exam.blankAns': 'bỏ trống', 'exam.correctAns': 'Đáp án đúng:',
    },
    en: {
      'exam.title': 'Mock exams',
      'exam.pickTitle': '📝 Timed mock exams',
      'exam.pickSub': 'Pick an exam: questions are drawn at random by topic weight, timed, answers shown only after you submit.',
      'exam.pickKeys': 'Press {keys} to open the matching exam.',
      'exam.pool': '{n} questions in the bank',
      'exam.shape': '{n} questions · {m} min · pass {pass}',
      'exam.last': 'Last: {score}',
      'exam.never': 'Not taken yet',
      'exam.resumeBadge': 'In progress',
      'exam.open': 'Start',
      'exam.none': 'No exams yet.',
      'exam.all': '← All exams',
      'exam.headSub': '{n} questions weighted by domain · {m} min · no answers shown during the exam · pass from {pass}.',
      'exam.short': 'The bank only has {have}/{want} questions, so the exam is shorter and the time is scaled down.',
      'exam.resume': 'You have an unfinished exam.',
      'exam.continue': 'Resume', 'exam.discard': 'Discard', 'exam.start': 'Start exam',
      'exam.noQuiz': 'No quiz questions for this exam yet.',
      'exam.weak': 'Practise weak domain: {d}',
      'exam.noteScaled': 'Simulated scale (100 + 900 × ratio correct), not the official scoring. Multi-answer questions count only when every choice is right.',
      'exam.notePct': 'Score = % correct. Multi-answer questions count only when every choice is right.',
      'exam.byDomain': 'Bank by domain', 'exam.colDomain': 'Domain', 'exam.colWeight': 'Exam weight', 'exam.colCount': 'Questions',
      'exam.hist': 'Last 5 attempts', 'exam.noHist': 'No attempts yet.',
      'exam.pass': 'PASS', 'exam.fail': 'FAIL',
      'exam.badgeExam': 'Exam', 'exam.badgePractice': 'Practice',
      'exam.progress': 'Question {i}/{n} · answered {done}',
      'exam.timeLeft': 'Time left', 'exam.timeUsed': 'Time used',
      'exam.submit': 'Submit', 'exam.finish': 'Finish',
      'exam.chooseN': 'Choose {n}', 'exam.check': 'Check',
      'exam.right': '✅ Correct', 'exam.wrongAns': '❌ Not quite',
      'exam.prev': '← Prev', 'exam.next': 'Next →', 'exam.flag': '🚩 Flag for review', 'exam.unflag': '🚩 Unflag',
      'exam.keys': 'Keys {k} pick an answer.',
      'exam.list': 'Questions', 'exam.legendDone': 'answered', 'exam.legendFlag': 'flagged', 'exam.cell': 'Question {n}',
      'exam.confirm': 'Submit the exam?', 'exam.blank': ' {n} questions unanswered.',
      'exam.resPractice': 'Practice result', 'exam.resExam': 'Exam result',
      'exam.auto': 'Time is up, the exam was submitted automatically. ', 'exam.resLine': '{c}/{t} correct in {time}.',
      'exam.mark': 'pass mark {pass}', 'exam.scaledNote': 'Simulated scale, not the official scoring.',
      'exam.retryWrong': 'Review wrong answers ({n})', 'exam.home': 'Back to exam page',
      'exam.domainScore': 'Score by domain', 'exam.domainHint': 'Below 72% (red/yellow) needs more study.',
      'exam.wrongList': 'Wrong answers ({n})', 'exam.perfect': 'No mistakes. 🎉',
      'exam.youChose': 'You chose:', 'exam.blankAns': 'blank', 'exam.correctAns': 'Correct answer:',
    },
  });
  const t = (k, v) => App.t(k, v);

  const OTHER = 'Khác';

  const E = {
    phase: 'setup',        // pick | setup | exam | result
    exam: null,            // đề hiện tại (object trong window.EXAMS hoặc đề tạm)
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

  const keyOf = id => 'sjp.exam.' + id;
  const mdInline = src => App.md(src).replace(/^<p>/, '').replace(/<\/p>$/, '');

  // ---------- registry ----------
  function exams() { return Array.isArray(window.EXAMS) ? window.EXAMS : []; }
  /** Đề theo id; id là topic có câu trắc nghiệm mà chưa đăng ký → đề tạm (giữ hành vi cũ của #/exam/<topic>). */
  function examById(id) {
    const ex = exams().find(x => x.id === id);
    if (ex) return ex;
    if (!App.quiz().some(q => q.topic === id)) return null;
    const tp = App.topic(id) || { name: id, icon: '' };
    return { id: id, title: tp.name, icon: tp.icon || '', topics: { [id]: 1 }, count: 53, minutes: 120, passScore: 720 };
  }
  const topicIds = ex => Object.keys(ex.topics || {});
  const topicName = id => (App.topic(id) || { name: id }).name;
  const byTag = ex => !!ex.domains;

  function domainOf(q, ex) {
    ex = ex || E.exam;
    if (!byTag(ex) && topicIds(ex).length > 1) return topicName(q.topic);
    const m = /^\s*\[([^\]]+)\]/.exec(q.q || '');
    return m ? m[1].trim() : OTHER;
  }
  /** Trọng số theo nhãn domain (tag hoặc tên chủ đề). */
  function weightsOf(ex) {
    if (byTag(ex)) return ex.domains;
    const w = {};
    if (topicIds(ex).length > 1) topicIds(ex).forEach(id => { w[topicName(id)] = ex.topics[id]; });
    return w;
  }
  function stripTag(text) { return String(text || '').replace(/^\s*\[[^\]]+\]\s*/, ''); }
  function answerOf(q) { return Array.isArray(q.answer) ? q.answer.slice() : [q.answer]; }
  function pool(ex) { const ids = topicIds(ex || E.exam); return App.quiz().filter(q => ids.indexOf(q.topic) >= 0); }
  const examSize = ex => Math.min(ex.count, pool(ex).length);
  const examMinutes = (ex, n) => Math.max(10, Math.round(ex.minutes * n / ex.count));
  const passLabel = ex => (ex.passScore ? ex.passScore + '/1000' : ex.passPct + '%');

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
  function pickExam(all, n, ex) {
    const w = weightsOf(ex);
    const byDom = {};
    all.forEach(q => { const d = domainOf(q, ex); (byDom[d] = byDom[d] || []).push(q); });
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
  const scaled = (c, n) => (n ? Math.round(100 + 900 * c / n) : 100);
  const pctOf = (c, n) => (n ? Math.round(c / n * 100) : 0);
  const fmt = sec => { sec = Math.max(0, sec); const m = Math.floor(sec / 60), s = sec % 60; return m + ':' + String(s).padStart(2, '0'); };
  const left = () => (E.endAt ? Math.round((E.endAt - Date.now()) / 1000) : 0);
  /** Điểm hiển thị của một lần thi trong lịch sử. */
  const scoreText = (h, ex) => (ex && ex.passScore ? String(h.score) : (h.pct != null ? h.pct : pctOf(h.correct, h.total)) + '%');

  // ---------- lưu / khôi phục bài dở ----------
  function save() {
    if (E.phase !== 'exam' || !E.exam) return;
    try {
      sessionStorage.setItem(keyOf(E.exam.id), JSON.stringify({
        practice: E.practice, idx: E.idx, startedAt: E.startedAt, endAt: E.endAt,
        items: E.list.map(it => ({ id: it.q.id, order: it.order })), sel: E.sel, flag: E.flag, checked: E.checked,
      }));
    } catch (e) { /* storage bị chặn: bỏ qua */ }
  }
  function loadSaved(id) {
    try { const raw = sessionStorage.getItem(keyOf(id)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function clearSaved(id) { try { sessionStorage.removeItem(keyOf(id)); } catch (e) { /* ignore */ } }
  function restore(s) {
    const byId = {};
    App.quiz().forEach(q => { byId[q.id] = q; });
    const list = (s.items || []).filter(x => byId[x.id]).map(x => prepare(byId[x.id], x.order));
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
    E.endAt = practice ? 0 : Date.now() + examMinutes(E.exam, list.length) * 60000;
    save();
    startTimer();
    render();
  }
  function startExam() { begin(pickExam(pool(), E.exam.count, E.exam).map(q => prepare(q)), false); }
  function startPractice(qs) { if (qs.length) begin(App.shuffle(qs).map(q => prepare(q)), true); }

  function submit(auto) {
    if (E.phase !== 'exam') return;
    if (!auto && !E.practice) {
      const blank = E.sel.filter(s => !s || !s.length).length;
      if (!confirm(t('exam.confirm') + (blank ? t('exam.blank', { n: blank }) : ''))) return;
    }
    stopTimer();
    const ex = E.exam;
    const byDomain = {}, topics = {};
    let correct = 0;
    const wrongIds = [];
    E.list.forEach((it, i) => {
      const d = byDomain[it.domain] = byDomain[it.domain] || { total: 0, correct: 0 };
      d.total += 1;
      topics[it.q.topic] = (topics[it.q.topic] || 0) + 1;
      if (isCorrect(it, E.sel[i])) { d.correct += 1; correct += 1; } else wrongIds.push(it.q.id);
    });
    const total = E.list.length;
    const seconds = Math.round((Date.now() - E.startedAt) / 1000);
    const pct = pctOf(correct, total);
    const score = ex.passScore ? scaled(correct, total) : pct;
    const passed = ex.passScore ? score >= ex.passScore : pct >= ex.passPct;
    E.result = { total, correct, score, pct, passed, byDomain, wrongIds, seconds, auto: !!auto };
    if (!E.practice) {
      const rec = { mode: 'exam', topic: ex.id, total, correct, score, passed, byDomain, wrongIds, seconds, topics };
      if (!ex.passScore) rec.pct = pct;
      App.store.addQuizResult(rec);
      App.store.save();
    }
    clearSaved(ex.id);
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
  function historyFor(id) {
    return (App.store.data.quizHistory || []).filter(h => h.mode === 'exam' && h.topic === id);
  }
  function historyRows() { return historyFor(E.exam.id).slice(0, 5); }
  function weakestDomain(h) {
    if (!h || !h.byDomain) return null;
    let best = null;
    Object.keys(h.byDomain).forEach(d => {
      const v = h.byDomain[d], p = v.total ? v.correct / v.total : 1;
      if (!best || p < best.p) best = { d: d, p: p };
    });
    return best;
  }

  function pickHtml() {
    const list = exams();
    const cards = list.map((ex, i) => {
      const n = pool(ex).length, size = Math.min(ex.count, n);
      const last = historyFor(ex.id)[0];
      const saved = loadSaved(ex.id);
      const tps = topicIds(ex).map(id => '<span class="chip">' + App.esc(topicName(id)) + '</span>').join('');
      return '<li class="card exam-pick-card"' + (ex.lang === 'en' ? ' lang="en"' : '') + '>' +
        '<div class="exam-pick-top"><h3>' + App.esc((ex.icon ? ex.icon + ' ' : '') + ex.title) + '</h3>' +
          (saved ? '<span class="badge warn">' + t('exam.resumeBadge') + '</span>' : '') + '</div>' +
        (ex.desc ? '<p class="small muted">' + App.esc(ex.desc) + '</p>' : '') +
        (byTag(ex) ? '' : '<div class="chips exam-pick-topics">' + tps + '</div>') +
        '<p class="small">' + t('exam.shape', { n: size, m: examMinutes(ex, size), pass: passLabel(ex) }) + '<br>' +
          '<span class="muted">' + t('exam.pool', { n: n }) + '</span></p>' +
        '<div class="exam-pick-foot">' +
          (last ? '<span class="badge ' + (last.passed ? 'ok' : 'bad') + '">' + App.esc(t('exam.last', { score: scoreText(last, ex) })) + ' · ' +
            (last.passed ? t('exam.pass') : t('exam.fail')) + '</span>' : '<span class="small muted">' + t('exam.never') + '</span>') +
          '<a class="btn primary" href="#/exam/' + encodeURIComponent(ex.id) + '"' + (n ? '' : ' aria-disabled="true"') + '>' +
            t('exam.open') + (i < 9 ? ' <kbd>' + (i + 1) + '</kbd>' : '') + '</a>' +
        '</div></li>';
    }).join('');
    const keys = list.length ? '<kbd>1</kbd>' + (list.length > 1 ? '–<kbd>' + Math.min(9, list.length) + '</kbd>' : '') : '';
    return '<div class="page-head"><div><h1>' + t('exam.pickTitle') + '</h1><p>' + t('exam.pickSub') + '</p>' +
      (keys ? '<p class="small muted">' + t('exam.pickKeys', { keys: keys }) + '</p>' : '') + '</div></div>' +
      (cards ? '<ul class="exam-pick">' + cards + '</ul>' : '<p class="empty">' + t('exam.none') + '</p>');
  }

  function setupHtml() {
    const ex = E.exam;
    const qs = pool();
    const counts = {};
    qs.forEach(q => { const d = domainOf(q); counts[d] = (counts[d] || 0) + 1; });
    const w = weightsOf(ex);
    const sumW = Object.keys(w).reduce((s, d) => s + w[d], 0);
    const doms = Object.keys(Object.assign({}, w, counts)).sort((a, b) => (w[b] || 0) - (w[a] || 0));
    const domRows = doms.map(d =>
      '<tr><td>' + App.esc(d) + '</td><td>' + (w[d] ? Math.round(w[d] / sumW * 100) + '%' : '—') + '</td><td>' + (counts[d] || 0) + '</td></tr>').join('');
    const hist = historyRows();
    const histHtml = hist.map(h => '<li><span class="badge ' + (h.passed ? 'ok' : 'bad') + '">' + App.esc(scoreText(h, ex)) + ' · ' + (h.passed ? t('exam.pass') : t('exam.fail')) +
      '</span> <span class="small muted">' + h.correct + '/' + h.total + ' · ' + App.esc(App.fmtDate(h.at)) + ' · ' + fmt(h.seconds) + '</span></li>').join('');
    const weak = weakestDomain(hist[0]);
    const saved = loadSaved(ex.id);
    const n = examSize(ex);
    const minutes = examMinutes(ex, n);
    return '<p class="exam-back"><a href="#/exam">' + t('exam.all') + '</a></p>' +
      '<div class="page-head"><div><h1>📝 ' + App.esc((ex.icon ? ex.icon + ' ' : '') + ex.title) + '</h1>' +
      '<p>' + t('exam.headSub', { n: n, m: minutes, pass: passLabel(ex) }) + '</p>' +
      (qs.length && n < ex.count ? '<p class="small muted">' + t('exam.short', { have: n, want: ex.count }) + '</p>' : '') + '</div></div>' +
      (saved ? '<section class="card exam-resume"><strong>' + t('exam.resume') + '</strong> ' +
        '<button type="button" class="btn primary" data-act="resume">' + t('exam.continue') + '</button> <button type="button" class="btn ghost" data-act="discard">' + t('exam.discard') + '</button></section>' : '') +
      '<section class="card">' +
        (qs.length ? '<button type="button" class="btn primary lg" data-act="start">' + t('exam.start') + '</button>' : '<p class="muted">' + t('exam.noQuiz') + '</p>') +
        (weak && weak.p < 0.72 ? ' <button type="button" class="btn" data-act="weak">' + App.esc(t('exam.weak', { d: weak.d })) + ' (' + Math.round(weak.p * 100) + '%)</button>' : '') +
        '<p class="small muted exam-note">' + (ex.passScore ? t('exam.noteScaled') : t('exam.notePct')) + '</p>' +
      '</section>' +
      (domRows ? '<section class="card"><h3>' + t('exam.byDomain') + '</h3><table class="exam-table"><thead><tr><th>' + t('exam.colDomain') + '</th><th>' + t('exam.colWeight') +
        '</th><th>' + t('exam.colCount') + '</th></tr></thead><tbody>' + domRows + '</tbody></table></section>' : '') +
      '<section class="card"><h3>' + t('exam.hist') + '</h3>' + (histHtml ? '<ul class="exam-hist">' + histHtml + '</ul>' : '<p class="muted small">' + t('exam.noHist') + '</p>') + '</section>';
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
      return '<button type="button" class="exam-cell' + c + '" data-go="' + i + '" aria-label="' + t('exam.cell', { n: i + 1 }) + '">' + (i + 1) + '</button>';
    }).join('');
    const timeText = E.endAt ? fmt(left()) : fmt(Math.round((Date.now() - E.startedAt) / 1000));
    return '<div class="card exam-head">' +
        '<span class="badge">' + (E.practice ? t('exam.badgePractice') : t('exam.badgeExam')) + '</span>' +
        '<span class="exam-progress">' + t('exam.progress', { i: E.idx + 1, n: E.list.length, done: answered }) + '</span>' +
        '<span class="exam-timer" id="examTimer" title="' + (E.endAt ? t('exam.timeLeft') : t('exam.timeUsed')) + '">' + timeText + '</span>' +
        '<button type="button" class="btn sm primary" data-act="submit">' + (E.practice ? t('exam.finish') : t('exam.submit')) + '</button>' +
      '</div>' +
      '<div class="exam-body">' +
        '<section class="card exam-q"' + (E.exam.lang === 'en' ? ' lang="en"' : '') + '>' +
          '<div class="exam-meta"><span class="chip">' + App.esc(it.domain) + '</span>' +
            (it.multi ? '<span class="badge warn">' + t('exam.chooseN', { n: it.answer.length }) + '</span>' : '') + '</div>' +
          '<div class="md exam-q-text">' + App.md(stripTag(it.q.q)) + '</div>' +
          '<ul class="exam-opts">' + opts + '</ul>' +
          (E.practice && it.multi && !revealed ? '<button type="button" class="btn" data-act="check"' + (sel.length === it.answer.length ? '' : ' disabled') + '>' + t('exam.check') + '</button>' : '') +
          (revealed ? '<div class="exam-explain"><h4>' + (isCorrect(it, sel) ? t('exam.right') : t('exam.wrongAns')) + '</h4><div class="md">' + App.md(it.q.explain) + '</div></div>' : '') +
          '<div class="row exam-nav">' +
            '<button type="button" class="btn" data-act="prev"' + (E.idx ? '' : ' disabled') + '>' + t('exam.prev') + ' <kbd>P</kbd></button>' +
            '<button type="button" class="btn' + (E.flag[E.idx] ? ' warn' : '') + '" data-act="flag">' + (E.flag[E.idx] ? t('exam.unflag') : t('exam.flag')) + ' <kbd>F</kbd></button>' +
            '<button type="button" class="btn primary" data-act="next"' + (E.idx + 1 < E.list.length ? '' : ' disabled') + '>' + t('exam.next') + ' <kbd>N</kbd></button>' +
          '</div>' +
          '<p class="small muted">' + t('exam.keys', { k: '<kbd>1</kbd>–<kbd>' + it.options.length + '</kbd>' }) + '</p>' +
        '</section>' +
        '<aside class="card exam-grid-card"><h4>' + t('exam.list') + '</h4><div class="exam-grid">' + grid + '</div>' +
          '<p class="small muted"><span class="exam-dot done"></span> ' + t('exam.legendDone') + ' · <span class="exam-dot flagged"></span> ' + t('exam.legendFlag') + '</p></aside>' +
      '</div>';
  }

  function resultHtml() {
    const r = E.result, ex = E.exam;
    const w = weightsOf(ex);
    const doms = Object.keys(r.byDomain).sort((a, b) => (w[b] || 0) - (w[a] || 0));
    const rows = doms.map(d => {
      const v = r.byDomain[d], p = v.total ? Math.round(v.correct / v.total * 100) : 0;
      return '<div class="exam-bar"><span class="exam-bar-label">' + App.esc(d) + '</span>' +
        '<span class="progress"><i class="' + (p >= 72 ? 'ok' : p >= 50 ? 'warn' : 'bad') + '" style="width:' + p + '%"></i></span>' +
        '<span class="exam-bar-val">' + v.correct + '/' + v.total + ' (' + p + '%)</span></div>';
    }).join('');
    const wrong = E.list.map((it, i) => ({ it: it, sel: E.sel[i] || [] })).filter(x => !isCorrect(x.it, x.sel));
    const wrongHtml = wrong.map((x, n) =>
      '<details class="card exam-wrong"' + (ex.lang === 'en' ? ' lang="en"' : '') + '><summary>' + (n + 1) + '. <span class="chip">' + App.esc(x.it.domain) + '</span> ' + App.esc(stripTag(x.it.q.q)) + '</summary>' +
        '<p class="small"><strong>' + t('exam.youChose') + '</strong> ' + (x.sel.length ? x.sel.map(i => App.esc(x.it.options[i])).join(' · ') : '<em>' + t('exam.blankAns') + '</em>') + '</p>' +
        '<p class="small"><strong>' + t('exam.correctAns') + '</strong> ' + x.it.answer.map(i => App.esc(x.it.options[i])).join(' · ') + '</p>' +
        '<div class="md">' + App.md(x.it.q.explain) + '</div></details>').join('');
    let weakest = null;
    doms.forEach(d => { const v = r.byDomain[d], p = v.correct / v.total; if (!weakest || p < weakest.p) weakest = { d: d, p: p }; });
    const big = ex.passScore ? r.score + '<small>/1000</small>' : r.pct + '<small>%</small>';
    return '<div class="page-head"><div><h1>' + (E.practice ? t('exam.resPractice') : t('exam.resExam')) + ': ' + App.esc(ex.title) + '</h1>' +
      '<p>' + (r.auto ? t('exam.auto') : '') + t('exam.resLine', { c: r.correct, t: r.total, time: fmt(r.seconds) }) + '</p></div></div>' +
      '<section class="card exam-score">' +
        (E.practice ? '<div class="exam-score-num">' + r.pct + '%</div>' :
          '<div class="exam-score-num ' + (r.passed ? 'ok' : 'bad') + '">' + big + '</div>' +
          '<div class="badge ' + (r.passed ? 'ok' : 'bad') + ' exam-verdict">' + (r.passed ? t('exam.pass') : t('exam.fail')) + ' (' + t('exam.mark', { pass: ex.passScore || ex.passPct + '%' }) + ')</div>' +
          (ex.passScore ? '<p class="small muted">' + t('exam.scaledNote') + '</p>' : '')) +
        '<div class="row exam-actions">' +
          '<button type="button" class="btn primary" data-act="retryWrong"' + (wrong.length ? '' : ' disabled') + '>' + t('exam.retryWrong', { n: wrong.length }) + '</button>' +
          (weakest && weakest.p < 0.72 ? '<button type="button" class="btn" data-act="weakNow" data-domain="' + App.esc(weakest.d) + '">' + App.esc(t('exam.weak', { d: weakest.d })) + '</button>' : '') +
          '<button type="button" class="btn ghost" data-act="home">' + t('exam.home') + '</button>' +
        '</div>' +
      '</section>' +
      '<section class="card"><h3>' + t('exam.domainScore') + '</h3>' + rows + '<p class="small muted">' + t('exam.domainHint') + '</p></section>' +
      (wrongHtml ? '<section><h3>' + t('exam.wrongList', { n: wrong.length }) + '</h3>' + wrongHtml + '</section>' : '<section class="card"><p>' + t('exam.perfect') + '</p></section>');
  }

  function render() {
    if (!rootEl) return;
    rootEl.innerHTML = E.phase === 'pick' ? pickHtml() : E.phase === 'exam' ? examHtml() : E.phase === 'result' ? resultHtml() : setupHtml();
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
    else if (act === 'resume') { const s = loadSaved(E.exam.id); if (s && restore(s)) { startTimer(); render(); } }
    else if (act === 'discard') { clearSaved(E.exam.id); render(); }
    else if (act === 'weak') { const w = weakestDomain(historyRows()[0]); if (w) startPractice(pool().filter(q => domainOf(q) === w.d)); }
    else if (act === 'weakNow') startPractice(pool().filter(q => domainOf(q) === b.dataset.domain));
    else if (act === 'retryWrong') { const ids = E.result ? E.result.wrongIds : []; startPractice(App.quiz().filter(q => ids.indexOf(q.id) >= 0)); }
    else if (act === 'home') { E.phase = 'setup'; render(); }
    else if (act === 'submit') submit(false);
    else if (act === 'prev') go(E.idx - 1);
    else if (act === 'next') go(E.idx + 1);
    else if (act === 'flag') toggleFlag();
    else if (act === 'check') check();
  }
  function onKey(e) {
    if (E.phase === 'pick') {
      const i = Number(e.key) - 1, ex = exams()[i];
      if (e.key >= '1' && e.key <= '9' && ex) { e.preventDefault(); App.navigate('#/exam/' + ex.id); }
      return;
    }
    if (E.phase !== 'exam') return;
    if (e.key >= '1' && e.key <= '6') { e.preventDefault(); choose(Number(e.key) - 1); }
    else if (e.key === 'n' || e.key === 'N' || e.key === 'ArrowRight') { e.preventDefault(); go(E.idx + 1); }
    else if (e.key === 'p' || e.key === 'P' || e.key === 'ArrowLeft') { e.preventDefault(); go(E.idx - 1); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFlag(); }
  }

  App.registerView('exam', {
    get title() { return App.t('exam.title'); },
    render(root, params) {
      rootEl = root;
      stopTimer();
      const id = params && params[0];
      E.exam = id ? examById(id) : null;
      E.phase = E.exam ? 'setup' : 'pick';
      E.result = null;
      render();
      root.addEventListener('click', onClick);
      const off = App.onKey(onKey);
      return () => { stopTimer(); save(); off(); root.removeEventListener('click', onClick); };
    },
  });
})();
