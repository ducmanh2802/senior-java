/* View "algo" — owner: task T15. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'algo.title': 'Luyện thuật toán',
      'algo.subtitle': 'Luyện thuật toán: đề, gợi ý từng bước, editor, timer, lời giải Java.',
      'algo.emptyTitle': 'Chưa có bài nào trong ngân hàng.',
      'algo.emptyHint': 'Quay lại sau khi kho bài được thêm.',
      'algo.filterAll': 'Tất cả',
      'algo.filterDue': 'Đến hạn giải lại',
      'algo.filterUnseen': 'Chưa làm',
      'algo.filterUnknown': 'Chưa giải được',
      'algo.filterReview': 'Cần làm lại',
      'algo.filterKnown': 'Đã giải',
      'algo.filterAllDiff': 'Mọi độ khó',
      'algo.filterAllPattern': 'Mọi pattern',
      'algo.filterAllStatus': 'Mọi trạng thái',
      'algo.searchPlaceholder': 'Tìm theo tên, pattern, tag…',
      'algo.searchAria': 'Tìm bài',
      'algo.searchLabel': 'Độ khó',
      'algo.patternLabel': 'Pattern',
      'algo.statusLabel': 'Trạng thái',
      'algo.randomBtn': 'Bài ngẫu nhiên',
      'algo.viewAllBtn': 'Xem tất cả',
      'algo.emptyFilterTitle': 'Không có bài nào khớp bộ lọc',
      'algo.emptyFilterHint': 'Thử bỏ bớt điều kiện lọc hoặc xoá ô tìm kiếm.',
      'algo.progressAria': 'Tiến độ',
      'algo.solvedText': '{n} bài đã giải',
      'algo.matchedText': '{n} bài khớp bộ lọc',
      'algo.notFoundTitle': 'Không tìm thấy bài',
      'algo.notFoundHint': 'Bài {id} không có trong ngân hàng.',
      'algo.notFoundBack': 'Về danh sách',
      'algo.hintTitle': 'Gợi ý',
      'algo.hintBtn': 'Gợi ý',
      'algo.hintDone': 'Đã hết gợi ý',
      'algo.hintNext': 'Gợi ý {n}/{total}',
      'algo.hintShortcut': 'Phím tắt <kbd>H</kbd> để mở gợi ý tiếp theo.',
      'algo.timerGoal': 'Mục tiêu {n} phút',
      'algo.timerOver': 'Đã vượt mục tiêu {n} phút',
      'algo.timerStart': 'Bắt đầu',
      'algo.timerPause': 'Tạm dừng',
      'algo.timerResume': 'Tiếp tục',
      'algo.timerReset': 'Đặt lại',
      'algo.minuteUnit': 'phút',
      'algo.editorPlaceholder': 'Viết code Java ở đây',
      'algo.editorAria': 'Editor Java',
      'algo.editorTip': 'Viết lời giải như phỏng vấn thật.',
      'algo.editorRunTip': 'Ctrl+Enter để chạy test trên Judge0 (Java 13).',
      'algo.editorNoTest': 'Bài này chưa có test tự động.',
      'algo.runBtn': '▶ Chạy test',
      'algo.reviewBtn': 'AI review code',
      'algo.copyBtn': 'Sao chép code',
      'algo.copyDone': 'Đã sao chép',
      'algo.resetBtn': 'Xoá code',
      'algo.resetConfirm': 'Xoá toàn bộ code đang soạn?',
      'algo.solutionBtn': 'Xem lời giải',
      'algo.solutionConfirm': 'Bạn mới dùng {n}/{total} gợi ý. Xem lời giải luôn? (Nên tự viết lại trước đã)',
      'algo.solutionTitle': 'Lời giải',
      'algo.runTesting': 'Đang chạy test…',
      'algo.runNotConfigured': 'Máy chạy code chưa được cấu hình. Bạn có thể dùng AI review code.',
      'algo.reviewTesting': 'AI đang review code…',
      'algo.markKnown': 'Đã giải',
      'algo.markReview': 'Cần ôn',
      'algo.markUnknown': 'Chưa giải được',
      'algo.savedLabel': 'Đã lưu ✓',
      'algo.savedLabels': 'saved',
      'algo.complexityLabel': 'Độ phức tạp:',
      'algo.followUpTitle': 'Câu hỏi follow-up',
    },
    en: {
      'algo.title': 'Algorithm Practice',
      'algo.subtitle': 'Algorithm practice: prompt, step hints, editor, timer, Java solution.',
      'algo.emptyTitle': 'No algorithm exercises yet.',
      'algo.emptyHint': 'Check back once the bank is added.',
      'algo.filterAll': 'All',
      'algo.filterDue': 'Due for review',
      'algo.filterUnseen': 'Not done',
      'algo.filterUnknown': 'Can\'t solve',
      'algo.filterReview': 'Needs redo',
      'algo.filterKnown': 'Solved',
      'algo.filterAllDiff': 'All difficulties',
      'algo.filterAllPattern': 'All patterns',
      'algo.filterAllStatus': 'All statuses',
      'algo.searchPlaceholder': 'Search by name, pattern, tag…',
      'algo.searchAria': 'Find exercise',
      'algo.searchLabel': 'Difficulty',
      'algo.patternLabel': 'Pattern',
      'algo.statusLabel': 'Status',
      'algo.randomBtn': 'Random exercise',
      'algo.viewAllBtn': 'View all',
      'algo.emptyFilterTitle': 'No exercises match the filter',
      'algo.emptyFilterHint': 'Try removing some filter conditions or clearing the search.',
      'algo.progressAria': 'Progress',
      'algo.solvedText': '{n} solved',
      'algo.matchedText': '{n} matched',
      'algo.notFoundTitle': 'Exercise not found',
      'algo.notFoundHint': 'Exercise {id} is not in the bank.',
      'algo.notFoundBack': 'Back to list',
      'algo.listBack': '← List',
      'algo.hintTitle': 'Hints',
      'algo.hintBtn': 'Hint',
      'algo.hintDone': 'No more hints',
      'algo.hintNext': 'Hint {n}/{total}',
      'algo.hintShortcut': 'Shortcut <kbd>H</kbd> for next hint.',
      'algo.timerGoal': 'Goal: {n} min',
      'algo.timerOver': 'Over goal {n} min',
      'algo.timerStart': 'Start',
      'algo.timerPause': 'Pause',
      'algo.timerResume': 'Resume',
      'algo.timerReset': 'Reset',
      'algo.minuteUnit': 'min',
      'algo.editorPlaceholder': 'Write your Java code here',
      'algo.editorAria': 'Java editor',
      'algo.editorTip': 'Write your solution like a real interview.',
      'algo.editorRunTip': 'Ctrl+Enter to run tests on Judge0 (Java 13).',
      'algo.editorNoTest': 'This exercise has no automatic tests.',
      'algo.runBtn': '▶ Run tests',
      'algo.reviewBtn': 'AI review code',
      'algo.copyBtn': 'Copy code',
      'algo.copyDone': 'Copied',
      'algo.resetBtn': 'Clear code',
      'algo.resetConfirm': 'Clear all code? Current work will be lost.',
      'algo.solutionBtn': 'Show solution',
      'algo.solutionConfirm': 'You used {n}/{total} hints. Still view the solution? (Write it again first)',
      'algo.solutionTitle': 'Solution',
      'algo.runTesting': 'Running tests…',
      'algo.runNotConfigured': 'Code-run server not configured. You can use AI review.',
      'algo.reviewTesting': 'AI reviewing code…',
      'algo.markKnown': 'Solved',
      'algo.markReview': 'Review',
      'algo.markUnknown': 'Can\'t solve',
      'algo.savedLabel': 'Saved ✓',
      'algo.savedLabels': { known: 'Solved', review: 'Review', unknown: 'Can\'t solve' },
      'algo.complexityLabel': 'Complexity:',
      'algo.followUpTitle': 'Follow-up questions',
    },
  });

  const DIFF = {
    easy: { label: 'Easy', cls: 'ok' },
    medium: { label: 'Medium', cls: 'warn' },
    hard: { label: 'Hard', cls: 'bad' },
  };
  const FILTERS = [
    { id: 'all', label: App.t('algo.filterAll') },
    { id: 'unseen', label: App.t('algo.filterUnseen') },
    { id: 'known', label: App.t('algo.filterKnown') },
    { id: 'review', label: App.t('algo.filterReview') },
    { id: 'unknown', label: App.t('algo.filterUnknown') },
    { id: 'due', label: App.t('algo.filterDue') },
  ];
  const GOALS = [15, 25, 45];
  const DEFAULT_CODE = 'class Solution {\n    \n}';
  const runCache = {};

  // Bộ lọc giữ nguyên giữa các lần render (mở bài chi tiết rồi quay lại danh sách).
  const state = { q: '', diff: 'all', pattern: 'all', status: 'all' };
  let listClickHandler = null;

  function draftKey(id) { return 'sjp.algo.' + id; }
  function loadDraft(id) { try { return localStorage.getItem(draftKey(id)) || ''; } catch (e) { return ''; } }
  function saveDraft(id, code) { try { localStorage.setItem(draftKey(id), code); } catch (e) { /* private mode */ } }

  function patterns() {
    const seen = [];
    App.algos().forEach(a => { if (a.pattern && seen.indexOf(a.pattern) < 0) seen.push(a.pattern); });
    return seen.sort();
  }

  function filtered() {
    const term = state.q.trim().toLowerCase();
    return App.algos().filter(a => {
      if (state.diff !== 'all' && a.difficulty !== state.diff) return false;
      if (state.pattern !== 'all' && a.pattern !== state.pattern) return false;
      const s = App.store.getStatus(a.id);
      if (state.status === 'unseen' && s) return false;
      if (state.status === 'known' && s !== 'known') return false;
      if (state.status === 'review' && s !== 'review') return false;
      if (state.status === 'unknown' && s !== 'unknown') return false;
      if (state.status === 'due' && !App.store.isDue(a.id)) return false;
      if (term) {
        const hay = (a.title + ' ' + a.pattern + ' ' + a.id + ' ' + (a.tags || []).join(' ')).toLowerCase();
        if (hay.indexOf(term) < 0) return false;
      }
      return true;
    });
  }

  function diffBadge(a) {
    const d = DIFF[a.difficulty] || { label: a.difficulty || '', cls: '' };
    return '<span class="badge ' + d.cls + '">' + App.esc(d.label) + '</span>';
  }

  function statusBadge(a) {
    const s = App.store.getStatus(a.id);
    if (s && App.STATUS[s]) return '<span class="badge ' + App.STATUS[s].cls + '">' + App.STATUS[s].label + '</span>';
    return '<span class="badge">' + (App.t('algo.filterUnseen') || 'Not done') + '</span>';
  }

  function dueBadge(a) {
    return App.store.isDue(a.id) ? '<span class="badge accent">' + App.t('algo.filterDue') + '</span>' : '';
  }

  function chipRow(label, items, current, attr) {
    const chips = items.map(it =>
      '<button type="button" class="chip' + (it.id === current ? ' active' : '') + '" data-' + attr + '="' + App.esc(it.id) + '">' +
      App.esc(it.label) + '</button>').join('');
    return '<div class="algo-chiprow"><span class="algo-chiplabel">' + App.esc(label) + '</span><div class="chips">' + chips + '</div></div>';
  }

  // Delegation để không gắn listener mỗi lần render lại danh sách.
  function handleListClick(e) {
    const root = e.currentTarget;
    const chip = e.target.closest('.chip');
    if (chip) {
      if (chip.dataset.diff) state.diff = chip.dataset.diff;
      else if (chip.dataset.pattern) state.pattern = chip.dataset.pattern;
      else if (chip.dataset.status) state.status = chip.dataset.status;
      renderList(root);
      return;
    }
    if (e.target.closest('#algoRandom')) {
      const list = filtered();
      const pool = list.filter(a => App.store.getStatus(a.id) !== 'known');
      const src = pool.length ? pool : list;
      if (!src.length) return;
      const pick = src[Math.floor(Math.random() * src.length)];
      App.navigate('#/algo/' + pick.id);
    }
  }

  // ------------------------------------------------------------------ list
  function renderList(root) {
    const all = App.algos();
    const list = filtered();
    const solved = all.filter(a => App.store.getStatus(a.id) === 'known').length;
    const pct = all.length ? Math.round((solved / all.length) * 100) : 0;

    if (!all.length) {
      root.innerHTML = '<div class="empty"><h2>' + App.t('algo.emptyTitle') + '</h2>' +
        '<p>' + App.t('algo.emptyHint') + '</p></div>';
      return () => {};
    }

    const diffItems = [{ id: 'all', label: 'Mọi độ khó' }].concat(
      ['easy', 'medium', 'hard'].map(d => ({ id: d, label: (DIFF[d] || {}).label || d })));
    const patItems = [{ id: 'all', label: 'Mọi pattern' }].concat(patterns().map(p => ({ id: p, label: p })));

    const rows = list.map(a => {
      const s = App.store.getStatus(a.id);
      const dotCls = s === 'known' ? 'ok' : s === 'review' ? 'warn' : s === 'unknown' ? 'bad' : '';
      return '<a class="algo-row" href="#/algo/' + App.esc(a.id) + '">' +
        '<span class="dot ' + dotCls + '"></span>' +
        '<span class="algo-row-main"><b>' + App.esc(a.title) + '</b>' +
        '<span class="algo-row-sub">' + App.esc(a.pattern) + ' · ' + App.esc(a.id) + '</span></span>' +
        '<span class="algo-row-tags">' + diffBadge(a) + statusBadge(a) + dueBadge(a) + '</span>' +
        '</a>';
    }).join('');

    root.innerHTML =
      '<div class="page-head">' +
        '<div><h1>' + App.t('algo.title') + '</h1>' +
        '<p>' + solved + '/' + all.length + ' ' + App.t('algo.solvedText', {n: solved}) + ' · ' + list.length + ' ' + App.t('algo.matchedText', {n: list.length}) + '</p></div>' +
        '<div class="row"><button type="button" class="btn primary" id="algoRandom">' + App.t('algo.randomBtn') + '</button>' +
        '<a class="btn" href="#/algo">' + App.t('algo.viewAllBtn') + '</a></div>' +
      '</div>' +
      '<div class="progress algo-progress" role="progressbar" aria-label="' + App.t('algo.progressAria') + '" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
        '<i class="accent" style="width:' + pct + '%"></i></div>' +
      '<div class="card algo-filters">' +
        '<div class="row"><input class="input algo-search" id="algoSearch" type="search" placeholder="' + App.t('algo.searchPlaceholder') + '" value="' + App.esc(state.q) + '" aria-label="' + App.t('algo.searchAria') + '"></div>' +
        chipRow(App.t('algo.searchLabel'), diffItems, state.diff, 'diff') +
        chipRow(App.t('algo.patternLabel'), patItems, state.pattern, 'pattern') +
        chipRow(App.t('algo.statusLabel'), FILTERS, state.status, 'status') +
      '</div>' +
      (list.length
        ? '<div class="card algo-list">' + rows + '</div>'
        : '<div class="empty"><h2>' + App.t('algo.emptyFilterTitle') + '</h2><p>' + App.t('algo.emptyFilterHint') + '</p></div>');

    // ---- events
    const search = root.querySelector('#algoSearch');
    search.addEventListener('input', e => {
      state.q = e.target.value;
      const pos = e.target.selectionStart;
      renderList(root);
      const again = root.querySelector('#algoSearch');
      again.focus();
      try { again.setSelectionRange(pos, pos); } catch (err) { /* ignore */ }
    });

    // Delegation: chỉ một listener cho cả view, tránh nhân bản khi render lại.
    if (listClickHandler) root.removeEventListener('click', listClickHandler);
    listClickHandler = handleListClick;
    root.addEventListener('click', listClickHandler);

    return () => {
      if (listClickHandler) { root.removeEventListener('click', listClickHandler); listClickHandler = null; }
    };
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  // ------------------------------------------------------------------ detail
  function fmtClock(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60), s = total % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function renderDetail(root, id) {
    const algo = App.algos().find(a => a.id === id);
    if (!algo) {
      root.innerHTML = '<div class="empty"><h2>' + App.t('algo.notFoundTitle') + '</h2>' +
        '<p>' + App.t('algo.notFoundHint', {id: App.esc(id)}) + '</p>' +
        '<p><a class="btn" href="#/algo">' + App.t('algo.notFoundBack') + '</a></p></div>';
      return () => {};
    }

    const list = filtered();
    const idx = list.findIndex(a => a.id === algo.id);
    const nav = idx >= 0 ? list : App.algos();
    const navIdx = idx >= 0 ? idx : nav.findIndex(a => a.id === algo.id);
    const prev = navIdx > 0 ? nav[navIdx - 1] : null;
    const next = navIdx >= 0 && navIdx < nav.length - 1 ? nav[navIdx + 1] : null;

    const hints = algo.hints || [];
    const draft = loadDraft(algo.id);
    const baseCode = algo.starter || DEFAULT_CODE;
    const code = draft || baseCode;
    const canRun = App.code.hasTests(algo);
    const cache = runCache[algo.id] || (runCache[algo.id] = { code: '', run: null, parsed: null, runHtml: '', reviewHtml: '' });
    if (cache.code !== code) Object.assign(cache, { code: '', run: null, parsed: null, runHtml: '', reviewHtml: '' });
    let lastRun = cache.run, lastParsed = cache.parsed;
    let hintsUsed = 0;
    let solutionShown = false;
    const timer = { elapsed: 0, running: false, goal: GOALS[1], tick: null };

    root.innerHTML =
      '<div class="page-head algo-head">' +
        '<div>' +
          '<div class="row algo-title-row"><a class="link-btn" href="#/algo">' + App.t('algo.listBack') + '</a>' +
            '<h1 class="algo-title">' + App.esc(algo.title) + '</h1></div>' +
          '<div class="row algo-meta">' + diffBadge(algo) +
            '<span class="badge accent">' + App.esc(algo.pattern) + '</span>' +
            '<span class="badge">' + App.esc(algo.id) + '</span>' +
            (algo.tags || []).map(t => '<span class="badge">' + App.esc(t) + '</span>').join('') +
            statusBadge(algo) + dueBadge(algo) +
          '</div>' +
        '</div>' +
        '<div class="row algo-nav">' +
          (prev ? '<a class="btn sm" href="#/algo/' + App.esc(prev.id) + '">← ' + App.esc(prev.title) + '</a>' : '') +
          (next ? '<a class="btn sm" href="#/algo/' + App.esc(next.id) + '">' + App.esc(next.title) + ' →</a>' : '') +
        '</div>' +
      '</div>' +
      '<div class="algo-layout">' +
        '<section class="card algo-prompt">' +
          '<div class="md">' + App.md(algo.prompt) + '</div>' +
          '<div class="algo-hints">' +
            '<h3>' + App.t('algo.hintTitle') + ' <span class="algo-hint-count" id="algoHintCount">0/' + hints.length + '</span></h3>' +
            '<div id="algoHints"></div>' +
            '<button type="button" class="btn sm" id="algoHintBtn"' + (hints.length ? '' : ' disabled') + '>' +
              (hints.length ? App.t('algo.hintNext', {n: 1, total: hints.length}) : App.t('algo.hintDone')) + '</button>' +
            '<p class="small muted">' + App.t('algo.hintShortcut') + '</p>' +
          '</div>' +
        '</section>' +
        '<section class="card algo-work">' +
          '<div class="row algo-work-head">' +
            '<span class="algo-timer" id="algoTimer" role="timer" aria-live="off">00:00</span>' +
            '<span class="small muted" id="algoTimerGoal">' + App.t('algo.timerGoal', {n: timer.goal}) + '</span>' +
            '<span class="spacer"></span>' +
            '<button type="button" class="btn sm" id="algoTimerToggle">' + App.t('algo.timerStart') + '</button>' +
            '<button type="button" class="btn sm" id="algoTimerReset">' + App.t('algo.timerReset') + '</button>' +
          '</div>' +
          '<div class="chips algo-goals" id="algoGoals">' +
            GOALS.map(g => '<button type="button" class="chip' + (g === GOALS[1] ? ' active' : '') + '" data-goal="' + g + '">' + g + ' ' + App.t('algo.minuteUnit') + '</button>').join('') +
          '</div>' +
          '<textarea id="algoCode" class="textarea algo-editor" spellcheck="false" autocapitalize="off" autocorrect="off" wrap="off"' +
            ' aria-label="' + App.t('algo.editorAria') + '" placeholder="' + App.t('algo.editorPlaceholder') + '">' + App.esc(code) + '</textarea>' +
          '<p class="small muted algo-tip">' + App.t('algo.editorTip') + ' ' + (canRun ? App.t('algo.editorRunTip') : App.t('algo.editorNoTest')) + '</p>' +
          (canRun ? '<button type="button" class="btn sm primary" id="algoRun">' + App.t('algo.runBtn') + '</button>' : '') +
          '<button type="button" class="btn sm" id="algoAiReview">' + App.t('algo.reviewBtn') + '</button>' +
          '<div class="row algo-actions">' +
            '<button type="button" class="btn sm" id="algoCopy">' + App.t('algo.copyBtn') + '</button>' +
            '<button type="button" class="btn sm" id="algoResetCode">' + App.t('algo.resetBtn') + '</button>' +
            '<button type="button" class="btn sm primary" id="algoSolution">' + App.t('algo.solutionBtn') + '</button>' +
            '<span class="spacer"></span>' +
            '<button type="button" class="btn sm ok" data-mark="known">' + App.t('algo.markKnown') + '</button>' +
            '<button type="button" class="btn sm warn" data-mark="review">' + App.t('algo.markReview') + '</button>' +
            '<button type="button" class="btn sm bad" data-mark="unknown">' + App.t('algo.markUnknown') + '</button>' +
          '</div>' +
          '<div id="algoRunPanel" class="algo-ai-panel" aria-live="polite"></div><div id="algoReviewPanel" class="algo-ai-panel" aria-live="polite"></div>' +
          '<div id="algoSolutionBox"></div>' +
        '</section>' +
      '</div>';

    const hintsBox = root.querySelector('#algoHints');
    const hintCount = root.querySelector('#algoHintCount');
    const hintBtn = root.querySelector('#algoHintBtn');
    const editor = root.querySelector('#algoCode');
    const timerEl = root.querySelector('#algoTimer');
    const timerGoalEl = root.querySelector('#algoTimerGoal');
    const timerToggle = root.querySelector('#algoTimerToggle');
    const solutionBox = root.querySelector('#algoSolutionBox');
    const runPanel = root.querySelector('#algoRunPanel'), reviewPanel = root.querySelector('#algoReviewPanel');
    const runBtn = root.querySelector('#algoRun'), reviewBtn = root.querySelector('#algoAiReview');
    runPanel.innerHTML = cache.runHtml; reviewPanel.innerHTML = cache.reviewHtml;
    async function runTests() {
      if (!canRun || runBtn.disabled) return;
      const submitted = editor.value;
      runBtn.disabled = true;
      runPanel.innerHTML = '<span class="ai-loading">' + App.t('algo.runTesting') + '</span>';
      try {
        const run = await App.ai.run(App.code.assemble(submitted, algo.tests));
        if (editor.value !== submitted) return;
        lastRun = cache.run = run; cache.code = submitted;
        if (run.configured === false) {
          runPanel.innerHTML = '<div class="run-box">' + App.t('algo.runNotConfigured') + '</div>';
        } else {
          lastParsed = cache.parsed = App.code.parse(run.stdout);
          runPanel.innerHTML = App.ui.runResult(run, lastParsed);
        }
        cache.runHtml = runPanel.innerHTML;
      } catch (e) { if (editor.value === submitted) runPanel.innerHTML = App.ui.error(e); }
      finally { runBtn.disabled = false; }
    }
    async function reviewCode() {
      if (reviewBtn.disabled) return;
      const submitted = editor.value;
      reviewBtn.disabled = true;
      reviewPanel.innerHTML = '<span class="ai-loading">' + App.t('algo.reviewTesting') + '</span>';
      try {
        const run = lastRun ? { passed: lastParsed ? lastParsed.passed : 0, total: lastParsed ? lastParsed.total : 0, output: (lastRun.stdout || '').slice(0, 2000) } : undefined;
        const result = await App.ai.review({ title: algo.title, prompt: algo.prompt, reference: algo.solution, code: submitted, complexity: algo.complexity, run });
        if (editor.value === submitted) { cache.code = submitted; cache.reviewHtml = App.ui.codeFeedback(result); reviewPanel.innerHTML = cache.reviewHtml; }
      } catch (e) { if (editor.value === submitted) reviewPanel.innerHTML = App.ui.error(e); }
      finally { reviewBtn.disabled = false; }
    }
    if (runBtn) runBtn.addEventListener('click', runTests);
    reviewBtn.addEventListener('click', reviewCode);

    function showHint() {
      if (hintsUsed >= hints.length) return;
      const h = hints[hintsUsed];
      hintsUsed++;
      const item = document.createElement('div');
      item.className = 'algo-hint';
      item.innerHTML = '<b>' + App.t('algo.hintTitle') + ' ' + hintsUsed + '</b><div class="md">' + App.md(h) + '</div>';
      hintsBox.appendChild(item);
      hintCount.textContent = hintsUsed + '/' + hints.length;
      hintBtn.textContent = hintsUsed < hints.length ? App.t('algo.hintNext', {n: hintsUsed + 1, total: hints.length}) : App.t('algo.hintDone');
      if (hintsUsed >= hints.length) hintBtn.disabled = true;
    }

    function updateTimer() {
      timerEl.textContent = fmtClock(timer.elapsed);
      const over = timer.elapsed > timer.goal * 60000;
      timerEl.classList.toggle('algo-over', over);
      timerGoalEl.textContent = over
        ? App.t('algo.timerOver', {n: timer.goal})
        : App.t('algo.timerGoal', {n: timer.goal});
    }

    function startTimer() {
      if (timer.running) return;
      timer.running = true;
      timerToggle.textContent = App.t('algo.timerPause');
      timer.tick = setInterval(() => { timer.elapsed += 1000; updateTimer(); }, 1000);
    }
    function pauseTimer() {
      timer.running = false;
      timerToggle.textContent = App.t('algo.timerResume');
      if (timer.tick) { clearInterval(timer.tick); timer.tick = null; }
    }

    function showSolution() {
      if (solutionShown) return;
      if (hintsUsed < hints.length && !confirm(App.t('algo.solutionConfirm', {n: hintsUsed, total: hints.length}))) return;
      solutionShown = true;
      const follow = (algo.follow || []).map(f => '<li>' + App.md(f) + '</li>').join('');
      solutionBox.innerHTML =
        '<div class="algo-solution">' +
          '<h3>' + App.t('algo.solutionTitle') + '</h3>' +
          '<div class="md">' + App.md(algo.solution) + '</div>' +
          '<p class="small"><b>' + App.t('algo.complexityLabel') + '</b> ' + App.esc(algo.complexity || '') + '</p>' +
          (follow ? '<h4>' + App.t('algo.followUpTitle') + '</h4><ul class="algo-follow">' + follow + '</ul>' : '') +
        '</div>';
      solutionBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ---- editor: Tab = 4 space, Enter = giữ indent
    editor.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runTests(); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = editor.selectionStart, en = editor.selectionEnd;
        editor.value = editor.value.slice(0, s) + '    ' + editor.value.slice(en);
        editor.selectionStart = editor.selectionEnd = s + 4;
      } else if (e.key === 'Enter') {
        const s = editor.selectionStart;
        const lineStart = editor.value.lastIndexOf('\n', s - 1) + 1;
        const line = editor.value.slice(lineStart, s);
        const indent = (line.match(/^[ \t]*/) || [''])[0];
        e.preventDefault();
        const ins = '\n' + indent;
        editor.value = editor.value.slice(0, s) + ins + editor.value.slice(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = s + ins.length;
      }
    });
    editor.addEventListener('input', () => { saveDraft(algo.id, editor.value); Object.assign(cache, { code: '', run: null, parsed: null, runHtml: '', reviewHtml: '' }); lastRun = lastParsed = null; runPanel.innerHTML = ''; reviewPanel.innerHTML = ''; });

    // ---- buttons
    hintBtn.addEventListener('click', showHint);
    timerToggle.addEventListener('click', () => { timer.running ? pauseTimer() : startTimer(); });
    root.querySelector('#algoTimerReset').addEventListener('click', () => {
      pauseTimer();
      timer.elapsed = 0;
      timerToggle.textContent = App.t('algo.timerStart');
      updateTimer();
    });
    root.querySelector('#algoGoals').addEventListener('click', e => {
      const chip = e.target.closest('[data-goal]');
      if (!chip) return;
      timer.goal = parseInt(chip.dataset.goal, 10) || GOALS[1];
      root.querySelectorAll('#algoGoals .chip').forEach(c => c.classList.toggle('active', c === chip));
      updateTimer();
    });
    root.querySelector('#algoSolution').addEventListener('click', showSolution);
    root.querySelector('#algoCopy').addEventListener('click', () => {
      const text = editor.value;
      const done = () => {
        const btn = root.querySelector('#algoCopy');
        const old = btn.textContent;
        btn.textContent = App.t('algo.copyDone');
        setTimeout(() => { btn.textContent = old; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
      } else fallbackCopy(text, done);
    });
    root.querySelector('#algoResetCode').addEventListener('click', () => {
      if (!editor.value.trim() || confirm(App.t('algo.resetConfirm'))) {
        editor.value = baseCode;
        saveDraft(algo.id, baseCode);
        Object.assign(cache, { code: '', run: null, parsed: null, runHtml: '', reviewHtml: '' });
        lastRun = lastParsed = null; runPanel.innerHTML = ''; reviewPanel.innerHTML = '';
        editor.focus();
      }
    });
    root.querySelector('.algo-actions').addEventListener('click', e => {
      const btn = e.target.closest('[data-mark]');
      if (!btn) return;
      const s = btn.dataset.mark;
      App.store.setStatus(algo.id, s);
      App.store.log('algo');
      const badge = root.querySelector('.algo-meta');
      const fresh = App.store.getStatus(algo.id);
      badge.innerHTML = diffBadge(algo) +
        '<span class="badge accent">' + App.esc(algo.pattern) + '</span>' +
        '<span class="badge">' + App.esc(algo.id) + '</span>' +
        (algo.tags || []).map(t => '<span class="badge">' + App.esc(t) + '</span>').join('') +
        '<span class="badge ' + (App.STATUS[fresh] ? App.STATUS[fresh].cls : '') + '">' +
        (App.STATUS[fresh] ? App.STATUS[fresh].label : App.t('algo.filterUnseen')) + '</span>' +
        (App.store.isDue(algo.id) ? '<span class="badge accent">' + App.t('algo.filterDue') + '</span>' : '');
      btn.textContent = App.t('algo.savedLabel');
      setTimeout(() => {
        const labels = { known: App.t('algo.markKnown'), review: App.t('algo.markReview'), unknown: App.t('algo.markUnknown') };
        btn.textContent = labels[s] || btn.textContent;
      }, 1200);
    });

    // ---- phím tắt: H = hint, S = solution (bỏ qua khi đang gõ trong editor)
    const offKey = App.onKey(e => {
      const k = e.key.toLowerCase();
      if (k === 'h') { showHint(); }
      else if (k === 's') { showSolution(); }
    });

    updateTimer();

    return () => {
      offKey();
      if (timer.tick) clearInterval(timer.tick);
    };
  }

  // ------------------------------------------------------------------ register
  App.registerView('algo', {
    get title() { return App.t('algo.title'); },
    render(root, params) {
      if (params && params.length) return renderDetail(root, params[0]);
      return renderList(root);
    },
  });
})();
