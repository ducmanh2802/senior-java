/* View "bugs" — bug hunt: realistic production bugs (window.BUGS, js/data/bugs.js).
 * Learner reads the incident + artifacts, edits the buggy code, runs the tests that reproduce the bug,
 * asks AI to review the fix, writes a root-cause analysis graded by AI, then compares with the reference.
 * Owner: integrator (Claude). Contract: AGENTS.md sections 7, 9, 17. */
(function () {
  'use strict';
  const esc = App.esc;

  App.i18n.add({
    vi: {
      'bugs.title': 'Sửa bug thật',
      'bugs.subtitle': 'Code mô phỏng dự án thật đang có bug nghiêm trọng trên production. Đọc sự cố và log, tái hiện bằng test, sửa code, giải thích nguyên nhân gốc như khi phỏng vấn.',
      'bugs.how': 'Cách làm: đọc bối cảnh và artifact → bấm Chạy test để thấy bug (test đỏ) → sửa code trong editor → chạy lại đến khi xanh hết → viết phân tích nguyên nhân gốc để AI chấm → xem đáp án và cách làm trên production.',
      'bugs.all': 'Tất cả', 'bugs.solved': 'Đã sửa', 'bugs.unsolved': 'Chưa sửa',
      'bugs.count': '{n}/{total} bài', 'bugs.minutes': '{n} phút',
      'bugs.emptyFilter': 'Không có bài nào khớp bộ lọc.',
      'bugs.notFound': 'Không tìm thấy bài này.', 'bugs.back': '← Danh sách bug',
      'bugs.incident': 'Bối cảnh và sự cố', 'bugs.artifacts': 'Log, dump và số liệu',
      'bugs.code': 'Code dự án (sửa trực tiếp)', 'bugs.editorAria': 'Editor code Java',
      'bugs.run': '▶ Chạy test', 'bugs.review': '🤖 AI review cách sửa', 'bugs.hint': '💡 Gợi ý',
      'bugs.reset': '↺ Code gốc', 'bugs.resetConfirm': 'Khôi phục code lỗi ban đầu? Phần bạn đã sửa sẽ mất.',
      'bugs.answer': '📖 Đáp án', 'bugs.answerConfirm': 'Bạn chưa sửa xong. Xem đáp án luôn?',
      'bugs.running': 'Đang biên dịch và chạy test…', 'bugs.aiReviewing': 'AI đang review…',
      'bugs.notConfigured': 'Máy chủ chạy code chưa được cấu hình. Bạn vẫn có thể dùng "AI review cách sửa".',
      'bugs.pass': '🎉 Đã sửa xong: mọi test đều xanh. Giờ hãy viết phân tích nguyên nhân gốc bên dưới.',
      'bugs.shortcut': 'Ctrl+Enter để chạy',
      'bugs.rcaTitle': 'Phân tích nguyên nhân gốc (RCA)',
      'bugs.rcaHint': 'Viết như đang trả lời interviewer: triệu chứng → dẫn chứng trong log → nguyên nhân gốc → cách sửa → cách phòng ngừa trên production.',
      'bugs.rcaGrade': '🤖 AI chấm RCA', 'bugs.rcaShort': 'Viết dài hơn một chút (ít nhất vài câu) rồi hãy chấm.',
      'bugs.rcaWait': 'AI đang chấm…',
      'bugs.rootCause': 'Nguyên nhân gốc', 'bugs.fix': 'Cách sửa và phòng ngừa', 'bugs.refCode': 'Code đã sửa (tham khảo)',
      'bugs.solvedBadge': '✅ Đã sửa',
    },
    en: {
      'bugs.title': 'Fix real bugs',
      'bugs.subtitle': 'Code from realistic projects with serious production bugs. Read the incident and logs, reproduce with tests, fix the code, explain the root cause like in an interview.',
      'bugs.how': 'How: read the context and artifacts → Run tests to see the bug (red) → fix the code → run until all green → write a root-cause analysis for AI grading → compare with the reference and production advice.',
      'bugs.all': 'All', 'bugs.solved': 'Fixed', 'bugs.unsolved': 'Not fixed',
      'bugs.count': '{n}/{total} bugs', 'bugs.minutes': '{n} min',
      'bugs.emptyFilter': 'No bug matches the filter.',
      'bugs.notFound': 'Bug not found.', 'bugs.back': '← All bugs',
      'bugs.incident': 'Context and incident', 'bugs.artifacts': 'Logs, dumps and numbers',
      'bugs.code': 'Project code (edit directly)', 'bugs.editorAria': 'Java code editor',
      'bugs.run': '▶ Run tests', 'bugs.review': '🤖 AI review my fix', 'bugs.hint': '💡 Hint',
      'bugs.reset': '↺ Original code', 'bugs.resetConfirm': 'Restore the original buggy code? Your changes will be lost.',
      'bugs.answer': '📖 Answer', 'bugs.answerConfirm': 'You have not fixed it yet. Show the answer anyway?',
      'bugs.running': 'Compiling and running tests…', 'bugs.aiReviewing': 'AI is reviewing…',
      'bugs.notConfigured': 'The code runner is not configured. You can still use "AI review my fix".',
      'bugs.pass': '🎉 Fixed: every test is green. Now write the root-cause analysis below.',
      'bugs.shortcut': 'Ctrl+Enter to run',
      'bugs.rcaTitle': 'Root-cause analysis (RCA)',
      'bugs.rcaHint': 'Write it like an interview answer: symptom → evidence in the logs → root cause → fix → prevention in production.',
      'bugs.rcaGrade': '🤖 Grade my RCA', 'bugs.rcaShort': 'Write a bit more (a few sentences) before grading.',
      'bugs.rcaWait': 'AI is grading…',
      'bugs.rootCause': 'Root cause', 'bugs.fix': 'Fix and prevention', 'bugs.refCode': 'Fixed code (reference)',
      'bugs.solvedBadge': '✅ Fixed',
    },
  });

  const t = (k, p) => App.t(k, p);
  const all = () => (window.BUGS || []);
  const solved = b => App.store.getStatus(b.id) === 'known';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* private mode */ } },
  };
  const draftKey = id => 'sjp.bugs.draft.' + id;
  const rcaKey = id => 'sjp.bugs.rca.' + id;
  const sevCls = s => s === 'P1' ? 'bad' : s === 'P2' ? 'warn' : '';
  let filter = 'all';

  function listView(root) {
    const bugs = all();
    const shown = bugs.filter(b => filter === 'all' || (filter === 'solved' ? solved(b) : !solved(b)));
    const done = bugs.filter(solved).length;
    root.innerHTML = `
      <div class="page-head"><h1>🐞 ${esc(t('bugs.title'))}</h1><p class="muted">${esc(t('bugs.subtitle'))}</p></div>
      <div class="card bg-how"><p>${esc(t('bugs.how'))}</p>
        <div class="progress" aria-label="${esc(t('bugs.count', { n: done, total: bugs.length }))}"><i class="ok" style="width:${bugs.length ? Math.round(done * 100 / bugs.length) : 0}%"></i></div>
        <p class="muted small">${esc(t('bugs.solved'))}: ${done}/${bugs.length}</p></div>
      <div class="chips bg-filter" role="group">
        ${['all', 'unsolved', 'solved'].map(f => `<button type="button" class="chip ${filter === f ? 'active' : ''}" data-filter="${f}">${esc(t('bugs.' + f))}</button>`).join('')}
        <span class="muted small">${esc(t('bugs.count', { n: shown.length, total: bugs.length }))}</span>
      </div>
      ${shown.length ? `<div class="bg-grid">${shown.map(card).join('')}</div>` : `<div class="empty"><p>${esc(t('bugs.emptyFilter'))}</p></div>`}`;
  }

  function card(b) {
    return `<a class="card bg-card" href="#/bugs/${esc(b.id)}">
      <div class="bg-card-top"><span class="badge ${sevCls(b.severity)}">${esc(b.severity)}</span>
        <span class="badge">${esc((App.LEVELS && App.LEVELS[b.level]) || b.level)}</span>
        <span class="muted small">⏱ ${esc(t('bugs.minutes', { n: b.minutes }))}</span>
        ${solved(b) ? `<span class="badge ok">${esc(t('bugs.solvedBadge'))}</span>` : ''}</div>
      <h3>${esc(b.title)}</h3>
      <p class="muted small">${esc(b.domain)}</p>
      <div class="bg-tags">${(b.tags || []).slice(0, 4).map(x => `<span class="bg-tag">${esc(x)}</span>`).join('')}</div>
    </a>`;
  }

  function detailView(root, b) {
    const code = store.get(draftKey(b.id)) ?? b.starter;
    root.innerHTML = `
      <p><a href="#/bugs">${esc(t('bugs.back'))}</a></p>
      <div class="page-head"><h1>🐞 ${esc(b.title)}</h1>
        <p class="bg-meta"><span class="badge ${sevCls(b.severity)}">${esc(b.severity)}</span>
          <span class="badge">${esc((App.LEVELS && App.LEVELS[b.level]) || b.level)}</span>
          <span class="muted small">${esc(b.domain)} · ⏱ ${esc(t('bugs.minutes', { n: b.minutes }))}</span>
          <span class="bg-solved">${solved(b) ? `<span class="badge ok">${esc(t('bugs.solvedBadge'))}</span>` : ''}</span></p></div>
      <section class="card"><h2 class="bg-h">${esc(t('bugs.incident'))}</h2><div class="md">${App.md(b.story)}</div></section>
      ${(b.artifacts || []).length ? `<section class="card"><h2 class="bg-h">${esc(t('bugs.artifacts'))}</h2>
        ${b.artifacts.map((a, i) => `<details class="bg-artifact" ${i === 0 ? 'open' : ''}><summary>📄 ${esc(a.name)}</summary><pre class="bg-pre"><code>${esc(a.content)}</code></pre></details>`).join('')}</section>` : ''}
      <section class="card bg-work">
        <h2 class="bg-h">${esc(t('bugs.code'))}</h2>
        <textarea class="textarea bg-editor" spellcheck="false" autocapitalize="off" autocorrect="off" wrap="off" aria-label="${esc(t('bugs.editorAria'))}">${esc(code)}</textarea>
        <div class="row bg-actions">
          <button type="button" class="btn primary" data-act="run">${esc(t('bugs.run'))}</button>
          <button type="button" class="btn" data-act="hint">${esc(t('bugs.hint'))} <span class="bg-hint-count">0/${(b.hints || []).length}</span></button>
          <button type="button" class="btn" data-act="review">${esc(t('bugs.review'))}</button>
          <button type="button" class="btn sm" data-act="reset">${esc(t('bugs.reset'))}</button>
          <span class="muted small"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> ${esc(t('bugs.shortcut').replace(/^Ctrl\+Enter\s*/, ''))}</span>
        </div>
        <div class="bg-hints"></div>
        <div class="bg-result" aria-live="polite"></div>
      </section>
      <section class="card bg-rca">
        <h2 class="bg-h">${esc(t('bugs.rcaTitle'))}</h2>
        <p class="muted small">${esc(t('bugs.rcaHint'))}</p>
        <textarea class="textarea bg-rca-text" rows="6" aria-label="${esc(t('bugs.rcaTitle'))}">${esc(store.get(rcaKey(b.id)) || '')}</textarea>
        <div class="row"><button type="button" class="btn" data-act="rca">${esc(t('bugs.rcaGrade'))}</button></div>
        <div class="bg-rca-result" aria-live="polite"></div>
      </section>
      <div class="row"><button type="button" class="btn" data-act="answer">${esc(t('bugs.answer'))}</button></div>
      <section class="bg-answer" hidden>
        <div class="card"><h2 class="bg-h">${esc(t('bugs.rootCause'))}</h2><div class="md">${App.md(b.rootCause)}</div></div>
        <div class="card"><h2 class="bg-h">${esc(t('bugs.fix'))}</h2><div class="md">${App.md(b.fix)}</div></div>
        <div class="card"><h2 class="bg-h">${esc(t('bugs.refCode'))}</h2><div class="md">${App.md('~~~java\n' + b.reference + '\n~~~')}</div></div>
      </section>
      ${App.ui.relatedQuestions ? App.ui.relatedQuestions({ ids: b.related || [], tags: b.tags, limit: 4 }) : ''}`;
  }

  App.registerView('bugs', {
    get title() { return t('bugs.title'); },
    render(root, params) {
      const id = params && params[0];
      const b = id ? all().find(x => x.id === id) : null;
      if (id && !b) { root.innerHTML = `<div class="empty"><h2>${esc(t('bugs.notFound'))}</h2><p><a href="#/bugs">${esc(t('bugs.back'))}</a></p></div>`; return () => {}; }
      if (!b) {
        listView(root);
        const onList = e => {
          const f = e.target.closest('[data-filter]');
          if (f) { filter = f.dataset.filter; listView(root); }
        };
        root.addEventListener('click', onList);
        return () => root.removeEventListener('click', onList);
      }

      detailView(root, b);
      const editor = root.querySelector('.bg-editor');
      const out = root.querySelector('.bg-result');
      let lastRun = null, hintsShown = 0, saveTimer = 0;

      async function run() {
        const btn = root.querySelector('[data-act="run"]');
        if (btn.disabled) return;
        btn.disabled = true;
        out.innerHTML = `<span class="ai-loading">${esc(t('bugs.running'))}</span>`;
        try {
          const r = await App.ai.run(App.code.assemble(editor.value, b.tests));
          if (r.configured === false) { out.innerHTML = `<div class="ai-error">${esc(t('bugs.notConfigured'))}</div>`; return; }
          const parsed = App.code.parse(r.stdout);
          lastRun = { run: r, parsed };
          out.innerHTML = App.ui.runResult(r, parsed);
          if (parsed.allPassed && parsed.total) {
            if (!solved(b)) { App.store.setStatus(b.id, 'known'); App.store.log('algo'); }
            out.insertAdjacentHTML('beforeend', `<p class="bg-pass">${esc(t('bugs.pass'))}</p>`);
            root.querySelector('.bg-solved').innerHTML = `<span class="badge ok">${esc(t('bugs.solvedBadge'))}</span>`;
          }
        } catch (e) { out.innerHTML = App.ui.error(e); }
        finally { btn.disabled = false; }
      }

      async function review() {
        const btn = root.querySelector('[data-act="review"]');
        if (btn.disabled) return;
        btn.disabled = true;
        out.innerHTML = `<span class="ai-loading">${esc(t('bugs.aiReviewing'))}</span>`;
        try {
          const r = await App.ai.review({
            title: 'Sửa bug: ' + b.title,
            prompt: b.story + '\n\nNguyên nhân gốc (để AI đối chiếu): ' + b.rootCause,
            reference: b.reference, code: editor.value,
            run: lastRun ? { passed: lastRun.parsed.passed, total: lastRun.parsed.total, output: String(lastRun.run.stdout || '').slice(0, 3000) } : undefined,
          });
          out.innerHTML = App.ui.codeFeedback(r);
        } catch (e) { out.innerHTML = App.ui.error(e); }
        finally { btn.disabled = false; }
      }

      async function gradeRca() {
        const btn = root.querySelector('[data-act="rca"]'), box = root.querySelector('.bg-rca-result');
        const answer = root.querySelector('.bg-rca-text').value.trim();
        if (btn.disabled) return;
        if (answer.length < 80) { box.innerHTML = `<p class="muted">${esc(t('bugs.rcaShort'))}</p>`; return; }
        btn.disabled = true;
        box.innerHTML = `<span class="ai-loading">${esc(t('bugs.rcaWait'))}</span>`;
        try {
          const r = await App.ai.grade({
            question: 'Phân tích nguyên nhân gốc và cách sửa sự cố: ' + b.title + '. Bối cảnh: ' + String(b.story).slice(0, 1500),
            reference: b.rootCause + '\n\n' + String(b.fix).slice(0, 4000),
            answer, lang: 'vi', topic: 'bugs', level: b.level,
          });
          box.innerHTML = App.ui.feedback(r, 'vi');
        } catch (e) { box.innerHTML = App.ui.error(e); }
        finally { btn.disabled = false; }
      }

      function showHint() {
        const hints = b.hints || [];
        if (hintsShown >= hints.length) return;
        hintsShown++;
        root.querySelector('.bg-hints').innerHTML = hints.slice(0, hintsShown).map((h, i) => `<div class="bg-hint">💡 ${i + 1}. ${App.md(h).replace(/^<p>|<\/p>$/g, '')}</div>`).join('');
        root.querySelector('.bg-hint-count').textContent = hintsShown + '/' + hints.length;
      }

      function onClick(e) {
        const act = e.target.closest('[data-act]');
        if (!act) return;
        const a = act.dataset.act;
        if (a === 'run') run();
        else if (a === 'review') review();
        else if (a === 'hint') showHint();
        else if (a === 'rca') gradeRca();
        else if (a === 'reset') {
          if (confirm(t('bugs.resetConfirm'))) { editor.value = b.starter; store.del(draftKey(b.id)); out.innerHTML = ''; }
        } else if (a === 'answer') {
          const sec = root.querySelector('.bg-answer');
          if (!sec.hidden) { sec.hidden = true; return; }
          if (!solved(b) && !confirm(t('bugs.answerConfirm'))) return;
          sec.hidden = false;
          sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      function onKeydown(e) {
        if (e.target === editor) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); return; }
          if (e.key === 'Tab' && !e.shiftKey) {          // Tab chèn 4 dấu cách thay vì rời editor
            e.preventDefault();
            const s = editor.selectionStart, en = editor.selectionEnd;
            editor.value = editor.value.slice(0, s) + '    ' + editor.value.slice(en);
            editor.selectionStart = editor.selectionEnd = s + 4;
          }
        }
      }
      function onInput(e) {
        if (e.target === editor) {
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => store.set(draftKey(b.id), editor.value), 400);
        } else if (e.target.classList.contains('bg-rca-text')) {
          store.set(rcaKey(b.id), e.target.value);
        }
      }
      root.addEventListener('click', onClick);
      root.addEventListener('keydown', onKeydown);
      root.addEventListener('input', onInput);
      return () => {
        clearTimeout(saveTimer);
        if (editor.value !== b.starter) store.set(draftKey(b.id), editor.value);
        root.removeEventListener('click', onClick);
        root.removeEventListener('keydown', onKeydown);
        root.removeEventListener('input', onInput);
      };
    },
  });
})();
