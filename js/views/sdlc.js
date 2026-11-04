/* #/sdlc[/scenarioId[/stageIndex]] — mô phỏng vòng đời phát triển phần mềm end-to-end (window.SDLC). */
(function () {
  'use strict';
  App.i18n.add({
    vi: {
      'sdlc.title': 'Mô phỏng SDLC',
      'sdlc.sub': 'Đi trọn một tính năng thật: nhận requirement → phân tích → thiết kế → code → review/CI → test → deploy → sự cố → kể lại trong phỏng vấn.',
      'sdlc.empty': 'Chưa có kịch bản.',
      'sdlc.open': 'Bắt đầu',
      'sdlc.continue': 'Tiếp tục',
      'sdlc.progress': '{done}/{total} giai đoạn',
      'sdlc.back': '← Danh sách',
      'sdlc.context': 'Bối cảnh dự án',
      'sdlc.yourTask': 'Việc của bạn',
      'sdlc.placeholder': 'Viết câu trả lời của bạn trước khi xem đáp án (bản nháp được lưu trên máy này)…',
      'sdlc.showAnswer': 'Xem đáp án mẫu',
      'sdlc.hideAnswer': 'Ẩn đáp án mẫu',
      'sdlc.grade': 'AI chấm',
      'sdlc.grading': 'AI đang chấm…',
      'sdlc.needAnswer': 'Hãy viết câu trả lời trước.',
      'sdlc.markDone': 'Đánh dấu xong',
      'sdlc.done': '✓ Đã xong',
      'sdlc.prev': '← Trước',
      'sdlc.next': 'Tiếp →',
      'sdlc.pitfalls': 'Bẫy hay gặp',
      'sdlc.interview': 'Phỏng vấn',
      'sdlc.interviewTitle': 'Kể lại dự án này trong phỏng vấn',
      'sdlc.questions': 'Interviewer sẽ hỏi tiếp',
      'sdlc.practice': 'Luyện với Phỏng vấn AI',
      'sdlc.notFound': 'Không tìm thấy kịch bản.',
      'sdlc.keys': 'phím ← → chuyển giai đoạn',
    },
    en: {
      'sdlc.title': 'SDLC simulation',
      'sdlc.sub': 'Walk one real feature end to end: requirement → analysis → design → code → review/CI → test → deploy → incident → telling it in an interview.',
      'sdlc.empty': 'No scenarios yet.',
      'sdlc.open': 'Start',
      'sdlc.continue': 'Continue',
      'sdlc.progress': '{done}/{total} stages',
      'sdlc.back': '← All scenarios',
      'sdlc.context': 'Project context',
      'sdlc.yourTask': 'Your task',
      'sdlc.placeholder': 'Write your answer before opening the model answer (the draft is saved on this device)…',
      'sdlc.showAnswer': 'Show model answer',
      'sdlc.hideAnswer': 'Hide model answer',
      'sdlc.grade': 'AI grade',
      'sdlc.grading': 'AI is grading…',
      'sdlc.needAnswer': 'Write your answer first.',
      'sdlc.markDone': 'Mark as done',
      'sdlc.done': '✓ Done',
      'sdlc.prev': '← Previous',
      'sdlc.next': 'Next →',
      'sdlc.pitfalls': 'Common traps',
      'sdlc.interview': 'Interview',
      'sdlc.interviewTitle': 'Telling this project in an interview',
      'sdlc.questions': 'Likely follow-up questions',
      'sdlc.practice': 'Practice with the AI interviewer',
      'sdlc.notFound': 'Scenario not found.',
      'sdlc.keys': '← → keys switch stages',
    },
  });
  const t = (k, v) => App.t('sdlc.' + k, v);
  const ICONS = { requirement: '📝', analysis: '🔍', design: '📐', dev: '💻', review: '🔎', test: '🧪', deploy: '🚀', bugfix: '🚨' };
  const DRAFT = 'sjp.sdlc.draft.';
  const list = () => window.SDLC || [];
  const doneMap = () => (App.store.data.sdlc = App.store.data.sdlc || {});
  const doneKey = (s, key) => s.id + ':' + key;
  const doneCount = s => s.stages.filter(st => doneMap()[doneKey(s, st.key)]).length + (doneMap()[doneKey(s, 'interview')] ? 1 : 0);
  const draft = {
    get(k) { try { return localStorage.getItem(DRAFT + k) || ''; } catch (e) { return ''; } },
    set(k, v) { try { localStorage.setItem(DRAFT + k, v); } catch (e) { /* private mode */ } },
  };

  function artifactHtml(a) {
    return '<details class="sd-art"><summary><span class="badge">' + App.esc(a.lang) + '</span> ' + App.esc(a.name) + '</summary>' +
      '<pre class="code"><code>' + App.highlight(a.content, a.lang) + '</code></pre></details>';
  }

  function renderList(root) {
    const items = list();
    root.innerHTML = '<div class="page-head"><h1>🔄 ' + t('title') + '</h1><p class="muted">' + t('sub') + '</p></div>' +
      (items.length ? '<div class="sd-list">' + items.map(s => {
        const total = s.stages.length + 1, done = doneCount(s);
        return '<a class="card sd-card" href="#/sdlc/' + encodeURIComponent(s.id) + '">' +
          '<div class="sd-card-top"><span class="badge">' + App.esc(s.domain) + '</span><span class="badge">' + App.esc(App.LEVELS[s.level] || s.level) + '</span></div>' +
          '<h3>' + App.esc(s.title) + '</h3>' +
          '<div class="sd-dots" aria-hidden="true">' + s.stages.map(st => '<span class="' + (doneMap()[doneKey(s, st.key)] ? 'on' : '') + '" title="' + App.esc(st.title) + '">' + (ICONS[st.key] || '•') + '</span>').join('') + '</div>' +
          '<div class="progress"><i class="accent" style="width:' + Math.round(done / total * 100) + '%"></i></div>' +
          '<p class="muted small">' + t('progress', { done: done, total: total }) + ' · ' + (done ? t('continue') : t('open')) + ' →</p></a>';
      }).join('') + '</div>' : '<div class="empty"><p>' + t('empty') + '</p></div>');
  }

  function renderScenario(root, s, idx) {
    const n = s.stages.length;              // stages 0..n-1, n = interview
    idx = Math.max(0, Math.min(n, idx));
    const isInterview = idx === n;
    const st = isInterview ? null : s.stages[idx];
    const key = isInterview ? 'interview' : st.key;
    const dk = doneKey(s, key);
    const steps = s.stages.map((x, i) => ({ i, label: x.title, icon: ICONS[x.key] || '•', key: x.key }))
      .concat([{ i: n, label: t('interview'), icon: '🎤', key: 'interview' }]);

    const stepper = '<nav class="sd-steps" aria-label="SDLC">' + steps.map(x =>
      '<a href="#/sdlc/' + encodeURIComponent(s.id) + '/' + x.i + '" class="sd-step' + (x.i === idx ? ' active' : '') + (doneMap()[doneKey(s, x.key)] ? ' done' : '') + '"' +
      (x.i === idx ? ' aria-current="step"' : '') + '><span class="sd-step-ico">' + x.icon + '</span><span class="sd-step-lbl">' + (x.i + 1) + '. ' + App.esc(x.label) + '</span></a>').join('') + '</nav>';

    let body;
    if (isInterview) {
      const iv = s.interview;
      body = '<section class="card"><h2>🎤 ' + t('interviewTitle') + '</h2><div class="md">' + App.md(iv.story) + '</div></section>' +
        '<section class="card"><h2>' + t('questions') + '</h2>' + iv.questions.map((x, i) =>
          '<details class="sd-q"><summary><b>' + (i + 1) + '.</b> ' + App.esc(x.q) + '</summary><div class="md">' + App.md(x.a) + '</div></details>').join('') +
        '<div class="row sd-actions"><a class="btn" href="#/interview">' + t('practice') + '</a></div></section>';
    } else {
      body = '<section class="card sd-stage"><div class="sd-stage-head"><h2>' + (ICONS[st.key] || '') + ' ' + App.esc(st.title) + '</h2>' +
        '<span class="badge">' + App.esc(st.role) + '</span></div><div class="md">' + App.md(st.story) + '</div>' +
        (st.artifacts && st.artifacts.length ? '<div class="sd-arts">' + st.artifacts.map(artifactHtml).join('') + '</div>' : '') + '</section>' +
        '<section class="card sd-task"><h2>✍️ ' + t('yourTask') + '</h2><div class="md">' + App.md(st.task) + '</div>' +
        '<textarea class="textarea" rows="8" data-draft placeholder="' + App.esc(t('placeholder')) + '">' + App.esc(draft.get(dk)) + '</textarea>' +
        '<div class="row sd-actions">' +
          '<button class="btn" data-act="answer" aria-expanded="false">' + t('showAnswer') + '</button>' +
          '<button class="btn primary" data-act="grade">' + t('grade') + '</button>' +
        '</div><div data-fb></div>' +
        '<div class="sd-answer md" data-answer hidden>' + App.md(st.answer) +
          (st.pitfalls && st.pitfalls.length ? '<h3>⚠️ ' + t('pitfalls') + '</h3><ul>' + st.pitfalls.map(p => '<li>' + App.esc(p) + '</li>').join('') + '</ul>' : '') +
        '</div></section>';
    }

    const done = !!doneMap()[dk];
    root.innerHTML = '<div class="page-head sd-head"><a class="btn ghost sm" href="#/sdlc">' + t('back') + '</a>' +
      '<h1>' + App.esc(s.title) + '</h1><p class="muted small">' + App.esc(s.domain) + ' · ' + t('progress', { done: doneCount(s), total: n + 1 }) + '</p></div>' +
      stepper +
      (idx === 0 ? '<details class="card sd-context" open><summary><b>' + t('context') + '</b></summary><div class="md">' + App.md(s.context) + '</div></details>'
        : '<details class="card sd-context"><summary><b>' + t('context') + '</b></summary><div class="md">' + App.md(s.context) + '</div></details>') +
      body +
      '<div class="row sd-nav">' +
        (idx > 0 ? '<a class="btn" href="#/sdlc/' + encodeURIComponent(s.id) + '/' + (idx - 1) + '">' + t('prev') + '</a>' : '<span></span>') +
        '<button class="btn ' + (done ? 'ok' : '') + '" data-act="done">' + (done ? t('done') : t('markDone')) + '</button>' +
        (idx < n ? '<a class="btn primary" href="#/sdlc/' + encodeURIComponent(s.id) + '/' + (idx + 1) + '">' + t('next') + '</a>' : '<span></span>') +
      '</div><p class="muted small sd-keys"><kbd>←</kbd> <kbd>→</kbd> ' + t('keys') + '</p>';

    let busy = false;
    const onClick = async e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const act = b.dataset.act;
      if (act === 'answer') {
        const box = root.querySelector('[data-answer]');
        box.hidden = !box.hidden;
        b.textContent = box.hidden ? t('showAnswer') : t('hideAnswer');
        b.setAttribute('aria-expanded', String(!box.hidden));
      } else if (act === 'done') {
        if (doneMap()[dk]) delete doneMap()[dk]; else doneMap()[dk] = Date.now();
        App.store.save();
        renderScenario(root, s, idx);
      } else if (act === 'grade' && !busy) {
        const ans = (root.querySelector('[data-draft]').value || '').trim();
        const fb = root.querySelector('[data-fb]');
        if (!ans) { fb.innerHTML = '<p class="muted">' + t('needAnswer') + '</p>'; return; }
        busy = true; b.disabled = true;
        fb.innerHTML = '<span class="ai-loading">' + t('grading') + '</span>';
        try {
          const res = await App.ai.grade({
            question: st.title + ': ' + st.task + '\n\n' + s.context,
            reference: st.answer, answer: ans, lang: 'vi', topic: 'sdlc', level: s.level,
          });
          fb.innerHTML = App.ui.feedback(res, 'vi');
        } catch (err) {
          fb.innerHTML = App.ui.error(err);
        } finally { busy = false; b.disabled = false; }
      }
    };
    const onInput = e => { if (e.target.matches('[data-draft]')) draft.set(dk, e.target.value); };
    root.onclick = onClick;
    root.oninput = onInput;
  }

  App.registerView('sdlc', {
    get title() { return t('title'); },
    render(root, params) {
      const id = params[0];
      if (!id) { renderList(root); return () => { root.onclick = null; root.oninput = null; }; }
      const s = list().find(x => x.id === id);
      if (!s) { root.innerHTML = '<div class="empty"><p>' + t('notFound') + '</p><a class="btn" href="#/sdlc">' + t('back') + '</a></div>'; return; }
      const idx = parseInt(params[1] || '0', 10) || 0;
      renderScenario(root, s, idx);
      const off = App.onKey(e => {
        const cur = parseInt(params[1] || '0', 10) || 0;
        if (e.key === 'ArrowRight' && cur < s.stages.length) App.navigate('#/sdlc/' + encodeURIComponent(s.id) + '/' + (cur + 1));
        if (e.key === 'ArrowLeft' && cur > 0) App.navigate('#/sdlc/' + encodeURIComponent(s.id) + '/' + (cur - 1));
      });
      return () => { off(); root.onclick = null; root.oninput = null; };
    },
  });
})();
