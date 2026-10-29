/* View "dashboard" — owner: task T09. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'dash.title': 'Tổng quan',
      'dash.heroTitle': 'Ôn luyện phỏng vấn Senior Java',
      'dash.heroText': 'Kế hoạch 6 tháng từ Java core đến system design, microservices và phỏng vấn tiếng Anh — ôn theo lặp lại ngắt quãng để câu nào cũng "đã thuộc" khi đi phỏng vấn thật.',
      'dash.mock': 'Phỏng vấn thử',
      'dash.flash': 'Ôn flashcard',
      'dash.bank': 'Ngân hàng câu hỏi',
      'dash.ringAria': 'Đã thuộc {p}%',
      'dash.ringLabel': 'đã thuộc',
      'dash.known': 'Đã thuộc',
      'dash.review': 'Cần ôn',
      'dash.unknown': 'Chưa biết',
      'dash.unseen': 'Chưa học',
      'dash.topicsTitle': 'Tiến độ theo chủ đề',
      'dash.noTopics': 'Chưa có chủ đề nào được đăng ký.',
      'dash.other': 'Khác',
      'dash.topicAria': '{name}: {p}% đã thuộc',
      'dash.questions': 'Câu hỏi',
      'dash.flashcard': 'Flashcard',
      'dash.quizCorrect': '{correct}/{total} đúng',
      'dash.score': 'điểm {score}',
      'dash.mockBadge': 'Phỏng vấn thử',
      'dash.quizBadge': 'Trắc nghiệm',
      'dash.questionCount': '{n} câu',
      'dash.planTitle': 'Kế hoạch hôm nay',
      'dash.streakTitle': 'Số ngày học liên tục',
      'dash.streakDays': '🔥 {n} ngày',
      'dash.dueStrong': ' câu/bài đến hạn ôn lại',
      'dash.dueExplain': 'Sau khi tự chấm, mỗi câu được lên lịch ôn lại: chấm “Chưa biết” sẽ quay lại ngày mai, “Cần ôn” sau 2+ ngày, “Đã thuộc” giãn dần 3 → 8 → 20+ ngày.',
      'dash.dueBreakdown': '{q} câu hỏi',
      'dash.dueBreakdownAlgo': ' · {a} bài thuật toán',
      'dash.reviewNow': 'Ôn ngay',
      'dash.noDue': 'Chưa có câu nào đến hạn ôn',
      'dash.suggest': 'Gợi ý: {link} đang ở mức thấp nhất ({known}/{total} đã thuộc).',
      'dash.startHint': 'Bắt đầu bằng cách đánh giá vài câu trong ngân hàng câu hỏi.',
      'dash.openBank': 'Mở ngân hàng câu hỏi',
      'dash.weekN': 'Tuần {n}',
      'dash.weekDone': ' · đã xong {done}/{total} việc',
      'dash.openRoadmap': 'Mở lộ trình',
      'dash.noRoadmap': 'Chưa bắt đầu lộ trình 6 tháng',
      'dash.noRoadmapHint': 'Chọn ngày bắt đầu để theo dõi tuần hiện tại và tiến độ từng giai đoạn.',
      'dash.startRoadmap': 'Bắt đầu lộ trình 6 tháng',
      'dash.actReview': '{n} câu đã ôn',
      'dash.actKnown': '{n} đã thuộc',
      'dash.actQuiz': '{n} bài trắc nghiệm',
      'dash.actMock': '{n} phiên phỏng vấn',
      'dash.actAlgo': '{n} bài thuật toán',
      'dash.actMinutes': '{n} phút',
      'dash.didToday': 'Hôm nay đã làm: {list}',
      'dash.noActivity': 'Hôm nay chưa có hoạt động nào. Bắt đầu bằng 5 câu ôn nhé!',
      'dash.historyTitle': 'Lịch sử gần đây',
      'dash.noHistory': 'Chưa có phiên trắc nghiệm hay phỏng vấn thử nào.',
      'dash.doQuiz': 'Làm một bài trắc nghiệm',
      'dash.planHeading': '🎯 Buổi phỏng vấn sắp tới',
      'dash.planSub': 'Lập kế hoạch ôn tập theo ngày phỏng vấn.',
      'dash.deletePlan': 'Xoá kế hoạch',
      'dash.date': 'Ngày phỏng vấn',
      'dash.company': 'Công ty',
      'dash.companyPlaceholder': 'Tên công ty (không bắt buộc)',
      'dash.round': 'Vòng',
      'dash.savePlan': 'Lưu kế hoạch',
      'dash.pastDays': 'Đã qua {n} ngày',
      'dash.today': 'Hôm nay',
      'dash.daysLeft': 'Còn {n} ngày',
      'dash.interviewPassed': 'Ngày phỏng vấn đã qua',
      'dash.perDay': '{n} câu chưa thuộc/ngày',
      'dash.priority': '3 chủ đề cần ưu tiên',
      'dash.unlearned': '{n} câu chưa thuộc',
      'dash.noTopicQuestions': 'Chưa có câu hỏi trong các chủ đề này.',
      'dash.lastDay': 'Checklist ngày cuối',
      'dash.lastDay1': 'Đọc lại STAR stories',
      'dash.lastDay2': 'Làm một phiên mock',
      'dash.lastDay3': 'Chuẩn bị 2–3 câu hỏi ngược cho interviewer',
      'dash.planPrompt': 'Chọn ngày để tính ngược số câu cần ôn mỗi ngày và các chủ đề ưu tiên.',
      'dash.todayTitle': 'Hôm nay học gì',
      'dash.todaySub': 'Kế hoạch 60–90 phút, giữ nguyên trong ngày để bạn không phải nghĩ xem học gì.',
      'dash.todayProgress': 'Đã xong {done}/{total} mục',
      'dash.todayProgressAria': 'Tiến độ hôm nay {p}%',
      'dash.todayMinutes': '≈ {m} phút',
      'dash.changePlan': 'Đổi kế hoạch',
      'dash.startStudy': '▶ Bắt đầu buổi học',
      'dash.pauseStudy': '⏸ Tạm dừng',
      'dash.resumeStudy': '▶ Tiếp tục',
      'dash.resetTimer': 'Đặt lại',
      'dash.pomoHint': 'Pomodoro 25 phút',
      'dash.pomoDone': 'Hết 25 phút — nghỉ 5 phút rồi làm tiếp nhé!',
      'dash.itemReview': 'Ôn đến hạn',
      'dash.itemReviewSub': '{n} câu đến hạn ôn lại',
      'dash.itemLesson': 'Bài học tiếp theo',
      'dash.itemAlgo': 'Một bài thuật toán',
      'dash.itemSpeak': 'Luyện nói 10 phút',
      'dash.itemSd': 'Một đề system design',
      'dash.itemMock': 'Phỏng vấn thử',
      'dash.weekend': 'Cuối tuần',
      'dash.duration': '≈ {n} phút',
      'dash.start': 'Bắt đầu',
      'dash.doneAria': 'Đánh dấu đã xong: {title}',
      'dash.allDone': 'Xong hết kế hoạch hôm nay! 🎉',
      'dash.emptyPlan': 'Chưa có dữ liệu để lập kế hoạch. Hãy thêm câu hỏi hoặc bài học.',
    },
    en: {
      'dash.title': 'Dashboard',
      'dash.heroTitle': 'Senior Java interview prep',
      'dash.heroText': 'A 6-month plan from Java core to system design, microservices and English interviews — spaced repetition makes every answer stick by the time you interview for real.',
      'dash.mock': 'Mock interview',
      'dash.flash': 'Review flashcards',
      'dash.bank': 'Question bank',
      'dash.ringAria': '{p}% known',
      'dash.ringLabel': 'known',
      'dash.known': 'Known',
      'dash.review': 'Review',
      'dash.unknown': 'Don’t know',
      'dash.unseen': 'Not studied',
      'dash.topicsTitle': 'Progress by topic',
      'dash.noTopics': 'No topics registered yet.',
      'dash.other': 'Other',
      'dash.topicAria': '{name}: {p}% known',
      'dash.questions': 'Questions',
      'dash.flashcard': 'Flashcards',
      'dash.quizCorrect': '{correct}/{total} correct',
      'dash.score': 'score {score}',
      'dash.mockBadge': 'Mock interview',
      'dash.quizBadge': 'Quiz',
      'dash.questionCount': '{n} questions',
      'dash.planTitle': 'Today’s plan',
      'dash.streakTitle': 'Consecutive study days',
      'dash.streakDays': '🔥 {n} days',
      'dash.dueStrong': ' questions and problems due for review',
      'dash.dueExplain': 'After you self-rate, each item is scheduled for review: “Don’t know” comes back tomorrow, “Review” after 2+ days, and “Known” stretches to 3 → 8 → 20+ days.',
      'dash.dueBreakdown': '{q} questions',
      'dash.dueBreakdownAlgo': ' · {a} algorithm problems',
      'dash.reviewNow': 'Review now',
      'dash.noDue': 'Nothing due for review',
      'dash.suggest': 'Tip: {link} is your weakest topic ({known}/{total} known).',
      'dash.startHint': 'Start by rating a few questions in the question bank.',
      'dash.openBank': 'Open question bank',
      'dash.weekN': 'Week {n}',
      'dash.weekDone': ' · {done}/{total} tasks done',
      'dash.openRoadmap': 'Open roadmap',
      'dash.noRoadmap': '6-month roadmap not started',
      'dash.noRoadmapHint': 'Pick a start date to track the current week and phase progress.',
      'dash.startRoadmap': 'Start the 6-month roadmap',
      'dash.actReview': '{n} reviewed',
      'dash.actKnown': '{n} known',
      'dash.actQuiz': '{n} quizzes',
      'dash.actMock': '{n} mock sessions',
      'dash.actAlgo': '{n} algorithm problems',
      'dash.actMinutes': '{n} minutes',
      'dash.didToday': 'Done today: {list}',
      'dash.noActivity': 'No activity today yet. Start with 5 review questions!',
      'dash.historyTitle': 'Recent history',
      'dash.noHistory': 'No quiz or mock sessions yet.',
      'dash.doQuiz': 'Take a quiz',
      'dash.planHeading': '🎯 Upcoming interview',
      'dash.planSub': 'Plan your prep around the interview date.',
      'dash.deletePlan': 'Delete plan',
      'dash.date': 'Interview date',
      'dash.company': 'Company',
      'dash.companyPlaceholder': 'Company name (optional)',
      'dash.round': 'Round',
      'dash.savePlan': 'Save plan',
      'dash.pastDays': '{n} days ago',
      'dash.today': 'Today',
      'dash.daysLeft': '{n} days left',
      'dash.interviewPassed': 'Interview date has passed',
      'dash.perDay': '{n} unlearned questions/day',
      'dash.priority': '3 priority topics',
      'dash.unlearned': '{n} unlearned questions',
      'dash.noTopicQuestions': 'No questions in these topics yet.',
      'dash.lastDay': 'Final-day checklist',
      'dash.lastDay1': 'Re-read your STAR stories',
      'dash.lastDay2': 'Do one mock session',
      'dash.lastDay3': 'Prepare 2–3 questions to ask the interviewer',
      'dash.planPrompt': 'Pick a date to work out how many questions to review per day and which topics to prioritise.',
      'dash.todayTitle': 'What to study today',
      'dash.todaySub': 'A 60–90 minute plan, fixed for the day so you never wonder what to study next.',
      'dash.todayProgress': '{done}/{total} done',
      'dash.todayProgressAria': 'Today’s progress {p}%',
      'dash.todayMinutes': '≈ {m} min',
      'dash.changePlan': 'Change plan',
      'dash.startStudy': '▶ Start study session',
      'dash.pauseStudy': '⏸ Pause',
      'dash.resumeStudy': '▶ Resume',
      'dash.resetTimer': 'Reset',
      'dash.pomoHint': '25-minute pomodoro',
      'dash.pomoDone': '25 minutes done — take a 5 minute break!',
      'dash.itemReview': 'Due review',
      'dash.itemReviewSub': '{n} questions due for review',
      'dash.itemLesson': 'Next lesson',
      'dash.itemAlgo': 'One algorithm problem',
      'dash.itemSpeak': '10 minutes of speaking',
      'dash.itemSd': 'One system design problem',
      'dash.itemMock': 'Mock interview',
      'dash.weekend': 'Weekend',
      'dash.duration': '≈ {n} min',
      'dash.start': 'Start',
      'dash.doneAria': 'Mark as done: {title}',
      'dash.allDone': 'Today’s plan is complete! 🎉',
      'dash.emptyPlan': 'No data to build a plan yet. Add questions or lessons.',
    },
  });

  const tr = (key, vars) => App.t('dash.' + key, vars);
  const DAY = 86400000;

  function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

  /** SVG ring showing % of questions marked "Đã thuộc". */
  function ring(percent) {
    const r = 52;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, percent));
    const off = c * (1 - p / 100);
    return '<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="' + App.esc(tr('ringAria', { p: p })) + '">' +
      '<circle class="ring-bg" cx="60" cy="60" r="' + r + '"></circle>' +
      '<circle class="ring-fg" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>' +
      '<text class="ring-val" x="60" y="58">' + p + '%</text>' +
      '<text class="ring-lbl" x="60" y="78">' + App.esc(tr('ringLabel')) + '</text>' +
      '</svg>';
  }

  function statTile(num, label, cls) {
    return '<div class="stat"><div class="num' + (cls ? ' ' + cls : '') + '">' + num + '</div>' +
      '<div class="lbl">' + App.esc(label) + '</div></div>';
  }

  /** Flatten ROADMAP phases into a list of weeks. */
  function allWeeks() {
    const rm = window.ROADMAP;
    if (!rm || !rm.phases) return [];
    const out = [];
    rm.phases.forEach(ph => (ph.weeks || []).forEach(w => out.push(Object.assign({ phase: ph.name }, w))));
    return out;
  }

  /** Parse roadmap.start (timestamp, numeric string or 'YYYY-MM-DD'). */
  function roadmapStart() {
    const rd = App.store.data.roadmap || {};
    const s = rd.start;
    if (s == null || s === '') return null;
    if (typeof s === 'number') return s;
    if (typeof s === 'string') {
      if (/^\d+$/.test(s)) return Number(s);
      const t = Date.parse(s);
      return isNaN(t) ? null : t;
    }
    return null;
  }

  /** Current week object based on roadmap.start, or null when the plan has not started. */
  function currentWeek() {
    const start = roadmapStart();
    if (!start) return null;
    const weeks = allWeeks();
    if (!weeks.length) return null;
    const diff = App.startOfDay(Date.now()) - App.startOfDay(start);
    let idx = Math.floor(diff / (7 * DAY)) + 1;
    idx = Math.max(1, Math.min(weeks.length, idx));
    return Object.assign({ index: idx, total: weeks.length }, weeks[idx - 1]);
  }

  /** Count of items due for review, split between questions and algo problems. */
  function dueList() {
    const items = App.dueItems();
    const q = items.filter(x => String(x.id).indexOf('algo-') !== 0);
    const a = items.filter(x => String(x.id).indexOf('algo-') === 0);
    return { total: items.length, q: q.length, a: a.length };
  }

  // ---------- "Hôm nay học gì" (T288) ----------
  const POMO_SECONDS = 25 * 60;
  const dayNumber = () => Math.floor(App.startOfDay(Date.now()) / DAY);
  const isWeekend = () => { const d = new Date().getDay(); return d === 0 || d === 6; };

  /** Current week number, defaulting to week 1 when the roadmap has not started. */
  function weekNumber() {
    const weeks = allWeeks();
    if (!weeks.length) return 1;
    const start = roadmapStart();
    if (!start) return 1;
    const diff = App.startOfDay(Date.now()) - App.startOfDay(start);
    return Math.max(1, Math.min(weeks.length, Math.floor(diff / (7 * DAY)) + 1));
  }

  /** First lesson not marked known, walking window.PATH order then the full lesson list. */
  function nextLesson() {
    const lessons = App.lite('lessons');
    const byId = {};
    lessons.forEach(l => { byId[l.id] = l; });
    const order = [], seen = {};
    const path = Array.isArray(window.PATH) ? window.PATH.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    path.forEach(st => (st.lessons || []).forEach(id => {
      if (!seen[id]) { seen[id] = 1; order.push(id); }
    }));
    lessons.forEach(l => { if (!seen[l.id]) { seen[l.id] = 1; order.push(l.id); } });
    for (let i = 0; i < order.length; i++) {
      const l = byId[order[i]];
      if (l && App.store.getStatus(l.id) !== 'known') return l;
    }
    return null;
  }

  /** Due algorithm first, otherwise an unsolved problem matching the current week's pattern. */
  function pickAlgo() {
    const algos = App.lite('algos');
    if (!algos.length) return null;
    const due = App.dueItems().filter(x => String(x.id).indexOf('algo-') === 0);
    if (due.length) {
      const a = algos.find(x => x.id === due[0].id);
      if (a) return a;
    }
    let pool = algos.filter(a => !App.store.getStatus(a.id));
    if (!pool.length) pool = algos.filter(a => App.store.getStatus(a.id) !== 'known');
    if (!pool.length) return null;
    const weeks = allWeeks();
    const raw = String((weeks[weekNumber() - 1] || {}).algo || '').toLowerCase();
    const stop = { bai: 1, on: 1, lai: 1, sai: 1, easy: 1, medium: 1, hard: 1, tron: 1, chon: 1, loc: 1 };
    const tokens = raw.split(/[^a-z0-9]+/).filter(t => t.length > 1 && !stop[t]);
    if (/\bdp\b/.test(raw)) tokens.push('dynamic');
    if (tokens.length) {
      const matched = pool.filter(a => tokens.some(t => String(a.pattern || '').toLowerCase().indexOf(t) >= 0));
      if (matched.length) pool = matched;
    }
    const level = /easy/.test(raw) ? 'easy' : /hard/.test(raw) ? 'hard' : /medium/.test(raw) ? 'medium' : null;
    if (level) {
      const matched = pool.filter(a => a.difficulty === level);
      if (matched.length) pool = matched;
    }
    return pool[0];
  }

  /** Rotate through system-design problems by day. */
  function pickSd() {
    const list = App.lite('sd').filter(x => x && x.id);
    return list.length ? list[dayNumber() % list.length] : null;
  }

  /** Speaking drill (prefer not-known), falling back to an English question in the bank. */
  function pickSpeak() {
    const drills = App.lite('drills').filter(d => d && d.id);
    if (drills.length) {
      const fresh = drills.filter(d => App.store.getStatus(d.id) !== 'known');
      const pool = fresh.length ? fresh : drills;
      return { kind: 'speak', drill: pool[dayNumber() % pool.length].id, minutes: 10 };
    }
    const q = App.lite('questions').find(x => x.lang === 'en');
    return q ? { kind: 'speak', q: q.id, minutes: 10 } : null;
  }

  /** Build today's item list from current progress + roadmap data. */
  function buildPlan() {
    const items = [];
    const dueQ = App.dueItems().filter(x => String(x.id).indexOf('algo-') !== 0).slice(0, 10);
    if (dueQ.length) items.push({ kind: 'review', ids: dueQ.map(x => x.id), minutes: 15 });

    const lesson = nextLesson();
    if (lesson) items.push({ kind: 'lesson', id: lesson.id, minutes: lesson.minutes || 25 });

    if (isWeekend()) {
      const sd = pickSd();
      if (sd) items.push({ kind: 'sd', id: sd.id, minutes: 45 });
      else items.push({ kind: 'mock', minutes: 30 });
    } else {
      const algo = pickAlgo();
      if (algo) items.push({ kind: 'algo', id: algo.id, minutes: 30 });
    }

    const speak = pickSpeak();
    if (speak) items.push(speak);
    return items;
  }

  /** Persist the plan once per day; `force` rebuilds it ("Đổi kế hoạch"). */
  function ensurePlan(force) {
    const data = App.store.data;
    const today = App.dayKey(Date.now());
    const old = data.todayPlan;
    if (!force && old && old.day === today && Array.isArray(old.items) && old.items.length) {
      if (!old.done || typeof old.done !== 'object') old.done = {};
      return old;
    }
    data.todayPlan = {
      day: today,
      items: buildPlan(),
      done: (old && old.day === today && old.done && typeof old.done === 'object') ? old.done : {},
    };
    App.store.save();
    return data.todayPlan;
  }

  function itemKey(it) {
    if (it.kind === 'review') return 'review:' + (it.ids || []).slice().sort().join(',');
    if (it.kind === 'speak') return 'speak:' + (it.drill || it.q || '');
    return it.kind + ':' + (it.id || '');
  }

  /** Resolve a stored item to display data; null means the underlying content is gone. */
  function planItemView(it) {
    if (!it || !it.kind) return null;
    if (it.kind === 'review') {
      const n = (it.ids || []).filter(id => App.lite('questions').some(q => q.id === id)).length;
      if (!n) return null;
      return { icon: '🔁', title: tr('itemReview'), sub: tr('itemReviewSub', { n: n }), href: '#/flash/due' };
    }
    if (it.kind === 'lesson') {
      const l = App.lite('lessons').find(x => x.id === it.id);
      if (!l) return null;
      const topic = App.topic(l.track);
      return {
        icon: '📘',
        title: l.title,
        sub: tr('itemLesson') + (topic && topic.name ? ' · ' + topic.name : ''),
        href: '#/learn/' + encodeURIComponent(l.id),
      };
    }
    if (it.kind === 'algo') {
      const a = App.lite('algos').find(x => x.id === it.id);
      if (!a) return null;
      return {
        icon: '🧩',
        title: a.title,
        sub: tr('itemAlgo') + (a.pattern ? ' · ' + a.pattern : ''),
        href: '#/algo/' + encodeURIComponent(a.id),
      };
    }
    if (it.kind === 'speak') {
      if (it.drill) {
        const drills = App.lite('drills');
        const d = drills.find(x => x.id === it.drill);
        if (!d) return null;
        const detail = d.kind === 'qa' ? d.q : d.kind === 'term' ? d.term + ' — ' + d.example : d.en;
        return { icon: '🎤', title: tr('itemSpeak'), sub: detail || '', lang: 'en', href: '#/speak' };
      }
      if (it.q) {
        const q = App.lite('questions').find(x => x.id === it.q);
        if (!q) return null;
        return { icon: '🎤', title: tr('itemSpeak'), sub: q.q, lang: 'en', href: '#/bank/english' };
      }
      return null;
    }
    if (it.kind === 'sd') {
      const list = App.lite('sd');
      const p = list.find(x => x.id === it.id);
      if (!p) return null;
      return { icon: '🏗️', title: p.title, sub: tr('itemSd'), href: '#/sd/' + encodeURIComponent(p.id) };
    }
    if (it.kind === 'mock') return { icon: '🎯', title: tr('itemMock'), sub: tr('weekend'), href: '#/mock' };
    return null;
  }

  function planItemHtml(it, v, tp) {
    const key = itemKey(it);
    const done = !!(tp.done && tp.done[key]);
    const aria = tr('doneAria', { title: v.title });
    return '<li class="today-item' + (done ? ' is-done' : '') + '">' +
      '<label class="today-check">' +
        '<input type="checkbox" data-plan-done="' + App.esc(key) + '"' + (done ? ' checked' : '') + ' aria-label="' + App.esc(aria) + '">' +
        '<span class="today-icon" aria-hidden="true">' + App.esc(v.icon) + '</span>' +
      '</label>' +
      '<div class="today-body">' +
        '<div class="today-item-head"><strong>' + App.esc(v.title) + '</strong>' +
          '<span class="badge">' + App.esc(tr('duration', { n: it.minutes || 0 })) + '</span></div>' +
        (v.sub ? '<div class="small muted"' + (v.lang ? ' lang="' + App.esc(v.lang) + '"' : '') + '>' + App.esc(v.sub) + '</div>' : '') +
      '</div>' +
      '<a class="btn primary sm" href="' + App.esc(v.href) + '">' + App.esc(tr('start')) + '</a>' +
    '</li>';
  }

  function fmtClock(sec) {
    const m = Math.floor(Math.max(0, sec) / 60);
    const s = Math.max(0, sec) % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function pomoLabel(pomo) {
    if (pomo.running) return tr('pauseStudy');
    if (pomo.left === POMO_SECONDS || pomo.left <= 0) return tr('startStudy');
    return tr('resumeStudy');
  }

  /** The "Hôm nay học gì" card; `pomo` holds the in-memory 25' timer state. */
  function todayStudyCard(pomo) {
    const tp = ensurePlan(false);
    const rows = (tp.items || []).map(it => ({ it: it, v: planItemView(it) })).filter(x => x.v);
    const total = rows.length;
    const doneCount = rows.filter(x => tp.done && tp.done[itemKey(x.it)]).length;
    const totalMin = rows.reduce((sum, x) => sum + (x.it.minutes || 0), 0);
    const doneMin = rows.reduce((sum, x) => sum + (tp.done && tp.done[itemKey(x.it)] ? (x.it.minutes || 0) : 0), 0);
    const p = totalMin ? Math.round((doneMin / totalMin) * 100) : 0;
    const list = total
      ? '<ul class="today-list">' + rows.map(x => planItemHtml(x.it, x.v, tp)).join('') + '</ul>'
      : '<div class="empty"><p>' + tr('emptyPlan') + '</p></div>';
    const allDone = total && doneCount === total ? '<p class="today-all-done">' + tr('allDone') + '</p>' : '';

    return '<section class="card today-card">' +
      '<div class="today-card-head">' +
        '<div><h2>' + tr('todayTitle') + '</h2><p class="muted small">' + tr('todaySub') + '</p></div>' +
        '<div class="today-actions">' +
          '<button type="button" class="btn sm" data-plan-change>' + tr('changePlan') + '</button>' +
          '<button type="button" class="btn primary sm" data-pomo-toggle>' + App.esc(pomoLabel(pomo)) + '</button>' +
        '</div>' +
      '</div>' +
      '<div class="today-progress">' +
        '<div class="today-progress-meta"><span>' + App.esc(tr('todayProgress', { done: doneCount, total: total })) + '</span>' +
          '<span>' + App.esc(tr('todayMinutes', { m: totalMin })) + '</span></div>' +
        '<div class="progress" role="progressbar" aria-label="' + App.esc(tr('todayProgressAria', { p: p })) + '" aria-valuenow="' + p + '" aria-valuemin="0" aria-valuemax="100">' +
          '<i class="ok" style="width:' + p + '%"></i>' +
        '</div>' +
      '</div>' +
      list + allDone +
      '<div class="today-timer">' +
        '<span class="today-timer-label">' + tr('pomoHint') + '</span>' +
        '<span class="today-timer-time" data-pomo-time>' + fmtClock(pomo.left) + '</span>' +
        '<button type="button" class="btn sm" data-pomo-reset>' + tr('resetTimer') + '</button>' +
        '<span class="today-timer-msg" data-pomo-msg hidden>' + tr('pomoDone') + '</span>' +
      '</div>' +
    '</section>';
  }

  /** Topic cards grouped by topic.group, each with known/total + progress bar. */
  function topicGroups() {
    const topics = App.topics();
    if (!topics.length) return '';
    const groups = [];
    const byName = {};
    topics.forEach(t => {
      const g = t.group || tr('other');
      if (!byName[g]) { byName[g] = { name: g, items: [] }; groups.push(byName[g]); }
      byName[g].items.push(t);
    });
    return groups.map(g => {
      const cards = g.items.map(t => {
        const s = App.stats(t.id);
        const p = pct(s.known, s.total);
        const barCls = s.total === 0 ? '' : (p >= 70 ? 'ok' : (p >= 30 ? 'warn' : 'bad'));
        return '<div class="topic-card">' +
          '<div class="topic-head">' +
            '<span class="topic-icon" aria-hidden="true">' + App.esc(t.icon || '•') + '</span>' +
            '<span class="topic-name">' + App.esc(t.name) + '</span>' +
            '<span class="badge' + (s.total ? '' : ' accent') + '">' + s.known + '/' + s.total + '</span>' +
          '</div>' +
          '<div class="progress" role="progressbar" aria-label="' + App.esc(tr('topicAria', { name: t.name, p: p })) + '" aria-valuenow="' + p + '" aria-valuemin="0" aria-valuemax="100">' +
            '<i class="' + barCls + '" style="width:' + p + '%"></i>' +
          '</div>' +
          '<div class="topic-links">' +
            '<a class="btn sm" href="#/bank/' + encodeURIComponent(t.id) + '">' + App.esc(tr('questions')) + '</a>' +
            '<a class="btn sm" href="#/flash/' + encodeURIComponent(t.id) + '">' + App.esc(tr('flashcard')) + '</a>' +
          '</div>' +
        '</div>';
      }).join('');
      return '<section class="group"><h3 class="group-title">' + App.esc(g.name) + '</h3><div class="topic-grid">' + cards + '</div></section>';
    }).join('');
  }

  /** Topic with the lowest known-ratio that still has questions (suggestion for today). */
  function weakestTopic() {
    let best = null;
    App.topics().forEach(t => {
      const s = App.stats(t.id);
      if (!s.total) return;
      const p = pct(s.known, s.total);
      if (!best || p < best.p) best = { t: t, p: p, s: s };
    });
    return best;
  }

  /** Recent activity from mock + quiz history, newest first. */
  function recentHistory() {
    const d = App.store.data;
    const rows = [];
    (d.mockHistory || []).forEach(h => rows.push({ kind: 'mock', at: h.at, h: h }));
    (d.quizHistory || []).forEach(h => rows.push({ kind: 'quiz', at: h.at, h: h }));
    rows.sort((a, b) => (b.at || 0) - (a.at || 0));
    return rows.slice(0, 5);
  }

  function historyRow(r) {
    const h = r.h || {};
    const total = h.total != null ? h.total : (h.questions != null ? h.questions : 0);
    let score = '';
    if (r.kind === 'quiz' && h.correct != null) score = tr('quizCorrect', { correct: h.correct, total: total });
    else if (r.kind === 'mock' && h.score != null) score = tr('score', { score: h.score });
    else if (h.score != null) score = tr('score', { score: h.score });
    return '<li class="hist-item">' +
      '<span class="badge ' + (r.kind === 'mock' ? 'accent' : 'info') + '">' + (r.kind === 'mock' ? tr('mockBadge') : tr('quizBadge')) + '</span>' +
      '<span class="hist-meta">' + App.esc(score || tr('questionCount', { n: total })) + '</span>' +
      '<span class="hist-date muted small">' + App.esc(App.fmtDate(r.at || Date.now())) + '</span>' +
    '</li>';
  }

  /** Today's plan card (due items + current roadmap week + today's activity). */
  function todayCard() {
    const due = dueList();
    const week = currentWeek();
    const day = App.store.day();
    const streak = App.store.streak();
    const done = (App.store.data.roadmap && App.store.data.roadmap.done) || {};

    let plan = '';
    if (due.total > 0) {
      plan += '<div class="plan-row">' +
        '<div class="plan-num">' + due.total + '</div>' +
        '<div class="plan-txt"><strong>' + tr('dueStrong') + '</strong>' +
          '<div class="small muted">' + tr('dueExplain') + '</div>' +
          '<div class="small muted">' + tr('dueBreakdown', { q: due.q }) + (due.a ? tr('dueBreakdownAlgo', { a: due.a }) : '') + '</div>' +
        '</div>' +
        '<a class="btn primary" href="#/flash/due">' + tr('reviewNow') + '</a>' +
      '</div>';
    } else {
      const w = weakestTopic();
      plan += '<div class="plan-row">' +
        '<div class="plan-num">0</div>' +
        '<div class="plan-txt"><strong>' + tr('noDue') + '</strong>' +
          '<div class="small muted">' + (w
            ? tr('suggest', { link: '<a href="#/bank/' + encodeURIComponent(w.t.id) + '">' + App.esc(w.t.name) + '</a>', known: w.s.known, total: w.s.total })
            : tr('startHint')) + '</div>' +
        '</div>' +
        '<a class="btn" href="#/bank">' + tr('openBank') + '</a>' +
      '</div>';
    }

    let weekPart = '';
    if (week) {
      const tasks = week.tasks || [];
      const doneCount = tasks.filter((_, i) => done[week.id + '-' + i]).length;
      weekPart += '<div class="plan-row">' +
        '<div class="plan-num">' + week.index + '<span class="plan-den">/' + week.total + '</span></div>' +
        '<div class="plan-txt"><strong>' + tr('weekN', { n: week.index }) + ': ' + App.esc(week.title) + '</strong>' +
          '<div class="small muted">' + App.esc(week.phase || '') + (tasks.length ? tr('weekDone', { done: doneCount, total: tasks.length }) : '') + '</div>' +
        '</div>' +
        '<a class="btn" href="#/roadmap">' + tr('openRoadmap') + '</a>' +
      '</div>';
    } else {
      weekPart += '<div class="plan-row">' +
        '<div class="plan-num">–</div>' +
        '<div class="plan-txt"><strong>' + tr('noRoadmap') + '</strong>' +
          '<div class="small muted">' + tr('noRoadmapHint') + '</div>' +
        '</div>' +
        '<a class="btn primary" href="#/roadmap">' + tr('startRoadmap') + '</a>' +
      '</div>';
    }

    const act = [
      day.review ? tr('actReview', { n: day.review }) : '',
      day.known ? tr('actKnown', { n: day.known }) : '',
      day.quiz ? tr('actQuiz', { n: day.quiz }) : '',
      day.mock ? tr('actMock', { n: day.mock }) : '',
      day.algo ? tr('actAlgo', { n: day.algo }) : '',
      day.minutes ? tr('actMinutes', { n: day.minutes }) : ''
    ].filter(Boolean);

    return '<section class="card plan-card">' +
      '<div class="plan-head"><h2>' + tr('planTitle') + '</h2>' +
        '<span class="streak" title="' + App.esc(tr('streakTitle')) + '">' + tr('streakDays', { n: streak }) + '</span></div>' +
      plan + weekPart +
      '<div class="plan-activity small muted">' +
        (act.length ? App.esc(tr('didToday', { list: act.join(' · ') })) : tr('noActivity')) +
      '</div>' +
    '</section>';
  }

  /** Recent mock + quiz history. */
  function historyCard() {
    const rows = recentHistory();
    if (!rows.length) {
      return '<section class="card"><h2>' + tr('historyTitle') + '</h2>' +
        '<div class="empty"><p>' + tr('noHistory') + '</p>' +
        '<p><a class="btn" href="#/quiz">' + tr('doQuiz') + '</a></p></div></section>';
    }
    return '<section class="card"><h2>' + tr('historyTitle') + '</h2>' +
      '<ul class="hist-list">' + rows.map(historyRow).join('') + '</ul></section>';
  }

  function localDateValue(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function interviewPlanCard() {
    const plan = App.store.data.interviewPlan || {};
    const companies = App.lite('companies');
    const company = companies.find(c => c.name === plan.company) || companies.find(c => c.id === plan.company);
    const focusIds = company && Array.isArray(company.focus) && company.focus.length
      ? company.focus.filter(id => App.topics().some(t => t.id === id))
      : App.topics().map(t => t.id);
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(plan.date || '');
    const parsedDate = dateMatch ? new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])) : null;
    const validDate = !!dateMatch && parsedDate.getFullYear() === Number(dateMatch[1]) &&
      parsedDate.getMonth() === Number(dateMatch[2]) - 1 && parsedDate.getDate() === Number(dateMatch[3]);
    const days = validDate ? Math.ceil((parsedDate.getTime() - new Date(localDateValue() + 'T00:00:00').getTime()) / DAY) : null;
    const totalUnlearned = focusIds.reduce((sum, id) => {
      const s = App.stats(id);
      return sum + s.total - s.known;
    }, 0);
    const daily = days == null ? null : Math.ceil(totalUnlearned / Math.max(1, days));
    const weakest = focusIds.map(id => {
      const t = App.topic(id), s = App.stats(id);
      return { t, s, ratio: s.total ? s.known / s.total : 1 };
    }).filter(x => x.s.total).sort((a, b) => a.ratio - b.ratio).slice(0, 3);
    const companyOptions = companies.map(c => '<option value="' + App.esc(c.name) + '"></option>').join('');
    const summary = validDate
      ? '<div class="interview-plan-summary"><div class="interview-count"><strong>' + (days < 0 ? tr('pastDays', { n: Math.abs(days) }) : days === 0 ? tr('today') : tr('daysLeft', { n: days })) + '</strong><span>' + (days < 0 ? tr('interviewPassed') : tr('perDay', { n: daily })) + '</span></div>' +
        '<div class="interview-plan-topics"><strong>' + tr('priority') + '</strong>' +
          (weakest.length ? '<ol>' + weakest.map(x => '<li><a href="#/flash/' + encodeURIComponent(x.t.id) + '">' + App.esc(x.t.name) + '</a><span>' + tr('unlearned', { n: x.s.total - x.s.known }) + '</span></li>').join('') + '</ol>' : '<p class="muted small">' + tr('noTopicQuestions') + '</p>') +
        '</div></div>' +
        '<div class="interview-last-day"><strong>' + tr('lastDay') + '</strong><ul><li><a href="#/career">' + tr('lastDay1') + '</a></li><li><a href="#/interview">' + tr('lastDay2') + '</a></li><li>' + tr('lastDay3') + '</li></ul></div>'
      : '<p class="muted small">' + tr('planPrompt') + '</p>';

    return '<section class="card interview-plan-card"><div class="interview-plan-head"><div><h2>' + tr('planHeading') + '</h2><p class="muted small">' + tr('planSub') + '</p></div>' +
      (plan.date || plan.company || plan.round ? '<button type="button" class="btn sm" data-interview-plan-delete>' + tr('deletePlan') + '</button>' : '') + '</div>' +
      '<form class="interview-plan-form" data-interview-plan-form>' +
        '<label>' + tr('date') + '<input class="input" type="date" name="date" required value="' + App.esc(plan.date || '') + '"></label>' +
        '<label>' + tr('company') + '<input class="input" type="text" name="company" list="interview-company-list" placeholder="' + App.esc(tr('companyPlaceholder')) + '" value="' + App.esc(plan.company || '') + '"><datalist id="interview-company-list">' + companyOptions + '</datalist></label>' +
        '<label>' + tr('round') + '<select class="select" name="round"><option value="HR"' + (plan.round === 'HR' ? ' selected' : '') + '>HR</option><option value="technical"' + (plan.round === 'technical' ? ' selected' : '') + '>Technical</option><option value="final"' + (plan.round === 'final' ? ' selected' : '') + '>Final</option></select></label>' +
        '<button type="submit" class="btn primary">' + tr('savePlan') + '</button>' +
      '</form>' + summary + '</section>';
  }

  App.registerView('dashboard', {
    get title() { return App.t('dash.title'); },
    render(root, params) {
      const st = App.stats();
      const knownPct = pct(st.known, st.total);

      const hero =
        '<section class="card hero">' +
          '<div class="hero-txt">' +
            '<h1>' + tr('heroTitle') + '</h1>' +
            '<p class="muted">' + tr('heroText') + '</p>' +
            '<div class="row hero-actions">' +
              '<a class="btn primary lg" href="#/mock">' + tr('mock') + '</a>' +
              '<a class="btn lg" href="#/flash">' + tr('flash') + '</a>' +
              '<a class="btn ghost" href="#/bank">' + tr('bank') + '</a>' +
            '</div>' +
          '</div>' +
          '<div class="hero-ring">' + ring(knownPct) + '</div>' +
        '</section>';

      const stats =
        '<section class="stat-grid">' +
          statTile(st.known, tr('known'), 'ok') +
          statTile(st.review, tr('review'), 'warn') +
          statTile(st.unknown, tr('unknown'), 'bad') +
          statTile(st.unseen, tr('unseen')) +
        '</section>';

      const topics = topicGroups();
      const topicsSection = topics
        ? '<section class="card"><h2>' + tr('topicsTitle') + '</h2>' + topics + '</section>'
        : '<section class="card"><h2>' + tr('topicsTitle') + '</h2><div class="empty"><p>' + tr('noTopics') + '</p></div></section>';

      const pomo = { left: POMO_SECONDS, id: null, running: false };

      root.innerHTML =
        todayStudyCard(pomo) +
        hero +
        interviewPlanCard() +
        todayCard() +
        stats +
        topicsSection +
        historyCard();

      function paintPomo() {
        const time = root.querySelector('[data-pomo-time]');
        if (time) time.textContent = fmtClock(pomo.left);
        const btn = root.querySelector('[data-pomo-toggle]');
        if (btn) btn.textContent = pomoLabel(pomo);
        const msg = root.querySelector('[data-pomo-msg]');
        if (msg) msg.hidden = pomo.left > 0;
      }

      function tick() {
        if (pomo.left <= 0) return;
        pomo.left -= 1;
        paintPomo();
        if (pomo.left <= 0 && pomo.running) {
          clearInterval(pomo.id);
          pomo.id = null;
          pomo.running = false;
          paintPomo();
        }
      }

      function togglePomo() {
        if (pomo.running) {
          clearInterval(pomo.id);
          pomo.id = null;
          pomo.running = false;
          paintPomo();
          return;
        }
        if (pomo.left <= 0) pomo.left = POMO_SECONDS;
        pomo.id = setInterval(tick, 1000);
        pomo.running = true;
        paintPomo();
      }

      function resetPomo() {
        if (pomo.running) { clearInterval(pomo.id); pomo.id = null; pomo.running = false; }
        pomo.left = POMO_SECONDS;
        paintPomo();
      }

      function refreshStudyCard() {
        const card = root.querySelector('.today-card');
        if (card) card.outerHTML = todayStudyCard(pomo);
        paintPomo();
      }

      const onSubmit = e => {
        const form = e.target.closest('[data-interview-plan-form]');
        if (!form) return;
        e.preventDefault();
        const values = new FormData(form);
        App.store.data.interviewPlan = {
          date: String(values.get('date') || ''),
          company: String(values.get('company') || '').trim(),
          round: String(values.get('round') || 'HR'),
          updatedAt: Date.now(),
        };
        App.store.save();
        const card = root.querySelector('.interview-plan-card');
        if (card) card.outerHTML = interviewPlanCard();
      };
      const onChange = e => {
        const cb = e.target.closest('[data-plan-done]');
        if (!cb) return;
        const tp = ensurePlan(false);
        const key = cb.getAttribute('data-plan-done');
        if (cb.checked) tp.done[key] = true; else delete tp.done[key];
        App.store.save();
        refreshStudyCard();
      };
      const onClick = e => {
        if (e.target.closest('[data-plan-change]')) {
          ensurePlan(true);
          refreshStudyCard();
          return;
        }
        if (e.target.closest('[data-pomo-toggle]')) { togglePomo(); return; }
        if (e.target.closest('[data-pomo-reset]')) { resetPomo(); return; }
        if (!e.target.closest('[data-interview-plan-delete]')) return;
        App.store.data.interviewPlan = { deleted: true, updatedAt: Date.now() };   // a marker, so sync doesn't bring it back
        App.store.save();
        const card = root.querySelector('.interview-plan-card');
        if (card) card.outerHTML = interviewPlanCard();
      };
      root.addEventListener('submit', onSubmit);
      root.addEventListener('change', onChange);
      root.addEventListener('click', onClick);
      paintPomo();
      return () => {
        if (pomo.running) { clearInterval(pomo.id); pomo.id = null; pomo.running = false; }
        root.removeEventListener('submit', onSubmit);
        root.removeEventListener('change', onChange);
        root.removeEventListener('click', onClick);
      };
    },
  });
})();
