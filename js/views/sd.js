(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'sd.title': 'Luyện System Design',
      'sd.subtitle': 'Bấm giờ từng pha như vòng phỏng vấn 45 phút thật, AI chấm theo rubric.',
      'sd.back': 'Danh sách đề',
      'sd.all': 'Tất cả',
      'sd.bank': 'Ngân hàng',
      'sd.bigtech': 'Big tech',
      'sd.level': 'Level',
      'sd.todo': 'Chưa làm',
      'sd.doneFilter': 'Đã làm',
      'sd.notStarted': 'Chưa làm',
      'sd.lastScore': 'Lần gần nhất: {score}/5',
      'sd.start': 'Bắt đầu',
      'sd.open': 'Xem lại',
      'sd.empty': 'Chưa có đề nào. Quay lại sau khi nội dung được thêm.',
      'sd.minutes': '{n} phút',
      'sd.phase': 'Pha {n}/{total}',
      'sd.guide': 'Hướng dẫn pha này',
      'sd.answer': 'Bài làm của bạn',
      'sd.answerPlaceholder': 'Viết ý chính, sơ đồ dạng text, trade-off… như đang nói với interviewer.',
      'sd.next': 'Sang pha tiếp',
      'sd.finish': 'Kết thúc',
      'sd.pause': 'Tạm dừng',
      'sd.resume': 'Tiếp tục',
      'sd.done': 'Đã hết giờ',
      'sd.finished': 'Kết thúc — tổng kết bài làm',
      'sd.grade': 'AI chấm bài',
      'sd.grading': 'AI đang chấm…',
      'sd.gradeHint': 'Mỗi lần chấm tốn 1 lượt hạn mức AI. Chỉ bấm khi đã viết đủ các pha.',
      'sd.reference': 'Đáp án mẫu',
      'sd.showReference': 'Xem đáp án mẫu',
      'sd.hideReference': 'Ẩn đáp án mẫu',
      'sd.followups': 'Câu hỏi đào sâu',
      'sd.selfScore': 'Tự chấm',
      'sd.selfScoreHint': '1 = chưa đạt, 5 = rất tốt. Điểm được lưu vào lịch sử.',
      'sd.saved': 'Đã lưu điểm {score}/5',
      'sd.related': 'Câu hỏi phỏng vấn liên quan',
      'sd.notFound': 'Không tìm thấy đề này.',
      'sd.timerAria': 'Đồng hồ đếm ngược pha hiện tại',
      'sd.mic': 'Đọc bài làm bằng giọng nói',
      'sd.micStop': 'Dừng ghi âm',
      'sd.kbd': 'Phím tắt: <kbd>n</kbd> sang pha · <kbd>p</kbd> tạm dừng/tiếp tục.',
      'sd.phaseDone': 'Pha này đã lưu nháp tự động.',
      'sd.scoreLabel': 'Điểm',
      'sd.toc': 'Mục lục các pha',
      'sd.tocHint': 'Chọn pha để xem hướng dẫn. Chuyển pha sẽ lưu nháp và đặt lại đồng hồ pha.',
      'sd.autosaved': 'Đã tự lưu nháp',
      'sd.noAnswer': 'Chưa có nội dung.',
      'sd.yourDrafts': 'Bài làm theo từng pha',
      'sd.compare': 'So sánh với đáp án mẫu',
      'sd.compareHint': 'Tự đối chiếu: ý nào đã có, ý nào còn thiếu, trade-off nào cần bổ sung.',
      'sd.noRef': 'Chưa có đáp án mẫu cho đề này.',
      'sd.count': '{n}/{total} đề',
      'sd.emptyFiltered': 'Không có đề nào khớp bộ lọc đang chọn.',
      'sd.clearFilters': 'Xoá bộ lọc',
      'sd.saving': 'Đang lưu…',
      'sd.timeUp': 'Hết giờ pha này — đã tự chuyển sang pha sau.',
      'sd.allDone': 'Đã hết giờ cả 5 pha. Xem tổng kết bên dưới.',
      'sd.endEarly': 'Kết thúc sớm',
      'sd.restart': 'Làm lại từ đầu',
      'sd.restartConfirm': 'Xoá toàn bộ bài làm và đặt lại đồng hồ cho đề này?',
    },
    en: {
      'sd.title': 'System design practice',
      'sd.subtitle': 'Time each phase like a real 45-minute interview round; AI grades against the rubric.',
      'sd.back': 'Problem list',
      'sd.all': 'All',
      'sd.bank': 'Banking',
      'sd.bigtech': 'Big tech',
      'sd.level': 'Level',
      'sd.todo': 'Not done',
      'sd.doneFilter': 'Done',
      'sd.notStarted': 'Not started',
      'sd.lastScore': 'Latest: {score}/5',
      'sd.start': 'Start',
      'sd.open': 'Review',
      'sd.empty': 'No problems yet. Check back once content is added.',
      'sd.minutes': '{n} min',
      'sd.phase': 'Phase {n}/{total}',
      'sd.guide': 'Phase guide',
      'sd.answer': 'Your answer',
      'sd.answerPlaceholder': 'Write key points, a text diagram, trade-offs… as if talking to the interviewer.',
      'sd.next': 'Next phase',
      'sd.finish': 'Finish',
      'sd.pause': 'Pause',
      'sd.resume': 'Resume',
      'sd.done': 'Time is up',
      'sd.finished': 'Done — your summary',
      'sd.grade': 'AI grade',
      'sd.grading': 'AI is grading…',
      'sd.gradeHint': 'Each grade uses 1 AI quota unit. Click only after writing all phases.',
      'sd.reference': 'Reference answer',
      'sd.showReference': 'Show reference answer',
      'sd.hideReference': 'Hide reference answer',
      'sd.followups': 'Follow-up questions',
      'sd.selfScore': 'Self score',
      'sd.selfScoreHint': '1 = poor, 5 = excellent. The score is saved to history.',
      'sd.saved': 'Saved {score}/5',
      'sd.related': 'Related interview questions',
      'sd.notFound': 'Problem not found.',
      'sd.timerAria': 'Countdown for the current phase',
      'sd.mic': 'Dictate your answer',
      'sd.micStop': 'Stop recording',
      'sd.kbd': 'Shortcuts: <kbd>n</kbd> next phase · <kbd>p</kbd> pause/resume.',
      'sd.phaseDone': 'This phase is auto-saved.',
      'sd.scoreLabel': 'Score',
      'sd.toc': 'Phase outline',
      'sd.tocHint': 'Select a phase to view its guide. Switching phases saves the draft and resets that phase timer.',
      'sd.autosaved': 'Draft auto-saved',
      'sd.noAnswer': 'No content yet.',
      'sd.yourDrafts': 'Your draft by phase',
      'sd.compare': 'Compare with reference',
      'sd.compareHint': 'Self-check: what you covered, what is missing, and which trade-offs to add.',
      'sd.noRef': 'No reference answer for this problem yet.',
      'sd.count': '{n}/{total} problems',
      'sd.emptyFiltered': 'No problem matches the selected filters.',
      'sd.clearFilters': 'Clear filters',
      'sd.saving': 'Saving…',
      'sd.timeUp': 'Phase time is up — moved to the next phase automatically.',
      'sd.allDone': 'All 5 phases are done. The summary is below.',
      'sd.endEarly': 'Finish early',
      'sd.restart': 'Start over',
      'sd.restartConfirm': 'Clear all answers and reset the timers for this problem?',
    },
  });

  const FALLBACK_PHASES = [
    { name: 'Requirements', minutes: 5, guide: 'Ask about users, core flows, scale, SLA and what is out of scope.' },
    { name: 'Estimation', minutes: 5, guide: 'Estimate QPS, storage, bandwidth and read/write ratio.' },
    { name: 'API & data model', minutes: 5, guide: 'Define the main endpoints, idempotency, schema and indexes.' },
    { name: 'High-level design', minutes: 15, guide: 'Draw the components and the request flow end to end.' },
    { name: 'Deep dive', minutes: 15, guide: 'Pick the hardest part: consistency, hot keys, failure or scale.' },
  ];

  const fmtTime = s => {
    const n = Math.max(0, Math.floor(Number(s) || 0));
    return String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  };

  const problems = () => (Array.isArray(window.SD_PROBLEMS) ? window.SD_PROBLEMS : []);
  const phasesOf = p => (Array.isArray(p.phases) && p.phases.length ? p.phases : FALLBACK_PHASES);

  // one-line plain text preview: drop code blocks and markup signs, so the list shows readable Vietnamese
  const preview = (s, max) => {
    const t = String(s || '')
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      .replace(/\{\{([^}]*)\}\}/g, '$1')
      .replace(/[*#>`|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const n = max || 160;
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
  };

  function history() {
    const d = App.store.data;
    if (!Array.isArray(d.sdHistory)) d.sdHistory = [];
    return d.sdHistory;
  }

  function latestScore(id) {
    const h = history().find(x => x && x.id === id);
    return h ? h.score : null;
  }

  function kindLabel(kind) {
    return kind === 'bank' ? App.t('sd.bank') : kind === 'bigtech' ? App.t('sd.bigtech') : '';
  }

  function levelBadge(level) {
    return '<span class="badge">' + App.esc(App.LEVELS[level] || level || '') + '</span>';
  }

  function pageHead() {
    return '<div class="page-head"><div><h1>' + App.esc(App.t('sd.title')) + '</h1>' +
      '<p class="muted">' + App.esc(App.t('sd.subtitle')) + '</p></div></div>';
  }

  // ---------- list ----------
  function list(root) {
    const all = problems();
    const state = { kind: 'all', level: 'all', done: 'all' };

    root.innerHTML = pageHead() +
      '<p class="small muted sd-count" id="sdCount" role="status" aria-live="polite"></p>' +
      '<div class="row sd-filters" id="sdFilters">' +
        '<span class="chips" role="group" aria-label="' + App.esc(App.t('sd.all')) + '">' +
          ['all', 'bank', 'bigtech'].map(k =>
            '<button type="button" class="chip' + (k === 'all' ? ' active' : '') + '" data-kind="' + k + '">' +
              App.esc(k === 'all' ? App.t('sd.all') : kindLabel(k)) + '</button>').join('') +
        '</span>' +
        '<span class="chips" role="group" aria-label="' + App.esc(App.t('sd.level')) + '">' +
          ['all', 'senior', 'lead'].map(l =>
            '<button type="button" class="chip' + (l === 'all' ? ' active' : '') + '" data-level="' + l + '">' +
              App.esc(l === 'all' ? App.t('sd.all') : App.LEVELS[l]) + '</button>').join('') +
        '</span>' +
        '<span class="chips" role="group" aria-label="' + App.esc(App.t('sd.todo')) + '">' +
          '<button type="button" class="chip active" data-done="all">' + App.esc(App.t('sd.all')) + '</button>' +
          '<button type="button" class="chip" data-done="todo">' + App.esc(App.t('sd.todo')) + '</button>' +
          '<button type="button" class="chip" data-done="done">' + App.esc(App.t('sd.doneFilter')) + '</button>' +
        '</span>' +
      '</div>' +
      '<div class="sd-list" id="sdList"></div>';

    const box = root.querySelector('#sdList');
    const filters = root.querySelector('#sdFilters');
    const count = root.querySelector('#sdCount');

    function resetFilters() {
      state.kind = 'all';
      state.level = 'all';
      state.done = 'all';
      filters.querySelectorAll('.chip').forEach(c => {
        const on = c.dataset.kind === 'all' || c.dataset.level === 'all' || c.dataset.done === 'all';
        c.classList.toggle('active', on);
      });
      draw();
    }

    function draw() {
      const rows = all.filter(p =>
        (state.kind === 'all' || p.kind === state.kind) &&
        (state.level === 'all' || p.level === state.level) &&
        (state.done === 'all' || (state.done === 'done') === (latestScore(p.id) != null)));
      if (count) count.textContent = App.t('sd.count', { n: rows.length, total: all.length });
      if (!rows.length) {
        const filtered = all.length > 0;
        box.innerHTML = '<div class="empty card sd-empty">' +
          '<p>' + App.esc(App.t(filtered ? 'sd.emptyFiltered' : 'sd.empty')) + '</p>' +
          (filtered ? '<button type="button" class="btn" id="sdClear">' + App.esc(App.t('sd.clearFilters')) + '</button>' : '') +
          '</div>';
        return;
      }
      box.innerHTML = rows.map(p => {
        const score = latestScore(p.id);
        return '<article class="card sd-row">' +
          '<div class="sd-row-head"><h2><a href="#/sd/' + encodeURIComponent(p.id) + '">' + App.esc(p.title) + '</a></h2>' +
            '<span class="badge accent">' + App.esc(kindLabel(p.kind)) + '</span>' + levelBadge(p.level) + '</div>' +
          '<p class="muted small">' + App.esc(preview(p.prompt)) + '</p>' +
          '<div class="row sd-row-foot">' +
            '<span class="badge ' + (score == null ? '' : 'ok') + '">' +
              App.esc(score == null ? App.t('sd.notStarted') : App.t('sd.lastScore', { score })) + '</span>' +
            '<a class="btn sm ' + (score == null ? 'primary' : '') + '" href="#/sd/' + encodeURIComponent(p.id) + '">' +
              App.esc(score == null ? App.t('sd.start') : App.t('sd.open')) + '</a>' +
          '</div>' +
        '</article>';
      }).join('');
    }

    filters.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.kind) { state.kind = b.dataset.kind; b.parentElement.querySelectorAll('[data-kind]').forEach(x => x.classList.toggle('active', x === b)); }
      if (b.dataset.level) { state.level = b.dataset.level; b.parentElement.querySelectorAll('[data-level]').forEach(x => x.classList.toggle('active', x === b)); }
      if (b.dataset.done) { state.done = b.dataset.done; b.parentElement.querySelectorAll('[data-done]').forEach(x => x.classList.toggle('active', x === b)); }
      draw();
    });

    box.addEventListener('click', e => {
      if (e.target.closest('#sdClear')) resetFilters();
    });

    draw();
    return () => {};
  }

  // ---------- detail ----------
  function detail(root, id) {
    const p = problems().find(x => x.id === id);
    if (!p) {
      root.innerHTML = pageHead() + '<div class="empty card">' + App.esc(App.t('sd.notFound')) + '</div>';
      return () => {};
    }
    const phases = phasesOf(p);
    const drafts = App.store.data.sdDrafts || (App.store.data.sdDrafts = {});
    const d = drafts[id] || (drafts[id] = {
      answers: phases.map(() => ''),
      phase: 0,
      remaining: (phases[0].minutes || 5) * 60,
      paused: false,
      done: false,
      updatedAt: Date.now(),
    });
    if (!Array.isArray(d.answers)) d.answers = phases.map(() => '');
    while (d.answers.length < phases.length) d.answers.push('');
    if (typeof d.phase !== 'number' || d.phase < 0 || d.phase >= phases.length) d.phase = 0;
    if (typeof d.remaining !== 'number' || d.remaining < 0) d.remaining = (phases[d.phase].minutes || 5) * 60;

    const save = () => { d.updatedAt = Date.now(); App.store.save(); };
    let timer = 0;
    let mic = null;
    let saveTimer = 0;
    let announcedPhase = -1;
    let justTimedUp = false;
    let justFinished = false;

    // one polite live region: the ticking clock itself is NOT aria-live (that would read every second)
    function announce(msg) {
      if (els.announce && els.announce.textContent !== msg) els.announce.textContent = msg;
    }

    function announcePhase() {
      const ph = phases[d.phase];
      const name = ph.name || App.t('sd.phase', { n: d.phase + 1, total: phases.length });
      const head = justTimedUp ? App.t('sd.timeUp') + ' ' : '';
      justTimedUp = false;
      announce(head + App.t('sd.phase', { n: d.phase + 1, total: phases.length }) + ': ' + name +
        ' · ' + App.t('sd.minutes', { n: ph.minutes || 0 }));
    }

    root.innerHTML =
      '<a class="link-btn" href="#/sd">← ' + App.esc(App.t('sd.back')) + '</a>' +
      '<div class="page-head sd-head">' +
        '<div><h1>' + App.esc(p.title) + '</h1>' +
          '<div class="row sd-meta">' +
            '<span class="badge accent">' + App.esc(kindLabel(p.kind)) + '</span>' + levelBadge(p.level) +
            '<span class="badge">' + App.esc(p.id) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="sd-clock">' +
          '<div class="sd-time" id="sdTime" role="timer" aria-label="' + App.esc(App.t('sd.timerAria')) + '">00:00</div>' +
          '<button type="button" class="btn sm" id="sdPause">' + App.esc(App.t('sd.pause')) + '</button>' +
        '</div>' +
      '</div>' +
      '<p class="sd-sr" id="sdAnnounce" role="status" aria-live="polite"></p>' +
      '<section class="card sd-brief"><div class="md">' + App.md(p.prompt || '') + '</div></section>' +
      '<nav class="card sd-toc" aria-label="' + App.esc(App.t('sd.toc')) + '">' +
        '<h2 class="sd-toc-title">' + App.esc(App.t('sd.toc')) + '</h2>' +
        '<p class="small muted">' + App.esc(App.t('sd.tocHint')) + '</p>' +
        '<div class="sd-phases" id="sdPhases" role="tablist" aria-label="' + App.esc(App.t('sd.toc')) + '"></div>' +
      '</nav>' +
      '<section class="card sd-guide" aria-labelledby="sdPhaseTitle">' +
        '<h3 id="sdPhaseTitle"></h3>' +
        '<div class="md sd-guide-body" id="sdGuide"></div>' +
      '</section>' +
      '<section class="card sd-write" aria-labelledby="sdAnswerLabel">' +
        '<div class="row sd-write-head">' +
          '<label class="field sd-write-field" for="sdAnswer"><span id="sdAnswerLabel">' + App.esc(App.t('sd.answer')) + '</span></label>' +
          '<span class="badge ok sd-save-badge" id="sdSaveBadge" aria-live="polite">' + App.esc(App.t('sd.autosaved')) + '</span>' +
        '</div>' +
        '<textarea class="textarea sd-textarea" id="sdAnswer" rows="12" placeholder="' + App.esc(App.t('sd.answerPlaceholder')) + '"></textarea>' +
        '<div class="row sd-write-actions">' +
          (App.speech.supported ? '<button type="button" class="btn mic-btn" id="sdMic" aria-label="' + App.esc(App.t('sd.mic')) + '">🎤</button>' : '') +
          '<button type="button" class="btn" id="sdEnd">' + App.esc(App.t('sd.endEarly')) + '</button>' +
          '<button type="button" class="btn primary" id="sdNext">' + App.esc(App.t('sd.next')) + '</button>' +
        '</div>' +
        '<p class="small muted">' + App.t('sd.kbd') + ' · ' + App.esc(App.t('sd.phaseDone')) + '</p>' +
      '</section>' +
      '<section class="card sd-finish" id="sdFinish" hidden>' +
        '<h2>' + App.esc(App.t('sd.finished')) + '</h2>' +
        '<div class="row sd-finish-actions">' +
          '<button type="button" class="btn primary" id="sdGrade">' + App.esc(App.t('sd.grade')) + '</button>' +
          '<button type="button" class="btn" id="sdRefBtn">' + App.esc(App.t('sd.showReference')) + '</button>' +
          '<button type="button" class="btn" id="sdRestart">' + App.esc(App.t('sd.restart')) + '</button>' +
        '</div>' +
        '<p class="small muted">' + App.esc(App.t('sd.gradeHint')) + '</p>' +
        '<div class="sd-fb" id="sdFb" aria-live="polite"></div>' +
        '<div class="sd-self" id="sdSelf">' +
          '<b>' + App.esc(App.t('sd.selfScore')) + '</b>' +
          '<div class="row sd-score-row" role="group" aria-label="' + App.esc(App.t('sd.selfScore')) + '">' + [1, 2, 3, 4, 5].map(n =>
            '<button type="button" class="btn sm sd-score-btn" data-score="' + n + '" aria-pressed="false" aria-label="' + App.esc(App.t('sd.scoreLabel')) + ' ' + n + '">' + n + '</button>').join('') + '</div>' +
          '<p class="small muted">' + App.esc(App.t('sd.selfScoreHint')) + '</p>' +
          '<p class="small" id="sdSaved" aria-live="polite"></p>' +
        '</div>' +
        '<div class="sd-compare" id="sdCompare" hidden>' +
          '<h3>' + App.esc(App.t('sd.compare')) + '</h3>' +
          '<p class="small muted">' + App.esc(App.t('sd.compareHint')) + '</p>' +
          '<div class="sd-compare-grid">' +
            '<div class="sd-compare-col"><h4>' + App.esc(App.t('sd.yourDrafts')) + '</h4><div class="md" id="sdYourDrafts"></div></div>' +
            '<div class="sd-compare-col"><h4>' + App.esc(App.t('sd.reference')) + '</h4><div class="md" id="sdRefBody"></div></div>' +
          '</div>' +
        '</div>' +
        '<div id="sdFollow"></div>' +
      '</section>' +
      '<div id="sdRelated"></div>';

    const els = {
      time: root.querySelector('#sdTime'),
      pause: root.querySelector('#sdPause'),
      phases: root.querySelector('#sdPhases'),
      phaseTitle: root.querySelector('#sdPhaseTitle'),
      guide: root.querySelector('#sdGuide'),
      answer: root.querySelector('#sdAnswer'),
      next: root.querySelector('#sdNext'),
      mic: root.querySelector('#sdMic'),
      finish: root.querySelector('#sdFinish'),
      grade: root.querySelector('#sdGrade'),
      refBtn: root.querySelector('#sdRefBtn'),
      fb: root.querySelector('#sdFb'),
      self: root.querySelector('#sdSelf'),
      saved: root.querySelector('#sdSaved'),
      follow: root.querySelector('#sdFollow'),
      related: root.querySelector('#sdRelated'),
      compare: root.querySelector('#sdCompare'),
      yourDrafts: root.querySelector('#sdYourDrafts'),
      refBody: root.querySelector('#sdRefBody'),
      saveBadge: root.querySelector('#sdSaveBadge'),
      announce: root.querySelector('#sdAnnounce'),
      end: root.querySelector('#sdEnd'),
      restart: root.querySelector('#sdRestart'),
    };

    els.phases.innerHTML = phases.map((ph, i) =>
      '<button type="button" class="sd-phase" role="tab" data-phase="' + i + '" aria-label="' +
        App.esc(App.t('sd.phase', { n: i + 1, total: phases.length }) + ': ' + (ph.name || '') + ' (' + App.t('sd.minutes', { n: ph.minutes || 0 }) + ')') + '">' +
        '<span class="sd-phase-n">' + (i + 1) + '</span>' +
        '<span class="sd-phase-name">' + App.esc(ph.name || App.t('sd.phase', { n: i + 1, total: phases.length })) + '</span>' +
        '<span class="sd-phase-min">' + App.esc(App.t('sd.minutes', { n: ph.minutes || 0 })) + '</span>' +
      '</button>').join('');

    if (els.related && App.ui.relatedQuestions) {
      els.related.innerHTML = App.ui.relatedQuestions({ ids: p.related || [], topic: 'design', limit: 4 });
    }
    if (Array.isArray(p.followups) && p.followups.length) {
      els.follow.innerHTML = '<section class="sd-followups" aria-labelledby="sdFollowTitle"><h3 id="sdFollowTitle">' + App.esc(App.t('sd.followups')) + '</h3><ul>' +
        p.followups.map(f => '<li>' + App.esc(f) + '</li>').join('') + '</ul></section>';
    } else {
      els.follow.innerHTML = '';
    }

    function renderDrafts() {
      if (!els.yourDrafts) return;
      const has = phases.some((_, i) => String(d.answers[i] || '').trim());
      if (!has) {
        els.yourDrafts.innerHTML = '<p class="muted">' + App.esc(App.t('sd.noAnswer')) + '</p>';
        return;
      }
      els.yourDrafts.innerHTML = phases.map((ph, i) => {
        const body = String(d.answers[i] || '').trim();
        const title = App.esc((i + 1) + '. ' + (ph.name || App.t('sd.phase', { n: i + 1, total: phases.length })));
        return '<section class="sd-draft-block"><h5>' + title + '</h5>' +
          (body ? '<div class="md">' + App.md(body) + '</div>' : '<p class="muted small">' + App.esc(App.t('sd.noAnswer')) + '</p>') +
          '</section>';
      }).join('');
    }

    function renderReference() {
      if (!els.refBody) return;
      const ref = String(p.reference || '').trim();
      els.refBody.innerHTML = ref ? App.md(ref) : '<p class="muted">' + App.esc(App.t('sd.noRef')) + '</p>';
    }

    function renderCompare(show) {
      if (!els.compare) return;
      if (show) {
        renderDrafts();
        renderReference();
        els.compare.hidden = false;
      } else {
        els.compare.hidden = true;
      }
      if (els.refBtn) {
        els.refBtn.textContent = els.compare.hidden ? App.t('sd.showReference') : App.t('sd.hideReference');
      }
    }

    // mark the self-score button that matches the latest saved score, so the panel shows the state at a glance
    function paintSelf(score) {
      if (!els.self) return;
      els.self.querySelectorAll('[data-score]').forEach(b => {
        b.setAttribute('aria-pressed', String(Number(b.dataset.score) === Number(score)));
      });
    }

    function renderPhase() {
      const ph = phases[d.phase];
      els.time.textContent = fmtTime(d.remaining);
      els.pause.textContent = d.paused ? App.t('sd.resume') : App.t('sd.pause');
      els.pause.setAttribute('aria-pressed', d.paused ? 'true' : 'false');
      els.phaseTitle.textContent = (ph.name || App.t('sd.phase', { n: d.phase + 1, total: phases.length })) +
        ' · ' + App.t('sd.phase', { n: d.phase + 1, total: phases.length });
      els.guide.innerHTML = App.md(ph.guide || '');
      els.answer.value = d.answers[d.phase] || '';
      els.answer.setAttribute('aria-label', App.t('sd.answer') + ' — ' + (ph.name || App.t('sd.phase', { n: d.phase + 1, total: phases.length })));
      els.next.textContent = d.phase >= phases.length - 1 ? App.t('sd.finish') : App.t('sd.next');
      if (els.end) els.end.hidden = !!d.done;
      els.phases.querySelectorAll('[data-phase]').forEach((b, i) => {
        b.classList.toggle('is-active', i === d.phase);
        b.classList.toggle('is-done', i < d.phase || d.done);
        b.setAttribute('aria-selected', i === d.phase ? 'true' : 'false');
      });
      els.finish.hidden = !d.done;
      if (d.done) {
        renderDrafts();
        if (justFinished) {           // do not jump on page load of an already-finished draft
          justFinished = false;
          announce(App.t('sd.allDone'));
          els.finish.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      } else if (announcedPhase !== d.phase) {
        announcedPhase = d.phase;
        announcePhase();
      }
    }

    function tick() {
      if (d.paused || d.done) return;
      d.remaining = Math.max(0, d.remaining - 1);
      els.time.textContent = fmtTime(d.remaining);
      if (!d.remaining) {
        justTimedUp = true;
        if (d.phase < phases.length - 1) {
          d.phase++;
          d.remaining = (phases[d.phase].minutes || 5) * 60;
          save();
          renderPhase();
        } else {
          finish();
        }
      }
    }

    function pause() {
      d.paused = !d.paused;
      save();
      renderPhase();
    }

    function finish() {
      d.done = true;
      d.paused = true;
      justTimedUp = false;
      justFinished = true;
      save();
      renderPhase();
    }

    function next() {
      if (d.done) return;
      if (d.phase >= phases.length - 1) { finish(); return; }
      d.phase++;
      d.remaining = (phases[d.phase].minutes || 5) * 60;
      save();
      renderPhase();
    }

    function saveAnswer() {
      d.answers[d.phase] = els.answer.value;
      if (els.saveBadge) {
        els.saveBadge.className = 'badge sd-save-badge';
        els.saveBadge.textContent = App.t('sd.saving');
      }
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        save();
        if (els.saveBadge) {
          els.saveBadge.className = 'badge ok sd-save-badge';
          els.saveBadge.textContent = App.t('sd.autosaved');
        }
      }, 400);
    }

    els.answer.addEventListener('input', saveAnswer);
    els.answer.addEventListener('change', () => { d.answers[d.phase] = els.answer.value; save(); });

    els.pause.addEventListener('click', pause);
    els.next.addEventListener('click', next);
    if (els.end) els.end.addEventListener('click', () => {
      if (d.done) return;
      d.answers[d.phase] = els.answer.value;
      finish();
    });
    els.phases.addEventListener('click', e => {
      const b = e.target.closest('[data-phase]');
      if (!b || d.done) return;
      d.answers[d.phase] = els.answer.value;
      d.phase = parseInt(b.dataset.phase, 10) || 0;
      d.remaining = (phases[d.phase].minutes || 5) * 60;
      d.paused = true;
      save();
      renderPhase();
    });

    if (els.mic) {
      els.mic.addEventListener('click', () => {
        if (mic) {
          try { mic.stop(); } catch (e) { /* ignore */ }
          mic = null;
          els.mic.classList.remove('recording');
          els.mic.setAttribute('aria-label', App.t('sd.mic'));
          d.answers[d.phase] = els.answer.value;
          save();
          return;
        }
        try {
          els.mic.classList.add('recording');
          els.mic.setAttribute('aria-label', App.t('sd.micStop'));
          mic = App.speech.start({
            lang: 'vi',
            onText: (finalText, interim) => {
              els.answer.value = finalText + (interim ? ' ' + interim : '');
              d.answers[d.phase] = els.answer.value;
            },
            onError: msg => {
              mic = null;
              els.mic.classList.remove('recording');
              els.mic.setAttribute('aria-label', App.t('sd.mic'));
              els.fb.innerHTML = '<div class="ai-error">' + App.esc(msg) + '</div>';
            },
          });
        } catch (e) {
          els.mic.classList.remove('recording');
          els.fb.innerHTML = App.ui.error(e);
        }
      });
    }

    let lastGrade = null;
    renderCompare(false);
    paintSelf(latestScore(id));

    els.grade.addEventListener('click', async () => {
      if (els.grade.disabled) return;
      d.answers[d.phase] = els.answer.value;
      save();
      const answer = phases.map((ph, i) => '### ' + (ph.name || ('Phase ' + (i + 1))) + '\n' + (d.answers[i] || '')).join('\n\n');
      els.grade.disabled = true;
      els.fb.innerHTML = '<span class="ai-loading">' + App.esc(App.t('sd.grading')) + '</span>';
      try {
        lastGrade = await App.ai.grade({
          question: p.title + '\n' + (p.prompt || ''),
          reference: (p.reference || '') + '\nRubric: ' + (Array.isArray(p.rubric) ? p.rubric.join('; ') : ''),
          answer,
          lang: 'vi',
          topic: 'design',
          level: p.level || 'senior',
        });
        els.fb.innerHTML = App.ui.feedback(lastGrade, 'vi');
        renderCompare(true);
        if (els.compare) els.compare.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (e) {
        els.fb.innerHTML = App.ui.error(e);
      } finally {
        els.grade.disabled = false;
      }
    });

    els.refBtn.addEventListener('click', () => {
      renderCompare(els.compare ? els.compare.hidden : true);
      if (els.compare && !els.compare.hidden) {
        els.compare.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    els.self.addEventListener('click', e => {
      const b = e.target.closest('[data-score]');
      if (!b) return;
      const score = parseInt(b.dataset.score, 10);
      history().unshift({ id, at: Date.now(), score, ai: lastGrade ? lastGrade.score : null });
      if (App.store.data.sdHistory.length > 50) App.store.data.sdHistory.length = 50;
      App.store.log('mock');
      App.store.save();
      els.saved.textContent = App.t('sd.saved', { score });
      paintSelf(score);
    });

    if (els.restart) els.restart.addEventListener('click', () => {
      if (!window.confirm(App.t('sd.restartConfirm'))) return;
      d.answers = phases.map(() => '');
      d.phase = 0;
      d.remaining = (phases[0].minutes || 5) * 60;
      d.paused = false;
      d.done = false;
      announcedPhase = -1;
      justTimedUp = false;
      justFinished = false;
      lastGrade = null;
      els.fb.innerHTML = '';
      els.saved.textContent = '';
      els.self.querySelectorAll('[data-score]').forEach(b => b.setAttribute('aria-pressed', 'false'));
      renderCompare(false);
      save();
      renderPhase();
      els.answer.focus();
    });

    const offKey = App.onKey(e => {
      if (e.key === 'n' || e.key === 'N') next();
      if (e.key === 'p' || e.key === 'P') pause();
    });

    timer = setInterval(tick, 1000);
    renderPhase();

    return () => {
      clearInterval(timer);
      if (saveTimer) clearTimeout(saveTimer);
      if (mic) { try { mic.stop(); } catch (e) { /* ignore */ } }
      offKey();
      d.answers[d.phase] = els.answer.value;
      save();
    };
  }

  App.registerView('sd', {
    get title() { return App.t('sd.title'); },
    render(root, params) {
      return params && params[0] ? detail(root, params[0]) : list(root);
    },
  });
})();
