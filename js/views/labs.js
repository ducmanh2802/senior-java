/* View "labs" — owner: task T45. Contract: see AGENTS.md "Views" + section 10. */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'labs.title': 'Debug lab',
      'labs.subtitle': 'Luyện chẩn đoán sự cố như Senior thật: đọc thread dump, GC log, query plan và log production.',
      'labs.emptyTitle': 'Chưa có bài debug lab',
      'labs.emptyHint': 'Kho bài đang được bổ sung (thread dump, GC log, SQL, sự cố production). Quay lại sau nhé.',
      'labs.emptyFilterTitle': 'Không có bài nào khớp bộ lọc',
      'labs.emptyFilterHint': 'Thử bỏ bớt điều kiện lọc để xem các bài khác.',
      'labs.filterAll': 'Tất cả',
      'labs.filterAllCat': 'Tất cả',
      'labs.filterAllLevel': 'Mọi level',
      'labs.filterAllStatus': 'Mọi trạng thái',
      'labs.filterCategory': 'Nhóm',
      'labs.filterLevel': 'Level',
      'labs.filterStatus': 'Trạng thái',
      'labs.filterUnseen': 'Chưa làm',
      'labs.filterDue': 'Đến hạn ôn',
      'labs.filterKnown': 'Đã giải',
      'labs.filterReview': 'Cần ôn',
      'labs.filterUnknown': 'Chưa giải',
      'labs.clearFilterBtn': 'Xoá bộ lọc',
      'labs.countText': '{n}/{total} bài',
      'labs.artifactCount': '{n} artifact',
      'labs.questionsCount': '{n} câu hỏi',
      'labs.readHint': 'đọc kỹ trước khi trả lời',
      'labs.notFoundTitle': 'Không tìm thấy bài',
      'labs.notFoundHint': 'Bài {id} không có trong dữ liệu.',
      'labs.notFoundBack': '← Về danh sách',
      'labs.artifactTitle': 'Artifact',
      'labs.artifactAria': 'Chọn artifact',
      'labs.searchPlaceholder': 'Tìm trong artifact…',
      'labs.searchAria': 'Tìm trong artifact',
      'labs.copyBtn': 'Copy',
      'labs.copyDone': 'Đã copy ✓',
      'labs.noArtifact': 'Không có artifact.',
      'labs.searchMatch': '{matches} chỗ khớp trong {lines} dòng',
      'labs.searchNoMatch': 'Không tìm thấy "{term}" trong artifact này.',
      'labs.searchLines': '{n} dòng',
      'labs.questionsTitle': 'Câu hỏi cần trả lời',
      'labs.answerLabel': 'Câu trả lời của bạn',
      'labs.answerPlaceholder': 'Phân tích nguyên nhân gốc, dẫn chứng từ artifact, cách sửa ngắn hạn và dài hạn…',
      'labs.micBtnTitle': 'Đọc bằng giọng nói',
      'labs.micAria': 'Đọc câu trả lời bằng giọng nói',
      'labs.micStopAria': 'Dừng ghi âm',
      'labs.hintBtn': '💡 Gợi ý {n}/{total}',
      'labs.hintDone': 'Đã hết gợi ý',
      'labs.gradeBtn': '🤖 Chấm bằng AI',
      'labs.showAnswerBtn': 'Xem đáp án',
      'labs.showAnswerDone': 'Đã xem đáp án',
      'labs.kbdTip': 'Phím tắt: <kbd>H</kbd> gợi ý · <kbd>S</kbd> xem đáp án.',
      'labs.selfTitle': 'Tự đánh giá',
      'labs.selfMarkKnown': 'Đã giải',
      'labs.selfMarkReview': 'Cần ôn',
      'labs.selfMarkUnknown': 'Chưa giải',
      'labs.selfSaved': 'Đã lưu',
      'labs.selfSavedDue': 'Đã lưu · ôn lại từ {date}',
      'labs.selfNote': 'Đánh giá sẽ tự lên lịch ôn lặp lại (SRS).',
      'labs.gradeError': 'Hãy nhập hoặc nói câu trả lời trước khi chấm.',
      'labs.gradeLoading': 'AI đang chấm…',
      'labs.hintItem': 'Gợi ý {n}',
      'labs.answerTitle': 'Đáp án mẫu',
      'labs.rubricTitle': 'Rubric tự chấm',
      'labs.solutionConfirm': 'Bạn mới dùng {n}/{total} gợi ý. Xem đáp án luôn? (Nên tự phân tích artifact trước đã)',
      'labs.catThread': 'Thread dump',
      'labs.catGc': 'GC & bộ nhớ',
      'labs.catSql': 'SQL',
      'labs.catIncident': 'Sự cố production',
      'labs.artifactLabel': 'Artifact',
    },
    en: {
      'labs.title': 'Debug Lab',
      'labs.subtitle': 'Practice senior-level incident diagnosis: thread dumps, GC logs, query plans, production logs.',
      'labs.emptyTitle': 'No debug lab exercises yet',
      'labs.emptyHint': 'Exercises are being added (thread dump, GC log, SQL, production incident). Check back later.',
      'labs.emptyFilterTitle': 'No exercises match the filter',
      'labs.emptyFilterHint': 'Try removing some filter conditions to see other exercises.',
      'labs.filterAll': 'All',
      'labs.filterAllCat': 'All',
      'labs.filterAllLevel': 'All levels',
      'labs.filterAllStatus': 'All statuses',
      'labs.filterCategory': 'Category',
      'labs.filterLevel': 'Level',
      'labs.filterStatus': 'Status',
      'labs.filterUnseen': 'Not done',
      'labs.filterDue': 'Due for review',
      'labs.filterKnown': 'Solved',
      'labs.filterReview': 'Needs review',
      'labs.filterUnknown': 'Can\'t solve',
      'labs.clearFilterBtn': 'Clear filters',
      'labs.countText': '{n}/{total} exercises',
      'labs.artifactCount': '{n} artifact',
      'labs.questionsCount': '{n} questions',
      'labs.readHint': 'read carefully before answering',
      'labs.notFoundTitle': 'Exercise not found',
      'labs.notFoundHint': 'Exercise {id} is not in the data.',
      'labs.notFoundBack': '← Back to list',
      'labs.artifactTitle': 'Artifact',
      'labs.artifactAria': 'Select artifact',
      'labs.searchPlaceholder': 'Search in artifact…',
      'labs.searchAria': 'Search in artifact',
      'labs.copyBtn': 'Copy',
      'labs.copyDone': 'Copied ✓',
      'labs.noArtifact': 'No artifact.',
      'labs.searchMatch': '{matches} matches in {lines} lines',
      'labs.searchNoMatch': '"{term}" not found in this artifact.',
      'labs.searchLines': '{n} lines',
      'labs.questionsTitle': 'Questions to answer',
      'labs.answerLabel': 'Your answer',
      'labs.answerPlaceholder': 'Analyze root cause, evidence from artifact, short-term and long-term fixes…',
      'labs.micBtnTitle': 'Read aloud',
      'labs.micAria': 'Read your answer aloud',
      'labs.micStopAria': 'Stop recording',
      'labs.hintBtn': '💡 Hint {n}/{total}',
      'labs.hintDone': 'No more hints',
      'labs.gradeBtn': '🤖 Grade with AI',
      'labs.showAnswerBtn': 'Show answer',
      'labs.showAnswerDone': 'Answer shown',
      'labs.kbdTip': 'Shortcuts: <kbd>H</kbd> hint · <kbd>S</kbd> answer.',
      'labs.selfTitle': 'Self-assess',
      'labs.selfMarkKnown': 'Solved',
      'labs.selfMarkReview': 'Review',
      'labs.selfMarkUnknown': 'Can\'t solve',
      'labs.selfSaved': 'Saved',
      'labs.selfSavedDue': 'Saved · review from {date}',
      'labs.selfNote': 'Self-assessment schedules spaced repetition (SRS).',
      'labs.gradeError': 'Enter or say your answer before grading.',
      'labs.gradeLoading': 'AI grading…',
      'labs.hintItem': 'Hint {n}',
      'labs.answerTitle': 'Model answer',
      'labs.rubricTitle': 'Self-grade rubric',
      'labs.solutionConfirm': 'You used {n}/{total} hints. Still view the answer? (Analyze the artifact first)',
      'labs.catThread': 'Thread dump',
      'labs.catGc': 'GC & memory',
      'labs.catSql': 'SQL',
      'labs.catIncident': 'Production incident',
      'labs.artifactLabel': 'Artifact',
    },
  });

  const CATS = {
    thread: { label: App.t('labs.catThread'), icon: '🧵' },
    gc: { label: App.t('labs.catGc'), icon: '♻️' },
    sql: { label: App.t('labs.catSql'), icon: '🗄️' },
    incident: { label: App.t('labs.catIncident'), icon: '🔥' },
  };
  const CAT_ORDER = ['thread', 'gc', 'sql', 'incident'];
  const CAT_FILTERS = [{ id: 'all', label: App.t('labs.filterAllCat') }].concat(
    CAT_ORDER.map(id => ({ id: id, label: CATS[id].icon + ' ' + CATS[id].label })));
  const LEVEL_FILTERS = [
    { id: 'all', label: App.t('labs.filterAllLevel') },
    { id: 'mid', label: 'Mid-level' },
    { id: 'senior', label: 'Senior' },
    { id: 'lead', label: 'Lead / Architect' },
  ];
  const STATUS_FILTERS = [
    { id: 'all', label: App.t('labs.filterAllStatus') },
    { id: 'unseen', label: App.t('labs.filterUnseen') },
    { id: 'known', label: App.t('labs.filterKnown') },
    { id: 'review', label: App.t('labs.filterReview') },
    { id: 'unknown', label: App.t('labs.filterUnknown') },
    { id: 'due', label: App.t('labs.filterDue') },
  ];
  const LAB_STATUS = {
    known: { label: App.t('labs.filterKnown'), cls: 'ok' },
    review: { label: App.t('labs.filterReview'), cls: 'warn' },
    unknown: { label: App.t('labs.filterUnknown'), cls: 'bad' },
  };
  const LEVEL_CLS = { mid: '', senior: 'accent', lead: 'info' };

  // Giữ bộ lọc khi mở bài rồi quay lại danh sách.
  const state = { cat: 'all', level: 'all', status: 'all' };
  // Delegation listener dùng lại giữa các lần render danh sách.
  let listHandler = null;

  function labs() { return window.LABS || []; }
  function labById(id) { return labs().find(l => l.id === id) || null; }
  function catOf(l) { return CATS[l.category] || { label: l.category || 'Khác', icon: '•' }; }

  function draftKey(id) { return 'sjp.lab.' + id; }
  function loadDraft(id) { try { return localStorage.getItem(draftKey(id)) || ''; } catch (e) { return ''; } }
  function saveDraft(id, text) { try { localStorage.setItem(draftKey(id), text); } catch (e) { /* private mode */ } }

  function catBadge(l) {
    const c = catOf(l);
    return '<span class="badge">' + c.icon + ' ' + App.esc(c.label) + '</span>';
  }
  function levelBadge(l) {
    return '<span class="badge ' + (LEVEL_CLS[l.level] || '') + '">' +
      App.esc(App.LEVELS[l.level] || l.level || '') + '</span>';
  }
  function statusBadge(l) {
    const s = App.store.getStatus(l.id);
    if (s && LAB_STATUS[s]) return '<span class="badge ' + LAB_STATUS[s].cls + '">' + LAB_STATUS[s].label + '</span>';
    return '<span class="badge">' + App.t('labs.filterUnseen') + '</span>';
  }
  function dueBadge(l) {
    return App.store.isDue(l.id) ? '<span class="badge accent">' + App.t('labs.filterDue') + '</span>' : '';
  }

  function filtered() {
    return labs().filter(l => {
      if (state.cat !== 'all' && l.category !== state.cat) return false;
      if (state.level !== 'all' && l.level !== state.level) return false;
      const s = App.store.getStatus(l.id);
      if (state.status === 'unseen') return !s;
      if (state.status === 'due') return App.store.isDue(l.id);
      if (state.status !== 'all' && s !== state.status) return false;
      return true;
    });
  }

  function chipRow(label, items, current, attr) {
    const chips = items.map(it =>
      '<button type="button" class="chip' + (it.id === current ? ' active' : '') + '"' +
      ' aria-pressed="' + (it.id === current ? 'true' : 'false') + '"' +
      ' data-' + attr + '="' + App.esc(it.id) + '">' + App.esc(it.label) + '</button>').join('');
    return '<div class="lab-chiprow"><span class="lab-chiplabel">' + App.esc(label) + '</span>' +
      '<div class="chips">' + chips + '</div></div>';
  }

  // ------------------------------------------------------------------ list
  function handleListClick(e) {
    const root = e.currentTarget;
    if (e.target.closest('[data-clear]')) {
      state.cat = 'all'; state.level = 'all'; state.status = 'all';
      renderList(root);
      return;
    }
    const chip = e.target.closest('.chip');
    if (!chip) return;
    if (chip.dataset.cat) state.cat = chip.dataset.cat;
    else if (chip.dataset.level) state.level = chip.dataset.level;
    else if (chip.dataset.status) state.status = chip.dataset.status;
    else return;
    renderList(root);
  }

  function renderList(root) {
    const all = labs();
    const list = filtered();

    if (!all.length) {
      if (listHandler) { root.removeEventListener('click', listHandler); listHandler = null; }
      root.innerHTML =
        '<div class="page-head"><div><h1>' + App.t('labs.title') + '</h1>' +
          '<p>' + App.t('labs.subtitle') + '</p></div></div>' +
        '<div class="empty"><h2>' + App.t('labs.emptyTitle') + '</h2>' +
          '<p>' + App.t('labs.emptyHint') + '</p></div>';
      return () => {};
    }

    const cards = list.map(l => {
      const artN = (l.artifacts || []).length;
      const qN = (l.questions || []).length;
      const tags = (l.tags || []).join(', ');
      return '<a class="card lab-card" href="#/labs/' + App.esc(l.id) + '">' +
        '<div class="lab-card-top">' + catBadge(l) + levelBadge(l) + '</div>' +
        '<h3>' + App.esc(l.title) + '</h3>' +
        '<p class="small muted lab-card-sub">' + App.t('labs.artifactCount', {n: artN}) + ' · ' + App.t('labs.questionsCount', {n: qN}) +
          (tags ? ' · ' + App.esc(tags) : '') + '</p>' +
        '<div class="row lab-card-foot">' + statusBadge(l) + dueBadge(l) + '</div>' +
        '</a>';
    }).join('');

    root.innerHTML =
      '<div class="page-head">' +
        '<div><h1>' + App.t('labs.title') + '</h1>' +
          '<p>' + App.t('labs.subtitle') + '</p></div>' +
        '<span class="badge accent">' + App.t('labs.countText', {n: list.length, total: all.length}) + '</span>' +
      '</div>' +
      '<div class="card lab-filters">' +
        chipRow(App.t('labs.filterCategory'), CAT_FILTERS, state.cat, 'cat') +
        chipRow(App.t('labs.filterLevel'), LEVEL_FILTERS, state.level, 'level') +
        chipRow(App.t('labs.filterStatus'), STATUS_FILTERS, state.status, 'status') +
      '</div>' +
      (list.length
        ? '<div class="grid lab-grid">' + cards + '</div>'
        : '<div class="empty"><h2>' + App.t('labs.emptyFilterTitle') + '</h2>' +
            '<p>' + App.t('labs.emptyFilterHint') + '</p>' +
            '<p><button type="button" class="btn sm" data-clear>' + App.t('labs.clearFilterBtn') + '</button></p></div>');

    if (listHandler) root.removeEventListener('click', listHandler);
    listHandler = handleListClick;
    root.addEventListener('click', listHandler);
    return () => {
      root.removeEventListener('click', handleListClick);
      if (listHandler === handleListClick) listHandler = null;
    };
  }

  // ------------------------------------------------------------------ helpers
  /** Tách một dòng thành HTML đã escape, bọc các đoạn khớp trong <mark>. */
  function highlightLine(line, term) {
    if (!term) return { html: App.esc(line), count: 0 };
    const lower = line.toLowerCase();
    const t = term.toLowerCase();
    let out = '', pos = 0, idx, count = 0;
    while ((idx = lower.indexOf(t, pos)) !== -1) {
      out += App.esc(line.slice(pos, idx));
      out += '<mark>' + App.esc(line.slice(idx, idx + t.length)) + '</mark>';
      count++;
      pos = idx + t.length;
    }
    return { html: out + App.esc(line.slice(pos)), count: count };
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

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }

  // ------------------------------------------------------------------ detail
  function renderDetail(root, id) {
    const lab = labById(id);
    if (!lab) {
      root.innerHTML = '<div class="empty"><h2>' + App.t('labs.notFoundTitle') + '</h2>' +
        '<p>' + App.t('labs.notFoundHint', {id: App.esc(id)}) + '</p>' +
        '<p><a class="btn" href="#/labs">' + App.t('labs.notFoundBack') + '</a></p></div>';
      return () => {};
    }

    const all = labs();
    const idx = all.findIndex(x => x.id === lab.id);
    const prev = idx > 0 ? all[idx - 1] : null;
    const next = idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null;
    const artifacts = lab.artifacts || [];
    const questions = lab.questions || [];
    const hints = lab.hints || [];
    const rubric = lab.rubric || [];

    let artIdx = 0;
    let term = '';
    let hintsUsed = 0;
    let answerShown = false;
    let mic = null;
    let lastSpeech = null;
    let copyTimer = null;

    const offs = [];
    function on(el, ev, fn, opts) {
      if (!el) return;
      el.addEventListener(ev, fn, opts);
      offs.push(() => el.removeEventListener(ev, fn, opts));
    }

    const tabs = artifacts.map((a, i) =>
      '<button type="button" class="chip' + (i === 0 ? ' active' : '') + '" role="tab"' +
      ' aria-selected="' + (i === 0 ? 'true' : 'false') + '" data-art="' + i + '">' +
      App.esc(a.name || ('Artifact ' + (i + 1))) + '</button>').join('');

    root.innerHTML =
      '<div class="page-head lab-head">' +
        '<div>' +
          '<div class="row lab-title-row"><a class="link-btn" href="#/labs">' + App.t('labs.notFoundBack') + '</a>' +
            '<h1 class="lab-title">' + App.esc(lab.title) + '</h1></div>' +
          '<div class="row lab-meta" id="labMeta"></div>' +
        '</div>' +
        '<div class="row lab-nav">' +
          (prev ? '<a class="btn sm" href="#/labs/' + App.esc(prev.id) + '" title="' + App.esc(prev.title) + '">← ' + App.esc(prev.title) + '</a>' : '') +
          (next ? '<a class="btn sm" href="#/labs/' + App.esc(next.id) + '" title="' + App.esc(next.title) + '">' + App.esc(next.title) + ' →</a>' : '') +
        '</div>' +
      '</div>' +
      '<div class="lab-layout">' +
        '<section class="card lab-left">' +
          '<div class="md">' + App.md(lab.scenario || '') + '</div>' +
          '<div class="lab-artifacts">' +
            '<div class="row lab-art-head"><h3>' + App.t('labs.artifactTitle') + '</h3>' +
              '<span class="small muted">' + artifacts.length + ' ' + App.t('labs.artifactCount', {n: artifacts.length}) + ' · ' + App.t('labs.readHint') + '</span></div>' +
            '<div class="chips lab-tabs" id="labTabs" role="tablist" aria-label="' + App.t('labs.artifactAria') + '">' + tabs + '</div>' +
            '<div class="row lab-art-tools">' +
              '<input class="input lab-search" id="labSearch" type="search" placeholder="' + App.t('labs.searchPlaceholder') + '" aria-label="' + App.t('labs.searchAria') + '">' +
              '<button type="button" class="btn sm" id="labCopy">' + App.t('labs.copyBtn') + '</button>' +
            '</div>' +
            '<div class="lab-viewer" id="labViewer" role="region" aria-label="' + App.t('labs.artifactTitle') + '" tabindex="0"></div>' +
            '<p class="small muted lab-match" id="labMatch" aria-live="polite"></p>' +
          '</div>' +
        '</section>' +
        '<section class="card lab-right">' +
          '<h2>' + App.t('labs.questionsTitle') + '</h2>' +
          '<ol class="lab-questions">' + questions.map(q => '<li>' + App.esc(q) + '</li>').join('') + '</ol>' +
          '<label class="field"><span>' + App.t('labs.answerLabel') + '</span>' +
            '<textarea class="textarea lab-textarea" id="labAnswer" rows="8"' +
              ' placeholder="' + App.t('labs.answerPlaceholder') + '">' +
              App.esc(loadDraft(lab.id)) + '</textarea></label>' +
          '<div class="row lab-answer-actions">' +
            (App.speech.supported
              ? '<button type="button" class="btn mic-btn" id="labMic" title="' + App.t('labs.micBtnTitle') + '"' +
                ' aria-label="' + App.t('labs.micAria') + '">🎤</button>'
              : '') +
            '<button type="button" class="btn" id="labHint"' + (hints.length ? '' : ' disabled') + '>' +
              (hints.length ? App.t('labs.hintBtn', {n: 1, total: hints.length}) : App.t('labs.hintDone')) + '</button>' +
            '<button type="button" class="btn primary" id="labGrade">' + App.t('labs.gradeBtn') + '</button>' +
            '<button type="button" class="btn" id="labShowAnswer">' + App.t('labs.showAnswerBtn') + '</button>' +
          '</div>' +
          '<p class="small muted lab-kbd-tip">' + App.t('labs.kbdTip') + '</p>' +
          '<div class="lab-speech" id="labSpeech"></div>' +
          '<div class="lab-hints" id="labHints"></div>' +
          '<div class="lab-fb" id="labFb" aria-live="polite"></div>' +
          '<div class="lab-answer-box" id="labAnswerBox"></div>' +
          '<div class="lab-self" id="labSelf">' +
            '<div class="row lab-self-row"><b>' + App.t('labs.selfTitle') + '</b>' +
              '<button type="button" class="btn sm ok" data-mark="known" aria-pressed="false">' + App.t('labs.selfMarkKnown') + '</button>' +
              '<button type="button" class="btn sm warn" data-mark="review" aria-pressed="false">' + App.t('labs.selfMarkReview') + '</button>' +
              '<button type="button" class="btn sm bad" data-mark="unknown" aria-pressed="false">' + App.t('labs.selfMarkUnknown') + '</button>' +
              '<span class="small muted" id="labSaved" aria-live="polite"></span>' +
            '</div>' +
            '<p class="small muted lab-self-note">' + App.t('labs.selfNote') + '</p>' +
          '</div>' +
          '<div class="lab-related">' + App.ui.relatedQuestions({
            topic: ({ thread: 'concurrency', gc: 'jvm', sql: 'sql', incident: 'microservices' })[lab.category] || '',
            tags: lab.tags,
            limit: 4,
          }) + '</div>' +
        '</section>' +
      '</div>';

    const els = {
      meta: root.querySelector('#labMeta'),
      tabs: root.querySelector('#labTabs'),
      search: root.querySelector('#labSearch'),
      copy: root.querySelector('#labCopy'),
      viewer: root.querySelector('#labViewer'),
      match: root.querySelector('#labMatch'),
      answer: root.querySelector('#labAnswer'),
      mic: root.querySelector('#labMic'),
      hint: root.querySelector('#labHint'),
      grade: root.querySelector('#labGrade'),
      answerBtn: root.querySelector('#labShowAnswer'),
      speech: root.querySelector('#labSpeech'),
      hints: root.querySelector('#labHints'),
      fb: root.querySelector('#labFb'),
      answerBox: root.querySelector('#labAnswerBox'),
      self: root.querySelector('#labSelf'),
      saved: root.querySelector('#labSaved'),
    };

    function renderArtifact() {
      const a = artifacts[artIdx];
      if (!a) {
        els.viewer.innerHTML = '<div class="lab-line"><span class="lab-code">' + App.t('labs.noArtifact') + '</span></div>';
        els.match.textContent = '';
        return;
      }
      const lines = String(a.content || '').replace(/\r\n?/g, '\n').split('\n');
      let matches = 0;
      const html = lines.map((line, n) => {
        const r = highlightLine(line, term);
        matches += r.count;
        return '<div class="lab-line"><span class="lab-ln" aria-hidden="true">' + (n + 1) + '</span>' +
          '<span class="lab-code">' + r.html + '</span></div>';
      }).join('');
      els.viewer.innerHTML = html;
      els.viewer.scrollTop = 0;
      els.viewer.scrollLeft = 0;
      if (term) {
        els.match.textContent = matches
          ? App.t('labs.searchMatch', {matches: matches, lines: lines.length})
          : App.t('labs.searchNoMatch', {term: term});
      } else {
        els.match.textContent = App.t('labs.searchLines', {n: lines.length});
      }
    }

    function refreshMeta() {
      els.meta.innerHTML = catBadge(lab) + levelBadge(lab) +
        '<span class="badge">' + App.esc(lab.id) + '</span>' +
        statusBadge(lab) + dueBadge(lab);
      const s = App.store.getStatus(lab.id);
      els.self.querySelectorAll('[data-mark]').forEach(b => {
        const active = b.dataset.mark === s;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    }

    function showHint() {
      if (hintsUsed >= hints.length) return;
      const text = hints[hintsUsed];
      hintsUsed++;
      const item = document.createElement('div');
      item.className = 'lab-hint';
      item.innerHTML = '<b>' + App.t('labs.hintItem', {n: hintsUsed}) + '</b><div class="md">' + App.md(text) + '</div>';
      els.hints.appendChild(item);
      els.hint.textContent = hintsUsed < hints.length
        ? App.t('labs.hintBtn', {n: hintsUsed + 1, total: hints.length})
        : App.t('labs.hintDone');
      els.hint.disabled = hintsUsed >= hints.length;
    }

    function showAnswer() {
      if (answerShown) return;
      if (hintsUsed < hints.length && !confirm(App.t('labs.solutionConfirm', {n: hintsUsed, total: hints.length}))) return;
      answerShown = true;
      const checks = rubric.map(r =>
        '<li><label><input type="checkbox"><span class="md">' +
        App.md(r).replace(/<\/?p>/g, '') + '</span></label></li>').join('');
      els.answerBox.innerHTML = '<div class="lab-answer-wrap">' +
        '<h3>' + App.t('labs.answerTitle') + '</h3><div class="md">' + App.md(lab.answer || '') + '</div>' +
        (checks ? '<h3>' + App.t('labs.rubricTitle') + '</h3><ul class="lab-rubric">' + checks + '</ul>' : '') +
        '</div>';
      els.answerBtn.disabled = true;
      els.answerBtn.textContent = App.t('labs.showAnswerDone');
      els.answerBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async function gradeAnswer() {
      if (els.grade.disabled) return;
      const answer = els.answer.value.trim();
      if (!answer) {
        els.fb.innerHTML = '<div class="ai-error">' + App.t('labs.gradeError') + '</div>';
        els.answer.focus();
        return;
      }
      if (mic) {
        try { lastSpeech = mic.stop(); } catch (e) { /* ignore */ }
        mic = null;
        if (els.mic) {
          els.mic.classList.remove('recording');
          els.mic.setAttribute('aria-label', App.t('labs.micAria'));
          els.speech.innerHTML = App.ui.speechStats(lastSpeech);
        }
      }
      els.grade.disabled = true;
      els.fb.innerHTML = '<span class="ai-loading">' + App.t('labs.gradeLoading') + '</span>';
      try {
        const res = await App.ai.grade({
          question: questions.join(' '),
          reference: (lab.answer || '') + '\nRubric: ' + rubric.join('; '),
          answer: answer,
          lang: 'vi',
          topic: 'lab-' + lab.category,
          level: lab.level,
          speech: lastSpeech || undefined,
        });
        els.fb.innerHTML = App.ui.feedback(res, 'vi');
      } catch (e) {
        els.fb.innerHTML = App.ui.error(e);
      } finally {
        els.grade.disabled = false;
      }
    }

    // ---- artifact tabs + search + copy
    on(els.tabs, 'click', e => {
      const btn = e.target.closest('[data-art]');
      if (!btn) return;
      artIdx = parseInt(btn.dataset.art, 10) || 0;
      els.tabs.querySelectorAll('[data-art]').forEach(x => {
        const active = x === btn;
        x.classList.toggle('active', active);
        x.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderArtifact();
    });

    on(els.search, 'input', e => {
      term = e.target.value.trim();
      renderArtifact();
    });

    on(els.copy, 'click', () => {
      const a = artifacts[artIdx];
      if (!a) return;
      copyText(String(a.content || ''), () => {
        const old = els.copy.textContent;
        els.copy.textContent = App.t('labs.copyDone');
        if (copyTimer) clearTimeout(copyTimer);
        copyTimer = setTimeout(() => { els.copy.textContent = old; }, 1500);
      });
    });

    // ---- answer draft + speech
    on(els.answer, 'input', () => saveDraft(lab.id, els.answer.value));

    if (els.mic) {
      on(els.mic, 'click', () => {
        if (mic) {
          try { lastSpeech = mic.stop(); } catch (e) { /* ignore */ }
          mic = null;
          els.mic.classList.remove('recording');
          els.mic.setAttribute('aria-label', App.t('labs.micAria'));
          els.speech.innerHTML = App.ui.speechStats(lastSpeech);
          return;
        }
        try {
          els.mic.classList.add('recording');
          els.mic.setAttribute('aria-label', App.t('labs.micStopAria'));
          mic = App.speech.start({
            lang: 'vi',
            onText: (finalText, interim) => {
              els.answer.value = finalText + (interim ? ' ' + interim : '');
              saveDraft(lab.id, els.answer.value);
            },
            onError: msg => {
              mic = null;
              els.mic.classList.remove('recording');
              els.mic.setAttribute('aria-label', App.t('labs.micAria'));
              els.fb.innerHTML = '<div class="ai-error">⚠️ ' + App.esc(msg) + '</div>';
            },
          });
        } catch (e) {
          els.mic.classList.remove('recording');
          els.fb.innerHTML = App.ui.error(e);
        }
      });
    }

    // ---- hints / answer / grade
    on(els.hint, 'click', showHint);
    on(els.answerBtn, 'click', showAnswer);
    on(els.grade, 'click', gradeAnswer);

    // ---- self-assessment
    on(els.self, 'click', e => {
      const btn = e.target.closest('[data-mark]');
      if (!btn) return;
      App.store.setStatus(lab.id, btn.dataset.mark);
      refreshMeta();
      const due = App.store.getDue(lab.id);
      els.saved.textContent = due ? App.t('labs.selfSavedDue', {date: App.fmtDate(due)}) : App.t('labs.selfSaved');
    });

    // ---- phím tắt: H = gợi ý, S = xem đáp án (bỏ qua khi đang gõ)
    offs.push(App.onKey(e => {
      const k = e.key.toLowerCase();
      if (k === 'h') showHint();
      else if (k === 's') showAnswer();
    }));

    renderArtifact();
    refreshMeta();

    return () => {
      if (mic) { try { mic.stop(); } catch (e) { /* ignore */ } mic = null; }
      if (copyTimer) { clearTimeout(copyTimer); copyTimer = null; }
      offs.forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
    };
  }

  // ------------------------------------------------------------------ register
  App.registerView('labs', {
    get title() { return App.t('labs.title'); },
    render(root, params) {
      if (params && params.length) return renderDetail(root, params[0]);
      return renderList(root);
    },
  });
})();
