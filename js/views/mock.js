/* View "mock" — owner: task T11. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  const PRESETS = [
    { id: 'java', label: 'Java Backend Senior', topics: ['core', 'collections', 'concurrency', 'jvm', 'spring', 'jpa', 'db'], coding: false },
    { id: 'micro', label: 'Microservices & System Design', topics: ['microservices', 'design', 'architecture'], coding: false },
    { id: 'cloud', label: 'Cloud & AI', topics: ['aws', 'ai'], coding: false },
    { id: 'english', label: 'English Interview', topics: ['english'], english: true, coding: false },
    { id: 'scenario', label: 'Tình huống thực tế', topics: ['scenario', 'db', 'design'], coding: false },
    { id: 'coding', label: 'Coding round', topics: [], codingOnly: true, coding: true, codingCount: 3 },
    { id: 'full', label: 'Full loop', topics: null, coding: true, codingCount: 1 }
  ];
  const COUNTS = [5, 8, 10, 15];
  const MINUTES = [2, 3, 5];
  const CODING_COUNTS = [1, 2, 3];
  const DIFFS = ['easy', 'medium', 'hard'];
  const CODING_MINUTES = 25;

  const VI = {
    setup: 'Thiết lập phỏng vấn thử',
    subtitle: 'Chọn preset, chủ đề, độ khó và thời lượng để luyện phỏng vấn như thật.',
    preset: 'Preset',
    topics: 'Chủ đề',
    level: 'Độ khó',
    count: 'Số câu',
    minutes: 'Thời gian mỗi câu',
    preferUnseen: 'Ưu tiên câu tôi chưa thuộc',
    addCoding: 'Thêm vòng coding',
    codingCount: 'Số bài coding',
    codingDiff: 'Độ khó coding',
    available: 'câu khả dụng',
    start: 'Bắt đầu phỏng vấn',
    noMatch: 'Không có câu nào phù hợp với lựa chọn hiện tại. Hãy nới lọc hoặc bổ sung câu hỏi.',
    all: 'Tất cả',
    notes: 'Ghi chú / dàn ý câu trả lời của bạn',
    showAnswer: 'Xem đáp án mẫu',
    hideAnswer: 'Ẩn đáp án mẫu',
    selfRate: 'Tự chấm điểm',
    skip: 'Bỏ qua',
    end: 'Kết thúc sớm',
    overTime: 'Quá giờ',
    hint: 'Gợi ý',
    solution: 'Xem lời giải',
    editor: 'Code của bạn',
    summary: 'Tổng kết phỏng vấn',
    avg: 'Điểm trung bình',
    totalTime: 'Tổng thời gian',
    seenAnswers: 'Đáp án mẫu đã xem',
    byTopic: 'Điểm theo chủ đề',
    weak: 'Chủ đề cần cải thiện',
    retryWeak: 'Phỏng vấn lại các câu yếu',
    newSession: 'Phiên mới',
    backSetup: 'Quay lại thiết lập',
    codingRound: 'Vòng coding',
    perQuestion: 'mỗi câu',
    rateHelp: 'Nhấn 1–5 để chấm nhanh (khi không gõ trong ô ghi chú).',
    scored: 'Điểm',
    topic: 'Chủ đề',
    difficulty: 'Độ khó',
    mic: 'Đọc chính tả',
    micStop: 'Dừng ghi âm',
    score: 'Điểm',
    time: 'Thời gian',
    algoCount: 'Bài coding',
    noWeak: 'Chưa có chủ đề nào dưới 3 điểm. Tốt lắm!',
    confirmEnd: 'Kết thúc phiên phỏng vấn sớm? Kết quả vẫn được lưu.',
    confirmLeave: 'Bạn đang trong phiên phỏng vấn. Thoát ra sẽ mất tiến độ phiên này.',
    followTitle: 'Câu hỏi đào sâu thường gặp',
    recapTitle: 'Chi tiết từng câu',
    codingName: 'Coding',
    question: 'Câu'
  };

  const EN = {
    setup: 'Mock interview setup',
    subtitle: 'Pick a preset, topics, level and time per question to practise like a real interview.',
    preset: 'Preset',
    topics: 'Topics',
    level: 'Level',
    count: 'Questions',
    minutes: 'Minutes per question',
    preferUnseen: 'Prioritise questions I do not know yet',
    addCoding: 'Add a coding round',
    codingCount: 'Number of coding problems',
    codingDiff: 'Coding difficulty',
    available: 'questions available',
    start: 'Start interview',
    noMatch: 'No question matches the current selection. Relax the filters or add more questions.',
    all: 'All',
    notes: 'Your notes / answer outline',
    showAnswer: 'Show sample answer',
    hideAnswer: 'Hide sample answer',
    selfRate: 'Self rate',
    skip: 'Skip',
    end: 'End early',
    overTime: 'Over time',
    hint: 'Hint',
    solution: 'Show solution',
    editor: 'Your code',
    summary: 'Interview summary',
    avg: 'Average score',
    totalTime: 'Total time',
    seenAnswers: 'Sample answers viewed',
    byTopic: 'Score by topic',
    weak: 'Topics to improve',
    retryWeak: 'Re-mock weak questions',
    newSession: 'New session',
    backSetup: 'Back to setup',
    codingRound: 'Coding round',
    perQuestion: 'per question',
    rateHelp: 'Press 1-5 to score quickly (when not typing in the notes box).',
    scored: 'Score',
    topic: 'Topic',
    difficulty: 'Difficulty',
    mic: 'Dictate',
    micStop: 'Stop dictation',
    score: 'Score',
    time: 'Time',
    algoCount: 'Coding problems',
    noWeak: 'No topic below 3 points. Nice work!',
    confirmEnd: 'End the interview early? The result will still be saved.',
    confirmLeave: 'You are in the middle of an interview. Leaving loses this session.',
    followTitle: 'Typical follow-up questions',
    recapTitle: 'Question by question',
    codingName: 'Coding',
    question: 'Question'
  };

  // ---------- state ----------
  const S = {
    phase: 'setup',
    cfg: {
      preset: 'java',
      topics: ['core', 'collections', 'concurrency', 'jvm', 'spring', 'jpa', 'db'],
      level: 'all',
      count: 8,
      minutes: 3,
      preferUnseen: true,
      coding: false,
      codingOnly: false,
      codingCount: 1,
      codingDiff: 'easy',
      english: false
    },
    items: [],
    idx: 0,
    notes: {},
    results: [],
    sessionStart: 0,
    qStart: 0,
    limit: 0,
    deadline: 0,
    timer: null,
    keyCleanup: null,
    beforeUnload: null,
    mic: null,
    lastFocus: null
  };

  function t() { return S.cfg.english ? EN : VI; }

  function fmtClock(sec) {
    const neg = sec < 0;
    sec = Math.abs(Math.round(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return (neg ? '+' : '') + m + ':' + String(s).padStart(2, '0');
  }

  function matchQuestions(topics, level) {
    let list = App.questions();
    if (topics && topics.length) list = list.filter(q => topics.indexOf(q.topic) !== -1);
    if (level && level !== 'all') list = list.filter(q => q.level === level);
    return list;
  }

  function matchAlgos(diff) {
    let list = App.algos();
    if (diff && diff !== 'all') list = list.filter(a => a.difficulty === diff);
    return list;
  }

  /** Order: unseen / not-known first when "prefer unseen" is on. */
  function orderQuestions(list) {
    const out = list.slice();
    if (!S.cfg.preferUnseen) return out;
    const score = q => {
      const st = App.store.getStatus(q.id);
      if (!st) return 0;
      if (st === 'unknown') return 1;
      if (st === 'review') return 2;
      return 3;
    };
    // sort ổn định (ES2019+) nên nhóm cùng điểm vẫn giữ thứ tự ngẫu nhiên đã shuffle.
    out.sort((a, b) => score(a) - score(b));
    return out;
  }

  function availableQuestions() { return matchQuestions(S.cfg.topics, S.cfg.level); }
  function availableAlgos() { return matchAlgos(S.cfg.codingDiff); }

  // ---------- setup screen ----------
  function chip(label, active, attrs) {
    return '<button type="button" class="chip' + (active ? ' active' : '') + '" ' + attrs + '>' + App.esc(label) + '</button>';
  }

  function renderSetup(root) {
    const L = t();
    const allTopics = App.topics();
    const availQ = S.cfg.codingOnly ? [] : availableQuestions();
    const availA = S.cfg.coding ? availableAlgos() : [];
    const total = availQ.length + availA.length;

    const presetChips = PRESETS.map(p => chip(p.label, S.cfg.preset === p.id, 'data-preset="' + p.id + '"')).join('');
    const topicChips = allTopics.map(tp => chip(tp.icon + ' ' + tp.name, S.cfg.topics.indexOf(tp.id) !== -1, 'data-topic="' + tp.id + '"')).join('');
    const levelChips = [['all', L.all], ['mid', App.LEVELS.mid], ['senior', App.LEVELS.senior], ['lead', App.LEVELS.lead]]
      .map(p => chip(p[1], S.cfg.level === p[0], 'data-level="' + p[0] + '"')).join('');
    const countChips = COUNTS.map(n => chip(String(n), S.cfg.count === n, 'data-count="' + n + '"')).join('');
    const minChips = MINUTES.map(n => chip(n + '′', S.cfg.minutes === n, 'data-minutes="' + n + '"')).join('');
    const ccChips = CODING_COUNTS.map(n => chip(String(n), S.cfg.codingCount === n, 'data-ccount="' + n + '"')).join('');
    const diffChips = DIFFS.map(d => chip(d, S.cfg.codingDiff === d, 'data-cdiff="' + d + '"')).join('');

    root.innerHTML =
      '<div class="page-head"><div><h1>' + App.esc(L.setup) + '</h1><p>' + App.esc(L.subtitle) + '</p></div></div>' +
      '<div class="mock-setup stack">' +
        '<section class="card"><h3>' + App.esc(L.preset) + '</h3><div class="chips">' + presetChips + '</div></section>' +

        '<section class="card"><h3>' + App.esc(L.topics) + '</h3><div class="chips">' + topicChips + '</div>' +
          '<div class="mock-row"><h4>' + App.esc(L.level) + '</h4><div class="chips">' + levelChips + '</div></div>' +
          '<div class="mock-row"><h4>' + App.esc(L.count) + '</h4><div class="chips">' + countChips + '</div></div>' +
          '<div class="mock-row"><h4>' + App.esc(L.minutes) + '</h4><div class="chips">' + minChips + '</div></div>' +
          '<label class="mock-check"><input type="checkbox" id="mockUnseen"' + (S.cfg.preferUnseen ? ' checked' : '') + '> ' + App.esc(L.preferUnseen) + '</label>' +
        '</section>' +

        '<section class="card"><h3>' + App.esc(L.codingRound) + '</h3>' +
          '<label class="mock-check"><input type="checkbox" id="mockCoding"' + (S.cfg.coding ? ' checked' : '') + '> ' + App.esc(L.addCoding) + '</label>' +
          '<div class="mock-row"><h4>' + App.esc(L.codingCount) + '</h4><div class="chips">' + ccChips + '</div></div>' +
          '<div class="mock-row"><h4>' + App.esc(L.codingDiff) + '</h4><div class="chips">' + diffChips + '</div></div>' +
        '</section>' +

        '<div class="mock-actions">' +
          '<button type="button" class="btn primary lg" id="mockStart"' + (total ? '' : ' disabled') + '>' + App.esc(L.start) + '</button>' +
          '<span class="mock-avail">' + total + ' ' + App.esc(L.available) + '</span>' +
        '</div>' +
        (total ? '' : '<p class="mock-warn">' + App.esc(L.noMatch) + '</p>') +
      '</div>';

    bindSetup(root);
  }

  function bindSetup(root) {
    const wrap = root.querySelector('.mock-setup');
    if (wrap) {
      // Delegation trên wrapper (được dựng lại mỗi lần render) => không tích luỹ listener.
      wrap.addEventListener('click', e => {
        const b = e.target.closest('[data-preset],[data-topic],[data-level],[data-count],[data-minutes],[data-ccount],[data-cdiff]');
        if (!b || !wrap.contains(b)) return;
        if (b.dataset.preset !== undefined) applyPreset(b.dataset.preset);
        else if (b.dataset.topic !== undefined) {
          const id = b.dataset.topic;
          const i = S.cfg.topics.indexOf(id);
          if (i === -1) S.cfg.topics.push(id); else S.cfg.topics.splice(i, 1);
          // Chọn topic thủ công => thoát chế độ "chỉ coding" để câu hỏi xuất hiện.
          if (S.cfg.topics.length) S.cfg.codingOnly = false;
        }
        else if (b.dataset.level !== undefined) S.cfg.level = b.dataset.level;
        else if (b.dataset.count !== undefined) S.cfg.count = +b.dataset.count;
        else if (b.dataset.minutes !== undefined) S.cfg.minutes = +b.dataset.minutes;
        else if (b.dataset.ccount !== undefined) S.cfg.codingCount = +b.dataset.ccount;
        else if (b.dataset.cdiff !== undefined) S.cfg.codingDiff = b.dataset.cdiff;
        renderSetup(root);
      });
    }
    const un = root.querySelector('#mockUnseen');
    if (un) un.addEventListener('change', () => { S.cfg.preferUnseen = un.checked; renderSetup(root); });
    const cd = root.querySelector('#mockCoding');
    if (cd) cd.addEventListener('change', () => { S.cfg.coding = cd.checked; renderSetup(root); });
    const st = root.querySelector('#mockStart');
    if (st) st.addEventListener('click', () => startSession(root));
  }

  function applyPreset(id) {
    const p = PRESETS.find(x => x.id === id);
    if (!p) return;
    S.cfg.preset = id;
    if (p.codingOnly) {
      S.cfg.topics = [];
      S.cfg.coding = true;
      S.cfg.codingOnly = true;
      S.cfg.english = false;
    } else {
      S.cfg.topics = p.topics === null ? App.topics().map(x => x.id) : p.topics.slice();
      S.cfg.english = !!p.english;
      S.cfg.codingOnly = false;
    }
    if (p.codingCount) S.cfg.codingCount = p.codingCount;
  }

  // ---------- session ----------
  function buildItems() {
    const items = [];
    let pool = S.cfg.codingOnly ? [] : availableQuestions();
    // Shuffle trước để giữ ngẫu nhiên trong từng nhóm, sau đó mới ưu tiên câu chưa thuộc.
    pool = App.shuffle(pool);
    if (S.cfg.preferUnseen) pool = orderQuestions(pool);
    const take = Math.min(S.cfg.count, pool.length);
    let chosen = pool.slice(0, take);
    if (S.cfg.preset === 'full' && chosen.length && !chosen.some(q => q.topic === 'behavioral')) {
      // Đảm bảo có ít nhất 1 câu behavioral (thay câu cuối) nếu pool có sẵn.
      const beh = pool.find(q => q.topic === 'behavioral');
      if (beh) { chosen[chosen.length - 1] = beh; }
    }
    for (let i = 0; i < chosen.length; i++) items.push({ kind: 'q', data: chosen[i] });

    if (S.cfg.coding) {
      const algos = App.shuffle(availableAlgos());
      const cn = Math.min(S.cfg.codingCount, algos.length);
      for (let i = 0; i < cn; i++) items.push({ kind: 'algo', data: algos[i] });
    }
    return items;
  }

  function startSession(root) {
    S.items = buildItems();
    if (!S.items.length) { renderSetup(root); return; }
    S.phase = 'session';
    S.idx = 0;
    S.notes = {};
    S.results = [];
    S.sessionStart = Date.now();
    showQuestion(root);
  }

  function current() { return S.items[S.idx]; }

  function startTimer(root) {
    stopTimer();
    S.qStart = Date.now();
    S.limit = current().kind === 'algo' ? CODING_MINUTES * 60 : S.cfg.minutes * 60;
    S.deadline = S.qStart + S.limit * 1000;
    S.timer = setInterval(() => tick(root), 250);
    tick(root);
  }

  function stopTimer() {
    if (S.timer) { clearInterval(S.timer); S.timer = null; }
  }

  function tick(root) {
    const el = root.querySelector('#mockTimer');
    if (!el) return;
    const left = (S.deadline - Date.now()) / 1000;
    el.textContent = (left < 0 ? t().overTime + ' ' : '') + fmtClock(left);
    el.classList.toggle('warn', left >= 0 && left < 30);
    el.classList.toggle('bad', left < 0);
  }

  function showQuestion(root) {
    const L = t();
    const it = current();
    const isAlgo = it.kind === 'algo';
    const d = it.data;
    const n = S.items.length;
    const pos = S.idx + 1;
    const tp = isAlgo ? { id: 'algorithm', name: L.codingName, icon: '💻' } : App.topic(d.topic);
    const lvl = isAlgo ? d.difficulty : (App.LEVELS[d.level] || d.level);
    const noteVal = S.notes[d.id] || '';
    const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

    root.innerHTML =
      '<div class="mock-session">' +
        '<header class="mock-head card">' +
          '<div class="mock-head-top">' +
            '<div><strong>' + App.esc(L.question) + ' ' + pos + ' / ' + n + '</strong>' +
              '<div class="mock-meta"><span class="badge">' + App.esc(tp.name) + '</span>' +
              '<span class="badge">' + App.esc(String(lvl)) + '</span>' +
              (isAlgo ? '<span class="badge accent">' + App.esc(L.codingRound) + '</span>' : '') + '</div></div>' +
            '<div class="mock-timer" id="mockTimer" role="timer">--:--</div>' +
          '</div>' +
          '<div class="mock-progress"><i style="width:' + Math.round(pos / n * 100) + '%"></i></div>' +
        '</header>' +

        '<section class="card mock-q">' +
          '<div class="md mock-q-text"' + (d.lang === 'en' ? ' lang="en"' : '') + '>' +
            (isAlgo ? App.md(d.prompt) : App.md(d.q)) +
          '</div>' +

          (isAlgo ? renderAlgoExtra(d, L) : '') +

          '<label class="field mock-notes"><span>' + App.esc(isAlgo ? L.editor : L.notes) + '</span>' +
            '<textarea class="textarea' + (isAlgo ? ' mock-editor' : '') + '" id="mockNote" rows="6" placeholder="">' + App.esc(noteVal) + '</textarea>' +
          '</label>' +
          '<div class="row mock-tools">' +
            (isAlgo ? '' : '<button type="button" class="btn" id="mockAnswer">' + App.esc(L.showAnswer) + '</button>') +
            '<button type="button" class="btn" id="mockMic"' + (speechSupported ? '' : ' hidden') + '>🎤 ' + App.esc(L.mic) + '</button>' +
          '</div>' +
          '<div id="mockAnswerBox" class="mock-answer" hidden></div>' +
        '</section>' +

        renderRating(L) +
        '<div class="row mock-actions-row">' +
          '<button type="button" class="btn warn" id="mockSkip">' + App.esc(L.skip) + '</button>' +
          '<span class="spacer"></span>' +
          '<button type="button" class="btn bad" id="mockEnd">' + App.esc(L.end) + '</button>' +
        '</div>' +
      '</div>';

    bindSession(root);
    startTimer(root);
  }

  function renderAlgoExtra(d, L) {
    let html = '<div class="mock-algo">' +
      '<div class="row mock-algo-row"><button type="button" class="btn sm" id="mockHint">' + App.esc(L.hint) + '</button>' +
      '<button type="button" class="btn sm" id="mockSolution">' + App.esc(L.solution) + '</button></div>' +
      '<div id="mockHints" class="mock-hints"></div><div id="mockSolutionBox" class="mock-solution" hidden></div></div>';
    return html;
  }

  function renderRating(L) {
    let btns = '';
    for (let i = 1; i <= 5; i++) {
      btns += '<button type="button" class="btn mock-rate" data-rate="' + i + '" aria-label="' + i + ' / 5">' + i + '</button>';
    }
    return '<section class="card mock-rate-box"><div class="row"><strong>' + App.esc(L.selfRate) + '</strong>' +
      '<span class="spacer"></span><span class="muted small">' + App.esc(L.rateHelp) + '</span></div>' +
      '<div class="mock-rate-row">' + btns + '</div></section>';
  }

  // ---------- session events ----------
  function bindSession(root) {
    const it = current();
    const d = it.data;
    const L = t();

    const note = root.querySelector('#mockNote');
    if (note) {
      note.addEventListener('input', () => { S.notes[d.id] = note.value; });
      note.addEventListener('keydown', e => {
        if (e.key === 'Tab' && it.kind === 'algo') {
          e.preventDefault();
          const st = note.selectionStart, en = note.selectionEnd;
          note.value = note.value.slice(0, st) + '    ' + note.value.slice(en);
          note.selectionStart = note.selectionEnd = st + 4;
          S.notes[d.id] = note.value;
        }
      });
    }

    const ans = root.querySelector('#mockAnswer');
    if (ans) ans.addEventListener('click', () => toggleAnswer(root));

    const hint = root.querySelector('#mockHint');
    if (hint) hint.addEventListener('click', () => showHint(root));

    const sol = root.querySelector('#mockSolution');
    if (sol) sol.addEventListener('click', () => toggleSolution(root));

    const mic = root.querySelector('#mockMic');
    if (mic) mic.addEventListener('click', () => toggleMic(root, mic));

    const rateBox = root.querySelector('.mock-rate-box');
    if (rateBox) {
      // Delegation trên box chấm điểm (dựng lại mỗi câu) => không tích luỹ listener.
      rateBox.addEventListener('click', e => {
        const r = e.target.closest('[data-rate]');
        if (r && rateBox.contains(r)) { rate(root, +r.dataset.rate); }
      });
    }

    const skip = root.querySelector('#mockSkip');
    if (skip) skip.addEventListener('click', () => rate(root, 0));

    const end = root.querySelector('#mockEnd');
    if (end) end.addEventListener('click', () => {
      if (confirm(L.confirmEnd)) finish(root);
    });

    if (!S.keyCleanup) {
      S.keyCleanup = App.onKey(e => {
        if (S.phase !== 'session') return;
        const k = e.key;
        if (k >= '1' && k <= '5') { e.preventDefault(); rate(root, +k); }
        else if (k === 's' || k === 'S') { e.preventDefault(); toggleAnswer(root); }
      });
    }
  }

  function toggleAnswer(root) {
    const L = t();
    const box = root.querySelector('#mockAnswerBox');
    const btn = root.querySelector('#mockAnswer');
    const d = current().data;
    if (!box) return;
    if (!box.hidden) {
      box.hidden = true; box.innerHTML = '';
      if (btn) btn.textContent = L.showAnswer;
      return;
    }
    const follow = (d.follow && d.follow.length)
      ? '<h4>' + App.esc(L.followTitle || 'Follow-up') + '</h4><ul>' + d.follow.map(f => '<li>' + App.md(f).replace(/^<p>|<\/p>$/g, '') + '</li>').join('') + '</ul>'
      : '';
    box.innerHTML = '<div class="md">' + App.md(d.a) + '</div>' + follow;
    box.hidden = false;
    if (btn) btn.textContent = L.hideAnswer;
    const r = current();
    r.seen = true;
  }

  function showHint(root) {
    const d = current().data;
    const box = root.querySelector('#mockHints');
    if (!box || !d.hints) return;
    const shown = box.querySelectorAll('.mock-hint-item').length;
    if (shown >= d.hints.length) return;
    const item = document.createElement('div');
    item.className = 'mock-hint-item';
    item.innerHTML = '<strong>' + (shown + 1) + '.</strong> ' + App.md(d.hints[shown]).replace(/^<p>|<\/p>$/g, '');
    box.appendChild(item);
    const btn = root.querySelector('#mockHint');
    if (btn && shown + 1 >= d.hints.length) btn.disabled = true;
  }

  function toggleSolution(root) {
    const d = current().data;
    const box = root.querySelector('#mockSolutionBox');
    if (!box) return;
    if (!box.hidden) { box.hidden = true; return; }
    box.innerHTML = '<div class="md">' + App.md(d.solution) + '</div>' +
      (d.complexity ? '<p class="muted small">' + App.esc(d.complexity) + '</p>' : '');
    box.hidden = false;
  }

  // ---------- speech (optional) ----------
  function toggleMic(root, btn) {
    const L = t();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const note = root.querySelector('#mockNote');
    if (S.mic) {
      try { S.mic.stop(); } catch (e) { /* ignore */ }
      stopMic(btn, L);
      return;
    }
    try {
      const rec = new SR();
      rec.lang = S.cfg.english ? 'en-US' : 'vi-VN';
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = e => {
        let txt = '';
        for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript + ' ';
        if (!note) return;
        note.value = (note.value ? note.value + ' ' : '') + txt.trim();
        S.notes[current().data.id] = note.value;
      };
      rec.onend = () => stopMic(btn, L);
      rec.onerror = () => stopMic(btn, L);
      rec.start();
      S.mic = rec;
      btn.textContent = '⏹ ' + L.micStop;
      btn.classList.add('warn');
    } catch (e) {
      stopMic(btn, L);
    }
  }

  function stopMic(btn, L) {
    S.mic = null;
    if (btn) { btn.textContent = '🎤 ' + L.mic; btn.classList.remove('warn'); }
  }

  // ---------- flow ----------
  function rate(root, score) {
    if (S.phase !== 'session') return;
    const it = current();
    const spent = Math.round((Date.now() - S.qStart) / 1000);
    S.results.push({
      id: it.data.id,
      kind: it.kind,
      topic: it.kind === 'algo' ? 'algorithm' : it.data.topic,
      score: score,
      seconds: Math.max(0, spent),
      seen: !!it.seen,
      note: S.notes[it.data.id] || ''
    });
    if (score >= 4) App.store.setStatus(it.data.id, 'known');
    else if (score === 3) App.store.setStatus(it.data.id, 'review');
    else App.store.setStatus(it.data.id, 'unknown');
    if (it.kind === 'algo') App.store.log('algo');
    next(root);
  }

  function next(root) {
    stopTimer();
    if (S.idx >= S.items.length - 1) { finish(root); return; }
    S.idx += 1;
    showQuestion(root);
  }

  // ---------- summary ----------
  function finish(root) {
    stopTimer();
    if (S.mic) { try { S.mic.stop(); } catch (e) { /* ignore */ } S.mic = null; }
    S.phase = 'summary';

    const res = S.results;
    // Câu bị bỏ qua tính 0 điểm => có tính vào điểm trung bình.
    const scored = res;
    const avg = scored.length ? scored.reduce((s, r) => s + r.score, 0) / scored.length : 0;
    const totalSec = res.reduce((s, r) => s + r.seconds, 0);
    const seen = res.filter(r => r.seen).length;

    // per topic
    const byTopic = {};
    res.forEach(r => {
      if (!byTopic[r.topic]) byTopic[r.topic] = { sum: 0, n: 0 };
      byTopic[r.topic].sum += r.score;
      byTopic[r.topic].n++;
    });
    const topicRows = Object.keys(byTopic).map(id => {
      const g = byTopic[id];
      const a = g.n ? g.sum / g.n : 0;
      return { id: id, avg: a, n: g.n, name: id === 'algorithm' ? t().codingName : App.topic(id).name };
    }).sort((x, y) => x.avg - y.avg);
    const weak = topicRows.filter(x => x.avg < 3);

    // coding scored separately
    const coding = res.filter(r => r.kind === 'algo');
    const codingAvg = coding.length ? coding.reduce((s, r) => s + r.score, 0) / coding.length : 0;

    if (!res.length) {
      // Kết thúc sớm ngay khi bắt đầu: không ghi lịch sử rỗng.
      S.phase = 'setup';
      renderSetup(root);
      return;
    }

    App.store.addMockResult({
      count: res.length,
      avg: Math.round(avg * 10) / 10,
      topics: topicRows.map(x => x.id),
      seconds: totalSec,
      english: !!S.cfg.english
    });

    renderSummary(root, { res: res, avg: avg, totalSec: totalSec, seen: seen, topicRows: topicRows, weak: weak, coding: coding, codingAvg: codingAvg });
  }

  function renderSummary(root, sum) {
    const L = t();
    const rows = sum.res.map(r => {
      const d = r.kind === 'algo'
        ? App.algos().find(a => a.id === r.id)
        : App.questions().find(q => q.id === r.id);
      const tname = r.kind === 'algo' ? t().codingName : App.topic(r.topic).name;
      const badge = r.score >= 4 ? 'ok' : r.score === 3 ? 'warn' : r.score > 0 ? 'bad' : '';
      return '<details class="card mock-recap-item"><summary>' +
        '<span class="badge ' + badge + '">' + r.score + '/5</span> ' +
        '<span class="mock-recap-q">' + App.esc(d ? (d.q || d.title) : r.id) + '</span>' +
        '<span class="muted small">' + App.esc(tname) + ' · ' + fmtClock(r.seconds) + '</span>' +
        '</summary>' +
        (r.note ? '<div class="mock-recap-note"><strong>' + App.esc(L.notes) + ':</strong> ' + App.esc(r.note) + '</div>' : '') +
        (d && d.a ? '<div class="md">' + App.md(d.a) + '</div>' : '') +
        (d && d.solution ? '<div class="md">' + App.md(d.solution) + '</div>' : '') +
        '</details>';
    }).join('');

    const bars = sum.topicRows.map(x => {
      const pct = Math.round(x.avg / 5 * 100);
      const cls = x.avg >= 4 ? 'ok' : x.avg >= 3 ? 'warn' : 'bad';
      return '<div class="mock-bar-row"><span class="mock-bar-label">' + App.esc(x.name) + '</span>' +
        '<span class="progress"><i class="' + cls + '" style="width:' + pct + '%"></i></span>' +
        '<span class="mock-bar-val">' + x.avg.toFixed(1) + '</span></div>';
    }).join('');

    const weakList = sum.weak.length
      ? '<ul class="mock-weak-list">' + sum.weak.map(x => '<li>' + App.esc(x.name) + ' — ' + x.avg.toFixed(1) + '/5</li>').join('') + '</ul>'
      : '<p class="muted">' + App.esc(L.noWeak) + '</p>';

    root.innerHTML =
      '<div class="page-head"><div><h1>' + App.esc(L.summary) + '</h1></div>' +
        '<div class="row"><button type="button" class="btn" id="mockRetryWeak">' + App.esc(L.retryWeak) + '</button>' +
        '<button type="button" class="btn primary" id="mockNew">' + App.esc(L.newSession) + '</button></div></div>' +

      '<div class="grid mock-stats">' +
        '<div class="stat"><div class="num">' + sum.avg.toFixed(1) + '/5</div><div class="lbl">' + App.esc(L.avg) + '</div></div>' +
        '<div class="stat"><div class="num">' + fmtClock(sum.totalSec) + '</div><div class="lbl">' + App.esc(L.totalTime) + '</div></div>' +
        '<div class="stat"><div class="num">' + sum.seen + '</div><div class="lbl">' + App.esc(L.seenAnswers) + '</div></div>' +
        '<div class="stat"><div class="num">' + sum.res.length + '</div><div class="lbl">' + App.esc(L.count) + '</div></div>' +
      '</div>' +

      (sum.coding.length ? '<section class="card mock-coding-summary"><h3>' + App.esc(L.codingRound) + '</h3>' +
        '<p class="muted">' + sum.coding.length + ' ' + App.esc(L.algoCount) + ' · ' + sum.codingAvg.toFixed(1) + '/5</p></section>' : '') +

      '<div class="mock-summary-grid">' +
        '<section class="card"><h3>' + App.esc(L.byTopic) + '</h3>' + (bars || '<p class="muted">—</p>') + '</section>' +
        '<section class="card"><h3>' + App.esc(L.weak) + '</h3>' + weakList + '</section>' +
      '</div>' +

      '<section class="stack mock-recap">' +
        '<h3>' + App.esc(L.recapTitle) + '</h3>' + (rows || '<p class="muted">—</p>') +
      '</section>';

    const rw = root.querySelector('#mockRetryWeak');
    if (rw) rw.addEventListener('click', () => retryWeak(root));
    const nb = root.querySelector('#mockNew');
    if (nb) nb.addEventListener('click', () => { S.phase = 'setup'; renderSetup(root); });
  }

  function retryWeak(root) {
    const weakIds = [];
    S.results.forEach(r => {
      if (r.score < 3) weakIds.push(r.id); // gồm cả câu bị bỏ qua (0 điểm)
    });
    if (!weakIds.length) { S.phase = 'setup'; renderSetup(root); return; }
    const items = [];
    weakIds.forEach(id => {
      const q = App.questions().find(x => x.id === id);
      if (q) items.push({ kind: 'q', data: q });
      else {
        const a = App.algos().find(x => x.id === id);
        if (a) items.push({ kind: 'algo', data: a });
      }
    });
    S.items = items;
    S.idx = 0;
    S.notes = {};
    S.results = [];
    S.sessionStart = Date.now();
    S.phase = 'session';
    showQuestion(root);
  }

  // ---------- register ----------
  App.registerView('mock', {
    title: 'Phỏng vấn thử',
    render(root, params) {
      S.setupBound = false;
      S.sessionBound = false;
      S.phase = 'setup';
      renderSetup(root);

      const onBeforeUnload = e => {
        if (S.phase === 'session') {
          e.preventDefault();
          e.returnValue = '';
          return '';
        }
      };
      window.addEventListener('beforeunload', onBeforeUnload);

      return () => {
        stopTimer();
        if (S.mic) { try { S.mic.stop(); } catch (e) { /* ignore */ } S.mic = null; }
        if (S.keyCleanup) { S.keyCleanup(); S.keyCleanup = null; }
        window.removeEventListener('beforeunload', onBeforeUnload);
      };
    },
  });
})();
