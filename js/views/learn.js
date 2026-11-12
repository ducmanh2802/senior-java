/*
 * View "learn" — lessons with self-graded Java exercises (AGENTS.md section 12).
 *   #/learn             table of contents grouped by track, progress, "continue"
 *   #/learn/<lessonId>  theory → exercises (run tests / AI review / hints / solution) → quick check → done
 * Progress: lesson done = store status 'known' on the lesson id; exercise solved = 'known' on "<lessonId>#<n>".
 */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'learn.title': 'Bài học',
      'learn.subtitleDone': 'bài đã xong',
      'learn.subtitle': 'Học lại nền tảng theo lộ trình: lý thuyết có ví dụ, bài tập Java chạy test thật, câu kiểm tra nhanh.',
      'learn.emptyTitle': 'Chưa có bài học',
      'learn.emptyHint': 'Bài học đang được biên soạn.',
      'learn.emptyBank': 'Ngân hàng câu hỏi',
      'learn.continueLabel': 'Học tiếp',
      'learn.continueBtn': 'Học tiếp →',
      'learn.doneAll': 'Bạn đã hoàn thành tất cả bài học hiện có.',
      'learn.tocBack': '← Mục lục bài học',
      'learn.goalsTitle': 'Sau bài này bạn sẽ:',
      'learn.ebTitle': '🗣️ Giải thích lại bằng lời của bạn',
      'learn.ebDesc': 'Cách nhớ lâu nhất: đọc xong, tự giải thích lại như đang trả lời phỏng vấn (gõ hoặc nói). AI so với bài học và chỉ ra chỗ hiểu sai/thiếu. Mỗi lần chấm tốn 1 lượt AI.',
      'learn.ebPh': 'Ví dụ: Bài này nói về… Cơ chế hoạt động là… Khi nào dùng… Lỗi hay gặp…',
      'learn.ebGrade': 'AI chấm phần giải thích',
      'learn.ebMic': 'Nói',
      'learn.ebStop': 'Dừng',
      'learn.ebEmpty': 'Hãy viết hoặc nói ít nhất vài câu trước khi chấm.',
      'learn.ebWait': 'AI đang chấm…',
      'learn.exercisesTitle': 'Bài tập',
      'learn.passedBadge': '✅ Đã pass',
      'learn.runBtn': '▶ Chạy test',
      'learn.reviewBtn': '🤖 AI review',
      'learn.hintBtn': '💡 Gợi ý',
      'learn.hintCount': '{n}',
      'learn.solutionBtn': 'Xem lời giải',
      'learn.editorAria': 'Code bài tập {n}',
      'learn.resetTitle': 'Khôi phục code ban đầu',
      'learn.shortcutTip': '<kbd>Ctrl</kbd>+<kbd>Enter</kbd> chạy',
      'learn.compilingMsg': 'Đang biên dịch và chạy test…',
      'learn.serverNotConfigured': 'Server chưa bật máy chạy code. Dùng <b>🤖 AI review</b> để AI đọc và chấm code của bạn.',
      'learn.passMsg': '🎉 Pass hết test!',
      'learn.solutionTitle': 'Lời giải',
      'learn.resetConfirm': 'Khôi phục code ban đầu? Code bạn đang viết sẽ mất.',
      'learn.doneBtnDone': '✅ Đã hoàn thành — ôn lại sau',
      'learn.doneBtnNot': 'Hoàn thành bài',
      'learn.quickCheckTitle': 'Kiểm tra nhanh',
      'learn.correct': '✅ Chính xác',
      'learn.incorrect': '❌ Chưa đúng',
      'learn.relatedTitle': 'Câu hỏi phỏng vấn liên quan',
      'learn.notFoundTitle': 'Không tìm thấy bài học',
      'learn.notFoundHint': 'Bài học có thể đã bị đổi mã hoặc chuyển sang chủ đề khác.',
      'learn.notFoundBack': 'Về mục lục',
      'learn.progressAria': 'Tiến độ {n}',
      'learn.minutesUnit': '{n} phút',
      'learn.exercisesUnit': '{n} bài tập',
      'learn.stateDone': 'Đã hoàn thành',
      'learn.stateDoing': 'Đang học',
      'learn.stateNew': 'Chưa học',
      'learn.aiReviewMsg': 'AI reviewing…',
      'learn.solutionConfirm': 'You have not run any tests yet. Still view the solution?',
      'learn.doneBadge': '✅ Đã hoàn thành',
      'learn.tocTitle': 'Mục lục bài',
      'learn.tocAria': 'Mục lục bài học',
      'learn.jumpAria': 'Đi tới phần của bài',
      'learn.jumpTheory': '📖 Lý thuyết',
      'learn.jumpExercises': '💻 Bài tập',
      'learn.jumpCheck': '✅ Kiểm tra nhanh',
      'learn.jumpRelated': '❓ Liên quan',
      'learn.readAria': 'Tiến độ đọc bài',
      'learn.resume': 'Đọc tiếp',
      'learn.kbdHint': 'Phím tắt: <kbd>T</kbd> lý thuyết · <kbd>E</kbd> bài tập · <kbd>C</kbd> kiểm tra · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> chạy test',
    },
    en: {
      'learn.title': 'Lessons',
      'learn.subtitleDone': 'done',
      'learn.subtitle': 'Rebuild fundamentals with guided theory, real Java test exercises, and quick checks.',
      'learn.emptyTitle': 'No lessons yet',
      'learn.emptyHint': 'Lessons are being compiled.',
      'learn.emptyBank': 'Question bank',
      'learn.continueLabel': 'Continue',
      'learn.continueBtn': 'Continue →',
      'learn.doneAll': '🎉 You completed all available lessons.',
      'learn.tocBack': '← Table of contents',
      'learn.goalsTitle': 'After this lesson you will:',
      'learn.ebTitle': '🗣️ Explain it back in your own words',
      'learn.ebDesc': 'The best way to remember: after reading, explain it back as if answering an interviewer (type or speak). AI compares it with the lesson and points out gaps. Each grading uses 1 AI credit.',
      'learn.ebPh': 'E.g. This lesson is about… It works by… Use it when… Common mistakes…',
      'learn.ebGrade': 'Grade my explanation',
      'learn.ebMic': 'Speak',
      'learn.ebStop': 'Stop',
      'learn.ebEmpty': 'Write or say at least a few sentences first.',
      'learn.ebWait': 'AI is grading…',
      'learn.exercisesTitle': 'Exercises',
      'learn.passedBadge': '✅ Passed',
      'learn.runBtn': '▶ Run tests',
      'learn.reviewBtn': '🤖 AI review',
      'learn.hintBtn': '💡 Hint',
      'learn.hintCount': '{n}',
      'learn.solutionBtn': 'Show solution',
      'learn.editorAria': 'Exercise code {n}',
      'learn.resetTitle': 'Restore initial code',
      'learn.shortcutTip': '<kbd>Ctrl</kbd>+<kbd>Enter</kbd> to run',
      'learn.compilingMsg': 'Compiling and running tests…',
      'learn.serverNotConfigured': 'Code-run server not configured. Use <b>🤖 AI review</b> to have AI read and grade your code.',
      'learn.passMsg': '🎉 All tests passed!',
      'learn.solutionTitle': 'Solution',
      'learn.resetConfirm': 'Restore initial code? Your current work will be lost.',
      'learn.doneBtnDone': '✅ Completed — review later',
      'learn.doneBtnNot': 'Complete lesson',
      'learn.quickCheckTitle': 'Quick check',
      'learn.correct': '✅ Correct',
      'learn.incorrect': '❌ Not correct',
      'learn.relatedTitle': 'Related interview questions',
      'learn.notFoundTitle': 'Lesson not found',
      'learn.notFoundHint': 'The lesson may have been renamed or moved to another track.',
      'learn.notFoundBack': 'Back to list',
      'learn.progressAria': 'Progress {n}',
      'learn.minutesUnit': '{n} min',
      'learn.exercisesUnit': '{n} exercises',
      'learn.stateDone': 'Done',
      'learn.stateDoing': 'In progress',
      'learn.stateNew': 'Not started',
      'learn.aiReviewMsg': 'AI reviewing…',
      'learn.solutionConfirm': 'You have not run any tests yet. Still view the solution?',
      'learn.doneBadge': '✅ Completed',
      'learn.tocTitle': 'On this page',
      'learn.tocAria': 'Lesson outline',
      'learn.jumpAria': 'Jump to a part of the lesson',
      'learn.jumpTheory': '📖 Theory',
      'learn.jumpExercises': '💻 Exercises',
      'learn.jumpCheck': '✅ Quick check',
      'learn.jumpRelated': '❓ Related',
      'learn.readAria': 'Reading progress',
      'learn.resume': 'Resume',
      'learn.kbdHint': 'Shortcuts: <kbd>T</kbd> theory · <kbd>E</kbd> exercises · <kbd>C</kbd> check · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> run tests',
    },
  });

  const esc = App.esc;
  const draftKey = (id, i) => 'sjp.lesson.' + id + '.' + i;
  const loadDraft = (id, i) => { try { return localStorage.getItem(draftKey(id, i)); } catch (e) { return null; } };
  const saveDraft = (id, i, v) => { try { localStorage.setItem(draftKey(id, i), v); } catch (e) { /* private mode */ } };
  const exId = (l, i) => l.id + '#' + (i + 1);
  const isDone = l => App.store.getStatus(l.id) === 'known';
  const solved = l => (l.exercises || []).filter((x, i) => App.store.getStatus(exId(l, i)) === 'known').length;
  const state = l => isDone(l) ? 'done' : solved(l) ? 'doing' : 'new';
  const STATE = { done: ['✅', App.t('learn.stateDone')], doing: ['🟡', App.t('learn.stateDoing')], new: ['○', App.t('learn.stateNew')] };
  const WIDE = () => (typeof window !== 'undefined' && window.innerWidth >= 720);

  function tracks() {
    const by = new Map();
    App.lessons().forEach(l => { if (!by.has(l.track)) by.set(l.track, []); by.get(l.track).push(l); });
    return [...by.entries()];
  }

  // ---------- table of contents ----------
  function toc(root) {
    const all = App.lessons();
    if (!all.length) {
      root.innerHTML = '<div class="page-head"><h1>' + App.t('learn.title') + '</h1></div>' +
        '<div class="empty"><h2>' + App.t('learn.emptyTitle') + '</h2><p>' + App.t('learn.emptyHint') + '</p>' +
        '<p><a class="btn" href="#/bank">' + App.t('learn.emptyBank') + '</a></p></div>';
      return;
    }
    const next = all.find(l => !isDone(l));
    const done = all.filter(isDone).length;
    root.innerHTML = `
      <div class="page-head"><h1>${App.t('learn.title')}</h1>
        <p class="muted">${App.t('learn.subtitle')} ${done}/${all.length} ${App.t('learn.subtitleDone')}</p></div>
      ${next ? `<div class="card ln-next"><div><span class="muted small">${App.t('learn.continueLabel')}</span><div><b>${esc(next.title)}</b></div>
        <span class="muted small">${esc(App.topic(next.track).name)} · ${App.t('learn.minutesUnit', {n: next.minutes})} · ${App.t('learn.exercisesUnit', {n: (next.exercises || []).length})}</span></div>
        <a class="btn primary" href="#/learn/${esc(next.id)}">${App.t('learn.continueBtn')}</a></div>` : '<div class="card ln-next"><b>🎉 ' + App.t('learn.doneAll') + '</b></div>'}
      ${tracks().map(([track, ls]) => {
        const t = App.topic(track), d = ls.filter(isDone).length;
        return `<section class="card ln-track">
          <div class="ln-track-head"><h2>${esc(t.icon + ' ' + t.name)}</h2><span class="muted small">${d}/${ls.length}</span></div>
          <div class="progress" aria-label="${App.t('learn.progressAria', {n: esc(t.name)})}"><i style="width:${Math.round(d / ls.length * 100)}%"></i></div>
          <ol class="ln-list">${ls.map(l => {
            const s = STATE[state(l)];
            return `<li><a href="#/learn/${esc(l.id)}"><span class="ln-state" title="${s[1]}" aria-label="${s[1]}">${s[0]}</span>
              <span class="ln-title">${esc(l.title)}</span>
              <span class="muted small">${esc(App.LEVELS[l.level] || l.level)} · ${App.t('learn.minutesUnit', {n: l.minutes})} · ${App.t('learn.exercisesUnit', {n: (l.exercises || []).length})}</span></a></li>`;
          }).join('')}</ol></section>`;
      }).join('')}`;
  }

  // ---------- lesson ----------
  const EB_KEY = id => 'sjp.learn.eb.' + id;   // per-viewer draft of the explain-back answer
  const POS_KEY = id => 'sjp.learn.pos.' + id; // last reading position inside a lesson
  function loadEb(id) { try { return localStorage.getItem(EB_KEY(id)) || ''; } catch (e) { return ''; } }
  function saveEb(id, v) { try { localStorage.setItem(EB_KEY(id), v); } catch (e) { /* storage blocked */ } }
  function loadPos(id) {
    try { const r = JSON.parse(localStorage.getItem(POS_KEY(id)) || 'null'); return r && typeof r.y === 'number' ? r : null; } catch (e) { return null; }
  }
  function savePos(id, y, pct) {
    try { localStorage.setItem(POS_KEY(id), JSON.stringify({ y: y, pct: pct, t: Date.now() })); } catch (e) { /* storage blocked */ }
  }

  function lessonHeadings(body) {
    const out = [];
    String(body || '').split('\n').forEach(line => {
      if (!line.startsWith('### ')) return;
      const t = line.slice(4).replace(/\*\*/g, '').replace(/\{\{|\}\}/g, '').trim();
      if (t) out.push(t);
    });
    return out;
  }
  function addHeadingIds(html) {
    let n = 0;
    return String(html).replace(/<h4>/g, () => '<h4 id="ln-sec-' + (n++) + '">');
  }

  function lesson(root, l) {
    const same = App.lessons().filter(x => x.track === l.track);
    const idx = same.indexOf(l), prev = same[idx - 1], next = same[idx + 1];
    const heads = lessonHeadings(l.body);
    const exCount = (l.exercises || []).length;
    const checkCount = (l.check || []).length;
    const related = App.ui.relatedQuestions({ ids: l.related || [], topic: l.track, tags: l.tags, limit: 5 });
    const pos = loadPos(l.id);
    const tocHtml = heads.length ? `
      <details class="ln-toc" ${WIDE() ? 'open' : ''}>
        <summary class="ln-toc-sum"><b>${App.t('learn.tocTitle')}</b> <span class="muted small">${heads.length}</span></summary>
        <ul class="ln-toc-list" aria-label="${App.t('learn.tocAria')}">${heads.map((h, i) =>
          `<li><a href="#ln-sec-${i}" data-ln-toc="${i}">${esc(h)}</a></li>`).join('')}</ul>
      </details>` : '';
    root.innerHTML = `
      <a class="link-btn" href="#/learn">${App.t('learn.tocBack')}</a>
      <div class="page-head"><h1>${esc(l.title)}</h1>
        <div class="row ln-meta"><span class="badge">${esc(App.topic(l.track).icon + ' ' + App.topic(l.track).name)}</span>
          <span class="badge">${esc(App.LEVELS[l.level] || l.level)}</span>          <span class="badge">${App.t('learn.minutesUnit', {n: l.minutes})}</span>
          ${isDone(l) ? '<span class="badge ok">' + App.t('learn.doneBadge') + '</span>' : ''}</div></div>
      <nav class="ln-jump" aria-label="${App.t('learn.jumpAria')}">
        <a class="btn sm" data-ln-jump="ln-theory" href="#ln-theory">${App.t('learn.jumpTheory')}</a>
        ${exCount ? `<a class="btn sm" data-ln-jump="ln-exercises" href="#ln-exercises">${App.t('learn.jumpExercises')} <span class="badge">${exCount}</span></a>` : ''}
        ${checkCount ? `<a class="btn sm" data-ln-jump="ln-check" href="#ln-check">${App.t('learn.jumpCheck')} <span class="badge">${checkCount}</span></a>` : ''}
        ${related ? `<a class="btn sm" data-ln-jump="ln-related" href="#ln-related">${App.t('learn.jumpRelated')}</a>` : ''}
        <span class="muted small ln-kbd">${App.t('learn.kbdHint')}</span>
      </nav>
      <div class="ln-read">
        <div class="progress ln-read-bar" role="progressbar" aria-label="${App.t('learn.readAria')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i style="width:0%"></i></div>
        <span class="muted small ln-read-pct" aria-hidden="true">0%</span>
        ${pos && pos.y > 240 ? `<button type="button" class="btn sm" data-act="resume">👇 ${App.t('learn.resume')} · ${Math.round(pos.pct || 0)}%</button>` : ''}
      </div>
      ${tocHtml}
      <div class="card ln-goals"><b>${App.t('learn.goalsTitle')}</b><ul>${(l.goals || []).map(g => '<li>' + App.md(g).replace(/^<p>|<\/p>$/g, '') + '</li>').join('')}</ul></div>
      <article class="card md ln-body" id="ln-theory">${addHeadingIds(App.md(l.body))}</article>
      <section class="card ln-eb"><h2 class="ln-h">${App.t('learn.ebTitle')}</h2><p class="muted">${App.t('learn.ebDesc')}</p>
        <textarea class="textarea ln-eb-text" rows="6" aria-label="${App.t('learn.ebTitle')}" placeholder="${esc(App.t('learn.ebPh'))}">${esc(loadEb(l.id))}</textarea>
        <div class="row ln-eb-actions"><button type="button" class="btn primary" data-act="eb-grade">${App.t('learn.ebGrade')}</button>${App.speech && App.speech.supported ? `<button type="button" class="btn mic-btn" data-act="eb-mic">🎤 ${App.t('learn.ebMic')}</button>` : ''}</div>
        <div class="ln-eb-result" aria-live="polite"></div></section>
      <div class="ln-report"><a class="btn sm" target="_blank" rel="noopener noreferrer" href="${esc('https://github.com/ducmanh2802/senior-java/issues/new?title=' + encodeURIComponent('Sai nội dung: ' + l.id) + '&body=' + encodeURIComponent('ID: ' + l.id + '\nTrang: ' + location.href + '\n\nSai ở đâu / nên sửa thế nào:\n') + '&labels=content')}">🚩 Báo sai</a></div>
      <h2 class="ln-h" id="ln-exercises">${App.t('learn.exercisesTitle')}</h2>
      ${(l.exercises || []).map((x, i) => exerciseCard(l, x, i)).join('')}
      ${checkCount ? `<h2 class="ln-h" id="ln-check">${App.t('learn.quickCheckTitle')}</h2>${l.check.map((c, i) => `
        <div class="card ln-check" data-check="${i}"><div class="md">${App.md(c.q)}</div>
          <div class="ln-options">${c.options.map((o, j) => `<button type="button" class="btn ln-opt" data-opt="${j}">${esc(String.fromCharCode(65 + j))}. ${App.md(o).replace(/^<p>|<\/p>$/g, '')}</button>`).join('')}</div>
          <div class="ln-explain" aria-live="polite"></div></div>`).join('')}` : ''}
      <div id="ln-related"${related ? '' : ' hidden'}>${related}</div>
      <div class="row ln-footer">
        ${prev ? `<a class="btn" href="#/learn/${esc(prev.id)}">← ${esc(prev.title)}</a>` : '<span></span>'}
        <button class="btn ${isDone(l) ? '' : 'primary'}" data-act="done">${isDone(l) ? App.t('learn.doneBtnDone') : App.t('learn.doneBtnNot')}</button>
        ${next ? `<a class="btn" href="#/learn/${esc(next.id)}">${esc(next.title)} →</a>` : '<span></span>'}
      </div>`;
  }

  function exerciseCard(l, x, i) {
    const code = loadDraft(l.id, i) ?? x.starter;
    const ok = App.store.getStatus(exId(l, i)) === 'known';
    return `<section class="card ln-ex" data-ex="${i}">
      <div class="ln-ex-head"><h3>${i + 1}. ${esc(x.title)}</h3>${ok ? '<span class="badge ok">' + App.t('learn.passedBadge') + '</span>' : ''}</div>
      <div class="md">${App.md(x.prompt)}</div>
      <textarea class="textarea ln-editor" spellcheck="false" autocapitalize="off" autocorrect="off" wrap="off"       aria-label="${App.t('learn.editorAria', {n: i + 1})}">${esc(code)}</textarea>
      <div class="row ln-ex-actions">
        <button class="btn primary" data-act="run">${App.t('learn.runBtn')}</button>
        <button class="btn" data-act="review">${App.t('learn.reviewBtn')}</button>
        <button class="btn" data-act="hint">${App.t('learn.hintBtn')} <span class="ln-hint-count">0/${(x.hints || []).length}</span></button>
        <button class="btn" data-act="solution">${App.t('learn.solutionBtn')}</button>
        <button class="btn sm" data-act="reset" title="${App.t('learn.resetTitle')}" aria-label="${App.t('learn.resetTitle')}">↺</button>
        <span class="muted small">${App.t('learn.shortcutTip')}</span>
      </div>
      <div class="ln-hints" aria-live="polite"></div><div class="ln-result" aria-live="polite"></div><div class="ln-solution"></div>
    </section>`;
  }

  App.registerView('learn', {
    get title() { return App.t('learn.title'); },
    render(root, params) {
      const l = params && params[0] ? App.lessons().find(x => x.id === params[0]) : null;
      if (params && params[0] && !l) {
        root.innerHTML = '<div class="empty"><h2>' + App.t('learn.notFoundTitle') + '</h2><p>' + App.t('learn.notFoundHint') + '</p>' +
          '<p><a class="btn primary" href="#/learn">' + App.t('learn.notFoundBack') + '</a></p></div>';
        return () => {};
      }
      if (!l) { toc(root); return () => {}; }
      lesson(root, l);

      const runs = {};          // exercise index → last {run, parsed}
      const hintsShown = {};
      const card = el => el.closest('.ln-ex');
      const ex = c => l.exercises[Number(c.dataset.ex)];

      // reading progress: bar + section highlight + remembered position
      const bodyEl = root.querySelector('.ln-body');
      const bar = root.querySelector('.ln-read-bar');
      const pctEl = root.querySelector('.ln-read-pct');
      const tocLinks = [...root.querySelectorAll('[data-ln-toc]')];
      const headEls = [...root.querySelectorAll('.ln-body h4[id]')];
      let raf = 0, lastPct = -1, curSec = -2, lastSave = Date.now(), skipSave = false, moved = false;
      function measure() {
        raf = 0;
        if (!bodyEl || !bar) return;
        const r = bodyEl.getBoundingClientRect();
        const line = window.innerHeight * 0.4;
        const pct = Math.max(0, Math.min(100, Math.round((line - r.top) / Math.max(r.height, 1) * 100)));
        if (pct !== lastPct) {
          lastPct = pct;
          bar.firstElementChild.style.width = pct + '%';
          bar.setAttribute('aria-valuenow', String(pct));
          if (pctEl) pctEl.textContent = pct + '%';
        }
        let cur = -1;
        for (let i = 0; i < headEls.length; i++) if (headEls[i].getBoundingClientRect().top <= 140) cur = i;
        if (cur !== curSec) {
          curSec = cur;
          tocLinks.forEach(a => {
            const on = Number(a.dataset.lnToc) === cur;
            a.classList.toggle('is-current', on);
            if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
          });
        }
        const now = Date.now();
        if (moved && !skipSave && now - lastSave > 1200) { lastSave = now; savePos(l.id, window.scrollY || 0, pct); }
      }
      function onScroll() { moved = true; if (!raf) raf = requestAnimationFrame(measure); }
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      measure();

      function jumpTo(id) {
        const t = document.getElementById(id);
        if (!t) return false;
        t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }

      async function run(c) {
        const i = Number(c.dataset.ex), x = ex(c), btn = c.querySelector('[data-act="run"]'), out = c.querySelector('.ln-result');
        if (btn.disabled) return;
        btn.disabled = true;
        out.innerHTML = '<span class="ai-loading">' + App.t('learn.compilingMsg') + '</span>';
        try {
          const r = await App.ai.run(App.code.assemble(c.querySelector('.ln-editor').value, x.tests));
          if (r.configured === false) {
            out.innerHTML = '<div class="ai-error">' + App.t('learn.serverNotConfigured') + '</div>';
            return;
          }
          const parsed = App.code.parse(r.stdout);
          runs[i] = { run: r, parsed };
          out.innerHTML = App.ui.runResult(r, parsed);
          if (parsed.allPassed && parsed.total) {
            if (App.store.getStatus(exId(l, i)) !== 'known') { App.store.setStatus(exId(l, i), 'known'); App.store.log('algo'); }
            out.insertAdjacentHTML('beforeend', '<p class="ln-pass">' + App.t('learn.passMsg') + '</p>');
            const head = c.querySelector('.ln-ex-head');
            if (!head.querySelector('.badge')) head.insertAdjacentHTML('beforeend', '<span class="badge ok">' + App.t('learn.passedBadge') + '</span>');
          }
        } catch (e) { out.innerHTML = App.ui.error(e); }
        finally { btn.disabled = false; }
      }

      async function review(c) {
        const i = Number(c.dataset.ex), x = ex(c), btn = c.querySelector('[data-act="review"]'), out = c.querySelector('.ln-result');
        if (btn.disabled) return;
        btn.disabled = true;
        out.innerHTML = '<span class="ai-loading">' + App.t('learn.aiReviewMsg') + '</span>';
        const last = runs[i];
        try {
          const r = await App.ai.review({
            title: x.title, prompt: x.prompt, reference: x.reference, code: c.querySelector('.ln-editor').value,
            run: last ? { passed: last.parsed.passed, total: last.parsed.total, output: String(last.run.stdout || '').slice(0, 3000) } : undefined,
          });
          out.innerHTML = App.ui.codeFeedback(r);
        } catch (e) { out.innerHTML = App.ui.error(e); }
        finally { btn.disabled = false; }
      }

      let mic = null;   // active speech handle for the explain-back box
      function toggleMic(btn) {
        const ta = root.querySelector('.ln-eb-text');
        if (mic) { mic.stop(); mic = null; btn.classList.remove('recording'); btn.textContent = '🎤 ' + App.t('learn.ebMic'); saveEb(l.id, ta.value); return; }
        const base = ta.value.trim();
        try {
          mic = App.speech.start({ lang: 'vi',
            onText(final, interim) { ta.value = (base ? base + ' ' : '') + final + (interim ? ' ' + interim : ''); },
            onError(msg) { root.querySelector('.ln-eb-result').innerHTML = '<div class="ai-error">' + esc(msg) + '</div>'; } });
          btn.classList.add('recording'); btn.textContent = '⏹ ' + App.t('learn.ebStop');
        } catch (e) { mic = null; root.querySelector('.ln-eb-result').innerHTML = App.ui.error(e); }
      }
      async function gradeEb(btn) {
        const ta = root.querySelector('.ln-eb-text'), out = root.querySelector('.ln-eb-result'), answer = ta.value.trim();
        if (btn.disabled) return;
        if (answer.length < 40) { out.innerHTML = '<p class="muted">' + App.t('learn.ebEmpty') + '</p>'; return; }
        btn.disabled = true;
        out.innerHTML = '<span class="ai-loading">' + App.t('learn.ebWait') + '</span>';
        try {
          const r = await App.ai.grade({
            question: 'Giải thích lại bài học "' + l.title + '". Mục tiêu: ' + (l.goals || []).join('; '),
            reference: String(l.body).slice(0, 8000), answer, lang: 'vi', topic: l.track, level: l.level,
          });
          out.innerHTML = App.ui.feedback(r, 'vi');
        } catch (e) { out.innerHTML = App.ui.error(e); }
        finally { btn.disabled = false; }
      }

      function onClick(e) {
        const tocA = e.target.closest('[data-ln-toc]');
        if (tocA) {
          e.preventDefault();
          jumpTo('ln-sec-' + tocA.dataset.lnToc);
          const box = tocA.closest('.ln-toc');
          if (box && !WIDE()) box.open = false;
          return;
        }
        const jumpA = e.target.closest('[data-ln-jump]');
        if (jumpA) {
          e.preventDefault();
          jumpTo(jumpA.dataset.lnJump);
          return;
        }
        const opt = e.target.closest('.ln-opt');
        if (opt) {
          const box = opt.closest('.ln-check'), c = l.check[Number(box.dataset.check)], pick = Number(opt.dataset.opt);
          box.querySelectorAll('.ln-opt').forEach((b, j) => { b.disabled = true; b.classList.toggle('ok', j === c.answer); b.classList.toggle('bad', j === pick && pick !== c.answer); });
          box.querySelector('.ln-explain').innerHTML = `<p><b>${pick === c.answer ? App.t('learn.correct') : App.t('learn.incorrect')}</b></p><div class="md">${App.md(c.explain)}</div>`;
          return;
        }
        const act = e.target.closest('[data-act]');
        if (!act) return;
        if (act.dataset.act === 'eb-grade') { gradeEb(act); return; }
        if (act.dataset.act === 'eb-mic') { toggleMic(act); return; }
        if (act.dataset.act === 'resume') {
          const p = loadPos(l.id);
          if (p) window.scrollTo({ top: p.y, behavior: 'smooth' });
          act.remove();
          return;
        }
        const c = card(act);
        switch (act.dataset.act) {
          case 'run': run(c); break;
          case 'review': review(c); break;
          case 'hint': {
            const i = Number(c.dataset.ex), hs = ex(c).hints || [], n = Math.min(hs.length, (hintsShown[i] || 0) + 1);
            hintsShown[i] = n;
            c.querySelector('.ln-hints').innerHTML = hs.slice(0, n).map((h, j) => `<div class="ln-hint"><b>Gợi ý ${j + 1}:</b> ${App.md(h).replace(/^<p>|<\/p>$/g, '')}</div>`).join('');
            act.querySelector('.ln-hint-count').textContent = n + '/' + hs.length;
            break;
          }
          case 'solution': {
            const i = Number(c.dataset.ex), x = ex(c);
            if (!runs[i] && !confirm(App.t('learn.solutionConfirm'))) return;
            c.querySelector('.ln-solution').innerHTML = `<h4>${App.t('learn.solutionTitle')}</h4><pre class="code" data-lang="java"><code>${App.highlight(x.reference, 'java')}</code></pre><div class="md">${App.md(x.explain)}</div>`;
            break;
          }
          case 'reset':
            if (confirm(App.t('learn.resetConfirm'))) {
              const i = Number(c.dataset.ex);
              c.querySelector('.ln-editor').value = ex(c).starter;
              saveDraft(l.id, i, ex(c).starter);
            }
            break;
          case 'done':
            skipSave = true;
            App.store.setStatus(l.id, 'known');
            try { localStorage.removeItem(POS_KEY(l.id)); } catch (e) { /* storage blocked */ }
            App.route();
            break;
        }
      }
      function onInput(e) {
        if (e.target.matches('.ln-eb-text')) { saveEb(l.id, e.target.value); return; }
        if (e.target.matches('.ln-editor')) saveDraft(l.id, Number(card(e.target).dataset.ex), e.target.value);
      }
      function onKeydown(e) {
        if (!e.target.matches('.ln-editor')) return;
        if (e.key === 'Tab' && !e.shiftKey) {            // Tab inserts 4 spaces instead of leaving the editor
          e.preventDefault();
          const t = e.target, s = t.selectionStart;
          t.setRangeText('    ', s, t.selectionEnd, 'end');
          onInput(e);
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault(); run(card(e.target));
        }
      }
      const keyCleanup = App.onKey(e => {
        const k = e.key.toLowerCase();
        const map = { t: 'ln-theory', e: 'ln-exercises', c: 'ln-check' };
        if (map[k] && document.getElementById(map[k])) { e.preventDefault(); jumpTo(map[k]); }
      });

      root.addEventListener('click', onClick);
      root.addEventListener('input', onInput);
      root.addEventListener('keydown', onKeydown);
      return () => {
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        if (keyCleanup) keyCleanup();
        if (moved && lastPct >= 0 && !skipSave) savePos(l.id, window.scrollY || 0, lastPct);
        if (mic) { try { mic.stop(); } catch (e) { /* already stopped */ } mic = null; }
        root.removeEventListener('click', onClick);
        root.removeEventListener('input', onInput);
        root.removeEventListener('keydown', onKeydown);
      };
    },
  });
})();