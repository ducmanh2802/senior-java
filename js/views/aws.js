/*
 * AWS Pro track (#/aws): SAP-C02 (~tuần 16) rồi DOP-C02 (~tuần 26) trong 26 tuần. Spec: docs/AWS-TRACK.md.
 * Data: window.AWS_PLAN (js/data/aws-plan.js), window.AWS_QUESTIONS (js/data/aws-sap-*.js, aws-dop-*.js) — group 'aws'.
 * Tabs: #/aws (tổng quan) · #/aws/plan (26 tuần) · #/aws/practice (luyện, có giải thích ngay) · #/aws/mock (thi thử).
 * Lưu: App.store.data.aws = { start: 'YYYY-MM-DD', done: { '<n>': true }, answers: { qid: { ok, at } }, mocks: [...] }.
 * Đề (stem/options) tiếng Anh → lang="en"; giải thích tiếng Việt render bằng App.md. Không xáo options (giải thích có thể nhắc A/B/C).
 */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'aws.title': 'AWS Pro (SAP + DOP)',
      'aws.heading': '☁️ AWS Pro: SAP-C02 rồi DOP-C02 trong 26 tuần',
      'aws.sub': 'Lộ trình từ nền tảng tới Professional: mỗi tuần có mục tiêu, tài liệu chính thức, lab thực hành và câu luyện kiểu đề thật.',
      'aws.tab.overview': 'Tổng quan', 'aws.tab.plan': 'Kế hoạch 26 tuần', 'aws.tab.practice': 'Luyện tập', 'aws.tab.mock': 'Thi thử',
      'aws.loading': 'Đang cập nhật', 'aws.noData': 'Dữ liệu lộ trình AWS đang được cập nhật.',
      'aws.start': 'Ngày bắt đầu', 'aws.today': 'Bắt đầu từ hôm nay', 'aws.pickStart': 'Chọn ngày bắt đầu để tính tuần hiện tại và ngày thi dự kiến.',
      'aws.week': 'Tuần {n}', 'aws.weekNow': 'Tuần hiện tại', 'aws.notStarted': 'Chưa bắt đầu', 'aws.finished': 'Đã qua 26 tuần',
      'aws.weeksDone': 'Tuần đã xong', 'aws.examDate': 'Ngày thi {code}', 'aws.examWeek': 'cuối tuần {n}',
      'aws.answered': 'Câu đã làm', 'aws.ofPool': '/ {n} câu trong ngân hàng',
      'aws.thisWeek': 'Tuần này', 'aws.nextUndone': 'Tuần tiếp theo chưa xong', 'aws.openWeek': 'Xem chi tiết tuần',
      'aws.accuracy': 'Độ chính xác theo domain', 'aws.accHint': 'Vạch đứng là mốc 75%: dưới mốc thì luyện thêm "câu sai/chưa làm" của domain đó.',
      'aws.accNone': 'chưa làm', 'aws.weight': 'trọng số {w}%',
      'aws.mocksRecent': 'Thi thử gần đây', 'aws.noMocks': 'Chưa có lần thi thử nào.',
      'aws.goals': 'Mục tiêu', 'aws.study': 'Tài liệu chính thức', 'aws.lab': 'Lab thực hành',
      'aws.practiceWeek': 'Luyện {n} câu của tuần', 'aws.markDone': 'Đánh dấu hoàn thành', 'aws.markUndone': 'Bỏ đánh dấu hoàn thành',
      'aws.doneBadge': 'Đã xong', 'aws.nowBadge': 'Tuần này',
      'aws.exam': 'Kỳ thi', 'aws.domain': 'Domain', 'aws.allDomains': 'Tất cả domain', 'aws.mode': 'Chọn câu',
      'aws.mode.all': 'Tất cả', 'aws.mode.todo': 'Câu sai / chưa làm', 'aws.mode.wrong': 'Chỉ câu sai',
      'aws.weekFilter': 'Theo tuần {n} ({k} câu)', 'aws.clearWeek': 'Bỏ lọc tuần',
      'aws.queue': 'Câu {i}/{n} · đúng {c}/{t} trong phiên',
      'aws.emptyPool': 'Câu hỏi cho phần này đang cập nhật.', 'aws.emptyFilter': 'Không còn câu nào theo bộ lọc. Đổi chế độ "Chọn câu" hoặc domain khác.',
      'aws.chooseN': 'Chọn {n} đáp án', 'aws.check': 'Kiểm tra', 'aws.next': 'Câu tiếp', 'aws.prev': 'Câu trước',
      'aws.right': '✅ Chính xác', 'aws.wrong': '❌ Chưa đúng', 'aws.correctIs': 'Đáp án đúng: {a}',
      'aws.services': 'Dịch vụ', 'aws.refs': 'Đọc thêm', 'aws.keys': 'Phím: {k} chọn · {enter} kiểm tra / câu tiếp · {n} câu tiếp',
      'aws.mockSub': '{n} câu bốc theo trọng số domain · {m} phút · không hiện giải thích tới khi nộp · đậu từ {pass}/1000.',
      'aws.mockShort': 'Ngân hàng mới có {have}/{want} câu nên đề ngắn hơn và thời gian giảm theo tỉ lệ.',
      'aws.mockStart': 'Bắt đầu thi', 'aws.mockResume': 'Bạn đang có bài thi dở', 'aws.continue': 'Tiếp tục', 'aws.discard': 'Bỏ bài dở',
      'aws.progress': 'Câu {i}/{n} · đã làm {d}', 'aws.timeLeft': 'Thời gian còn lại', 'aws.submit': 'Nộp bài',
      'aws.flag': '🚩 Đánh dấu', 'aws.unflag': '🚩 Bỏ đánh dấu', 'aws.grid': 'Danh sách câu', 'aws.cell': 'Câu {n}',
      'aws.confirm': 'Nộp bài?', 'aws.blank': ' Còn {n} câu chưa trả lời.',
      'aws.result': 'Kết quả thi thử {code}', 'aws.auto': 'Hết giờ, bài đã được nộp tự động. ', 'aws.resLine': 'Đúng {c}/{t} câu trong {time}.',
      'aws.pass': 'ĐẬU', 'aws.fail': 'TRƯỢT', 'aws.mark': 'mốc {pass}',
      'aws.scaledNote': 'Thang điểm mô phỏng (100 + 900 × tỉ lệ đúng), không phải cách chấm chính thức của AWS. Câu nhiều đáp án chỉ đúng khi chọn đủ và đúng hết.',
      'aws.byDomain': 'Điểm theo domain', 'aws.review': 'Xem lại từng câu', 'aws.onlyWrong': 'Chỉ câu sai',
      'aws.youChose': 'Bạn chọn:', 'aws.blankAns': 'bỏ trống', 'aws.again': 'Thi lại', 'aws.practiceWrong': 'Luyện các câu sai',
      'aws.histRow': '{score}/1000 · {c}/{t} · {date}', 'aws.reviewOld': 'Xem lại',
    },
    en: {
      'aws.title': 'AWS Pro (SAP + DOP)',
      'aws.heading': '☁️ AWS Pro: SAP-C02 then DOP-C02 in 26 weeks',
      'aws.sub': 'From foundations to Professional: each week has goals, official docs, a hands-on lab and exam-style practice.',
      'aws.tab.overview': 'Overview', 'aws.tab.plan': '26-week plan', 'aws.tab.practice': 'Practice', 'aws.tab.mock': 'Mock exam',
      'aws.loading': 'Coming soon', 'aws.noData': 'AWS plan data is being added.',
      'aws.start': 'Start date', 'aws.today': 'Start today', 'aws.pickStart': 'Pick a start date to get the current week and target exam dates.',
      'aws.week': 'Week {n}', 'aws.weekNow': 'Current week', 'aws.notStarted': 'Not started', 'aws.finished': 'Past week 26',
      'aws.weeksDone': 'Weeks done', 'aws.examDate': '{code} exam', 'aws.examWeek': 'end of week {n}',
      'aws.answered': 'Answered', 'aws.ofPool': '/ {n} in the bank',
      'aws.thisWeek': 'This week', 'aws.nextUndone': 'Next unfinished week', 'aws.openWeek': 'Open week',
      'aws.accuracy': 'Accuracy by domain', 'aws.accHint': 'The vertical line is 75%: below it, practise that domain\'s wrong/unanswered questions.',
      'aws.accNone': 'not started', 'aws.weight': 'weight {w}%',
      'aws.mocksRecent': 'Recent mock exams', 'aws.noMocks': 'No mock exams yet.',
      'aws.goals': 'Goals', 'aws.study': 'Official reading', 'aws.lab': 'Hands-on lab',
      'aws.practiceWeek': 'Practise {n} questions for this week', 'aws.markDone': 'Mark as done', 'aws.markUndone': 'Mark as not done',
      'aws.doneBadge': 'Done', 'aws.nowBadge': 'This week',
      'aws.exam': 'Exam', 'aws.domain': 'Domain', 'aws.allDomains': 'All domains', 'aws.mode': 'Questions',
      'aws.mode.all': 'All', 'aws.mode.todo': 'Wrong / unanswered', 'aws.mode.wrong': 'Wrong only',
      'aws.weekFilter': 'Week {n} ({k} questions)', 'aws.clearWeek': 'Clear week filter',
      'aws.queue': 'Question {i}/{n} · {c}/{t} correct this session',
      'aws.emptyPool': 'Questions for this part are coming soon.', 'aws.emptyFilter': 'No questions left for this filter. Change the question mode or domain.',
      'aws.chooseN': 'Choose {n}', 'aws.check': 'Check', 'aws.next': 'Next', 'aws.prev': 'Previous',
      'aws.right': '✅ Correct', 'aws.wrong': '❌ Not quite', 'aws.correctIs': 'Correct answer: {a}',
      'aws.services': 'Services', 'aws.refs': 'Further reading', 'aws.keys': 'Keys: {k} select · {enter} check / next · {n} next',
      'aws.mockSub': '{n} questions weighted by domain · {m} min · explanations only after you submit · pass from {pass}/1000.',
      'aws.mockShort': 'The bank only has {have}/{want} questions, so the exam is shorter and the time is scaled down.',
      'aws.mockStart': 'Start exam', 'aws.mockResume': 'You have an unfinished exam', 'aws.continue': 'Resume', 'aws.discard': 'Discard',
      'aws.progress': 'Question {i}/{n} · answered {d}', 'aws.timeLeft': 'Time left', 'aws.submit': 'Submit',
      'aws.flag': '🚩 Flag', 'aws.unflag': '🚩 Unflag', 'aws.grid': 'Questions', 'aws.cell': 'Question {n}',
      'aws.confirm': 'Submit the exam?', 'aws.blank': ' {n} questions unanswered.',
      'aws.result': '{code} mock result', 'aws.auto': 'Time is up, the exam was submitted automatically. ', 'aws.resLine': '{c}/{t} correct in {time}.',
      'aws.pass': 'PASS', 'aws.fail': 'FAIL', 'aws.mark': 'pass mark {pass}',
      'aws.scaledNote': 'Simulated scale (100 + 900 × ratio correct), not AWS\'s official scoring. Multi-answer questions count only when every choice is right.',
      'aws.byDomain': 'Score by domain', 'aws.review': 'Review every question', 'aws.onlyWrong': 'Wrong only',
      'aws.youChose': 'You chose:', 'aws.blankAns': 'blank', 'aws.again': 'Take again', 'aws.practiceWrong': 'Practise wrong answers',
      'aws.histRow': '{score}/1000 · {c}/{t} · {date}', 'aws.reviewOld': 'Review',
    },
  });

  const t = (k, v) => App.t('aws.' + k, v);
  const esc = App.esc;
  const TABS = ['overview', 'plan', 'practice', 'mock'];
  const LETTERS = 'ABCDEF';
  const PASS_PCT = 75;
  const MOCK_KEY = 'sjp.aws.mock';
  const MOCKS_MAX = 20;

  // ---------- data ----------
  const plan = () => (window.AWS_PLAN && Array.isArray(window.AWS_PLAN.exams) ? window.AWS_PLAN : { exams: [], weeks: [] });
  const weeks = () => plan().weeks || [];
  const allQs = () => (Array.isArray(window.AWS_QUESTIONS) ? window.AWS_QUESTIONS.filter(q => q && q.id && Array.isArray(q.options)) : []);
  const examOf = id => plan().exams.find(e => e.id === id) || null;
  function domainName(id) {
    for (const ex of plan().exams) for (const d of ex.domains || []) if (d.id === id) return d.name;
    return id;
  }
  const domainLabel = id => (id || '').replace(/^\w+-d/, 'D') + ' · ' + domainName(id);
  const pool = (examId, domains) => allQs().filter(q => q.exam === examId && (!domains || !domains.length || domains.indexOf(q.domain) >= 0));
  const answerOf = q => (Array.isArray(q.answer) ? q.answer.slice() : [q.answer]);
  const isCorrect = (q, sel) => {
    const a = answerOf(q).sort((x, y) => x - y), s = (sel || []).slice().sort((x, y) => x - y);
    return a.length === s.length && a.every((v, i) => v === s[i]);
  };
  const scaled = (c, n) => (n ? Math.round(100 + 900 * c / n) : 100);
  const fmt = sec => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0'); };
  const mdInline = src => App.md(String(src || '')).replace(/^<p>/, '').replace(/<\/p>$/, '');
  const safeUrl = u => (/^https:\/\//.test(u || '') ? u : '#');

  // ---------- store ----------
  function S() {
    const d = App.store.data;
    if (!d.aws || typeof d.aws !== 'object') d.aws = {};
    const a = d.aws;
    if (a.start === undefined) a.start = null;
    if (!a.done || typeof a.done !== 'object') a.done = {};
    if (!a.answers || typeof a.answers !== 'object') a.answers = {};
    if (!Array.isArray(a.mocks)) a.mocks = [];
    return a;
  }
  function record(q, sel) { S().answers[q.id] = { ok: isCorrect(q, sel), at: Date.now() }; }

  // ---------- weeks / dates ----------
  function startTs() {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(S().start || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : null;
  }
  /** 0 = chưa tới ngày bắt đầu, 1..26, 27 = đã qua; null = chưa chọn ngày. */
  function currentWeek() {
    const s = startTs();
    if (s == null) return null;
    const n = Math.floor((App.startOfDay(Date.now()) - s) / (7 * App.DAY)) + 1;
    return Math.max(0, Math.min(weeks().length + 1, n));
  }
  const examWeek = id => weeks().reduce((m, w) => (w.exam === id ? Math.max(m, w.n) : m), 0);
  const weekStart = n => { const s = startTs(); return s == null ? null : s + (n - 1) * 7 * App.DAY; };
  const dateStr = ts => new Date(ts).toLocaleDateString(App.lang === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isDone = n => !!S().done[String(n)];
  function focusWeek() {
    const cw = currentWeek();
    if (cw && cw >= 1 && cw <= weeks().length) return cw;
    const w = weeks().find(x => !isDone(x.n));
    return w ? w.n : (weeks().length ? weeks()[weeks().length - 1].n : 0);
  }

  // ---------- module state (survives tab switches) ----------
  let rootEl = null, tab = 'overview', timer = null;
  const openWeeks = new Set();
  const P = { exam: 'sap-c02', domain: 'all', mode: 'all', week: null, queue: [], idx: 0, sel: [], checked: false, c: 0, t: 0 };
  let M = null;           // mock đang làm: { exam, ids, sel, flag, idx, startedAt, endAt }
  let R = null;           // kết quả mock vừa nộp / đang xem lại
  let onlyWrong = false;

  // ---------- practice ----------
  function practiceDomains() {
    if (P.week) { const w = weeks().find(x => x.n === P.week); if (w) return w.domains || []; }
    return P.domain === 'all' ? null : [P.domain];
  }
  function buildQueue() {
    const ans = S().answers;
    let list = pool(P.exam, practiceDomains()).filter(q => {
      const a = ans[q.id];
      return P.mode === 'all' || (P.mode === 'wrong' ? a && !a.ok : !a || !a.ok);
    });
    list = App.shuffle(list);
    if (P.week) { const w = weeks().find(x => x.n === P.week); if (w && w.practice) list = list.slice(0, w.practice); }
    Object.assign(P, { queue: list.map(q => q.id), idx: 0, sel: [], checked: false, c: 0, t: 0 });
  }
  const byId = id => allQs().find(q => q.id === id) || null;
  const practiceQ = () => byId(P.queue[P.idx]);

  // ---------- mock ----------
  const mockSize = ex => Math.min(ex.questions || 75, pool(ex.id).length);
  const mockMinutes = (ex, n) => Math.max(1, Math.round((ex.minutes || 180) * n / (ex.questions || 75)));
  function pickMock(ex) {
    const n = mockSize(ex), byDom = {};
    pool(ex.id).forEach(q => { (byDom[q.domain] = byDom[q.domain] || []).push(q); });
    let picked = [], rest = [];
    (ex.domains || []).forEach(d => {
      const list = App.shuffle(byDom[d.id] || []), want = Math.round(n * d.weight / 100);
      picked = picked.concat(list.slice(0, want)); rest = rest.concat(list.slice(want));
    });
    if (picked.length < n) picked = picked.concat(App.shuffle(rest).slice(0, n - picked.length));
    return App.shuffle(picked).slice(0, n);
  }
  function saveMock() { try { if (M) sessionStorage.setItem(MOCK_KEY, JSON.stringify(M)); else sessionStorage.removeItem(MOCK_KEY); } catch (e) { /* storage blocked */ } }
  function loadMock() {
    if (M) return;
    try { const s = JSON.parse(sessionStorage.getItem(MOCK_KEY) || 'null'); if (s && Array.isArray(s.ids) && s.ids.length) M = s; } catch (e) { /* ignore */ }
    if (M) { M.ids = M.ids.filter(id => byId(id)); if (!M.ids.length) M = null; }
  }
  function startMock(examId) {
    const ex = examOf(examId); if (!ex) return;
    const qs = pickMock(ex); if (!qs.length) return;
    const now = Date.now();
    M = { exam: ex.id, ids: qs.map(q => q.id), sel: qs.map(() => []), flag: [], idx: 0, startedAt: now, endAt: now + mockMinutes(ex, qs.length) * 60000 };
    R = null; saveMock(); startTimer(); render();
  }
  const left = () => (M ? Math.round((M.endAt - Date.now()) / 1000) : 0);
  function submitMock(auto) {
    if (!M) return;
    if (!auto) {
      const blank = M.sel.filter(s => !s || !s.length).length;
      if (!confirm(t('confirm') + (blank ? t('blank', { n: blank }) : ''))) return;
    }
    stopTimer();
    const ex = examOf(M.exam), byDomain = {};
    let correct = 0;
    M.ids.forEach((id, i) => {
      const q = byId(id); if (!q) return;
      const d = byDomain[q.domain] = byDomain[q.domain] || { total: 0, correct: 0 };
      d.total += 1;
      const ok = isCorrect(q, M.sel[i]);
      if (ok) { d.correct += 1; correct += 1; }
      if ((M.sel[i] || []).length) record(q, M.sel[i]);
    });
    const total = M.ids.length, score = scaled(correct, total);
    const rec = { id: 'm' + Date.now().toString(36), at: Date.now(), exam: M.exam, total, correct, score,
      passed: score >= ((ex && ex.pass) || 750), seconds: Math.round((Math.min(Date.now(), M.endAt) - M.startedAt) / 1000),
      byDomain, ids: M.ids, sel: M.sel, auto: !!auto };
    const a = S();
    a.mocks.unshift(rec); a.mocks.length = Math.min(a.mocks.length, MOCKS_MAX);
    App.store.log('quiz');
    App.store.save();
    R = rec; M = null; onlyWrong = false; saveMock();
    tab = 'mock';
    if (location.hash !== '#/aws/mock') App.navigate('#/aws/mock'); else render();
  }
  function startTimer() {
    stopTimer();
    timer = setInterval(() => {
      if (!M) return;
      const s = left();
      const el = rootEl && rootEl.querySelector('#awsTimer');
      if (el) { el.textContent = fmt(s); el.classList.toggle('low', s <= 300); }
      if (s <= 0) submitMock(true);
    }, 1000);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  // ---------- shared HTML ----------
  function optionsHtml(q, sel, reveal) {
    const ans = answerOf(q), multi = q.multi === true;
    return '<ul class="aws-opts">' + q.options.map((text, i) => {
      const on = sel.indexOf(i) >= 0;
      let cls = on ? ' selected' : '';
      if (reveal) cls += ans.indexOf(i) >= 0 ? ' correct' : on ? ' wrong' : '';
      return '<li><button type="button" class="aws-opt' + cls + '" data-opt="' + i + '" aria-pressed="' + on + '"' + (reveal ? ' disabled' : '') + '>' +
        '<span class="aws-key" aria-hidden="true">' + (multi ? (on ? '☑' : '☐') : '') + LETTERS[i] + '</span>' +
        '<span class="aws-opt-text">' + mdInline(text) + '</span></button></li>';
    }).join('') + '</ul>';
  }
  function qHead(q, extra) {
    return '<div class="aws-meta"><span class="chip">' + esc(domainLabel(q.domain)) + '</span>' +
      (q.multi ? '<span class="badge warn">' + t('chooseN', { n: answerOf(q).length }) + '</span>' : '') + (extra || '') + '</div>';
  }
  function explainHtml(q, sel) {
    const ok = isCorrect(q, sel);
    const svc = (q.services || []).map(s => '<span class="chip">' + esc(s) + '</span>').join('');
    const refs = (q.refs || []).map(r => '<li><a href="' + esc(safeUrl(r.url)) + '" target="_blank" rel="noopener">' + esc(r.title || r.url) + '</a></li>').join('');
    return '<div class="aws-explain">' +
      '<h4>' + (ok ? t('right') : t('wrong')) + ' <span class="small muted">' + esc(t('correctIs', { a: answerOf(q).map(i => LETTERS[i]).join(', ') })) + '</span></h4>' +
      '<div class="md" lang="vi">' + App.md(q.explain || '') + '</div>' +
      (svc ? '<div class="chips aws-svc"><span class="small muted">' + t('services') + ':</span>' + svc + '</div>' : '') +
      (refs ? '<p class="small muted">' + t('refs') + ':</p><ul class="aws-refs small">' + refs + '</ul>' : '') + '</div>';
  }
  function bar(label, correct, total, sub) {
    const p = total ? Math.round(correct / total * 100) : 0;
    const cls = !total ? '' : p >= PASS_PCT ? 'ok' : p >= 50 ? 'warn' : 'bad';
    return '<div class="aws-bar"><span class="aws-bar-label">' + esc(label) + (sub ? '<br><span class="small muted">' + esc(sub) + '</span>' : '') + '</span>' +
      '<span class="aws-meter"><span class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '" aria-label="' + esc(label) + '">' +
      (total ? '<i class="' + cls + '" style="width:' + p + '%"></i>' : '') + '</span><span class="aws-mark" style="left:' + PASS_PCT + '%"></span></span>' +
      '<span class="aws-bar-val">' + (total ? correct + '/' + total + ' (' + p + '%)' : t('accNone')) + '</span></div>';
  }
  function tabsHtml() {
    return '<nav class="chips aws-tabs" aria-label="' + esc(t('title')) + '">' + TABS.map(k =>
      '<a class="chip' + (k === tab ? ' active' : '') + '" href="#/aws' + (k === 'overview' ? '' : '/' + k) + '"' + (k === tab ? ' aria-current="page"' : '') + '>' + t('tab.' + k) + '</a>').join('') + '</nav>';
  }

  // ---------- overview ----------
  function overviewHtml() {
    const a = S(), ws = weeks(), cw = currentWeek(), done = ws.filter(w => isDone(w.n)).length;
    const qs = allQs(), answered = qs.filter(q => a.answers[q.id]).length;
    const examCards = plan().exams.map(ex => {
      const n = examWeek(ex.id), ws0 = weekStart(n);
      return '<div class="stat"><div class="num">' + (ws0 != null ? esc(dateStr(ws0 + 6 * App.DAY)) : '—') + '</div><div class="lbl">' +
        esc(t('examDate', { code: ex.code })) + ' · ' + esc(t('examWeek', { n: n })) + '</div></div>';
    }).join('');
    const fw = focusWeek(), w = ws.find(x => x.n === fw);
    const weekCard = w ? '<section class="card aws-now"><div class="aws-now-head"><span class="badge accent">' +
      (cw === fw ? t('thisWeek') : t('nextUndone')) + '</span> <strong>' + esc(t('week', { n: w.n })) + ': ' + esc(w.title) + '</strong></div>' +
      '<ul class="aws-goals">' + (w.goals || []).map(g => '<li>' + mdInline(g) + '</li>').join('') + '</ul>' +
      '<div class="row"><button type="button" class="btn primary" data-act="openWeek" data-n="' + w.n + '">' + t('openWeek') + '</button>' +
      weekPracticeBtn(w) + '</div></section>' : '';
    const acc = plan().exams.map(ex => {
      const rows = (ex.domains || []).map(d => {
        const inDom = pool(ex.id, [d.id]);
        if (!inDom.length) return bar(domainLabel(d.id), 0, 0, t('weight', { w: d.weight }) + ' · ' + t('loading'));
        const ans = inDom.map(q => a.answers[q.id]).filter(Boolean);
        return bar(domainLabel(d.id), ans.filter(x => x.ok).length, ans.length, t('weight', { w: d.weight }) + ' · ' + ans.length + ' ' + t('ofPool', { n: inDom.length }));
      }).join('');
      return '<h4>' + esc(ex.code + ' – ' + ex.name) + '</h4>' + rows;
    }).join('');
    const mocks = a.mocks.slice(0, 5).map(mockHistRow).join('');
    return '<section class="card aws-start"><label for="awsStart"><strong>' + t('start') + '</strong></label> ' +
        '<input type="date" class="input" id="awsStart" value="' + esc(a.start || '') + '"> ' +
        '<button type="button" class="btn sm" data-act="today">' + t('today') + '</button>' +
        (a.start ? '' : '<p class="small muted">' + t('pickStart') + '</p>') + '</section>' +
      '<div class="grid aws-stats">' +
        '<div class="stat"><div class="num">' + (cw == null ? '—' : cw === 0 ? t('notStarted') : cw > ws.length ? t('finished') : cw + '/' + ws.length) + '</div><div class="lbl">' + t('weekNow') + '</div></div>' +
        '<div class="stat"><div class="num">' + done + '/' + ws.length + '</div><div class="lbl">' + t('weeksDone') + '</div>' +
          '<span class="progress"><i class="accent" style="width:' + (ws.length ? Math.round(done / ws.length * 100) : 0) + '%"></i></span></div>' +
        examCards +
        '<div class="stat"><div class="num">' + answered + '</div><div class="lbl">' + t('answered') + ' ' + esc(t('ofPool', { n: qs.length })) + '</div></div>' +
      '</div>' + weekCard +
      '<section class="card"><h3>' + t('accuracy') + '</h3>' + acc + '<p class="small muted">' + t('accHint') + '</p></section>' +
      '<section class="card"><h3>' + t('mocksRecent') + '</h3>' + (mocks ? '<ul class="aws-hist">' + mocks + '</ul>' : '<p class="small muted">' + t('noMocks') + '</p>') + '</section>';
  }
  function mockHistRow(h) {
    const ex = examOf(h.exam);
    return '<li><span class="badge ' + (h.passed ? 'ok' : 'bad') + '">' + esc((ex ? ex.code : h.exam) + ' · ' + (h.passed ? t('pass') : t('fail'))) + '</span> ' +
      '<span class="small">' + esc(t('histRow', { score: h.score, c: h.correct, t: h.total, date: App.fmtDate(h.at) })) + '</span>' +
      (Array.isArray(h.ids) ? ' <button type="button" class="btn sm ghost" data-act="reviewOld" data-id="' + esc(h.id || '') + '">' + t('reviewOld') + '</button>' : '') + '</li>';
  }
  function weekPracticeBtn(w) {
    const n = pool(w.exam, w.domains).length;
    return n ? '<button type="button" class="btn" data-act="weekPractice" data-n="' + w.n + '">' + esc(t('practiceWeek', { n: Math.min(w.practice || n, n) })) + '</button>'
      : '<button type="button" class="btn" disabled>' + esc(t('practiceWeek', { n: w.practice || 0 })) + ' · ' + t('loading') + '</button>';
  }

  // ---------- plan ----------
  function planHtml() {
    const cw = currentWeek();
    if (!openWeeks.size) openWeeks.add(focusWeek());
    return '<ol class="aws-weeks">' + weeks().map(w => {
      const ex = examOf(w.exam), done = isDone(w.n), s = weekStart(w.n);
      const study = (w.study || []).map(x => '<li><a href="' + esc(safeUrl(x.url)) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a></li>').join('');
      return '<li><details class="card aws-week' + (done ? ' done' : '') + (cw === w.n ? ' now' : '') + '" data-week="' + w.n + '"' + (openWeeks.has(w.n) ? ' open' : '') + '>' +
        '<summary><span class="aws-wk-n">' + (done ? '✓' : w.n) + '</span><span class="aws-wk-title"><strong>' + esc(t('week', { n: w.n })) + ':</strong> ' + esc(w.title) +
          '<span class="aws-wk-meta"><span class="badge info">' + esc(ex ? ex.code : w.exam) + '</span>' +
          (done ? '<span class="badge ok">' + t('doneBadge') + '</span>' : '') + (cw === w.n ? '<span class="badge accent">' + t('nowBadge') + '</span>' : '') +
          (s != null ? '<span class="small muted">' + esc(dateStr(s)) + ' – ' + esc(dateStr(s + 6 * App.DAY)) + '</span>' : '') + '</span></span></summary>' +
        '<div class="aws-week-body">' +
          '<div class="chips">' + (w.domains || []).map(d => '<span class="chip">' + esc(domainLabel(d)) + '</span>').join('') + '</div>' +
          '<h4>' + t('goals') + '</h4><ul class="aws-goals">' + (w.goals || []).map(g => '<li>' + mdInline(g) + '</li>').join('') + '</ul>' +
          (study ? '<h4>' + t('study') + '</h4><ul class="aws-study">' + study + '</ul>' : '') +
          (w.lab ? '<h4>' + t('lab') + '</h4><div class="md aws-lab">' + App.md(w.lab) + '</div>' : '') +
          '<div class="row aws-week-actions">' + weekPracticeBtn(w) +
            '<button type="button" class="btn ' + (done ? '' : 'ok') + '" data-act="tick" data-n="' + w.n + '" aria-pressed="' + done + '">' + (done ? t('markUndone') : '✓ ' + t('markDone')) + '</button></div>' +
        '</div></details></li>';
    }).join('') + '</ol>';
  }

  // ---------- practice ----------
  function practiceHtml() {
    const exs = plan().exams, ex = examOf(P.exam) || exs[0];
    if (ex && ex.id !== P.exam) { P.exam = ex.id; buildQueue(); }
    const examSel = '<select class="select" id="awsPExam" aria-label="' + t('exam') + '">' + exs.map(e =>
      '<option value="' + esc(e.id) + '"' + (e.id === P.exam ? ' selected' : '') + '>' + esc(e.code) + ' (' + pool(e.id).length + ')</option>').join('') + '</select>';
    const domSel = P.week ? '<span class="chip active">' + esc(t('weekFilter', { n: P.week, k: P.queue.length })) +
        ' <button type="button" class="btn sm ghost" data-act="clearWeek" aria-label="' + t('clearWeek') + '">✕</button></span>'
      : '<select class="select" id="awsPDomain" aria-label="' + t('domain') + '"><option value="all">' + t('allDomains') + '</option>' +
        ((ex && ex.domains) || []).map(d => '<option value="' + esc(d.id) + '"' + (d.id === P.domain ? ' selected' : '') + '>' + esc(domainLabel(d.id)) + ' (' + pool(ex.id, [d.id]).length + ')</option>').join('') + '</select>';
    const modes = ['all', 'todo', 'wrong'].map(m => '<button type="button" class="chip' + (P.mode === m ? ' active' : '') + '" data-mode="' + m + '" aria-pressed="' + (P.mode === m) + '">' + t('mode.' + m) + '</button>').join('');
    const filters = '<section class="card aws-filters"><div class="row">' + examSel + domSel + '</div>' +
      '<div class="chips" role="group" aria-label="' + t('mode') + '">' + modes + '</div></section>';
    const q = practiceQ();
    if (!q) {
      const empty = !pool(P.exam, practiceDomains()).length;
      return filters + '<p class="empty">' + (empty ? '⏳ ' + t('emptyPool') : t('emptyFilter')) + '</p>';
    }
    return filters + '<section class="card aws-q">' +
      '<p class="small muted">' + esc(t('queue', { i: P.idx + 1, n: P.queue.length, c: P.c, t: P.t })) + '</p>' +
      '<div lang="en">' + qHead(q) + '<div class="md aws-q-text">' + App.md(q.q) + '</div>' + optionsHtml(q, P.sel, P.checked) + '</div>' +
      (P.checked ? explainHtml(q, P.sel) : '') +
      '<div class="row aws-nav">' +
        (P.checked ? '' : '<button type="button" class="btn primary" data-act="check"' + (P.sel.length === answerOf(q).length ? '' : ' disabled') + '>' + t('check') + ' <kbd>Enter</kbd></button>') +
        '<button type="button" class="btn' + (P.checked ? ' primary' : '') + '" data-act="pnext"' + (P.idx + 1 < P.queue.length ? '' : ' disabled') + '>' + t('next') + ' <kbd>N</kbd></button>' +
      '</div>' +
      '<p class="small muted">' + t('keys', { k: '<kbd>1</kbd>–<kbd>' + q.options.length + '</kbd>', enter: '<kbd>Enter</kbd>', n: '<kbd>N</kbd>' }) + '</p></section>';
  }
  function practiceChoose(i) {
    const q = practiceQ(); if (!q || P.checked || i < 0 || i >= q.options.length) return;
    if (q.multi) {
      const p = P.sel.indexOf(i);
      if (p >= 0) P.sel.splice(p, 1); else if (P.sel.length < answerOf(q).length) P.sel.push(i);
    } else P.sel = [i];
    render();
  }
  function practiceCheck() {
    const q = practiceQ(); if (!q || P.checked || P.sel.length !== answerOf(q).length) return;
    P.checked = true; P.t += 1; if (isCorrect(q, P.sel)) P.c += 1;
    record(q, P.sel); App.store.save();
    render();
  }
  function practiceNext() { if (P.idx + 1 < P.queue.length) { P.idx += 1; P.sel = []; P.checked = false; render(); scrollTop(); } }

  // ---------- mock HTML ----------
  function mockSetupHtml() {
    loadMock();
    const resume = M ? '<section class="card aws-resume"><strong>' + t('mockResume') + ' (' + esc((examOf(M.exam) || {}).code || M.exam) + ')</strong> ' +
      '<button type="button" class="btn primary" data-act="resume">' + t('continue') + '</button> <button type="button" class="btn ghost" data-act="discard">' + t('discard') + '</button></section>' : '';
    const cards = plan().exams.map((ex, i) => {
      const n = mockSize(ex), hist = S().mocks.filter(h => h.exam === ex.id).slice(0, 5).map(mockHistRow).join('');
      return '<section class="card aws-mock-card"><h3>' + esc(ex.code + ' – ' + ex.name) + '</h3>' +
        (n ? '<p>' + esc(t('mockSub', { n: n, m: mockMinutes(ex, n), pass: ex.pass })) + '</p>' +
          (n < ex.questions ? '<p class="small muted">' + esc(t('mockShort', { have: n, want: ex.questions })) + '</p>' : '') +
          '<button type="button" class="btn primary" data-act="mockStart" data-exam="' + esc(ex.id) + '"' + (M ? ' disabled' : '') + '>' + t('mockStart') + ' <kbd>' + (i + 1) + '</kbd></button>'
          : '<p class="muted">⏳ ' + t('emptyPool') + '</p>') +
        (ex.guide ? '<p class="small"><a href="' + esc(safeUrl(ex.guide)) + '" target="_blank" rel="noopener">' + esc(ex.guide.replace(/^https:\/\//, '')) + '</a></p>' : '') +
        (hist ? '<ul class="aws-hist">' + hist + '</ul>' : '') + '</section>';
    }).join('');
    return resume + '<p class="small muted">' + t('scaledNote') + '</p><div class="aws-mock-cards">' + cards + '</div>';
  }
  function mockHtml() {
    const q = byId(M.ids[M.idx]), sel = M.sel[M.idx] || [], ex = examOf(M.exam) || { code: M.exam };
    const answered = M.sel.filter(s => s && s.length).length;
    const grid = M.ids.map((id, i) => '<button type="button" class="aws-cell' + (i === M.idx ? ' current' : '') + ((M.sel[i] || []).length ? ' done' : '') +
      (M.flag[i] ? ' flagged' : '') + '" data-go="' + i + '" aria-label="' + esc(t('cell', { n: i + 1 })) + '">' + (i + 1) + '</button>').join('');
    return '<div class="card aws-head"><span class="badge info">' + esc(ex.code) + '</span>' +
        '<span class="aws-progress">' + esc(t('progress', { i: M.idx + 1, n: M.ids.length, d: answered })) + '</span>' +
        '<span class="aws-timer' + (left() <= 300 ? ' low' : '') + '" id="awsTimer" title="' + t('timeLeft') + '" aria-label="' + t('timeLeft') + '">' + fmt(left()) + '</span>' +
        '<button type="button" class="btn sm primary" data-act="submit">' + t('submit') + '</button></div>' +
      '<div class="aws-body"><section class="card aws-q"><div lang="en">' + qHead(q, M.flag[M.idx] ? '<span class="badge warn">🚩</span>' : '') +
        '<div class="md aws-q-text">' + App.md(q.q) + '</div>' + optionsHtml(q, sel, false) + '</div>' +
        '<div class="row aws-nav">' +
          '<button type="button" class="btn" data-act="mprev"' + (M.idx ? '' : ' disabled') + '>' + t('prev') + ' <kbd>P</kbd></button>' +
          '<button type="button" class="btn' + (M.flag[M.idx] ? ' warn' : '') + '" data-act="flag">' + (M.flag[M.idx] ? t('unflag') : t('flag')) + ' <kbd>F</kbd></button>' +
          '<button type="button" class="btn primary" data-act="mnext"' + (M.idx + 1 < M.ids.length ? '' : ' disabled') + '>' + t('next') + ' <kbd>N</kbd></button></div>' +
        '<p class="small muted">' + t('keys', { k: '<kbd>1</kbd>–<kbd>' + q.options.length + '</kbd>', enter: '<kbd>Enter</kbd>', n: '<kbd>N</kbd>' }) + '</p></section>' +
      '<aside class="card aws-grid-card"><h4>' + t('grid') + '</h4><div class="aws-grid">' + grid + '</div></aside></div>';
  }
  function mockChoose(i) {
    const q = byId(M.ids[M.idx]); if (!q || i < 0 || i >= q.options.length) return;
    let s = (M.sel[M.idx] || []).slice();
    if (q.multi) { const p = s.indexOf(i); if (p >= 0) s.splice(p, 1); else if (s.length < answerOf(q).length) s.push(i); }
    else s = [i];
    M.sel[M.idx] = s; saveMock(); render();
  }
  function mockGo(i) { if (M && i >= 0 && i < M.ids.length) { M.idx = i; saveMock(); render(); scrollTop(); } }

  function resultHtml() {
    const r = R, ex = examOf(r.exam) || { code: r.exam, pass: 750, domains: [] };
    const doms = (ex.domains || []).map(d => d.id).concat(Object.keys(r.byDomain || {}).filter(d => !(ex.domains || []).some(x => x.id === d)));
    const rows = doms.filter(d => r.byDomain[d]).map(d => bar(domainLabel(d), r.byDomain[d].correct, r.byDomain[d].total)).join('');
    const items = (r.ids || []).map((id, i) => ({ q: byId(id), sel: (r.sel && r.sel[i]) || [], n: i + 1 })).filter(x => x.q);
    const shown = items.filter(x => !onlyWrong || !isCorrect(x.q, x.sel));
    const wrongN = items.filter(x => !isCorrect(x.q, x.sel)).length;
    const review = shown.map(x => {
      const ok = isCorrect(x.q, x.sel);
      return '<details class="card aws-review ' + (ok ? 'ok' : 'bad') + '"><summary>' + (ok ? '✅' : '❌') + ' ' + x.n + '. <span lang="en">' + esc(String(x.q.q).slice(0, 140)) + (x.q.q.length > 140 ? '…' : '') + '</span></summary>' +
        '<div lang="en">' + qHead(x.q) + '<div class="md aws-q-text">' + App.md(x.q.q) + '</div>' + optionsHtml(x.q, x.sel, true) + '</div>' +
        '<p class="small"><strong>' + t('youChose') + '</strong> ' + (x.sel.length ? x.sel.map(i => LETTERS[i]).join(', ') : '<em>' + t('blankAns') + '</em>') + '</p>' +
        explainHtml(x.q, x.sel) + '</details>';
    }).join('');
    return '<section class="card aws-score"><h2>' + esc(t('result', { code: ex.code })) + '</h2>' +
        '<p>' + (r.auto ? t('auto') : '') + esc(t('resLine', { c: r.correct, t: r.total, time: fmt(r.seconds) })) + '</p>' +
        '<div class="aws-score-num ' + (r.passed ? 'ok' : 'bad') + '">' + r.score + '<small>/1000</small></div>' +
        '<div class="badge ' + (r.passed ? 'ok' : 'bad') + ' aws-verdict">' + (r.passed ? t('pass') : t('fail')) + ' (' + esc(t('mark', { pass: ex.pass })) + ')</div>' +
        '<p class="small muted">' + t('scaledNote') + '</p>' +
        '<div class="row aws-actions"><button type="button" class="btn primary" data-act="again">' + t('again') + '</button>' +
          (wrongN ? '<button type="button" class="btn" data-act="practiceWrong">' + t('practiceWrong') + ' (' + wrongN + ')</button>' : '') + '</div></section>' +
      '<section class="card"><h3>' + t('byDomain') + '</h3>' + rows + '<p class="small muted">' + t('accHint') + '</p></section>' +
      '<section><div class="row aws-review-head"><h3>' + t('review') + '</h3><button type="button" class="chip' + (onlyWrong ? ' active' : '') + '" data-act="onlyWrong" aria-pressed="' + onlyWrong + '">' +
        t('onlyWrong') + ' (' + wrongN + ')</button></div>' + review + '</section>';
  }

  // ---------- render ----------
  function scrollTop() { if (rootEl && rootEl.scrollIntoView) rootEl.scrollIntoView({ block: 'start' }); }
  function render() {
    if (!rootEl) return;
    if (!weeks().length && !plan().exams.length) { rootEl.innerHTML = '<p class="empty">' + t('noData') + '</p>'; return; }
    let body;
    if (tab === 'plan') body = planHtml();
    else if (tab === 'practice') body = practiceHtml();
    else if (tab === 'mock') { loadMock(); body = M ? mockHtml() : R ? resultHtml() : mockSetupHtml(); }
    else body = overviewHtml();
    rootEl.innerHTML = '<div class="page-head"><div><h1>' + t('heading') + '</h1><p>' + t('sub') + '</p></div></div>' + tabsHtml() + body;
  }

  // ---------- events ----------
  function onClick(e) {
    const opt = e.target.closest('[data-opt]');
    if (opt && !opt.disabled) {
      if (tab === 'mock' && M) mockChoose(+opt.dataset.opt); else if (tab === 'practice') practiceChoose(+opt.dataset.opt);
      return;
    }
    const cell = e.target.closest('[data-go]');
    if (cell) { mockGo(+cell.dataset.go); return; }
    const mode = e.target.closest('[data-mode]');
    if (mode) { P.mode = mode.dataset.mode; buildQueue(); render(); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act, n = +b.dataset.n;
    if (act === 'today') { S().start = App.dayKey(Date.now()); App.store.save(); render(); }
    else if (act === 'openWeek') { openWeeks.clear(); openWeeks.add(n); App.navigate('#/aws/plan'); }
    else if (act === 'tick') { const a = S(); if (a.done[n]) delete a.done[n]; else a.done[n] = true; App.store.save(); render(); }
    else if (act === 'weekPractice') { const w = weeks().find(x => x.n === n); if (w) { P.exam = w.exam; P.week = n; P.mode = 'todo'; buildQueue(); if (!P.queue.length) { P.mode = 'all'; buildQueue(); } App.navigate('#/aws/practice'); } }
    else if (act === 'clearWeek') { P.week = null; P.domain = 'all'; buildQueue(); render(); }
    else if (act === 'check') practiceCheck();
    else if (act === 'pnext') practiceNext();
    else if (act === 'mockStart') startMock(b.dataset.exam);
    else if (act === 'resume') { if (M) { startTimer(); render(); } }
    else if (act === 'discard') { M = null; saveMock(); render(); }
    else if (act === 'submit') submitMock(false);
    else if (act === 'mprev') mockGo(M.idx - 1);
    else if (act === 'mnext') mockGo(M.idx + 1);
    else if (act === 'flag') { M.flag[M.idx] = !M.flag[M.idx]; saveMock(); render(); }
    else if (act === 'again') { R = null; render(); }
    else if (act === 'onlyWrong') { onlyWrong = !onlyWrong; render(); }
    else if (act === 'practiceWrong') {
      const ids = (R.ids || []).filter((id, i) => { const q = byId(id); return q && !isCorrect(q, (R.sel || [])[i]); });
      Object.assign(P, { exam: R.exam, week: null, domain: 'all', mode: 'all', queue: App.shuffle(ids), idx: 0, sel: [], checked: false, c: 0, t: 0 });
      App.navigate('#/aws/practice');
    }
    else if (act === 'reviewOld') { const h = S().mocks.find(x => x.id === b.dataset.id); if (h) { R = h; onlyWrong = false; App.navigate('#/aws/mock'); } }
  }
  function onChange(e) {
    const el = e.target;
    if (el.id === 'awsStart') { S().start = /^\d{4}-\d{2}-\d{2}$/.test(el.value) ? el.value : null; App.store.save(); render(); }
    else if (el.id === 'awsPExam') { P.exam = el.value; P.domain = 'all'; P.week = null; buildQueue(); render(); }
    else if (el.id === 'awsPDomain') { P.domain = el.value; buildQueue(); render(); }
  }
  function onToggle(e) {
    const d = e.target;
    if (!d || !d.dataset || !d.dataset.week) return;
    const n = +d.dataset.week;
    if (d.open) openWeeks.add(n); else openWeeks.delete(n);
  }
  function onKey(e) {
    const k = e.key, onBtn = e.target && e.target.closest && e.target.closest('button, a, summary');
    if (tab === 'mock' && !M && !R && k >= '1' && k <= '9') {
      const ex = plan().exams[+k - 1];
      if (ex && mockSize(ex)) { e.preventDefault(); startMock(ex.id); }
      return;
    }
    const inMock = tab === 'mock' && M, inPractice = tab === 'practice' && practiceQ();
    if (!inMock && !inPractice) return;
    if (k >= '1' && k <= '6') { e.preventDefault(); if (inMock) mockChoose(+k - 1); else practiceChoose(+k - 1); }
    else if (k === 'n' || k === 'N') { e.preventDefault(); if (inMock) mockGo(M.idx + 1); else practiceNext(); }
    else if (k === 'Enter') {
      if (onBtn && !onBtn.hasAttribute('data-opt')) return;     // để nút đang focus tự xử lý Enter
      e.preventDefault();
      if (inMock) mockGo(M.idx + 1); else if (P.checked) practiceNext(); else practiceCheck();
    }
    else if (inMock && (k === 'p' || k === 'P')) { e.preventDefault(); mockGo(M.idx - 1); }
    else if (inMock && (k === 'f' || k === 'F')) { e.preventDefault(); M.flag[M.idx] = !M.flag[M.idx]; saveMock(); render(); }
  }

  App.registerView('aws', {
    get title() { return App.t('aws.title'); },
    render(root, params) {
      rootEl = root;
      tab = TABS.indexOf(params && params[0]) > 0 ? params[0] : 'overview';
      S();
      if (tab === 'practice' && !P.queue.length) buildQueue();
      if (tab === 'mock') {
        loadMock();
        if (M && left() <= 0) submitMock(true);
      }
      if (M) startTimer();
      render();
      root.addEventListener('click', onClick);
      root.addEventListener('change', onChange);
      root.addEventListener('toggle', onToggle, true);
      const off = App.onKey(onKey);
      return () => { stopTimer(); saveMock(); off(); root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.removeEventListener('toggle', onToggle, true); rootEl = null; };
    },
  });
})();
