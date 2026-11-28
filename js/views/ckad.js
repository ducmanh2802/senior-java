/*
 * CKAD (#/ckad): tổng quan kỳ thi, đề thi thử thực hành, lab 12 module. Spec: docs/CKAD-MOCK.md, task T2841.
 * Data (group 'ckad'): window.CKAD_EXAMS (js/data/ckad-mock-N.js), window.CKAD_LABS (js/data/ckad-labs-N.js).
 * Routes: #/ckad (tổng quan) · #/ckad/exam/<id> (đề thực hành, bấm giờ 120 phút) · #/ckad/lab · #/ckad/lab/<id>
 * Người học chạy setup/verify trên cluster kind của mình; app chỉ hiển thị, bấm giờ và lưu tự chấm.
 * Lưu: App.store.data.ckad = { tasks: { '<taskId>': 'pass'|'fail' }, answers: { '<taskId>': {text, updatedAt} }, exams: [{ id, score, at }], start: { '<examId>': ms } }
 */
(function () {
  'use strict';
  const esc = s => App.esc(s == null ? '' : String(s));
  const DOMAINS = [
    ['Design & Build', 20, 'Image, Job/CronJob, multi-container (init, sidecar), volume'],
    ['Deployment', 20, 'Rolling update/rollback, blue-green, canary, Helm, Kustomize'],
    ['Observability & Maintenance', 15, 'Probe, log, event, kubectl debug, API deprecation, top'],
    ['Environment, Config & Security', 25, 'ConfigMap, Secret, ServiceAccount, SecurityContext, resource, quota, RBAC'],
    ['Services & Networking', 20, 'Service, Ingress, NetworkPolicy, debug kết nối'],
  ];
  // verified via YouTube oEmbed (scripts/videos-verified.js)
  const VIDEOS = [
    ['https://www.youtube.com/watch?v=fnI_4wV7YZM', 'Your Complete Guide to Passing CKAD the Right Way', 'Chiến lược ôn và thi'],
    ['https://www.youtube.com/watch?v=qSQAOOmt2nw', 'How To Pass CKAD With Real Exam-like Questions - LIVE', 'Làm bài kiểu đề thật trên terminal'],
    ['https://www.youtube.com/watch?v=7UzZU8KUqyw', 'My CKAD Strategy — The Certified Kubernetes Application Developer Exam', 'Quản lý thời gian, alias, bỏ qua bài khó'],
    ['https://www.youtube.com/watch?v=X48VuDVv0do', 'Kubernetes Tutorial for Beginners [FULL COURSE in 4 Hours]', 'Nền tảng nếu chưa quen Kubernetes'],
  ];
  const KIND = 'kind: Cluster\napiVersion: kind.x-k8s.io/v1alpha4\nnodes:\n- role: control-plane\n- role: worker\n- role: worker';

  function ytParse(url) {
    const m = String(url).match(/v=([\w-]{11})/);
    if (!m) return null;
    const tm = String(url).match(/[?&]t=(\d+)s/);
    return { id: m[1], start: tm ? '&start=' + tm[1] : '' };
  }
  function vItem(v) { return Array.isArray(v) ? { url: v[0], title: v[1], note: v[2] || '' } : v; }
  function ytCard(v) {
    const p = ytParse(v.url);
    const title = esc(v.title);
    const note = v.note ? ' <span class="small muted">' + esc(v.note) + '</span>' : '';
    const link = '<a href="' + esc(v.url) + '" target="_blank" rel="noopener" class="link-btn">Mở YouTube ↗</a>';
    if (!p) {
      return '<li class="ck-video"><div class="ck-video-card"><div class="ck-video-info"><b>' + title + '</b>' + note + '</div>' +
        '<div class="ck-video-actions">' + link + '</div></div></li>';
    }
    return '<li class="ck-video"><div class="ck-video-card"><div class="ck-video-info"><b>' + title + '</b>' + note + '</div>' +
      '<div class="ck-video-actions"><button class="btn sm" data-yt="' + esc(p.id) + '" data-yt-title="' + esc(v.title) + '">▶ Xem</button>' + link +
      '</div></div><div class="ck-video-frame" hidden></div></li>';
  }
  function ckYt(root, onAction) {
    let openBtn = null, openFrame = null;
    function close() {
      if (openFrame) { openFrame.innerHTML = ''; openFrame.classList.remove('open'); openFrame.hidden = true; openFrame = null; }
      if (openBtn) { openBtn.textContent = '▶ Xem'; openBtn = null; }
    }
    root.onclick = ev => {
      const b = ev.target.closest('[data-yt],[data-mark],[data-copy],[data-answer]'); if (!b) return;
      if (b.dataset.yt) {
        ev.preventDefault();
        if (openBtn === b) { close(); return; }
        close();
        const card = b.closest('.ck-video');
        const fr = card.querySelector('.ck-video-frame');
        fr.classList.add('open'); fr.hidden = false;
        fr.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(b.dataset.yt) +
          '?autoplay=1&rel=0" title="YouTube: ' + esc(b.dataset.ytTitle) +
          '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
        openFrame = fr; openBtn = b; b.textContent = '✕ Đóng';
        return;
      }
      if (onAction) onAction(b);
    };
  }

  function st() {
    const d = App.store.data;
    d.ckad = d.ckad || {};
    d.ckad.tasks = d.ckad.tasks || {};
    d.ckad.answers = d.ckad.answers || {};
    d.ckad.exams = d.ckad.exams || [];
    d.ckad.start = d.ckad.start || {};
    return d.ckad;
  }
  const exams = () => (window.CKAD_EXAMS || []).filter(e => e && Array.isArray(e.tasks) && e.tasks.length);
  const labs = () => (window.CKAD_LABS || []).filter(l => l && Array.isArray(l.tasks)).sort((a, b) => a.order - b.order);

  function tabs(active) {
    const t = [['home', '#/ckad', '🚢 Tổng quan'], ['exam', '#/ckad/exams', '⏱️ Đề thực hành'], ['lab', '#/ckad/lab', '🧪 Lab 12 module'], ['quiz', '#/exam/ckad', '📝 Trắc nghiệm CKAD']];
    return '<nav class="chips ck-tabs" aria-label="CKAD">' + t.map(([k, h, l]) =>
      '<a class="chip' + (k === active ? ' active' : '') + '" href="' + h + '">' + l + '</a>').join('') + '</nav>';
  }
  const head = sub => '<section class="page-head"><h2>🚢 CKAD: Certified Kubernetes Application Developer</h2><p>' + sub + '</p></section>';

  function viewHome() {
    const s = st();
    const ex = exams(), lb = labs();
    const labTasks = lb.reduce((n, l) => n + l.tasks.length, 0);
    const labDone = lb.reduce((n, l) => n + l.tasks.filter(t => s.tasks[t.id] === 'pass').length, 0);
    return head('Thi thực hành trên terminal, 2 giờ, 15–20 bài, đậu 66%. Được mở kubernetes.io/docs. Mọi bài ở đây chạy trên một cluster kind trên máy bạn.') + tabs('home') +
      '<div class="grid ck-stats">' +
      '<a class="stat" href="#/ckad/exams"><div class="num">' + ex.length + '</div><div class="lbl">đề thực hành' + (s.exams[0] ? ' · lần gần nhất ' + s.exams[0].score + '%' : '') + '</div></a>' +
      '<a class="stat" href="#/ckad/lab"><div class="num">' + labDone + '/' + labTasks + '</div><div class="lbl">bài lab đã pass (' + lb.length + '/12 module)</div></a>' +
      '<a class="stat" href="#/exam/ckad"><div class="num">40</div><div class="lbl">câu trắc nghiệm tình huống / đề, 60 phút</div></a></div>' +
      '<div class="card"><h3>Domain và trọng số</h3><table class="ck-table"><tbody>' +
      DOMAINS.map(d => '<tr><td><b>' + esc(d[0]) + '</b><br><span class="small muted">' + esc(d[2]) + '</span></td><td>' + d[1] + '%</td></tr>').join('') +
      '</tbody></table></div>' +
      '<div class="card md">' + App.md(
        '### Dựng môi trường luyện\n' +
        '1. Cài Docker, {{kind}}, {{kubectl}}, {{helm}}.\n' +
        '2. Tạo file {{kind-ckad.yaml}} rồi chạy {{kind create cluster --name ckad --config kind-ckad.yaml}} (context {{kind-ckad}}).\n' +
        '~~~yaml\n' + KIND + '\n~~~\n' +
        '3. Mỗi bài có **setup** (dán vào terminal để tạo tình huống) và **verify** (in {{PASS}}/{{FAIL}}, dòng cuối {{RESULT x/y}}).\n' +
        '### Alias nên gõ ngay đầu giờ thi\n' +
        '~~~bash\nalias k=kubectl\nexport do="--dry-run=client -o yaml"\nexport now="--force --grace-period 0"\nk config use-context kind-ckad\n~~~\n' +
        '> Senior tip: đề thật cho sẵn context cho từng bài. Luôn chạy lệnh {{kubectl config use-context}} ghi ở đầu bài trước khi làm, sai context là mất trọn điểm bài đó.') + '</div>' +
      stepsCard() + terminalCard() +
      '<div class="card"><h3>🎬 Video hướng dẫn</h3><ul class="ck-videos">' + VIDEOS.map(v => ytCard(vItem(v))).join('') + '</ul>' +
      '<p class="small muted">Video theo từng chủ đề nằm trong mỗi module Lab.</p></div>';
  }

  function viewExams() {
    const ex = exams(), s = st();
    const list = ex.map(e => {
      const w = e.tasks.reduce((n, t) => n + (t.weight || 0), 0);
      const last = s.exams.find(x => x.id === e.id);
      return '<a class="card ck-item" href="#/ckad/exam/' + esc(e.id) + '"><b>' + esc(e.title) + '</b><span class="small muted">' + e.tasks.length + ' bài · ' + (e.minutes || 120) + ' phút · ' + w + ' điểm · đậu ' + (e.passPct || 66) + '%' +
        (last ? ' · lần gần nhất ' + last.score + '%' : '') + '</span></a>';
    }).join('');
    return head('Đề thực hành mô phỏng kỳ thi: làm trên cluster kind, chạy verify, tự đánh dấu đạt/chưa đạt rồi xem điểm.') + tabs('exam') +
      (list || '<div class="empty">Đề thực hành đang được soạn (task T2838–T2840). Trong lúc chờ: làm <a href="#/exam/ckad">trắc nghiệm CKAD</a> hoặc Lab.</div>');
  }

  function terminalCard() {
    return '<div class="card ck-terminal"><div class="ck-terminal-head">🖥️ Không cài được kind? Dùng terminal Kubernetes miễn phí trên trình duyệt</div>' +
      '<p class="small muted">Mở <b>Killercoda Kubernetes playground</b> ở tab mới (cần đăng nhập Killercoda; phiên có giới hạn thời gian). Dán <code>setup</code> vào terminal đó, làm bài, rồi dán <code>verify</code>.</p>' +
      '<p class="small muted">Context trên Killercoda khác <code>kind-ckad</code>: bỏ qua dòng <code>kubectl config use-context</code> hoặc chạy <code>kubectl config rename-context $(kubectl config current-context) kind-ckad</code>.</p>' +
      '<a class="btn sm primary" href="https://killercoda.com/playgrounds/scenario/kubernetes" target="_blank" rel="noopener">Mở Killercoda ↗</a></div>';
  }

  function stepsCard() {
    return '<div class="card md">' + App.md(
      '### Cách làm bài\n' +
      '1. **Dựng cluster**: dùng {{kind}} trên máy, hoặc mở terminal Kubernetes miễn phí (Killercoda) ngay trên trình duyệt.\n' +
      '2. **Copy setup**: dán đoạn Setup của bài vào terminal để tạo tình huống.\n' +
      '3. **Gõ lệnh** trong terminal (có thể nháp trong ô Bài làm) → dán **verify** → chạy {{kubectl config use-context}} đúng context → bấm **Verify PASS hết** khi mọi dòng đều {{PASS}}.') + '</div>';
  }

  function answerHtml(t) {
    const s = st();
    const saved = (s.answers[t.id] && s.answers[t.id].text) || '';
    const hasSol = !!t.solution;
    return '<div class="ck-answer-wrap" data-task="' + esc(t.id) + '">' +
      '<div class="ck-answer-main">' +
      '<label class="small muted ck-answer-label" for="ans-' + esc(t.id) + '">✍️ Bài làm của bạn (tự lưu, gõ lệnh kubectl / YAML ở đây)</label>' +
      '<textarea id="ans-' + esc(t.id) + '" class="textarea ck-answer" data-id="' + esc(t.id) + '" spellcheck="false" autocapitalize="off" autocorrect="off" placeholder="Gõ lệnh kubectl / YAML của bạn…">' + esc(saved) + '</textarea>' +
      '<div class="row ck-answer-actions">' +
      '<button class="btn sm" data-answer="copy" data-id="' + esc(t.id) + '">📋 Copy bài làm</button>' +
      (hasSol ? '<button class="btn sm" data-answer="compare" data-id="' + esc(t.id) + '" aria-expanded="false">🆚 So với lời giải</button>' : '') +
      '<button class="btn sm primary" data-answer="ai" data-id="' + esc(t.id) + '">🤖 AI chấm</button>' +
      '<button class="btn sm bad" data-answer="clear" data-id="' + esc(t.id) + '">🗑️ Xoá</button>' +
      '</div>' +
      '<div class="ck-answer-feedback" data-feedback="' + esc(t.id) + '" aria-live="polite"></div>' +
      '</div>' +
      (hasSol ? '<div class="ck-answer-side"><div class="small muted ck-answer-side-title">📖 Lời giải</div><div class="md">' + App.md(t.solution || '') + '</div></div>' : '') +
      '</div>';
  }

  function taskHtml(t, opt) {
    const s = st();
    const res = s.tasks[t.id];
    const code = (label, body, cls) => body ? '<details class="ck-code' + (cls ? ' ' + cls : '') + '"><summary>' + label + '</summary><div class="row"><button class="btn sm" data-copy="' + esc(t.id) + ':' + cls + '">📋 Copy</button></div><pre><code>' + esc(body) + '</code></pre></details>' : '';
    return '<div class="card ck-task" id="' + esc(t.id) + '"><div class="row"><b>' + (t.no ? 'Bài ' + t.no + '. ' : '') + esc(t.title) + '</b>' +
      (t.weight ? '<span class="badge">' + t.weight + '%</span>' : '') + (t.level ? '<span class="badge">' + esc(t.level) + '</span>' : '') +
      (t.domain ? '<span class="small muted">' + esc(t.domain) + '</span>' : '') + (t.minutes ? '<span class="small muted">~' + t.minutes + ' phút</span>' : '') +
      (res ? '<span class="badge ' + (res === 'pass' ? 'ok' : 'bad') + '">' + (res === 'pass' ? '✅ Đạt' : '❌ Chưa đạt') + '</span>' : '') + '</div>' +
      '<div class="md">' + App.md(t.task || '') + '</div>' +
      answerHtml(t) +
      code('⚙️ Setup (chạy trước khi làm)', t.setup, 'setup') + code('🔎 Verify (chạy sau khi làm)', t.verify, 'verify') +
      ((t.hints || []).length ? '<details><summary>💡 Gợi ý</summary><ol>' + t.hints.map(h => '<li>' + App.md(h) + '</li>').join('') + '</ol></details>' : '') +
      (opt.solution ? '<details><summary>📖 Lời giải</summary><div class="md">' + App.md(t.solution || '') + '</div>' +
        ((t.refs || []).length ? '<p class="small">' + t.refs.map(r => '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.title) + '</a>').join(' · ') + '</p>' : '') + '</details>' : '') +
      '<div class="row"><button class="btn sm ok" data-mark="pass" data-id="' + esc(t.id) + '">Verify PASS hết</button><button class="btn sm bad" data-mark="fail" data-id="' + esc(t.id) + '">Chưa đạt</button></div></div>';
  }

  function viewExam(root, id, cleanups) {
    const e = exams().find(x => x.id === id);
    if (!e) { root.innerHTML = head('Không tìm thấy đề') + tabs('exam') + '<a class="btn" href="#/ckad/exams">← Danh sách đề</a>'; return; }
    const s = st();
    const total = e.tasks.reduce((n, t) => n + (t.weight || 0), 0) || 1;
    function draw() {
      const started = s.start[e.id];
      const left = started ? Math.max(0, (e.minutes || 120) * 60 - Math.floor((Date.now() - started) / 1000)) : null;
      const got = e.tasks.filter(t => s.tasks[t.id] === 'pass').reduce((n, t) => n + (t.weight || 0), 0);
      const pct = Math.round(100 * got / total);
      root.innerHTML = head(esc(e.title)) + tabs('exam') +
        '<div class="card ck-bar row">' + (started
          ? '<span class="badge ck-timer">⏱️ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0') + '</span><button class="btn sm" data-act="finish">Kết thúc &amp; chấm</button>'
          : '<button class="btn primary" data-act="start">⏱️ Bắt đầu bấm giờ ' + (e.minutes || 120) + ' phút</button>') +
        '<span class="spacer"></span><span class="badge ' + (pct >= (e.passPct || 66) ? 'ok' : '') + '">' + pct + '% / cần ' + (e.passPct || 66) + '%</span></div>' +
        (e.intro ? '<details class="card"><summary>📋 Hướng dẫn môi trường</summary><div class="md">' + App.md(e.intro) + '</div></details>' : '') +
        terminalCard() +
        e.tasks.map(t => taskHtml(t, { solution: true })).join('') +
        '<a class="btn" href="#/ckad/exams">← Danh sách đề</a>';
    }
    root.onclick = ev => {
      const b = ev.target.closest('[data-act],[data-mark],[data-copy],[data-answer]'); if (!b) return;
      if (b.dataset.act === 'start') { s.start[e.id] = Date.now(); App.store.save(); draw(); }
      else if (b.dataset.act === 'finish') {
        const got = e.tasks.filter(t => s.tasks[t.id] === 'pass').reduce((n, t) => n + (t.weight || 0), 0);
        const score = Math.round(100 * got / total);
        s.exams.unshift({ id: e.id, score, at: Date.now() }); s.exams.length = Math.min(s.exams.length, 30);
        delete s.start[e.id]; App.store.save(); App.store.log('quiz');
        window.alert('Điểm: ' + score + '% (' + (score >= (e.passPct || 66) ? 'ĐẬU' : 'TRƯỢT') + ', cần ' + (e.passPct || 66) + '%)');
        draw();
      } else mark(b, draw, root, e.tasks);
    };
    const timer = setInterval(() => {
      const el = root.querySelector('.ck-timer'); const started = s.start[e.id];
      if (!el || !started) return;
      const left = Math.max(0, (e.minutes || 120) * 60 - Math.floor((Date.now() - started) / 1000));
      el.textContent = '⏱️ ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
    }, 1000);
    cleanups.push(() => clearInterval(timer));
    draw();
  }

  function findTask(tasks, id) {
    return (tasks || []).find(t => t && t.id === id);
  }

  function setAnswer(id, text) {
    const s = st();
    if (text) s.answers[id] = { text: text, updatedAt: Date.now() };
    else delete s.answers[id];
    App.store.save();
  }

  function mark(b, draw, root, tasks) {
    const s = st();
    if (b.dataset.mark) {
      const id = b.dataset.id;
      s.tasks[id] = s.tasks[id] === b.dataset.mark ? undefined : b.dataset.mark;
      if (!s.tasks[id]) delete s.tasks[id];
      if (s.tasks[id] === 'pass') App.store.log('algo');
      App.store.save(); draw();
    } else if (b.dataset.copy) {
      const pre = b.closest('details').querySelector('pre');
      if (pre && navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(() => { b.textContent = '✅ Đã copy'; }, () => {});
    } else if (b.dataset.answer) {
      const id = b.dataset.id;
      const wrap = b.closest('.ck-answer-wrap');
      const ta = wrap ? wrap.querySelector('.ck-answer') : null;
      const fb = wrap ? wrap.querySelector('.ck-answer-feedback') : null;
      const act = b.dataset.answer;
      if (act === 'copy') {
        if (ta && navigator.clipboard) {
          navigator.clipboard.writeText(ta.value).then(() => {
            const old = b.textContent; b.textContent = '✅ Đã copy';
            setTimeout(() => { if (b.isConnected) b.textContent = old; }, 1500);
          }, () => {});
        }
      } else if (act === 'compare') {
        if (wrap) {
          const open = wrap.classList.toggle('open');
          b.setAttribute('aria-expanded', open ? 'true' : 'false');
          b.textContent = open ? '✕ Ẩn lời giải' : '🆚 So với lời giải';
        }
      } else if (act === 'clear') {
        if (ta) { ta.value = ''; setAnswer(id, ''); if (fb) fb.innerHTML = ''; ta.focus(); }
      } else if (act === 'ai') {
        const t = findTask(tasks, id);
        const code = ta ? ta.value.trim() : '';
        if (!t || !code || b.disabled) return;
        const orig = b.textContent;
        b.disabled = true; b.innerHTML = '<span class="ai-loading">AI đang chấm…</span>';
        App.ai.review({
          title: t.title, prompt: t.task,
          reference: (t.solution || '') + '\nVerify script:\n' + (t.verify || ''),
          code: code, complexity: '',
        }).then(r => { if (fb) fb.innerHTML = App.ui.codeFeedback(r); })
          .catch(e => { if (fb) fb.innerHTML = App.ui.error(e); })
          .then(() => { b.disabled = false; b.textContent = orig; });
      }
    }
  }

  function viewLabs() {
    const s = st();
    const list = labs().map(l => {
      const done = l.tasks.filter(t => s.tasks[t.id] === 'pass').length;
      return '<a class="card ck-item" href="#/ckad/lab/' + esc(l.id) + '"><b>Module ' + l.order + '. ' + esc(l.title) + '</b><span class="small muted">' + esc(l.summary || '') + '</span>' +
        '<div class="progress"><i class="ok" style="width:' + Math.round(100 * done / (l.tasks.length || 1)) + '%"></i></div><span class="small muted">' + done + '/' + l.tasks.length + ' bài đạt</span></a>';
    }).join('');
    return head('12 module luyện không giới hạn thời gian: khái niệm, cheat sheet lệnh, video, rồi bài tập từ dễ tới khó.') + tabs('lab') +
      (list ? '<div class="grid">' + list + '</div>' : '<div class="empty">Lab đang được soạn (task T2842–T2844).</div>');
  }

  function viewLab(root, id) {
    const all = labs();
    const i = all.findIndex(x => x.id === id);
    const l = all[i];
    if (!l) { root.innerHTML = head('Không tìm thấy lab') + tabs('lab') + '<a class="btn" href="#/ckad/lab">← Danh sách lab</a>'; return; }
    function draw() {
      root.innerHTML = head('Module ' + l.order + '. ' + esc(l.title)) + tabs('lab') +
        '<div class="card md">' + App.md(l.concepts || '') + '</div>' +
        ((l.videos || []).length ? '<div class="card"><h3>🎬 Video hướng dẫn</h3><ul class="ck-videos">' + l.videos.map(v => ytCard(v)).join('') + '</ul></div>' : '') +
        terminalCard() +
        l.tasks.map(t => taskHtml(t, { solution: true })).join('') +
        '<div class="row"><a class="btn" href="#/ckad/lab">← Danh sách lab</a>' + (all[i + 1] ? '<a class="btn primary" href="#/ckad/lab/' + esc(all[i + 1].id) + '">Module tiếp →</a>' : '') + '</div>';
      ckYt(root, b => mark(b, draw, root, l.tasks));
    }
    draw();
  }

  App.registerView('ckad', {
    title: 'CKAD',
    render(root, params) {
      params = params || [];
      const cleanups = [() => { root.onclick = null; }];
      let saveTimer = null;
      const onInput = ev => {
        const ta = ev.target.closest ? ev.target.closest('.ck-answer') : null;
        if (!ta) return;
        const s = st();
        s.answers[ta.dataset.id] = { text: ta.value, updatedAt: Date.now() };
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { App.store.save(); saveTimer = null; }, 500);
      };
      const onKey = ev => {
        const ta = ev.target.closest ? ev.target.closest('.ck-answer') : null;
        if (!ta || ev.key !== 'Tab') return;
        ev.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 2;
        const st2 = st();
        st2.answers[ta.dataset.id] = { text: ta.value, updatedAt: Date.now() };
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { App.store.save(); saveTimer = null; }, 500);
      };
      root.addEventListener('input', onInput);
      root.addEventListener('keydown', onKey);
      cleanups.push(() => {
        root.removeEventListener('input', onInput);
        root.removeEventListener('keydown', onKey);
        if (saveTimer) { clearTimeout(saveTimer); App.store.save(); }
      });
      if (params[0] === 'exams') root.innerHTML = viewExams();
      else if (params[0] === 'exam' && params[1]) viewExam(root, params[1], cleanups);
      else if (params[0] === 'lab' && params[1]) viewLab(root, params[1]);
      else if (params[0] === 'lab') root.innerHTML = viewLabs();
      else { root.innerHTML = viewHome(); ckYt(root); }
      return () => cleanups.forEach(f => f());
    },
  });
})();
