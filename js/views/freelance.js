/*
 * Freelance track (#/freelance): lộ trình 12 tuần AI-agent + Stripe Connect + tiếng Anh để nhận job Upwork
 * "Senior Software Engineer, AI Agent First". Data: window.FREELANCE_PLAN + window.FREELANCE_EN
 * (js/data/freelance-plan.js, js/data/freelance-english.js — nhóm 'freelance' trong data-manifest).
 * Lưu: App.store.data.freelance = { start, done: { '<weekId>': true }, taskDone: { '<taskId>': true },
 *   mustHaveDone: { '<index>': true }, screeningAnswers: { '<index>': text } }.
 */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'freelance.title': 'Freelance AI-agent',
      'freelance.heading': '🚀 Lộ trình 3 tháng: nhận job freelance "Senior AI Agent First"',
      'freelance.sub': '12 tuần (26/11/2026 → 26/02/2027) luyện Claude Code, Stripe Connect, Next.js và tiếng Anh để apply job Upwork giá 60–95 USD/giờ, làm theo giờ US Eastern.',
      'freelance.start': 'Ngày bắt đầu lộ trình',
      'freelance.today': 'Bắt đầu từ hôm nay',
      'freelance.pickStart': 'Chọn ngày bắt đầu để tính tuần hiện tại và tiến độ.',
      'freelance.tz': '⚠️ Cảnh báo múi giờ',
      'freelance.tzText': 'Làm việc theo giờ US Eastern (mùa đông EST UTC−5: 9:00–17:00 New York = 21:00–05:00 giờ Việt Nam; mùa hè EDT UTC−4: 20:00–04:00). Chốt 3–4 khung giờ overlap với client và ghi rõ timezone trong mọi tin nhắn.',
      'freelance.progress': 'Tiến độ tổng',
      'freelance.taskLabel': 'task đã xong',
      'freelance.of': '/ {n} task',
      'freelance.week': 'Tuần {n}',
      'freelance.weekNow': 'Tuần hiện tại',
      'freelance.notStarted': 'Chưa bắt đầu',
      'freelance.finished': 'Đã qua 12 tuần',
      'freelance.weeksDone': 'Tuần đã xong',
      'freelance.goals': 'Mục tiêu tuần',
      'freelance.tasks': 'Công việc',
      'freelance.min': 'phút',
      'freelance.markDone': 'Đánh dấu xong',
      'freelance.markUndone': 'Bỏ đánh dấu',
      'freelance.doneBadge': 'Đã xong',
      'freelance.nowBadge': 'Tuần này',
      'freelance.deliverable': 'Sản phẩm tuần',
      'freelance.english': 'Tiếng Anh trong tuần',
      'freelance.links': 'Tài liệu tham khảo (mở tab mới)',
      'freelance.lessons': 'Bài học liên quan',
      'freelance.noLesson': 'Chưa có bài học nào.',
      'freelance.jobReq': 'Yêu cầu job (tự đánh giá)',
      'freelance.mustHave': 'Tôi đã làm / có thể làm điều này',
      'freelance.screening': 'Câu hỏi sàng lọc (tiếng Anh)',
      'freelance.sample': 'Câu trả lời mẫu (tiếng Anh)',
      'freelance.yourAnswer': 'Bản của bạn',
      'freelance.saveAns': 'Lưu câu trả lời',
      'freelance.saved': 'Đã lưu.',
      'freelance.noData': 'Dữ liệu lộ trình freelance đang được cập nhật.',
    },
    en: {
      'freelance.title': 'Freelance AI-agent',
      'freelance.heading': '🚀 3-month plan: land a "Senior AI Agent First" freelance job',
      'freelance.sub': '12 weeks (26/11/2026 → 26/02/2027) practising Claude Code, Stripe Connect, Next.js and English to apply for Upwork jobs at $60–95/hour, US Eastern hours.',
      'freelance.start': 'Start date',
      'freelance.today': 'Start today',
      'freelance.pickStart': 'Pick a start date to get the current week and progress.',
      'freelance.tz': '⚠️ Time zone warning',
      'freelance.tzText': 'Work in US Eastern time (winter EST UTC−5: 9:00–17:00 New York = 21:00–05:00 Vietnam; summer EDT UTC−4: 20:00–04:00). Block 3–4 overlap windows with the client and write the time zone in every message.',
      'freelance.progress': 'Overall progress',
      'freelance.taskLabel': 'tasks done',
      'freelance.of': '/ {n} tasks',
      'freelance.week': 'Week {n}',
      'freelance.weekNow': 'Current week',
      'freelance.notStarted': 'Not started',
      'freelance.finished': 'Past week 12',
      'freelance.weeksDone': 'Weeks done',
      'freelance.goals': 'Week goals',
      'freelance.tasks': 'Tasks',
      'freelance.min': 'min',
      'freelance.markDone': 'Mark done',
      'freelance.markUndone': 'Mark not done',
      'freelance.doneBadge': 'Done',
      'freelance.nowBadge': 'This week',
      'freelance.deliverable': 'Week deliverable',
      'freelance.english': 'English this week',
      'freelance.links': 'Reference docs (open in new tab)',
      'freelance.lessons': 'Related lessons',
      'freelance.noLesson': 'No lessons yet.',
      'freelance.jobReq': 'Job requirements (self-assessment)',
      'freelance.mustHave': "I've done / can do this",
      'freelance.screening': 'Screening questions (English)',
      'freelance.sample': 'Sample answer (English)',
      'freelance.yourAnswer': 'Your answer',
      'freelance.saveAns': 'Save answer',
      'freelance.saved': 'Saved.',
      'freelance.noData': 'Freelance plan data is being added.',
    },
  });

  const t = (k, v) => App.t('freelance.' + k, v);
  const esc = App.esc;

  // ---------- data ----------
  function plan() { return window.FREELANCE_PLAN || { months: [], weeks: [], job: {} }; }
  const weeks = () => plan().weeks || [];
  const jobData = () => plan().job || {};
  const enScreening = () => (window.FREELANCE_EN && window.FREELANCE_EN.screening) || [];

  function S() {
    const d = App.store.data;
    if (!d.freelance || typeof d.freelance !== 'object') d.freelance = {};
    const f = d.freelance;
    if (f.start === undefined || f.start === null) f.start = '2026-11-26';
    if (!f.done || typeof f.done !== 'object') f.done = {};
    if (!f.taskDone || typeof f.taskDone !== 'object') f.taskDone = {};
    if (!f.mustHaveDone || typeof f.mustHaveDone !== 'object') f.mustHaveDone = {};
    if (!f.screeningAnswers || typeof f.screeningAnswers !== 'object') f.screeningAnswers = {};
    return f;
  }
  function save() { try { App.store.save(); } catch (e) { /* storage blocked */ } }

  // ---------- dates / weeks ----------
  function startTs() {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(S().start || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : null;
  }
  function currentWeek() {
    const s = startTs();
    if (s == null) return null;
    const n = Math.floor((App.startOfDay(Date.now()) - s) / (7 * App.DAY)) + 1;
    return Math.max(0, Math.min(weeks().length + 1, n));
  }
  const weekStart = n => { const s = startTs(); return s == null ? null : s + (n - 1) * 7 * App.DAY; };
  const dateStr = ts => new Date(ts).toLocaleDateString(App.lang === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isWeekDone = id => !!S().done[id];
  const isTaskDone = id => !!S().taskDone[id];
  const isMustDone = i => !!S().mustHaveDone[String(i)];

  function totalTasks() {
    let n = 0; weeks().forEach(w => { n += (w.tasks || []).length; }); return n;
  }
  function doneTasks() {
    let n = 0; weeks().forEach(w => { (w.tasks || []).forEach(t => { if (isTaskDone(t.id)) n += 1; }); }); return n;
  }
  function weekOf(cw) {
    return cw >= 1 && cw <= weeks().length ? weeks()[cw - 1] : null;
  }

  // ---------- module state ----------
  let rootEl = null;
  const openWeeks = new Set();

  // ---------- shared HTML ----------
  const mdInline = src => App.md(String(src || '')).replace(/^<p>/, '').replace(/<\/p>$/, '');
  const safeUrl = u => (/^https:\/\//.test(u || '') ? u : '#');

  function overviewHeader() {
    const f = S(), ws = weeks(), cw = currentWeek(), done = ws.filter(w => isWeekDone(w.id)).length;
    const total = totalTasks(), doneT = doneTasks();
    const pct = total ? Math.round(doneT / total * 100) : 0;
    const pctCls = total ? (pct >= 100 ? 'ok' : pct >= 50 ? 'warn' : 'bad') : '';
    return '<section class="card freelance-start"><label for="freelanceStart"><strong>' + t('start') + '</strong></label> ' +
      '<input type="date" class="input" id="freelanceStart" value="' + esc(f.start || '') + '"> ' +
      '<button type="button" class="btn sm" data-act="today">' + t('today') + '</button>' +
      (f.start ? '' : '<p class="small muted">' + t('pickStart') + '</p>') + '</section>' +
      '<div class="grid freelance-stats">' +
      '<div class="stat"><div class="num">' + (cw == null ? t('notStarted') : cw > ws.length ? t('finished') : cw + '/' + ws.length) + '</div><div class="lbl">' + t('weekNow') + '</div></div>' +
      '<div class="stat"><div class="num">' + done + '/' + ws.length + '</div><div class="lbl">' + t('weeksDone') + '</div>' +
      '<span class="progress"><i class="' + (ws.length ? (pct >= 100 ? 'ok' : 'accent') : '') + '" style="width:' + (ws.length ? Math.round(done / ws.length * 100) : 0) + '%"></i></span></div>' +
      '<div class="stat"><div class="num">' + doneT + '</div><div class="lbl">' + t('taskLabel') + ' ' + esc(t('of', { n: total })) + '</div>' +
      '<span class="progress"><i class="' + pctCls + '" style="width:' + pct + '%"></i></span></div>' +
      '</div>';
  }
  function tzBox() {
    return '<section class="card freelance-tz"><strong>' + t('tz') + '</strong> <p class="small muted">' + esc(t('tzText')) + '</p></section>';
  }

  // ---------- plan ----------
  function planHtml() {
    const cw = currentWeek();
    if (!openWeeks.size) {
      const fw = weekOf(cw);
      openWeeks.add(fw ? fw.id : (weeks().length ? weeks()[0].id : null));
    }
    return '<ol class="freelance-weeks">' + weeks().map(w => {
      const done = isWeekDone(w.id), now = cw != null && cw >= 1 && cw <= weeks().length && weeks()[cw - 1].id === w.id;
      const goals = (w.goals || []).map(g => '<li>' + mdInline(g) + '</li>').join('');
      const tasks = (w.tasks || []).map(task => {
        const td = isTaskDone(task.id);
        return '<li class="freelance-task"><label><input type="checkbox" data-act="tickTask" data-week="' + esc(w.id) + '" data-task="' + esc(task.id) + '"' +
          (td ? ' checked' : '') + ' aria-label="' + esc(t('markDone')) + '">' +
          '<span class="freelance-task-text' + (td ? ' done' : '') + '">' + esc(task.text) +
          '</span> <span class="badge muted">' + esc(task.minutes) + ' ' + t('min') + '</span></label>' +
          (td ? '<span class="dot ok" title="' + t('doneBadge') + '" aria-hidden="true"></span>' : '') + '</li>';
      }).join('');
      const links = (w.links || []).map(l => '<li><a href="' + esc(safeUrl(l.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(l.title) + '</a></li>').join('');
      const lessons = (w.lessonIds || []).map(lid => '<li><a href="#/learn/' + esc(lid) + '">' + esc(lid) + '</a></li>').join('');
      const english = (w.english || []).map(e => '<li>' + mdInline(e) + '</li>').join('');
      return '<li><details class="card freelance-week' + (done ? ' done' : '') + (now ? ' now' : '') + '" data-week="' + esc(w.id) + '"' + (openWeeks.has(w.id) ? ' open' : '') + '>' +
        '<summary><span class="freelance-wk-n">' + (done ? '✓' : w.id.slice(2)) + '</span><span class="freelance-wk-title"><strong>' + esc(t('week', { n: w.id.slice(2) })) + ':</strong> ' + esc(w.title) +
        '<span class="freelance-wk-meta">' + (done ? '<span class="badge ok">' + t('doneBadge') + '</span>' : '') + (now ? '<span class="badge accent">' + t('nowBadge') + '</span>' : '') +
        (weekStart(parseInt(w.id.slice(2), 10)) != null ? '<span class="small muted">' + esc(dateStr(weekStart(parseInt(w.id.slice(2), 10)))) + ' – ' + esc(dateStr(weekStart(parseInt(w.id.slice(2), 10)) + 6 * App.DAY)) + '</span>' : '') + '</span></span></summary>' +
        '<div class="freelance-week-body">' +
        (goals ? '<h4>' + t('goals') + '</h4><ul class="freelance-goals">' + goals + '</ul>' : '') +
        '<h4>' + t('tasks') + '</h4><ul class="freelance-tasks">' + tasks + '</ul>' +
        '<p class="freelance-deliverable"><strong>' + t('deliverable') + ':</strong> ' + mdInline(w.deliverable || '') + '</p>' +
        (english ? '<h4>' + t('english') + '</h4><ul class="freelance-english">' + english + '</ul>' : '') +
        (links ? '<h4>' + t('links') + '</h4><ul class="freelance-links">' + links + '</ul>' : '') +
        (lessons ? '<h4>' + t('lessons') + '</h4><ul class="freelance-lessons">' + lessons + '</ul>' : '') +
        '<div class="row freelance-week-actions"><button type="button" class="btn ' + (done ? '' : 'ok') + '" data-act="tickWeek" data-week="' + esc(w.id) + '" aria-pressed="' + done + '">' +
        (done ? t('markUndone') : '✓ ' + t('markDone')) + '</button></div>' +
        '</div></details></li>';
    }).join('') + '</ol>';
  }

  // ---------- job requirements ----------
  function jobReqHtml() {
    const j = jobData();
    const mhs = (j.mustHaves || []).map((m, i) => {
      const d = isMustDone(i);
      return '<li class="freelance-must"><label><input type="checkbox" data-act="tickMust" data-i="' + i + '"' +
        (d ? ' checked' : '') + ' aria-label="' + esc(t('mustHave')) + '">' +
        '<span class="freelance-must-text' + (d ? ' done' : '') + '">' + esc(m) + '</span>' +
        (d ? '<span class="dot ok" title="' + t('doneBadge') + '" aria-hidden="true"></span>' : '') + '</label></li>';
    }).join('');
    return '<section class="card freelance-jobreq"><h3>' + t('jobReq') + '</h3>' +
      (j.rate ? '<p class="small muted">' + esc(j.rate) + '</p>' : '') +
      '<ul class="freelance-musthaves">' + mhs + '</ul>' +
      (j.trial ? '<p class="small"><strong>Tuần thử việc:</strong> ' + mdInline(j.trial) + '</p>' : '') +
      '</section>';
  }

  // ---------- screening ----------
  function screeningHtml() {
    const qs = jobData().screening || [];
    const samples = enScreening();
    const ans = S().screeningAnswers;
    const rows = qs.map((q, i) => {
      const sample = samples[i] || null;
      const saved = ans[String(i)] || '';
      return '<div class="card freelance-screen"><h4>' + esc((i + 1) + '. ' + q) + '</h4>' +
        (sample ? '<div class="freelance-sample"><h5>' + t('sample') + '</h5><div class="md">' + App.md(sample) + '</div></div>' : '') +
        '<textarea class="textarea" data-act="screeningText" data-i="' + i + '" aria-label="' + esc(t('yourAnswer')) + '">' + esc(saved) + '</textarea>' +
        '<div class="row freelance-screen-actions"><button type="button" class="btn sm" data-act="saveScreening" data-i="' + i + '">' + t('saveAns') + '</button>' +
        '<span class="small muted freelance-saved-msg" id="freelance-saved-' + i + '"></span></div></div>';
    }).join('');
    return '<section class="card freelance-screening"><h3>' + t('screening') + '</h3>' + rows + '</section>';
  }

  // ---------- render ----------
  function render() {
    if (!rootEl) return;
    if (!weeks().length) { rootEl.innerHTML = '<p class="empty">' + t('noData') + '</p>'; return; }
    rootEl.innerHTML = '<div class="page-head"><div><h1>' + t('heading') + '</h1><p>' + t('sub') + '</p></div></div>' +
      overviewHeader() + tzBox() + '<section class="card freelance-plan-card"><h2>' + t('progress') + '</h2>' + planHtml() + '</section>' +
      jobReqHtml() + screeningHtml();
  }

  // ---------- events ----------
  function onClick(e) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    const f = S();
    if (act === 'today') { f.start = App.dayKey(Date.now()); save(); render(); return; }
    if (act === 'tickWeek') { const id = b.dataset.week; if (f.done[id]) delete f.done[id]; else f.done[id] = true; save(); render(); return; }
    if (act === 'tickTask') { const id = b.dataset.task; if (f.taskDone[id]) delete f.taskDone[id]; else f.taskDone[id] = true; save(); render(); return; }
    if (act === 'tickMust') { const i = b.dataset.i; if (f.mustHaveDone[i]) delete f.mustHaveDone[i]; else f.mustHaveDone[i] = true; save(); render(); return; }
    if (act === 'saveScreening') { const i = b.dataset.i; const ta = rootEl.querySelector('textarea[data-i="' + esc(i) + '"]'); if (ta) { f.screeningAnswers[i] = ta.value; save(); const msg = document.getElementById('freelance-saved-' + i); if (msg) { msg.textContent = t('saved'); setTimeout(() => { msg.textContent = ''; }, 1500); } } return; }
  }
  function onChange(e) {
    const el = e.target;
    if (el.id === 'freelanceStart') { S().start = /^\d{4}-\d{2}-\d{2}$/.test(el.value) ? el.value : null; save(); render(); }
  }
  function onToggle(e) {
    const d = e.target;
    if (!d || !d.dataset || !d.dataset.week) return;
    if (d.open) openWeeks.add(d.dataset.week); else openWeeks.delete(d.dataset.week);
  }
  function onKey(e) {
    // Không có phím shortcut đặc biệt; để tránh xung đột với input.
  }

  App.registerView('freelance', {
    get title() { return App.t('freelance.title'); },
    render(root, params) {
      rootEl = root;
      S();
      render();
    },
  });
})();
