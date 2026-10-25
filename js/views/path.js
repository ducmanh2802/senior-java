/*
 * View "path" — learning path junior → Senior built on window.PATH (data: T137, view: T140).
 * Stages grouped by phase as a vertical timeline. A stage is done when every lesson is
 * 'known' and >= 70% of its key questions are 'known'; the first unfinished stage whose
 * requires are all done is "Đang học" and opens by default.
 */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'path.title': 'Lộ trình học',
      'path.heading': 'Lộ trình học Java junior → Senior',
      'path.intro': 'Học theo thứ tự từng chặng: bài học có bài tập tự chấm, rồi câu hỏi chốt chặng.',
      'path.overall': 'Tiến độ tổng',
      'path.overallAria': 'Tiến độ lộ trình',
      'path.stagesDone': '{done}/{total} chặng đã xong',
      'path.lessonsDone': 'Bài học {done}/{total}',
      'path.questionsDone': 'Câu chốt {done}/{total}',
      'path.continue': 'Tiếp tục học',
      'path.continueKey': 'Tiếp tục',
      'path.allDone': 'Bạn đã hoàn thành tất cả chặng — chuyển sang ôn tập và phỏng vấn thử nhé.',
      'path.noLesson': 'Bài học của chặng này đã xong — còn phần câu chốt chặng.',
      'path.done': 'Đã xong',
      'path.current': 'Đang học',
      'path.locked': 'Chưa mở',
      'path.ready': 'Sẵn sàng',
      'path.peek': 'Học trước vẫn được',
      'path.weeks': 'Tuần {weeks}',
      'path.stageLessons': 'Bài học {done}/{total}',
      'path.stageQuestions': 'Câu chốt {done}/{total}',
      'path.lessonsH': 'Bài học',
      'path.questionsH': 'Câu chốt chặng',
      'path.minutes': '{n} phút',
      'path.unseen': 'Chưa học',
      'path.flash': 'Flashcard câu chốt',
      'path.quiz': 'Làm quiz',
      'path.noQuestions': 'Chặng này chưa có câu chốt.',
      'path.noLessons': 'Chặng này chưa có bài học.',
      'path.empty': 'Chưa có chặng nào',
      'path.emptyHint': 'Dữ liệu lộ trình đang được bổ sung.',
    },
    en: {
      'path.title': 'Learning path',
      'path.heading': 'Learning path: Java junior → Senior',
      'path.intro': 'Study stage by stage: lessons with self-graded exercises, then the stage key questions.',
      'path.overall': 'Overall progress',
      'path.overallAria': 'Path progress',
      'path.stagesDone': '{done}/{total} stages done',
      'path.lessonsDone': 'Lessons {done}/{total}',
      'path.questionsDone': 'Key questions {done}/{total}',
      'path.continue': 'Continue learning',
      'path.continueKey': 'Continue',
      'path.allDone': 'You have finished every stage — move on to review and mock interviews.',
      'path.noLesson': 'Lessons in this stage are done — key questions remain.',
      'path.done': 'Done',
      'path.current': 'In progress',
      'path.locked': 'Locked',
      'path.ready': 'Ready',
      'path.peek': 'You can study ahead',
      'path.weeks': 'Weeks {weeks}',
      'path.stageLessons': 'Lessons {done}/{total}',
      'path.stageQuestions': 'Key questions {done}/{total}',
      'path.lessonsH': 'Lessons',
      'path.questionsH': 'Key questions',
      'path.minutes': '{n} min',
      'path.unseen': 'Not studied',
      'path.flash': 'Flashcards for key questions',
      'path.quiz': 'Take the quiz',
      'path.noQuestions': 'This stage has no key questions yet.',
      'path.noLessons': 'This stage has no lessons yet.',
      'path.empty': 'No stages yet',
      'path.emptyHint': 'Path data is being added.',
    },
  });

  const esc = App.esc;
  const tr = (key, vars) => App.t('path.' + key, vars);

  // open stages + "study ahead" choices survive re-renders (language switch, route re-entry);
  // the current stage re-opens itself as progress moves unless the user closed it by hand
  const state = { open: null, closed: {}, peek: {} };

  const stages = () => (window.PATH || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const lessonById = id => App.lessons().find(l => l.id === id) || null;
  const questionById = id => App.questions().find(q => q.id === id) || null;
  const isKnown = id => App.store.getStatus(id) === 'known';

  /** Per-stage counters + done flag (all lessons known, >= 70% of key questions known). */
  function progress(s) {
    const lessonIds = s.lessons || [];
    const questionIds = s.questions || [];
    const lKnown = lessonIds.filter(isKnown).length;
    const qKnown = questionIds.filter(isKnown).length;
    const qOk = questionIds.length ? qKnown / questionIds.length >= 0.7 : true;
    const items = lessonIds.length + questionIds.length;
    return {
      lessonIds, questionIds, lKnown, qKnown,
      lTotal: lessonIds.length, qTotal: questionIds.length,
      pct: items ? Math.round((lKnown + qKnown) * 100 / items) : 0,
      done: lKnown === lessonIds.length && qOk,
    };
  }

  /** All stages with progress, require-checks and status: done | current | ready | locked. */
  function allInfo() {
    const list = stages().map(s => ({ s, p: progress(s) }));
    const doneIds = {};
    list.forEach(x => { if (x.p.done) doneIds[x.s.id] = 1; });
    let currentId = null;
    list.forEach(x => {
      x.reqOk = (x.s.requires || []).every(r => !!doneIds[r]);
      if (!x.p.done && x.reqOk && !currentId) currentId = x.s.id;
    });
    list.forEach(x => {
      x.state = x.p.done ? 'done' : !x.reqOk ? 'locked' : x.s.id === currentId ? 'current' : 'ready';
    });
    return { list, currentId, doneCount: list.filter(x => x.p.done).length };
  }

  /** Whole-path totals (lesson/question ids counted once even if a stage repeats one). */
  function overall(list) {
    const lids = new Set(), qids = new Set();
    list.forEach(x => { x.p.lessonIds.forEach(i => lids.add(i)); x.p.questionIds.forEach(i => qids.add(i)); });
    const lAll = [...lids], qAll = [...qids];
    const lKnown = lAll.filter(isKnown).length;
    const qKnown = qAll.filter(isKnown).length;
    const total = lAll.length + qAll.length;
    return {
      lTotal: lAll.length, lKnown, qTotal: qAll.length, qKnown,
      pct: total ? Math.round((lKnown + qKnown) * 100 / total) : 0,
    };
  }

  /** Plain-text question, shortened for the stage list. */
  function shorten(q) {
    const plain = String(q || '').replace(/\{\{([\s\S]+?)\}\}/g, '$1').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    return plain.length > 140 ? plain.slice(0, 139).replace(/\s+$/, '') + '…' : plain;
  }

  /** First topic used by the stage's flashcard button. */
  function flashTopic(x) {
    const s = x.s;
    if (s.quizTopics && s.quizTopics.length) return s.quizTopics[0];
    const q = x.p.questionIds.map(questionById).find(Boolean);
    if (q) return q.topic;
    const l = x.p.lessonIds.map(lessonById).find(Boolean);
    if (l) return l.track;
    return 'all';
  }

  // ---------- stage body ----------
  function lessonsHtml(x) {
    if (!x.p.lessonIds.length) return `<p class="muted small">${esc(tr('noLessons'))}</p>`;
    const items = x.p.lessonIds.map(id => {
      const l = lessonById(id);
      const done = isKnown(id);
      const lvl = l ? (App.LEVELS[l.level] || l.level || '') : '';
      const mins = l && l.minutes != null ? tr('minutes', { n: l.minutes }) : '';
      const meta = l ? `<span class="badge">${esc([lvl, mins].filter(Boolean).join(' · '))}</span>` : '';
      return `<li><a class="path-lesson${done ? ' is-done' : ''}" href="#/learn/${esc(id)}">
        <span class="path-check">${done ? '✓' : '○'}</span>
        <span class="path-ltitle">${esc(l ? l.title : id)}</span>${meta}</a></li>`;
    }).join('');
    return `<h4 class="path-h">${esc(tr('lessonsH'))}</h4><ul class="path-list path-lessons">${items}</ul>`;
  }

  function questionsHtml(x) {
    if (!x.p.questionIds.length) return `<p class="muted small">${esc(tr('noQuestions'))}</p>`;
    const items = x.p.questionIds.map(id => {
      const q = questionById(id);
      const st = q ? App.store.getStatus(q.id) : null;
      const info = st && App.STATUS[st] ? App.STATUS[st] : { label: tr('unseen'), cls: '' };
      const href = q ? '#/bank/' + encodeURIComponent(q.topic) : '#/bank';
      return `<li><a class="path-q" href="${esc(href)}">${esc(q ? shorten(q.q) : id)}</a>
        <span class="chip path-st"><span class="dot ${esc(info.cls)}"></span>${esc(info.label)}</span></li>`;
    }).join('');
    return `<h4 class="path-h">${esc(tr('questionsH'))}</h4><ul class="path-list path-qs">${items}</ul>`;
  }

  function bodyHtml(x) {
    const goal = x.s.goal ? `<div class="md path-goal">${App.md(x.s.goal)}</div>` : '';
    const topic = encodeURIComponent(flashTopic(x));
    return `${goal}
      <div class="path-cols">
        <div class="path-block">${lessonsHtml(x)}</div>
        <div class="path-block">${questionsHtml(x)}</div>
      </div>
      <div class="row path-actions">
        <a class="btn" href="#/flash/${topic}">${esc(tr('flash'))}</a>
        <a class="btn" href="#/quiz">${esc(tr('quiz'))}</a>
      </div>`;
  }

  // ---------- stage header ----------
  function stageHtml(x) {
    const s = x.s, p = x.p, st = x.state;
    const badgeCls = st === 'done' ? 'ok' : st === 'current' ? 'accent' : st === 'ready' ? 'info' : '';
    const open = !!state.open[s.id];
    const peeked = st === 'locked' && state.peek[s.id];
    return `<details class="path-stage is-${st}${peeked ? ' is-peeked' : ''}" data-stage="${esc(s.id)}"${open ? ' open' : ''}>
      <summary class="path-sum">
        <span class="path-num">${esc(String(s.order != null ? s.order : ''))}</span>
        <span class="path-main">
          <span class="path-titlerow">
            <span class="path-title">${esc(s.title || s.id)}</span>
            <span class="badge ${badgeCls}">${esc(tr(st))}</span>
            ${s.weeks ? `<span class="badge">${esc(tr('weeks', { weeks: s.weeks }))}</span>` : ''}
          </span>
          <span class="path-meta muted small">${esc(tr('stageLessons', { done: p.lKnown, total: p.lTotal }))} ·
            ${esc(tr('stageQuestions', { done: p.qKnown, total: p.qTotal }))}</span>
          <span class="progress path-bar" role="progressbar" aria-label="${esc(tr('overallAria'))}"
            aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100">
            <i class="${st === 'done' ? 'ok' : 'accent'}" style="width:${p.pct}%"></i></span>
          ${st === 'locked' && !state.peek[s.id]
            ? `<button type="button" class="btn sm path-peek" data-act="peek">${esc(tr('peek'))}</button>` : ''}
        </span>
      </summary>
      <div class="path-body">${bodyHtml(x)}</div>
    </details>`;
  }

  App.registerView('path', {
    get title() { return tr('title'); },
    render(root) {
      const info = allInfo();
      if (!info.list.length) {
        root.innerHTML = `<div class="page-head"><h1>${esc(tr('heading'))}</h1></div>
          <div class="empty"><h2>${esc(tr('empty'))}</h2><p>${esc(tr('emptyHint'))}</p></div>`;
        return () => {};
      }

      if (state.open === null) state.open = {};
      if (info.currentId && !state.closed[info.currentId]) state.open[info.currentId] = 1;
      // nothing to show open (no current stage yet): peek at the last stage
      if (!info.currentId && !Object.keys(state.open).length) state.open[info.list[info.list.length - 1].s.id] = 1;

      const ov = overall(info.list);
      const cur = info.list.find(x => x.state === 'current') || null;
      const nextLesson = cur ? cur.p.lessonIds.find(id => lessonById(id) && !isKnown(id)) : null;
      const continueHtml = nextLesson
        ? `<div class="path-continue">
             <a class="btn primary lg" href="#/learn/${esc(nextLesson)}">▶ ${esc(tr('continue'))}</a>
             <span class="muted small"><kbd>c</kbd> ${esc(tr('continueKey'))}</span>
           </div>`
        : cur ? `<p class="muted small path-note">${esc(tr('noLesson'))}</p>`
          : `<p class="muted small path-note">${esc(tr('allDone'))}</p>`;

      const phases = [], byPhase = new Map();
      info.list.forEach(x => {
        const ph = x.s.phase || '';
        if (!byPhase.has(ph)) { byPhase.set(ph, []); phases.push(ph); }
        byPhase.get(ph).push(x);
      });
      const timeline = phases.map(ph => `<section class="path-phase">
          <h2 class="path-phase-h">${esc(ph)}</h2>
          ${byPhase.get(ph).map(stageHtml).join('')}
        </section>`).join('');

      root.innerHTML = `
        <div class="page-head">
          <div>
            <h1>${esc(tr('heading'))}</h1>
            <p>${esc(tr('intro'))}</p>
          </div>
        </div>
        <section class="card path-overall">
          <div class="path-ov-head">
            <b>${esc(tr('overall'))}</b>
            <span class="badge accent">${esc(tr('stagesDone', { done: info.doneCount, total: info.list.length }))}</span>
          </div>
          <div class="progress" role="progressbar" aria-label="${esc(tr('overallAria'))}"
            aria-valuenow="${ov.pct}" aria-valuemin="0" aria-valuemax="100">
            <i class="accent" style="width:${ov.pct}%"></i></div>
          <div class="path-ov-meta">
            <span class="badge">${esc(tr('lessonsDone', { done: ov.lKnown, total: ov.lTotal }))}</span>
            <span class="badge">${esc(tr('questionsDone', { done: ov.qKnown, total: ov.qTotal }))}</span>
          </div>
          ${continueHtml}
        </section>
        <div class="path-timeline">${timeline}</div>`;

      function onClick(e) {
        const peek = e.target.closest('[data-act="peek"]');
        if (!peek) return;
        e.preventDefault();                       // keep the click from toggling <details> twice
        const d = peek.closest('details.path-stage');
        if (!d) return;
        state.peek[d.dataset.stage] = 1;
        d.classList.add('is-peeked');
        d.open = true;
        peek.hidden = true;                      // already studying ahead — drop the offer
      }
      function onToggle(e) {
        const d = e.target;
        if (!d || !d.matches || !d.matches('details.path-stage')) return;
        if (d.open) { state.open[d.dataset.stage] = 1; delete state.closed[d.dataset.stage]; }
        else { delete state.open[d.dataset.stage]; state.closed[d.dataset.stage] = 1; }
      }
      function onKey(e) {
        if (!/^[cC]$/.test(e.key)) return;
        const a = root.querySelector('.path-continue a');
        if (a) App.navigate(a.getAttribute('href'));
      }

      root.addEventListener('click', onClick);
      root.addEventListener('toggle', onToggle, true);
      const offKey = App.onKey(onKey);
      return () => {
        root.removeEventListener('click', onClick);
        root.removeEventListener('toggle', onToggle, true);
        offKey();
      };
    },
  });
})();
