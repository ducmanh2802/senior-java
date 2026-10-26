/* View "mock" — owner: task T11. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'mock.setup': 'Thiết lập phỏng vấn thử', 'mock.subtitle': 'Chọn preset, chủ đề, độ khó và thời lượng để luyện phỏng vấn như thật.', 'mock.preset': 'Preset', 'mock.topics': 'Chủ đề', 'mock.level': 'Độ khó', 'mock.count': 'Số câu', 'mock.minutes': 'Thời gian mỗi câu', 'mock.preferUnseen': 'Ưu tiên câu tôi chưa thuộc', 'mock.addCoding': 'Thêm vòng coding', 'mock.codingCount': 'Số bài coding', 'mock.codingDiff': 'Độ khó coding', 'mock.available': 'câu khả dụng', 'mock.start': 'Bắt đầu phỏng vấn', 'mock.noMatch': 'Không có câu nào phù hợp với lựa chọn hiện tại. Hãy nới lọc hoặc bổ sung câu hỏi.', 'mock.all': 'Tất cả', 'mock.notes': 'Câu trả lời của bạn', 'mock.showAnswer': 'Xem đáp án mẫu', 'mock.hideAnswer': 'Ẩn đáp án mẫu', 'mock.selfRate': 'Tự chấm điểm', 'mock.skip': 'Bỏ qua', 'mock.end': 'Kết thúc sớm', 'mock.overTime': 'Quá giờ', 'mock.hint': 'Gợi ý', 'mock.solution': 'Xem lời giải', 'mock.editor': 'Code của bạn', 'mock.summary': 'Tổng kết phỏng vấn', 'mock.avg': 'Điểm trung bình', 'mock.totalTime': 'Tổng thời gian', 'mock.seenAnswers': 'Đáp án mẫu đã xem', 'mock.byTopic': 'Điểm theo chủ đề', 'mock.weak': 'Chủ đề cần cải thiện', 'mock.retryWeak': 'Phỏng vấn lại các câu yếu', 'mock.newSession': 'Phiên mới', 'mock.backSetup': 'Quay lại thiết lập', 'mock.codingRound': 'Vòng coding', 'mock.perQuestion': 'mỗi câu', 'mock.rateHelp': 'Nhấn 1–5 để chấm nhanh (khi không gõ trong ô trả lời).', 'mock.scored': 'Điểm', 'mock.topic': 'Chủ đề', 'mock.difficulty': 'Độ khó', 'mock.mic': 'Đọc chính tả', 'mock.micStop': 'Dừng ghi âm', 'mock.voice': 'Trả lời bằng giọng nói', 'mock.voiceHint': 'Mục tiêu: 1–2 phút, 110–160 từ/phút, ít từ đệm', 'mock.gradeAI': 'Chấm bằng AI', 'mock.grading': 'AI đang chấm…', 'mock.followup': 'Trả lời câu hỏi đào sâu', 'mock.followupTitle': 'Câu hỏi đào sâu', 'mock.aiSuggest': 'AI gợi ý {n}/5 — bấm nút để xác nhận', 'mock.aiAvg': 'Điểm AI trung bình', 'mock.aiCol': 'AI', 'mock.score': 'Điểm', 'mock.time': 'Thời gian', 'mock.algoCount': 'Bài coding', 'mock.noWeak': 'Chưa có chủ đề nào dưới 3 điểm. Tốt lắm!', 'mock.confirmEnd': 'Kết thúc phiên phỏng vấn sớm? Kết quả vẫn được lưu.', 'mock.confirmLeave': 'Bạn đang trong phiên phỏng vấn. Thoát ra sẽ mất tiến độ phiên này.', 'mock.followTitle': 'Câu hỏi đào sâu thường gặp', 'mock.recapTitle': 'Chi tiết từng câu', 'mock.codingName': 'Coding', 'mock.question': 'Câu', 'mock.presetScenario': 'Tình huống thực tế',
    },
    en: {
      'mock.setup': 'Mock interview setup', 'mock.subtitle': 'Pick a preset, topics, level and time per question to practise like a real interview.', 'mock.preset': 'Preset', 'mock.topics': 'Topics', 'mock.level': 'Level', 'mock.count': 'Questions', 'mock.minutes': 'Minutes per question', 'mock.preferUnseen': 'Prioritise questions I do not know yet', 'mock.addCoding': 'Add a coding round', 'mock.codingCount': 'Number of coding problems', 'mock.codingDiff': 'Coding difficulty', 'mock.available': 'questions available', 'mock.start': 'Start interview', 'mock.noMatch': 'No question matches the current selection. Relax the filters or add more questions.', 'mock.all': 'All', 'mock.notes': 'Your answer', 'mock.showAnswer': 'Show sample answer', 'mock.hideAnswer': 'Hide sample answer', 'mock.selfRate': 'Self rate', 'mock.skip': 'Skip', 'mock.end': 'End early', 'mock.overTime': 'Over time', 'mock.hint': 'Hint', 'mock.solution': 'Show solution', 'mock.editor': 'Your code', 'mock.summary': 'Interview summary', 'mock.avg': 'Average score', 'mock.totalTime': 'Total time', 'mock.seenAnswers': 'Sample answers viewed', 'mock.byTopic': 'Score by topic', 'mock.weak': 'Topics to improve', 'mock.retryWeak': 'Re-mock weak questions', 'mock.newSession': 'New session', 'mock.backSetup': 'Back to setup', 'mock.codingRound': 'Coding round', 'mock.perQuestion': 'per question', 'mock.rateHelp': 'Press 1-5 to score quickly (when not typing in the answer box).', 'mock.scored': 'Score', 'mock.topic': 'Topic', 'mock.difficulty': 'Difficulty', 'mock.mic': 'Dictate', 'mock.micStop': 'Stop recording', 'mock.voice': 'Answer with voice', 'mock.voiceHint': 'Target: 1-2 minutes, 110-160 words/min, few filler words', 'mock.gradeAI': 'Grade with AI', 'mock.grading': 'AI is grading…', 'mock.followup': 'Answer follow-up', 'mock.followupTitle': 'Follow-up question', 'mock.aiSuggest': 'AI suggests {n}/5 — click the button to confirm', 'mock.aiAvg': 'Average AI score', 'mock.aiCol': 'AI', 'mock.score': 'Score', 'mock.time': 'Time', 'mock.algoCount': 'Coding problems', 'mock.noWeak': 'No topic below 3 points. Nice work!', 'mock.confirmEnd': 'End the interview early? The result will still be saved.', 'mock.confirmLeave': 'You are in the middle of an interview. Leaving loses this session.', 'mock.followTitle': 'Typical follow-up questions', 'mock.recapTitle': 'Question by question', 'mock.codingName': 'Coding', 'mock.question': 'Question', 'mock.presetScenario': 'Real scenarios',
    },
  });

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
  const MAX_FOLLOWUPS = 2; // tối đa 2 lượt hỏi đào sâu cho mỗi câu

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
    notes: 'Câu trả lời của bạn',
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
    rateHelp: 'Nhấn 1–5 để chấm nhanh (khi không gõ trong ô trả lời).',
    scored: 'Điểm',
    topic: 'Chủ đề',
    difficulty: 'Độ khó',
    mic: 'Đọc chính tả',
    micStop: 'Dừng ghi âm',
    voice: 'Trả lời bằng giọng nói',
    voiceHint: 'Mục tiêu: 1–2 phút, 110–160 từ/phút, ít từ đệm',
    gradeAI: 'Chấm bằng AI',
    grading: 'AI đang chấm…',
    followup: 'Trả lời câu hỏi đào sâu',
    followupTitle: 'Câu hỏi đào sâu',
    aiSuggest: 'AI gợi ý {n}/5 — bấm nút để xác nhận',
    aiAvg: 'Điểm AI trung bình',
    aiCol: 'AI',
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
    notes: 'Your answer',
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
    rateHelp: 'Press 1-5 to score quickly (when not typing in the answer box).',
    scored: 'Score',
    topic: 'Topic',
    difficulty: 'Difficulty',
    mic: 'Dictate',
    micStop: 'Stop recording',
    voice: 'Answer with voice',
    voiceHint: 'Target: 1-2 minutes, 110-160 words/min, few filler words',
    gradeAI: 'Grade with AI',
    grading: 'AI is grading…',
    followup: 'Answer follow-up',
    followupTitle: 'Follow-up question',
    aiSuggest: 'AI suggests {n}/5 — click the button to confirm',
    aiAvg: 'Average AI score',
    aiCol: 'AI',
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
    speech: {},      // id -> metrics {seconds, words, wpm, fillers}
    aiState: {},    // id -> { result, error, busy, followups: [] }
    results: [],
    sessionStart: 0,
    qStart: 0,
    limit: 0,
    deadline: 0,
    timer: null,
    keyCleanup: null,
    beforeUnload: null,
    rec: null,      // phiên ghi âm đang chạy: { handle, btn, ta, base, box, id, fuIdx, label }
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

    const presetChips = PRESETS.map(p => chip(p.id === 'scenario' ? App.t('mock.presetScenario') : p.label, S.cfg.preset === p.id, 'data-preset="' + p.id + '"')).join('');
    const topicChips = allTopics.map(tp => chip(tp.icon + ' ' + tp.name, S.cfg.topics.indexOf(tp.id) !== -1, 'data-topic="' + tp.id + '"')).join('');
    const levelChips = [['all', App.t('mock.all')], ['mid', App.LEVELS.mid], ['senior', App.LEVELS.senior], ['lead', App.LEVELS.lead]]
      .map(p => chip(p[1], S.cfg.level === p[0], 'data-level="' + p[0] + '"')).join('');
    const countChips = COUNTS.map(n => chip(String(n), S.cfg.count === n, 'data-count="' + n + '"')).join('');
    const minChips = MINUTES.map(n => chip(n + '′', S.cfg.minutes === n, 'data-minutes="' + n + '"')).join('');
    const ccChips = CODING_COUNTS.map(n => chip(String(n), S.cfg.codingCount === n, 'data-ccount="' + n + '"')).join('');
    const diffChips = DIFFS.map(d => chip(d, S.cfg.codingDiff === d, 'data-cdiff="' + d + '"')).join('');

    root.innerHTML =
      '<div class="page-head"><div><h1>' + App.esc(App.t('mock.setup')) + '</h1><p>' + App.esc(App.t('mock.subtitle')) + '</p></div></div>' +
      '<div class="mock-setup stack">' +
        '<section class="card"><h3>' + App.esc(App.t('mock.preset')) + '</h3><div class="chips">' + presetChips + '</div></section>' +

        '<section class="card"><h3>' + App.esc(App.t('mock.topics')) + '</h3><div class="chips">' + topicChips + '</div>' +
          '<div class="mock-row"><h4>' + App.esc(App.t('mock.level')) + '</h4><div class="chips">' + levelChips + '</div></div>' +
          '<div class="mock-row"><h4>' + App.esc(App.t('mock.count')) + '</h4><div class="chips">' + countChips + '</div></div>' +
          '<div class="mock-row"><h4>' + App.esc(App.t('mock.minutes')) + '</h4><div class="chips">' + minChips + '</div></div>' +
          '<label class="mock-check"><input type="checkbox" id="mockUnseen"' + (S.cfg.preferUnseen ? ' checked' : '') + '> ' + App.esc(App.t('mock.preferUnseen')) + '</label>' +
        '</section>' +

        '<section class="card"><h3>' + App.esc(App.t('mock.codingRound')) + '</h3>' +
          '<label class="mock-check"><input type="checkbox" id="mockCoding"' + (S.cfg.coding ? ' checked' : '') + '> ' + App.esc(App.t('mock.addCoding')) + '</label>' +
          '<div class="mock-row"><h4>' + App.esc(App.t('mock.codingCount')) + '</h4><div class="chips">' + ccChips + '</div></div>' +
          '<div class="mock-row"><h4>' + App.esc(App.t('mock.codingDiff')) + '</h4><div class="chips">' + diffChips + '</div></div>' +
        '</section>' +

        '<div class="mock-actions">' +
          '<button type="button" class="btn primary lg" id="mockStart"' + (total ? '' : ' disabled') + '>' + App.esc(App.t('mock.start')) + '</button>' +
          '<span class="mock-avail">' + total + ' ' + App.esc(App.t('mock.available')) + '</span>' +
        '</div>' +
        (total ? '' : '<p class="mock-warn">' + App.esc(App.t('mock.noMatch')) + '</p>') +
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
    S.speech = {};
    S.aiState = {};
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
    el.textContent = (left < 0 ? App.t('mock.overTime') + ' ' : '') + fmtClock(left);
    el.classList.toggle('warn', left >= 0 && left < 30);
    el.classList.toggle('bad', left < 0);
  }

  function showQuestion(root) {
    const L = t();
    stopRecording();
    const it = current();
    const isAlgo = it.kind === 'algo';
    const d = it.data;
    const n = S.items.length;
    const pos = S.idx + 1;
    const tp = isAlgo ? { id: 'algorithm', name: App.t('mock.codingName'), icon: '💻' } : App.topic(d.topic);
    const lvl = isAlgo ? d.difficulty : (App.LEVELS[d.level] || d.level);
    const noteVal = S.notes[d.id] || '';
    const speechSupported = !!App.speech.supported;

    root.innerHTML =
      '<div class="mock-session">' +
        '<header class="mock-head card">' +
          '<div class="mock-head-top">' +
            '<div><strong>' + App.esc(App.t('mock.question')) + ' ' + pos + ' / ' + n + '</strong>' +
              '<div class="mock-meta"><span class="badge">' + App.esc(tp.name) + '</span>' +
              '<span class="badge">' + App.esc(String(lvl)) + '</span>' +
              (isAlgo ? '<span class="badge accent">' + App.esc(App.t('mock.codingRound')) + '</span>' : '') + '</div></div>' +
            '<div class="mock-timer" id="mockTimer" role="timer">--:--</div>' +
          '</div>' +
          '<div class="mock-progress"><i style="width:' + Math.round(pos / n * 100) + '%"></i></div>' +
        '</header>' +

        '<section class="card mock-q">' +
          '<div class="md mock-q-text"' + (d.lang === 'en' ? ' lang="en"' : '') + '>' +
            (isAlgo ? App.md(d.prompt) : App.md(d.q)) +
          '</div>' +

          (isAlgo ? renderAlgoExtra(d, L) : '') +

          '<label class="field mock-notes"><span>' + App.esc(isAlgo ? App.t('mock.editor') : App.t('mock.notes')) + '</span>' +
            '<textarea class="textarea' + (isAlgo ? ' mock-editor' : '') + '" id="mockNote" rows="6" placeholder="">' + App.esc(noteVal) + '</textarea>' +
          '</label>' +
          (isAlgo ? '' : '<p class="mock-voice-hint muted small">🎯 ' + App.esc(App.t('mock.voiceHint')) + '</p>') +
          '<div class="row mock-tools">' +
            (isAlgo ? '' : '<button type="button" class="btn" id="mockAnswer">' + App.esc(App.t('mock.showAnswer')) + '</button>') +
            '<button type="button" class="btn mic-btn" id="mockMic"' + (speechSupported ? '' : ' hidden') + '>🎤 ' + App.esc(isAlgo ? App.t('mock.mic') : App.t('mock.voice')) + '</button>' +
            (isAlgo ? '' : '<button type="button" class="btn primary" id="mockAi" disabled>🤖 ' + App.esc(App.t('mock.gradeAI')) + '</button>') +
          '</div>' +
          '<div id="mockSpeechBox" class="mock-speech"></div>' +
          (isAlgo ? '' : '<div id="mockAiBox" class="mock-ai"></div><div id="mockFollowups" class="mock-followups"></div>') +
          '<div id="mockAnswerBox" class="mock-answer" hidden></div>' +
        '</section>' +

        renderRating(L) +
        '<div class="row mock-actions-row">' +
          '<button type="button" class="btn warn" id="mockSkip">' + App.esc(App.t('mock.skip')) + '</button>' +
          '<span class="spacer"></span>' +
          '<button type="button" class="btn bad" id="mockEnd">' + App.esc(App.t('mock.end')) + '</button>' +
        '</div>' +
      '</div>';

    bindSession(root);
    renderAiPanel(root);
    renderFollowups(root);
    updateAiButtons(root);
    // Quay lại câu đã chấm => khôi phục gợi ý điểm tự chấm.
    if (!isAlgo) {
      const st = aiStateFor(d.id);
      if (st.result) suggestRate(root, st.result.score);
    }
    startTimer(root);
  }

  function renderAlgoExtra(d, L) {
    let html = '<div class="mock-algo">' +
      '<div class="row mock-algo-row"><button type="button" class="btn sm" id="mockHint">' + App.esc(App.t('mock.hint')) + '</button>' +
      '<button type="button" class="btn sm" id="mockSolution">' + App.esc(App.t('mock.solution')) + '</button></div>' +
      '<div id="mockHints" class="mock-hints"></div><div id="mockSolutionBox" class="mock-solution" hidden></div></div>';
    return html;
  }

  function renderRating(L) {
    let btns = '';
    for (let i = 1; i <= 5; i++) {
      btns += '<button type="button" class="btn mock-rate" data-rate="' + i + '" aria-label="' + i + ' / 5">' + i + '</button>';
    }
    return '<section class="card mock-rate-box"><div class="row"><strong>' + App.esc(App.t('mock.selfRate')) + '</strong>' +
      '<span class="spacer"></span><span class="muted small">' + App.esc(App.t('mock.rateHelp')) + '</span></div>' +
      '<div class="mock-rate-row">' + btns + '</div>' +
      '<p class="mock-ai-suggest small" id="mockAiSuggest"></p></section>';
  }

  // ---------- session events ----------
  function bindSession(root) {
    const it = current();
    const d = it.data;
    const L = t();

    const note = root.querySelector('#mockNote');
    if (note) {
      note.addEventListener('input', () => { S.notes[d.id] = note.value; updateAiButtons(root); });
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

    const aiBtn = root.querySelector('#mockAi');
    if (aiBtn) aiBtn.addEventListener('click', () => gradeAnswer(root));

    // Vùng hỏi đào sâu: delegation (container được dựng lại mỗi câu) => không tích luỹ listener.
    const fuBox = root.querySelector('#mockFollowups');
    if (fuBox) {
      fuBox.addEventListener('click', e => {
        const add = e.target.closest('#mockAddFu');
        if (add) { addFollowup(root); return; }
        const g = e.target.closest('[data-fu-grade]');
        if (g) { gradeFollowup(root, +g.dataset.fuGrade); return; }
        const m = e.target.closest('[data-fu-mic]');
        if (m) { toggleMic(root, m, +m.dataset.fuMic); }
      });
      fuBox.addEventListener('input', e => {
        const ta = e.target.closest('[data-fu-note]');
        if (!ta) return;
        const st = aiStateFor(d.id);
        const fu = st.followups[+ta.dataset.fuNote];
        if (fu) fu.answer = ta.value;
        updateAiButtons(root);
      });
    }

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
      if (confirm(App.t('mock.confirmEnd'))) finish(root);
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
      if (btn) btn.textContent = App.t('mock.showAnswer');
      return;
    }
    const follow = (d.follow && d.follow.length)
      ? '<h4>' + App.esc(App.t('mock.followTitle') || 'Follow-up') + '</h4><ul>' + d.follow.map(f => '<li>' + App.md(f).replace(/^<p>|<\/p>$/g, '') + '</li>').join('') + '</ul>'
      : '';
    box.innerHTML = '<div class="md">' + App.md(d.a) + '</div>' + follow;
    box.hidden = false;
    if (btn) btn.textContent = App.t('mock.hideAnswer');
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

  // ---------- speech: trả lời bằng giọng nói ----------
  /** 'en' khi câu hỏi tiếng Anh hoặc phiên đang ở chế độ English. */
  function answerLang() {
    const it = current();
    if (!it) return 'vi';
    if (it.kind === 'algo') return S.cfg.english ? 'en' : 'vi';
    if (it.data.lang === 'en' || S.cfg.english) return 'en';
    return 'vi';
  }

  function toggleMic(root, btn, fuIdx) {
    if (S.rec) {
      if (S.rec.btn === btn) { stopRecording(); return; }
      stopRecording(); // bấm mic khác => dừng lượt đang ghi rồi ghi lượt mới
    }
    if (!App.speech.supported) return;
    const it = current();
    if (!it) return;
    const ta = fuIdx === undefined
      ? root.querySelector('#mockNote')
      : root.querySelector('[data-fu-note="' + fuIdx + '"]');
    const box = fuIdx === undefined
      ? root.querySelector('#mockSpeechBox')
      : root.querySelector('[data-fu-speech="' + fuIdx + '"]');
    if (!ta) return;
    startRecording(btn, ta, box, it.data.id, fuIdx);
  }

  function startRecording(btn, ta, box, id, fuIdx) {
    const L = t();
    const base = ta.value || '';
    const label = btn.textContent;
    let handle = null;
    try {
      handle = App.speech.start({
        lang: answerLang(),
        onText: (final, interim) => {
          // final đã chốt + interim nối tạm => câu chữ hiện dần trong textarea.
          const tail = [final, interim].filter(Boolean).join(' ').trim();
          ta.value = (base ? base + ' ' : '') + tail;
          saveAnswer(id, fuIdx, ta.value);
        },
        onError: (msg) => {
          if (box) box.innerHTML = '<div class="ai-error">⚠️ ' + App.esc(msg) + '</div>';
        },
      });
    } catch (e) {
      if (box) box.innerHTML = App.ui.error(e);
      return;
    }
    S.rec = { handle: handle, btn: btn, ta: ta, box: box, id: id, fuIdx: fuIdx, base: base, label: label };
    btn.textContent = '⏹ ' + App.t('mock.micStop');
    btn.classList.add('recording');
  }

  function stopRecording() {
    const r = S.rec;
    if (!r) return;
    S.rec = null;
    let metrics = null;
    try { metrics = r.handle.stop(); } catch (e) { metrics = null; }
    if (r.btn) {
      r.btn.textContent = r.label;
      r.btn.classList.remove('recording');
    }
    if (!metrics) return;
    r.ta.value = (r.base ? r.base + ' ' : '') + (metrics.text || '');
    saveAnswer(r.id, r.fuIdx, r.ta.value);
    if (r.fuIdx === undefined) {
      S.speech[r.id] = metrics;
    } else {
      const st = aiStateFor(r.id);
      const fu = st.followups[r.fuIdx];
      if (fu) fu.speech = metrics;
    }
    if (r.box) r.box.innerHTML = App.ui.speechStats(metrics);
  }

  /** Lưu câu trả lời (ô chính hoặc ô đào sâu) vào state của câu đang xét. */
  function saveAnswer(id, fuIdx, value) {
    if (fuIdx === undefined) { S.notes[id] = value; return; }
    const st = aiStateFor(id);
    const fu = st.followups[fuIdx];
    if (fu) fu.answer = value;
  }

  // ---------- AI chấm câu trả lời ----------
  function aiStateFor(id) {
    if (!S.aiState[id]) S.aiState[id] = { result: null, error: null, busy: false, followups: [] };
    return S.aiState[id];
  }

  function isCurrent(id) {
    const it = current();
    return !!it && it.data.id === id;
  }

  function updateAiButtons(root) {
    const it = current();
    if (!it || it.kind === 'algo') return;
    const d = it.data;
    const st = aiStateFor(d.id);
    const btn = root.querySelector('#mockAi');
    if (btn) btn.disabled = st.busy || !((S.notes[d.id] || '').trim());
    st.followups.forEach((fu, i) => {
      const b = root.querySelector('[data-fu-grade="' + i + '"]');
      if (b) b.disabled = st.busy || !((fu.answer || '').trim());
    });
  }

  function renderAiPanel(root) {
    const it = current();
    if (!it || it.kind === 'algo') return;
    const box = root.querySelector('#mockAiBox');
    if (!box) return;
    const st = aiStateFor(it.data.id);
    if (st.error) { box.innerHTML = App.ui.error(st.error); return; }
    box.innerHTML = st.result ? App.ui.feedback(st.result, answerLang()) : '';
  }

  /** Gợi ý điểm tự chấm 1–5 theo điểm AI (người dùng vẫn phải bấm để xác nhận). */
  function suggestRate(root, score) {
    const L = t();
    const box = root.querySelector('.mock-rate-box');
    if (!box) return;
    const n = Math.min(5, Math.max(1, Math.round(Number(score) || 0)));
    box.querySelectorAll('.mock-rate').forEach(b => b.classList.remove('suggested'));
    const btn = box.querySelector('.mock-rate[data-rate="' + n + '"]');
    if (btn) btn.classList.add('suggested');
    const hint = box.querySelector('#mockAiSuggest');
    if (hint) hint.textContent = App.t('mock.aiSuggest', { n });
  }

  async function gradeAnswer(root) {
    const L = t();
    const it = current();
    if (!it || it.kind === 'algo') return;
    const d = it.data;
    const answer = (S.notes[d.id] || '').trim();
    if (!answer) return;
    const st = aiStateFor(d.id);
    const box = root.querySelector('#mockAiBox');
    st.busy = true;
    if (box) box.innerHTML = '<span class="ai-loading">' + App.esc(App.t('mock.grading')) + '</span>';
    updateAiButtons(root);
    try {
      const res = await App.ai.grade({
        question: d.q,
        reference: d.a,
        answer: answer,
        lang: answerLang(),
        topic: d.topic,
        level: d.level,
        speech: S.speech[d.id] || undefined
      });
      st.result = res;
      st.error = null;
      if (isCurrent(d.id)) { renderAiPanel(root); renderFollowups(root); suggestRate(root, res.score); }
    } catch (e) {
      st.result = null;
      st.error = e;
      if (isCurrent(d.id) && box) box.innerHTML = App.ui.error(e);
    } finally {
      st.busy = false;
      if (isCurrent(d.id)) updateAiButtons(root);
    }
  }

  // ---------- hỏi đào sâu ----------
  /** Câu hỏi đào sâu kế tiếp (lấy từ follow_up của kết quả AI gần nhất). */
  function nextFollowupQuestion(st) {
    let last = null;
    if (st.followups.length) {
      const lastRound = st.followups[st.followups.length - 1];
      // Lượt cuối chưa được chấm => chưa có câu đào sâu mới để trả lời.
      if (!lastRound.result) return '';
      last = lastRound.result;
    } else {
      last = st.result;
    }
    return last && last.follow_up ? String(last.follow_up) : '';
  }

  function renderFollowups(root) {
    const L = t();
    const box = root.querySelector('#mockFollowups');
    if (!box) return;
    const it = current();
    if (!it || it.kind === 'algo') { box.innerHTML = ''; return; }
    const d = it.data;
    const st = aiStateFor(d.id);
    const en = answerLang() === 'en' ? ' lang="en"' : '';
    let html = '';
    st.followups.forEach((fu, i) => {
      html += '<section class="mock-fu">' +
        '<div class="mock-fu-head"><span class="badge accent">' + App.esc(App.t('mock.followupTitle')) + ' ' + (i + 1) + '</span></div>' +
        '<div class="md mock-fu-q"' + en + '>' + App.md(fu.question) + '</div>' +
        '<textarea class="textarea mock-fu-note" rows="4" data-fu-note="' + i + '" placeholder="">' + App.esc(fu.answer || '') + '</textarea>' +
        '<div class="row mock-fu-tools">' +
          '<button type="button" class="btn mic-btn" data-fu-mic="' + i + '"' + (App.speech.supported ? '' : ' hidden') + '>🎤 ' + App.esc(App.t('mock.voice')) + '</button>' +
          '<button type="button" class="btn primary" data-fu-grade="' + i + '" disabled>🤖 ' + App.esc(App.t('mock.gradeAI')) + '</button>' +
        '</div>' +
        '<div class="mock-fu-speech" data-fu-speech="' + i + '">' + (fu.speech ? App.ui.speechStats(fu.speech) : '') + '</div>' +
        '<div class="mock-fu-ai" data-fu-ai="' + i + '">' + (fu.result ? App.ui.feedback(fu.result, answerLang()) : '') + (fu.error ? App.ui.error(fu.error) : '') + '</div>' +
        '</section>';
    });
    if (st.followups.length < MAX_FOLLOWUPS && nextFollowupQuestion(st)) {
      html += '<button type="button" class="btn mock-fu-add" id="mockAddFu">🎤 ' + App.esc(App.t('mock.followup')) + '</button>';
    }
    box.innerHTML = html;
  }

  function addFollowup(root) {
    const it = current();
    if (!it || it.kind === 'algo') return;
    const st = aiStateFor(it.data.id);
    if (st.followups.length >= MAX_FOLLOWUPS) return;
    const q = nextFollowupQuestion(st);
    if (!q) return;
    st.followups.push({ question: q, answer: '', speech: null, result: null, error: null });
    renderFollowups(root);
    updateAiButtons(root);
  }

  async function gradeFollowup(root, i) {
    const L = t();
    const it = current();
    if (!it || it.kind === 'algo') return;
    const d = it.data;
    const st = aiStateFor(d.id);
    const fu = st.followups[i];
    if (!fu) return;
    const answer = (fu.answer || '').trim();
    if (!answer) return;
    // Lịch sử: lượt đầu + các lượt đào sâu trước đó.
    const history = [];
    const main = (S.notes[d.id] || '').trim();
    if (main) history.push({ question: d.q, answer: main });
    for (let k = 0; k < i; k++) {
      const prev = st.followups[k];
      if (prev && (prev.answer || '').trim()) history.push({ question: prev.question, answer: prev.answer.trim() });
    }
    const box = root.querySelector('[data-fu-ai="' + i + '"]');
    st.busy = true;
    if (box) box.innerHTML = '<span class="ai-loading">' + App.esc(App.t('mock.grading')) + '</span>';
    updateAiButtons(root);
    try {
      const res = await App.ai.grade({
        question: fu.question,
        reference: d.a,
        answer: answer,
        lang: answerLang(),
        topic: d.topic,
        level: d.level,
        history: history,
        speech: fu.speech || undefined
      });
      fu.result = res;
      fu.error = null;
      if (isCurrent(d.id)) renderFollowups(root);
    } catch (e) {
      fu.result = null;
      fu.error = e;
      if (isCurrent(d.id) && box) box.innerHTML = App.ui.error(e);
    } finally {
      st.busy = false;
      if (isCurrent(d.id)) updateAiButtons(root);
    }
  }

  // ---------- flow ----------
  function rate(root, score) {
    if (S.phase !== 'session') return;
    // Dừng ghi âm (nếu đang ghi) để lưu metrics trước khi chốt kết quả câu này.
    stopRecording();
    const it = current();
    const spent = Math.round((Date.now() - S.qStart) / 1000);
    const st = it.kind === 'algo' ? null : aiStateFor(it.data.id);
    S.results.push({
      id: it.data.id,
      kind: it.kind,
      topic: it.kind === 'algo' ? 'algorithm' : it.data.topic,
      score: score,
      seconds: Math.max(0, spent),
      seen: !!it.seen,
      note: S.notes[it.data.id] || '',
      ai: st ? st.result : null,
      aiScore: st && st.result ? st.result.score : null,
      speech: S.speech[it.data.id] || null,
      followups: st ? st.followups.slice() : []
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
    stopRecording();
    S.phase = 'summary';

    const res = S.results;
    // Câu bị bỏ qua tính 0 điểm => có tính vào điểm trung bình.
    const scored = res;
    const avg = scored.length ? scored.reduce((s, r) => s + r.score, 0) / scored.length : 0;
    const totalSec = res.reduce((s, r) => s + r.seconds, 0);
    const seen = res.filter(r => r.seen).length;

    // Điểm AI (chỉ những câu đã được chấm) => null nếu chưa có câu nào được chấm.
    const aiScores = res.filter(r => typeof r.aiScore === 'number').map(r => r.aiScore);
    const aiAvg = aiScores.length ? aiScores.reduce((s, x) => s + x, 0) / aiScores.length : null;
    const aiCount = aiScores.length;

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
      return { id: id, avg: a, n: g.n, name: id === 'algorithm' ? App.t('mock.codingName') : App.topic(id).name };
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
      english: !!S.cfg.english,
      aiAvg: aiAvg === null ? null : Math.round(aiAvg * 10) / 10
    });

    renderSummary(root, {
      res: res, avg: avg, totalSec: totalSec, seen: seen,
      topicRows: topicRows, weak: weak, coding: coding, codingAvg: codingAvg,
      aiAvg: aiAvg, aiCount: aiCount
    });
  }

  function renderSummary(root, sum) {
    const L = t();
    const fbLang = S.cfg.english ? 'en' : 'vi';
    const rows = sum.res.map(r => {
      const d = r.kind === 'algo'
        ? App.algos().find(a => a.id === r.id)
        : App.questions().find(q => q.id === r.id);
      const tname = r.kind === 'algo' ? App.t('mock.codingName') : App.topic(r.topic).name;
      const badge = r.score >= 4 ? 'ok' : r.score === 3 ? 'warn' : r.score > 0 ? 'bad' : '';
      const aiBadge = (typeof r.aiScore === 'number')
        ? '<span class="badge mock-ai-badge ' + (r.aiScore >= 4 ? 'ok' : r.aiScore === 3 ? 'warn' : 'bad') + '">' + App.esc(App.t('mock.aiCol')) + ' ' + r.aiScore + '/5</span>'
        : '';
      const fus = (r.followups || []).map((fu, i) => {
        let h = '<div class="mock-recap-fu"><strong>' + App.esc(App.t('mock.followupTitle')) + ' ' + (i + 1) + ':</strong> ' + App.esc(fu.question);
        if (fu.answer) h += '<div class="mock-recap-note">' + App.esc(fu.answer) + '</div>';
        if (fu.speech) h += '<div class="mock-recap-speech">' + App.ui.speechStats(fu.speech) + '</div>';
        if (fu.result) h += '<div class="mock-recap-ai">' + App.ui.feedback(fu.result, fbLang) + '</div>';
        if (fu.error) h += '<div class="mock-recap-ai">' + App.ui.error(fu.error) + '</div>';
        return h + '</div>';
      }).join('');
      return '<details class="card mock-recap-item"><summary>' +
        '<span class="badge ' + badge + '">' + r.score + '/5</span>' + aiBadge +
        '<span class="mock-recap-q">' + App.esc(d ? (d.q || d.title) : r.id) + '</span>' +
        '<span class="muted small">' + App.esc(tname) + ' · ' + fmtClock(r.seconds) + '</span>' +
        '</summary>' +
        (r.note ? '<div class="mock-recap-note"><strong>' + App.esc(App.t('mock.notes')) + ':</strong> ' + App.esc(r.note) + '</div>' : '') +
        (r.speech ? '<div class="mock-recap-speech">' + App.ui.speechStats(r.speech) + '</div>' : '') +
        (r.ai ? '<div class="mock-recap-ai">' + App.ui.feedback(r.ai, fbLang) + '</div>' : '') +
        fus +
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
      : '<p class="muted">' + App.esc(App.t('mock.noWeak')) + '</p>';

    root.innerHTML =
      '<div class="page-head"><div><h1>' + App.esc(App.t('mock.summary')) + '</h1></div>' +
        '<div class="row"><button type="button" class="btn" id="mockRetryWeak">' + App.esc(App.t('mock.retryWeak')) + '</button>' +
        '<button type="button" class="btn primary" id="mockNew">' + App.esc(App.t('mock.newSession')) + '</button></div></div>' +

      '<div class="grid mock-stats">' +
        '<div class="stat"><div class="num">' + sum.avg.toFixed(1) + '/5</div><div class="lbl">' + App.esc(App.t('mock.avg')) + '</div></div>' +
        '<div class="stat"><div class="num">' + fmtClock(sum.totalSec) + '</div><div class="lbl">' + App.esc(App.t('mock.totalTime')) + '</div></div>' +
        '<div class="stat"><div class="num">' + sum.seen + '</div><div class="lbl">' + App.esc(App.t('mock.seenAnswers')) + '</div></div>' +
        '<div class="stat"><div class="num">' + sum.res.length + '</div><div class="lbl">' + App.esc(App.t('mock.count')) + '</div></div>' +
        (sum.aiAvg === null ? '' :
          '<div class="stat mock-ai-stat"><div class="num">' + sum.aiAvg.toFixed(1) + '/5</div>' +
          '<div class="lbl">' + App.esc(App.t('mock.aiAvg')) + ' (' + sum.aiCount + ')</div></div>') +
      '</div>' +

      (sum.coding.length ? '<section class="card mock-coding-summary"><h3>' + App.esc(App.t('mock.codingRound')) + '</h3>' +
        '<p class="muted">' + sum.coding.length + ' ' + App.esc(App.t('mock.algoCount')) + ' · ' + sum.codingAvg.toFixed(1) + '/5</p></section>' : '') +

      '<div class="mock-summary-grid">' +
        '<section class="card"><h3>' + App.esc(App.t('mock.byTopic')) + '</h3>' + (bars || '<p class="muted">—</p>') + '</section>' +
        '<section class="card"><h3>' + App.esc(App.t('mock.weak')) + '</h3>' + weakList + '</section>' +
      '</div>' +

      '<section class="stack mock-recap">' +
        '<h3>' + App.esc(App.t('mock.recapTitle')) + '</h3>' + (rows || '<p class="muted">—</p>') +
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
    S.speech = {};
    S.aiState = {};
    S.results = [];
    S.sessionStart = Date.now();
    S.phase = 'session';
    showQuestion(root);
  }

  // ---------- register ----------
  App.registerView('mock', {
    get title() { return App.t('mock.setup'); },
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
        stopRecording();
        if (S.keyCleanup) { S.keyCleanup(); S.keyCleanup = null; }
        window.removeEventListener('beforeunload', onBeforeUnload);
      };
    },
  });
})();
