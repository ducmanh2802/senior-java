/* View "roadmap" — owner: task T17. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'rm.title': 'Lộ trình 6 tháng',
      'rm.noStart': 'Lộ trình 26 tuần. Chọn ngày bắt đầu để hệ thống tính tuần hiện tại, hạn ôn tập và nhắc việc.',
      'rm.startDate': 'Ngày bắt đầu',
      'rm.startBtn': 'Bắt đầu lộ trình',
      'rm.weekOf': 'Tuần {w} / {total}',
      'rm.started': 'Bắt đầu {date}',
      'rm.daysLeftEnd': 'Còn {n} ngày tới mốc 6 tháng',
      'rm.timePassed': 'Đã trôi qua {p}% thời gian',
      'rm.changeStart': 'Đổi ngày bắt đầu',
      'rm.save': 'Lưu',
      'rm.cancel': 'Huỷ',
      'rm.dueQuestions': 'câu hỏi đến hạn ôn',
      'rm.dueAlgo': 'bài thuật toán đến hạn giải lại',
      'rm.dueNone': 'Không có gì đến hạn — hôm nay có thể học chủ đề mới.',
      'rm.reviewQuestions': 'Ôn câu hỏi',
      'rm.reviewAlgo': 'Giải lại bài',
      'rm.dueHint': '<b>Lặp lại ngắt quãng:</b> chấm <i>Chưa biết</i> thì câu quay lại <b>ngày mai</b>;\n      <i>Cần ôn</i> thì sau <b>2+ ngày</b>; <i>Đã thuộc</i> thì giãn dần <b>3 → 8 → 20+ ngày</b>.\n      Nhờ vậy câu chưa vững được lặp lại liên tục cho tới khi bạn nhớ lâu dài — đừng ngại chấm thẳng "Chưa biết".',
      'rm.stReviewed': 'Câu đã ôn', 'rm.stKnown': 'Đã thuộc', 'rm.stQuiz': 'Trắc nghiệm', 'rm.stMock': 'Phỏng vấn thử', 'rm.stAlgo': 'Bài thuật toán', 'rm.stMinutes': 'Phút học',
      'rm.streakLbl': 'ngày học liên tiếp',
      'rm.noCurrentWeek': 'Chưa có dữ liệu tuần hiện tại.',
      'rm.weekHeading': 'Tuần {n}',
      'rm.algoGoal': 'Mục tiêu thuật toán:',
      'rm.notYet': 'chưa đến',
      'rm.heatScore': '{n} điểm hoạt động',
      'rm.heatNone': 'chưa học',
      'rm.heatLess': 'Ít', 'rm.heatMore': 'Nhiều',
      'rm.heatHint': 'Điểm mỗi ngày = câu ôn + 3×trắc nghiệm + 5×phỏng vấn thử + 3×bài thuật toán.\n      Bấm hoặc Tab tới một ô để xem chi tiết ngày đó.',
      'rm.dReviewed': 'Câu ôn', 'rm.dAlgo': 'Thuật toán', 'rm.dMinutes': 'Phút',
      'rm.noNote': 'Chưa có ghi chú cho ngày này.',
      'rm.tdDate': 'Ngày', 'rm.tdReview': 'Ôn', 'rm.tdKnown': 'Thuộc', 'rm.tdNotes': 'Ghi chú',
      'rm.todayNote': 'Ghi chú hôm nay ({key})',
      'rm.notePlaceholder': 'Hôm nay ôn gì? Câu nào còn yếu? Việc gì đã xong?',
      'rm.saveNote': 'Lưu ghi chú',
      'rm.noteSaved': 'Đã lưu ghi chú ngày {key}',
      'rm.weekNo': 'Tuần {n}',
      'rm.badgeDebt': 'còn nợ',
      'rm.badgeDone': 'xong',
      'rm.phaseBadge': '{done}/{total} việc · {pct}%',
      'rm.projectFallback': 'Dự án',
      'rm.todayTitle': 'Hôm nay',
      'rm.curWeekSub': 'Việc của tuần hiện tại',
      'rm.doneTodaySub': 'Hôm nay đã làm',
      'rm.logTitle': 'Nhật ký học',
      'rm.recent14': '14 ngày gần nhất',
      'rm.planTitle': 'Lộ trình 26 tuần',
      'rm.targetsTitle': 'Mục tiêu & dự án',
    },
    en: {
      'rm.title': '6-month roadmap',
      'rm.noStart': 'A 26-week roadmap. Pick a start date so the app can compute the current week, review schedule and reminders.',
      'rm.startDate': 'Start date',
      'rm.startBtn': 'Start roadmap',
      'rm.weekOf': 'Week {w} / {total}',
      'rm.started': 'Started {date}',
      'rm.daysLeftEnd': '{n} days left to the 6-month mark',
      'rm.timePassed': '{p}% of the time has passed',
      'rm.changeStart': 'Change start date',
      'rm.save': 'Save',
      'rm.cancel': 'Cancel',
      'rm.dueQuestions': 'questions due for review',
      'rm.dueAlgo': 'algorithm problems due for another solve',
      'rm.dueNone': 'Nothing is due — you can learn a new topic today.',
      'rm.reviewQuestions': 'Review questions',
      'rm.reviewAlgo': 'Re-solve problems',
      'rm.dueHint': '<b>Spaced repetition:</b> rate an item <i>Don\'t know</i> and it comes back <b>tomorrow</b>;\n      <i>Review</i> returns after <b>2+ days</b>; <i>Known</i> stretches to <b>3 → 8 → 20+ days</b>.\n      Weak items keep coming back until they stick — don\'t hesitate to rate "Don\'t know".',
      'rm.stReviewed': 'Reviewed', 'rm.stKnown': 'Known', 'rm.stQuiz': 'Quizzes', 'rm.stMock': 'Mock sessions', 'rm.stAlgo': 'Algorithm problems', 'rm.stMinutes': 'Study minutes',
      'rm.streakLbl': 'days in a row',
      'rm.noCurrentWeek': 'No data for the current week yet.',
      'rm.weekHeading': 'Week {n}',
      'rm.algoGoal': 'Algorithm goal:',
      'rm.notYet': 'not yet',
      'rm.heatScore': '{n} activity points',
      'rm.heatNone': 'not studied',
      'rm.heatLess': 'Less', 'rm.heatMore': 'More',
      'rm.heatHint': 'Daily score = questions reviewed + 3×quizzes + 5×mock interviews + 3×algorithm problems.\n      Click or Tab to a cell to see that day\'s detail.',
      'rm.dReviewed': 'Reviewed', 'rm.dAlgo': 'Algorithms', 'rm.dMinutes': 'Minutes',
      'rm.noNote': 'No note for this day yet.',
      'rm.tdDate': 'Date', 'rm.tdReview': 'Review', 'rm.tdKnown': 'Known', 'rm.tdNotes': 'Notes',
      'rm.todayNote': 'Today\'s note ({key})',
      'rm.notePlaceholder': 'What did you study? Which questions are still weak? What got done?',
      'rm.saveNote': 'Save note',
      'rm.noteSaved': 'Note saved for {key}',
      'rm.weekNo': 'Week {n}',
      'rm.badgeDebt': 'behind',
      'rm.badgeDone': 'done',
      'rm.phaseBadge': '{done}/{total} tasks · {pct}%',
      'rm.projectFallback': 'Project',
      'rm.todayTitle': 'Today',
      'rm.curWeekSub': 'Current week tasks',
      'rm.doneTodaySub': 'Done today',
      'rm.logTitle': 'Study log',
      'rm.recent14': 'Last 14 days',
      'rm.planTitle': '26-week roadmap',
      'rm.targetsTitle': 'Goals & projects',
    },
  });

  const tr = (key, vars) => App.t('rm.' + key, vars);
  const TOTAL_WEEKS = 26;
  const WEEK_MS = 7 * App.DAY;
  const PLAN_MS = TOTAL_WEEKS * WEEK_MS;
  const WD = () => (App.lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']); // Chủ nhật → Thứ 7

  const RM = () => window.ROADMAP || { goal: '', targets: [], phases: [], project: null };
  const rm = () => App.store.data.roadmap || (App.store.data.roadmap = { start: null, done: {} });
  const daily = () => App.store.data.daily || (App.store.data.daily = {});
  const esc = s => App.esc(s);

  /** Flatten ROADMAP.phases → list of weeks (kèm tên giai đoạn). */
  function allWeeks() {
    const out = [];
    (RM().phases || []).forEach(p => (p.weeks || []).forEach(w => out.push(Object.assign({ phase: p.name }, w))));
    return out;
  }
  function weekById(id) { return allWeeks().find(w => w.id === id) || null; }

  /** Ngày bắt đầu (timestamp) — chấp nhận number, chuỗi số hoặc 'YYYY-MM-DD'. */
  function startTs() {
    const s = rm().start;
    if (s == null || s === '') return null;
    if (typeof s === 'number') return isNaN(s) ? null : s;
    if (typeof s === 'string') {
      if (/^\d+$/.test(s)) return Number(s);
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
      const t = Date.parse(s);
      return isNaN(t) ? null : t;
    }
    return null;
  }
  function todayStart() { return App.startOfDay(Date.now()); }

  /** Tuần hiện tại (1..26) tính từ ngày bắt đầu. */
  function currentWeek() {
    const s = startTs();
    if (!s) return 1;
    const w = Math.floor((todayStart() - App.startOfDay(s)) / WEEK_MS) + 1;
    return Math.min(TOTAL_WEEKS, Math.max(1, w));
  }
  function curWeekId() { return 'w' + String(currentWeek()).padStart(2, '0'); }

  function doneMap() { return rm().done || (rm().done = {}); }
  function isDone(key) { return !!doneMap()[key]; }
  function weekDoneCount(w) {
    return (w.tasks || []).reduce((n, _, i) => n + (isDone(w.id + '-' + i) ? 1 : 0), 0);
  }
  function weekPercent(w) {
    const total = (w.tasks || []).length;
    return total ? Math.round(weekDoneCount(w) * 100 / total) : 0;
  }
  function phaseStats(phase) {
    let done = 0, total = 0;
    (phase.weeks || []).forEach(w => {
      total += (w.tasks || []).length;
      done += weekDoneCount(w);
    });
    return { done, total, pct: total ? Math.round(done * 100 / total) : 0 };
  }

  function fmtDay(ts) {
    const d = new Date(ts);
    return App.lang === 'en'
      ? (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear()
      : d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  }
  /* ---------- header ---------- */
  function headerHtml() {
    const goal = RM().goal || '';
    const s = startTs();
    if (!s) {
      return `<section class="card rm-hero">
        <h1 class="rm-goal">${esc(goal)}</h1>
        <p class="muted">${esc(tr('noStart'))}</p>
        <form class="row rm-start" id="rmStartForm">
          <label class="field rm-date-field">
            <span>${esc(tr('startDate'))}</span>
            <input class="input" type="date" id="rmStartDate" value="${esc(App.dayKey(Date.now()))}" required>
          </label>
          <button class="btn primary" type="submit">${esc(tr('startBtn'))}</button>
        </form>
      </section>`;
    }
    const week = currentWeek();
    const end = App.startOfDay(s) + PLAN_MS;
    const daysLeft = Math.max(0, Math.ceil((end - todayStart()) / App.DAY));
    const pct = Math.min(100, Math.max(0, Math.round((todayStart() - App.startOfDay(s)) / PLAN_MS * 100)));
    return `<section class="card rm-hero">
      <h1 class="rm-goal">${esc(goal)}</h1>
      <div class="row rm-hero-meta">
        <span class="badge accent">${esc(tr('weekOf', { w: week, total: TOTAL_WEEKS }))}</span>
        <span class="badge">${esc(tr('started', { date: fmtDay(App.startOfDay(s)) }))}</span>
        <span class="badge ${daysLeft <= 14 ? 'warn' : 'info'}">${esc(tr('daysLeftEnd', { n: daysLeft }))}</span>
        <span class="badge">${esc(tr('timePassed', { p: pct }))}</span>
      </div>
      <div class="progress rm-hero-bar"><i class="accent" style="width:${pct}%"></i></div>
      <div class="row rm-hero-actions">
        <button class="btn sm" id="rmChangeStart" type="button">${esc(tr('changeStart'))}</button>
      </div>
      <form class="row rm-start" id="rmStartForm" hidden>
        <label class="field rm-date-field">
          <span>${esc(tr('startDate'))}</span>
          <input class="input" type="date" id="rmStartDate" value="${esc(App.dayKey(App.startOfDay(s)))}" required>
        </label>
        <button class="btn primary" type="submit">${esc(tr('save'))}</button>
        <button class="btn" id="rmCancelStart" type="button">${esc(tr('cancel'))}</button>
      </form>
    </section>`;
  }
  /* ---------- hôm nay ---------- */
  function dueHtml() {
    const due = App.dueItems();
    const q = due.filter(x => !/^algo-/.test(x.id));
    const a = due.filter(x => /^algo-/.test(x.id));
    const chips = [
      `<span class="rm-due-chip"><b>${q.length}</b> ${esc(tr('dueQuestions'))}</span>`,
      `<span class="rm-due-chip"><b>${a.length}</b> ${esc(tr('dueAlgo'))}</span>`,
    ];
    if (!due.length) {
      chips.push(`<span class="rm-due-chip rm-due-none">${esc(tr('dueNone'))}</span>`);
    }
    return `<div class="rm-due">${chips.join('')}</div>
      <div class="row">
        <a class="btn primary" href="#/flash/due">${esc(tr('reviewQuestions'))}</a>
        <a class="btn" href="#/algo">${esc(tr('reviewAlgo'))}</a>
      </div>
      <p class="rm-hint muted">${tr('dueHint')}</p>`;
  }

  function dayStatsHtml() {
    const d = App.store.day();
    const streak = App.store.streak();
    const rows = [
      [tr('stReviewed'), d.review || 0], [tr('stKnown'), d.known || 0], [tr('stQuiz'), d.quiz || 0],
      [tr('stMock'), d.mock || 0], [tr('stAlgo'), d.algo || 0], [tr('stMinutes'), d.minutes || 0],
    ];
    return `<div class="rm-stats">
      ${rows.map(r => `<div class="stat rm-stat"><div class="num">${r[1]}</div><div class="lbl">${esc(r[0])}</div></div>`).join('')}
      <div class="stat rm-stat rm-streak"><div class="num">🔥 ${streak}</div><div class="lbl">${esc(tr('streakLbl'))}</div></div>
    </div>`;
  }
  /* ---------- tuần hiện tại ---------- */
  function taskListHtml(w) {
    const items = (w.tasks || []).map((t, i) => {
      const key = w.id + '-' + i;
      const on = isDone(key);
      return `<li class="rm-task${on ? ' is-done' : ''}">
        <label><input type="checkbox" class="rm-check" data-key="${esc(key)}" data-week="${esc(w.id)}"${on ? ' checked' : ''}> <span>${esc(t)}</span></label>
      </li>`;
    }).join('');
    return `<ul class="rm-tasks">${items}</ul>`;
  }

  function topicChipsHtml(topics) {
    const list = (topics || []).map(id => {
      const t = App.topic(id);
      return `<a class="chip rm-topic" href="#/bank/${encodeURIComponent(id)}">${esc(t.icon)} ${esc(t.name)}</a>`;
    }).join('');
    return list ? `<div class="chips rm-topics">${list}</div>` : '';
  }

  function currentWeekHtml() {
    const w = weekById(curWeekId());
    if (!w) return '<p class="muted">' + esc(tr('noCurrentWeek')) + '</p>';
    const pct = weekPercent(w);
    return `<div class="rm-week-head">
        <h3>${esc(tr('weekHeading', { n: currentWeek() }))} — ${esc(w.title)}</h3>
        <span class="badge rm-week-badge ${pct === 100 ? 'ok' : 'accent'}">${pct}%</span>
      </div>
      ${topicChipsHtml(w.topics)}
      ${w.algo ? `<p class="rm-algo-goal"><b>${esc(tr('algoGoal'))}</b> ${esc(w.algo)}</p>` : ''}
      ${taskListHtml(w)}`;
  }
  /* ---------- heatmap ---------- */
  function dayScore(d) {
    return (d.review || 0) + 3 * (d.quiz || 0) + 5 * (d.mock || 0) + 3 * (d.algo || 0);
  }
  function heatLevel(score) {
    if (!score) return 0;
    if (score <= 3) return 1;
    if (score <= 8) return 2;
    if (score <= 15) return 3;
    return 4;
  }

  /** Lưới 26 tuần × 7 ngày. Có ngày bắt đầu → bắt đầu từ tuần bắt đầu; chưa có → 26 tuần gần nhất. */
  function heatmapHtml() {
    const end = todayStart();
    const s = startTs();
    let gridStart;
    if (s) {
      gridStart = App.startOfDay(s);
      gridStart -= new Date(gridStart).getDay() * App.DAY; // lùi về Chủ nhật
    } else {
      gridStart = end - new Date(end).getDay() * App.DAY; // Chủ nhật của tuần này
      gridStart -= (TOTAL_WEEKS - 1) * WEEK_MS;          // lùi 25 tuần
    }
    let cells = '';
    for (let c = 0; c < TOTAL_WEEKS; c++) {
      for (let r = 0; r < 7; r++) {
        const ts = gridStart + (c * 7 + r) * App.DAY;
        const key = App.dayKey(ts);
        const d = daily()[key] || {};
        const future = ts > end;
        const score = future ? 0 : dayScore(d);
        const lv = future ? 0 : heatLevel(score);
        const title = future
          ? fmtDay(ts) + ' — ' + tr('notYet')
          : fmtDay(ts) + ' — ' + (score ? tr('heatScore', { n: score }) : tr('heatNone'));
        cells += `<span class="rm-cell rm-lv${lv}${future ? ' rm-future' : ''}" data-day="${esc(key)}" title="${esc(title)}" tabindex="0" role="button" aria-label="${esc(title)}"></span>`;
      }
    }
    return `<div class="rm-heat-scroll"><div class="rm-heat">${cells}</div></div>
      <div class="rm-heat-legend">
        <span class="muted small">${esc(tr('heatLess'))}</span>
        <span class="rm-cell rm-lv0"></span><span class="rm-cell rm-lv1"></span>
        <span class="rm-cell rm-lv2"></span><span class="rm-cell rm-lv3"></span>
        <span class="rm-cell rm-lv4"></span>
        <span class="muted small">${esc(tr('heatMore'))}</span>
      </div>
      <p class="rm-hint muted">${tr('heatHint')}</p>`;
  }

  function dayDetailHtml(key) {
    const d = daily()[key] || {};
    const rows = [
      [tr('dReviewed'), d.review || 0], [tr('stKnown'), d.known || 0], [tr('stQuiz'), d.quiz || 0],
      [tr('stMock'), d.mock || 0], [tr('dAlgo'), d.algo || 0], [tr('dMinutes'), d.minutes || 0],
    ];
    const note = d.note
      ? `<p class="rm-day-note">${esc(d.note)}</p>`
      : `<p class="muted small">${esc(tr('noNote'))}</p>`;
    return `<div class="rm-day-detail" data-day="${esc(key)}">
      <h4>${esc(key)}</h4>
      <div class="rm-day-grid">${rows.map(r => `<div><b>${r[1]}</b> <span class="muted">${esc(r[0])}</span></div>`).join('')}</div>
      ${note}
    </div>`;
  }
  /* ---------- bảng 14 ngày gần nhất ---------- */
  function recentTableHtml() {
    let rows = '';
    for (let i = 0; i < 14; i++) {
      const ts = todayStart() - i * App.DAY;
      const key = App.dayKey(ts);
      const d = daily()[key] || {};
      const note = d.note ? `<div class="rm-note-cell">${esc(d.note)}</div>` : '';
      rows += `<tr>
        <td><b>${esc(fmtDay(ts))}</b> <span class="muted small">${esc(WD()[new Date(ts).getDay()])}</span></td>
        <td>${d.review || 0}</td>
        <td>${d.known || 0}</td>
        <td>${d.quiz || 0}</td>
        <td>${d.mock || 0}</td>
        <td>${d.algo || 0}</td>
        <td>${d.minutes || 0}</td>
        <td class="rm-note-col">${note}</td>
      </tr>`;
    }
    return `<div class="rm-table-scroll"><table class="rm-table">
      <thead><tr><th>${esc(tr('tdDate'))}</th><th>${esc(tr('tdReview'))}</th><th>${esc(tr('tdKnown'))}</th><th>Quiz</th><th>Mock</th><th>Algo</th><th>${esc(tr('dMinutes'))}</th><th>${esc(tr('tdNotes'))}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
  }

  function noteHtml() {
    const key = App.dayKey(Date.now());
    const d = daily()[key] || {};
    return `<form class="rm-note-form" id="rmNoteForm">
      <label class="field">
        <span>${esc(tr('todayNote', { key }))}</span>
        <textarea class="textarea" id="rmNote" name="note" placeholder="${esc(tr('notePlaceholder'))}">${esc(d.note || '')}</textarea>
      </label>
      <div class="row">
        <button class="btn primary" type="submit">${esc(tr('saveNote'))}</button>
        <span class="muted small" id="rmNoteSaved" role="status"></span>
      </div>
    </form>`;
  }
  /* ---------- lộ trình ---------- */
  function weeksHtml() {
    const curId = curWeekId();
    return (RM().phases || []).map(p => {
      const st = phaseStats(p);
      const weeks = (p.weeks || []).map(w => {
        const pct = weekPercent(w);
        const isCur = w.id === curId;
        const debt = !isCur && w.id < curId && pct < 100;
        return `<details class="rm-week${isCur ? ' rm-week-cur' : ''}" data-week="${esc(w.id)}"${isCur ? ' open' : ''}>
          <summary>
            <span class="rm-week-no">${esc(tr('weekNo', { n: w.id.replace(/^w/, '') }))}</span>
            <span class="rm-week-title">${esc(w.title)}</span>
            ${debt ? `<span class="badge warn">${esc(tr('badgeDebt'))}</span>` : ''}
            ${pct === 100 ? `<span class="badge ok">${esc(tr('badgeDone'))}</span>` : ''}
            <span class="badge rm-week-badge ${pct === 100 ? 'ok' : 'accent'}">${pct}%</span>
          </summary>
          <div class="rm-week-body">
            <div class="progress rm-week-bar"><i class="${pct === 100 ? 'ok' : 'accent'}" style="width:${pct}%"></i></div>
            ${topicChipsHtml(w.topics)}
            ${w.algo ? `<p class="rm-algo-goal"><b>${esc(tr('algoGoal'))}</b> ${esc(w.algo)}</p>` : ''}
            ${taskListHtml(w)}
          </div>
        </details>`;
      }).join('');
      return `<section class="rm-phase">
        <div class="rm-phase-head">
          <h3>${esc(p.name)}</h3>
          <span class="badge rm-phase-badge ${st.pct === 100 ? 'ok' : 'accent'}">${esc(tr('phaseBadge', { done: st.done, total: st.total, pct: st.pct }))}</span>
        </div>
        <div class="progress rm-phase-bar"><i class="${st.pct === 100 ? 'ok' : 'accent'}" style="width:${st.pct}%"></i></div>
        <div class="rm-weeks">${weeks}</div>
      </section>`;
    }).join('');
  }

  /* ---------- mục tiêu & dự án ---------- */
  function targetsHtml() {
    const items = (RM().targets || []).map(t => `<div class="card rm-target">
        <h4>${esc(t.name)}</h4>
        <p class="muted small">${esc(t.examples || '')}</p>
        <ul>${(t.focus || []).map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>`).join('');
    const p = RM().project;
    const proj = p ? `<div class="card rm-target rm-project">
        <h4>${esc(p.name || tr('projectFallback'))}</h4>
        <p>${esc(p.desc || '')}</p>
      </div>` : '';
    return `<div class="grid rm-targets">${items}${proj}</div>`;
  }
  /* ---------- cập nhật DOM sau khi đổi trạng thái ---------- */
  function syncChecks(root, key, checked) {
    root.querySelectorAll('input.rm-check[data-key="' + key + '"]').forEach(cb => { cb.checked = checked; });
    root.querySelectorAll('li.rm-task').forEach(li => {
      const cb = li.querySelector('input.rm-check');
      if (cb) li.classList.toggle('is-done', cb.checked);
    });
  }

  function refreshWeek(root, weekId) {
    const w = weekById(weekId);
    if (!w) return;
    const pct = weekPercent(w);
    const sec = root.querySelector('.rm-week[data-week="' + weekId + '"]');
    if (sec) {
      const badge = sec.querySelector('.rm-week-badge');
      if (badge) { badge.textContent = pct + '%'; badge.className = 'badge rm-week-badge ' + (pct === 100 ? 'ok' : 'accent'); }
      const bar = sec.querySelector('.rm-week-bar i');
      if (bar) { bar.style.width = pct + '%'; bar.className = pct === 100 ? 'ok' : 'accent'; }
    }
    const cur = root.querySelector('#rmCurWeek');
    if (cur) {
      const cwp = weekPercent(weekById(curWeekId()) || { tasks: [] });
      const badge = cur.querySelector('.rm-week-badge');
      if (badge) { badge.textContent = cwp + '%'; badge.className = 'badge rm-week-badge ' + (cwp === 100 ? 'ok' : 'accent'); }
    }
  }

  function refreshPhases(root) {
    const phases = RM().phases || [];
    root.querySelectorAll('.rm-phase').forEach((sec, i) => {
      const p = phases[i];
      if (!p) return;
      const st = phaseStats(p);
      const badge = sec.querySelector('.rm-phase-badge');
      if (badge) {
        badge.textContent = tr('phaseBadge', { done: st.done, total: st.total, pct: st.pct });
        badge.className = 'badge rm-phase-badge ' + (st.pct === 100 ? 'ok' : 'accent');
      }
      const bar = sec.querySelector('.rm-phase-bar i');
      if (bar) { bar.style.width = st.pct + '%'; bar.className = st.pct === 100 ? 'ok' : 'accent'; }
    });
  }

  function refreshNoteTable(root) {
    const key = App.dayKey(Date.now());
    const note = (daily()[key] || {}).note || '';
    const cell = root.querySelector('.rm-note-col');
    if (cell) cell.innerHTML = note ? '<div class="rm-note-cell">' + esc(note) + '</div>' : '';
  }
  function showDay(root, key) {
    const host = root.querySelector('#rmDayDetailHost');
    if (!host) return;
    host.innerHTML = dayDetailHtml(key);
    root.querySelectorAll('.rm-cell.sel').forEach(c => c.classList.remove('sel'));
    root.querySelectorAll('.rm-cell[data-day="' + key + '"]').forEach(c => c.classList.add('sel'));
  }

  /* ---------- event binding ---------- */
  function bindStart(root) {
    const startForm = root.querySelector('#rmStartForm');
    if (startForm) {
      startForm.addEventListener('submit', e => {
        e.preventDefault();
        const inp = root.querySelector('#rmStartDate');
        const v = inp ? inp.value : '';
        if (!v) return;
        const p = v.split('-');
        if (p.length !== 3) return;
        rm().start = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getTime();
        App.store.save();
        App.route();
      });
    }
    const changeBtn = root.querySelector('#rmChangeStart');
    const actions = root.querySelector('.rm-hero-actions');
    if (changeBtn && startForm) {
      changeBtn.addEventListener('click', () => {
        startForm.hidden = false;
        if (actions) actions.hidden = true;
        const inp = root.querySelector('#rmStartDate');
        if (inp) inp.focus();
      });
    }
    const cancelBtn = root.querySelector('#rmCancelStart');
    if (cancelBtn && startForm) {
      cancelBtn.addEventListener('click', () => {
        startForm.hidden = true;
        if (actions) actions.hidden = false;
      });
    }
  }

  function bindChecks(root) {
    root.querySelectorAll('input.rm-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const key = cb.getAttribute('data-key');
        if (!key) return;
        const d = doneMap();
        if (cb.checked) d[key] = true; else delete d[key];
        App.store.save();
        syncChecks(root, key, cb.checked);
        refreshWeek(root, cb.getAttribute('data-week'));
        refreshPhases(root);
      });
    });
  }
  function bindNote(root) {
    const noteForm = root.querySelector('#rmNoteForm');
    if (!noteForm) return;
    noteForm.addEventListener('submit', e => {
      e.preventDefault();
      const ta = root.querySelector('#rmNote');
      if (!ta) return;
      const key = App.dayKey(Date.now());
      const rec = daily()[key] || (daily()[key] = {});
      rec.note = ta.value;
      App.store.save();
      const saved = root.querySelector('#rmNoteSaved');
      if (saved) saved.textContent = tr('noteSaved', { key });
      refreshNoteTable(root);
    });
  }

  function bindHeatmap(root) {
    root.querySelectorAll('.rm-cell[data-day]').forEach(cell => {
      cell.addEventListener('click', () => showDay(root, cell.getAttribute('data-day')));
      cell.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showDay(root, cell.getAttribute('data-day'));
        }
      });
    });
  }

  /* ---------- render ---------- */
  App.registerView('roadmap', {
    get title() { return App.t('rm.title'); },
    render(root, params) {
      root.innerHTML = `
        ${headerHtml()}
        <div class="stack">
          <section class="card rm-today">
            <h2>${esc(tr('todayTitle'))}</h2>
            ${dueHtml()}
            <h3 class="rm-sub">${esc(tr('curWeekSub'))}</h3>
            <div id="rmCurWeek">${currentWeekHtml()}</div>
            <h3 class="rm-sub">${esc(tr('doneTodaySub'))}</h3>
            ${dayStatsHtml()}
          </section>
          <section class="card rm-log">
            <h2>${esc(tr('logTitle'))}</h2>
            ${heatmapHtml()}
            <div id="rmDayDetailHost">${dayDetailHtml(App.dayKey(Date.now()))}</div>
            ${noteHtml()}
            <h3 class="rm-sub">${esc(tr('recent14'))}</h3>
            ${recentTableHtml()}
          </section>
          <section class="rm-plan">
            <h2>${esc(tr('planTitle'))}</h2>
            <div class="rm-phases">${weeksHtml()}</div>
          </section>
          <section class="rm-targets-sec">
            <h2>${esc(tr('targetsTitle'))}</h2>
            ${targetsHtml()}
          </section>
        </div>`;

      bindStart(root);
      bindChecks(root);
      bindNote(root);
      bindHeatmap(root);
      return () => {};
    },
  });
})();
