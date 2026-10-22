/* View "algo" — owner: task T15. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  const DIFF = {
    easy: { label: 'Easy', cls: 'ok' },
    medium: { label: 'Medium', cls: 'warn' },
    hard: { label: 'Hard', cls: 'bad' },
  };
  const FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'unseen', label: 'Chưa làm' },
    { id: 'known', label: 'Đã giải' },
    { id: 'review', label: 'Cần làm lại' },
    { id: 'unknown', label: 'Chưa giải được' },
    { id: 'due', label: 'Đến hạn giải lại' },
  ];
  const GOALS = [15, 25, 45];
  const DEFAULT_CODE = 'class Solution {\n    \n}';

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
    return '<span class="badge">Chưa làm</span>';
  }

  function dueBadge(a) {
    return App.store.isDue(a.id) ? '<span class="badge accent">Đến hạn giải lại</span>' : '';
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
      root.innerHTML = '<div class="empty"><h2>Luyện thuật toán</h2>' +
        '<p>Chưa có bài nào trong ngân hàng. Quay lại sau khi kho bài được thêm.</p></div>';
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
        '<div><h1>Luyện thuật toán</h1>' +
        '<p>' + solved + '/' + all.length + ' bài đã giải · ' + list.length + ' bài khớp bộ lọc</p></div>' +
        '<div class="row"><button type="button" class="btn primary" id="algoRandom">Bài ngẫu nhiên</button>' +
        '<a class="btn" href="#/algo">Xem tất cả</a></div>' +
      '</div>' +
      '<div class="progress algo-progress" role="progressbar" aria-label="Tiến độ" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
        '<i class="accent" style="width:' + pct + '%"></i></div>' +
      '<div class="card algo-filters">' +
        '<div class="row"><input class="input algo-search" id="algoSearch" type="search" placeholder="Tìm theo tên, pattern, tag…" value="' + App.esc(state.q) + '" aria-label="Tìm bài"></div>' +
        chipRow('Độ khó', diffItems, state.diff, 'diff') +
        chipRow('Pattern', patItems, state.pattern, 'pattern') +
        chipRow('Trạng thái', FILTERS, state.status, 'status') +
      '</div>' +
      (list.length
        ? '<div class="card algo-list">' + rows + '</div>'
        : '<div class="empty"><h2>Không có bài nào khớp bộ lọc</h2><p>Thử bỏ bớt điều kiện lọc hoặc xoá ô tìm kiếm.</p></div>');

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
      root.innerHTML = '<div class="empty"><h2>Không tìm thấy bài</h2>' +
        '<p>Bài <code>' + App.esc(id) + '</code> không có trong ngân hàng.</p>' +
        '<p><a class="btn" href="#/algo">Về danh sách</a></p></div>';
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
    const code = draft || DEFAULT_CODE;
    let hintsUsed = 0;
    let solutionShown = false;
    const timer = { elapsed: 0, running: false, goal: GOALS[1], tick: null };

    root.innerHTML =
      '<div class="page-head algo-head">' +
        '<div>' +
          '<div class="row algo-title-row"><a class="link-btn" href="#/algo">← Danh sách</a>' +
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
            '<h3>Gợi ý <span class="algo-hint-count" id="algoHintCount">0/' + hints.length + '</span></h3>' +
            '<div id="algoHints"></div>' +
            '<button type="button" class="btn sm" id="algoHintBtn"' + (hints.length ? '' : ' disabled') + '>' +
              (hints.length ? 'Gợi ý 1/' + hints.length : 'Không có gợi ý') + '</button>' +
            '<p class="small muted">Phím tắt <kbd>H</kbd> để mở gợi ý tiếp theo.</p>' +
          '</div>' +
        '</section>' +
        '<section class="card algo-work">' +
          '<div class="row algo-work-head">' +
            '<span class="algo-timer" id="algoTimer" role="timer" aria-live="off">00:00</span>' +
            '<span class="small muted" id="algoTimerGoal">Mục tiêu 25 phút</span>' +
            '<span class="spacer"></span>' +
            '<button type="button" class="btn sm" id="algoTimerToggle">Bắt đầu</button>' +
            '<button type="button" class="btn sm" id="algoTimerReset">Đặt lại</button>' +
          '</div>' +
          '<div class="chips algo-goals" id="algoGoals">' +
            GOALS.map(g => '<button type="button" class="chip' + (g === GOALS[1] ? ' active' : '') + '" data-goal="' + g + '">' + g + ' phút</button>').join('') +
          '</div>' +
          '<textarea id="algoCode" class="textarea algo-editor" spellcheck="false" autocapitalize="off" autocorrect="off" wrap="off"' +
            ' aria-label="Editor Java" placeholder="Viết code Java ở đây">' + App.esc(code) + '</textarea>' +
          '<p class="small muted algo-tip">Viết ra giấy/editor như phỏng vấn thật, sau đó so với lời giải. Không chạy được Java trong trình duyệt.</p>' +
          '<div class="row algo-actions">' +
            '<button type="button" class="btn sm" id="algoCopy">Sao chép code</button>' +
            '<button type="button" class="btn sm" id="algoResetCode">Xoá code</button>' +
            '<button type="button" class="btn sm primary" id="algoSolution">Xem lời giải</button>' +
            '<span class="spacer"></span>' +
            '<button type="button" class="btn sm ok" data-mark="known">Đã giải</button>' +
            '<button type="button" class="btn sm warn" data-mark="review">Cần ôn</button>' +
            '<button type="button" class="btn sm bad" data-mark="unknown">Chưa giải được</button>' +
          '</div>' +
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

    function showHint() {
      if (hintsUsed >= hints.length) return;
      const h = hints[hintsUsed];
      hintsUsed++;
      const item = document.createElement('div');
      item.className = 'algo-hint';
      item.innerHTML = '<b>Gợi ý ' + hintsUsed + '</b><div class="md">' + App.md(h) + '</div>';
      hintsBox.appendChild(item);
      hintCount.textContent = hintsUsed + '/' + hints.length;
      hintBtn.textContent = hintsUsed < hints.length ? 'Gợi ý ' + (hintsUsed + 1) + '/' + hints.length : 'Đã hết gợi ý';
      if (hintsUsed >= hints.length) hintBtn.disabled = true;
    }

    function updateTimer() {
      timerEl.textContent = fmtClock(timer.elapsed);
      const over = timer.elapsed > timer.goal * 60000;
      timerEl.classList.toggle('algo-over', over);
      timerGoalEl.textContent = over
        ? 'Đã vượt mục tiêu ' + timer.goal + ' phút'
        : 'Mục tiêu ' + timer.goal + ' phút';
    }

    function startTimer() {
      if (timer.running) return;
      timer.running = true;
      timerToggle.textContent = 'Tạm dừng';
      timer.tick = setInterval(() => { timer.elapsed += 1000; updateTimer(); }, 1000);
    }
    function pauseTimer() {
      timer.running = false;
      timerToggle.textContent = 'Tiếp tục';
      if (timer.tick) { clearInterval(timer.tick); timer.tick = null; }
    }

    function showSolution() {
      if (solutionShown) return;
      if (hintsUsed < hints.length && !confirm('Bạn mới dùng ' + hintsUsed + '/' + hints.length +
        ' gợi ý. Xem lời giải luôn? (Nên tự viết lại trước đã)')) return;
      solutionShown = true;
      const follow = (algo.follow || []).map(f => '<li>' + App.md(f) + '</li>').join('');
      solutionBox.innerHTML =
        '<div class="algo-solution">' +
          '<h3>Lời giải</h3>' +
          '<div class="md">' + App.md(algo.solution) + '</div>' +
          '<p class="small"><b>Độ phức tạp:</b> ' + App.esc(algo.complexity || '') + '</p>' +
          (follow ? '<h4>Câu hỏi follow-up</h4><ul class="algo-follow">' + follow + '</ul>' : '') +
        '</div>';
      solutionBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ---- editor: Tab = 4 space, Enter = giữ indent
    editor.addEventListener('keydown', e => {
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
    editor.addEventListener('input', () => saveDraft(algo.id, editor.value));

    // ---- buttons
    hintBtn.addEventListener('click', showHint);
    timerToggle.addEventListener('click', () => { timer.running ? pauseTimer() : startTimer(); });
    root.querySelector('#algoTimerReset').addEventListener('click', () => {
      pauseTimer();
      timer.elapsed = 0;
      timerToggle.textContent = 'Bắt đầu';
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
        btn.textContent = 'Đã sao chép';
        setTimeout(() => { btn.textContent = old; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
      } else fallbackCopy(text, done);
    });
    root.querySelector('#algoResetCode').addEventListener('click', () => {
      if (!editor.value.trim() || confirm('Xoá toàn bộ code đang soạn?')) {
        editor.value = DEFAULT_CODE;
        saveDraft(algo.id, DEFAULT_CODE);
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
        (App.STATUS[fresh] ? App.STATUS[fresh].label : 'Chưa làm') + '</span>' +
        (App.store.isDue(algo.id) ? '<span class="badge accent">Đến hạn giải lại</span>' : '');
      btn.textContent = 'Đã lưu ✓';
      setTimeout(() => {
        const labels = { known: 'Đã giải', review: 'Cần ôn', unknown: 'Chưa giải được' };
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
    title: 'Luyện thuật toán',
    render(root, params) {
      if (params && params.length) return renderDetail(root, params[0]);
      return renderList(root);
    },
  });
})();
