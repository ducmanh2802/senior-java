/* View "dashboard" (#/) — minimal, motivating home: mission hero, 3 metrics, today's mission, quick start.
   Reads only the light index (App.lite / App.stats / App.dueItems), see docs/PERFORMANCE.md. */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'dash.title': 'Tổng quan',
      'dash.morning': 'Chào buổi sáng', 'dash.afternoon': 'Chào buổi chiều', 'dash.evening': 'Chào buổi tối',
      'dash.daysLeft': 'Còn {n} ngày tới buổi phỏng vấn',
      'dash.daysLeftAt': 'Còn {n} ngày tới buổi phỏng vấn {company}',
      'dash.today': 'Phỏng vấn hôm nay — bạn đã sẵn sàng! 💪',
      'dash.passed': 'Buổi phỏng vấn đã qua. Đặt mục tiêu mới nhé.',
      'dash.perDay': 'Mỗi ngày cần thuộc thêm ~{n} câu trong các chủ đề trọng tâm.',
      'dash.setDate': 'Bạn phỏng vấn ngày nào?',
      'dash.setDateHint': 'Đặt ngày để có đếm ngược và số câu cần ôn mỗi ngày.',
      'dash.date': 'Ngày phỏng vấn',
      'dash.company': 'Công ty (không bắt buộc)',
      'dash.save': 'Đặt mục tiêu',
      'dash.edit': 'Sửa',
      'dash.clear': 'Xoá',
      'dash.ready': 'sẵn sàng',
      'dash.readyAria': 'Mức sẵn sàng phỏng vấn {p}%',
      'dash.tier0': 'Khởi động', 'dash.tier1': 'Đang tăng tốc', 'dash.tier2': 'Vững Middle',
      'dash.tier3': 'Sẵn sàng Senior', 'dash.tier4': 'Offer-ready 🏆',
      'dash.nextTier': 'Thuộc thêm {n} câu để lên “{tier}”',
      'dash.streak': 'ngày liên tục',
      'dash.streakZero': 'Bắt đầu chuỗi hôm nay',
      'dash.minutes': 'phút hôm nay',
      'dash.goal': 'mục tiêu {n}',
      'dash.known': 'câu đã thuộc',
      'dash.knownToday': '+{n} hôm nay',
      'dash.missionTitle': 'Nhiệm vụ hôm nay',
      'dash.missionDone': 'Hoàn thành nhiệm vụ hôm nay! Chuỗi của bạn được giữ 🔥',
      'dash.missionProgress': '{done}/{total} · ≈ {m} phút',
      'dash.changePlan': 'Đổi',
      'dash.changePlanAria': 'Đổi kế hoạch hôm nay',
      'dash.emptyPlan': 'Chưa có dữ liệu để lập kế hoạch.',
      'dash.start': 'Bắt đầu',
      'dash.doneAria': 'Đánh dấu đã xong: {title}',
      'dash.cgTitle': 'Mục tiêu sự nghiệp', 'dash.cgSet': 'Đặt mục tiêu: vị trí bạn muốn và mức thu nhập (USD/giờ) nhắm tới.',
      'dash.cgRole': 'Vị trí mục tiêu (vd: Senior Java Backend, remote)', 'dash.cgNow': 'Rate hiện tại (USD/giờ)', 'dash.cgTarget': 'Rate mục tiêu (USD/giờ)',
      'dash.cgProgress': 'Đang ở ${now}/giờ · còn ${gap}/giờ nữa', 'dash.cgReached': 'Đã đạt mục tiêu ${target}/giờ 🎉 Đặt mục tiêu cao hơn?',
      'dash.cgMonthly': '≈ ${m}/tháng nếu bill 100 giờ', 'dash.cgPlan': 'Lộ trình: kỹ năng, tiếng Anh, tìm khách',
      'dash.secTitle': 'Hôm nay theo từng mảng',
      'dash.secLearn': 'Học', 'dash.secPractice': 'Luyện', 'dash.secInterview': 'Phỏng vấn', 'dash.secCareer': 'Sự nghiệp',
      'dash.secDue': '{n} câu đến hạn ôn', 'dash.secDueNone': 'Không có câu đến hạn', 'dash.secLesson': 'Bài tiếp theo: {t}',
      'dash.secAlgo': 'Bài gợi ý: {t}', 'dash.secQuiz': '{n} lượt trắc nghiệm 7 ngày qua', 'dash.secAlgoNone': 'Làm một đề trắc nghiệm',
      'dash.secMock': '{n} buổi phỏng vấn thử đã làm', 'dash.secSpeak': 'Luyện nói tiếng Anh 10 phút',
      'dash.secJobs': '{n} việc đang theo dõi · {a} đã nộp', 'dash.secJobsNone': 'Xem tin tuyển dụng hôm nay',
      'dash.secRemote': 'Freelance & remote: Upwork, tìm khách, giá',
      'dash.duration': '{n}′',
      'dash.pomoStart': '▶ 25 phút tập trung', 'dash.pomoPause': '⏸ Tạm dừng', 'dash.pomoResume': '▶ Tiếp tục',
      'dash.pomoReset': 'Đặt lại Pomodoro',
      'dash.pomoDone': 'Hết 25 phút — nghỉ 5 phút nhé!',
      'dash.itemReview': 'Ôn câu đến hạn', 'dash.itemReviewSub': '{n} câu cần nhắc lại hôm nay',
      'dash.itemLesson': 'Bài học tiếp theo', 'dash.itemAlgo': 'Một bài thuật toán',
      'dash.itemSpeak': 'Nói tiếng Anh 10 phút', 'dash.itemSd': 'Một đề system design',
      'dash.itemMock': 'Phỏng vấn thử', 'dash.weekend': 'Cuối tuần',
      'dash.quickTitle': 'Luyện nhanh',
      'dash.qDue': 'Ôn đến hạn', 'dash.qDueSub': '{n} câu', 'dash.qDueNone': 'Không có câu đến hạn',
      'dash.qInterview': 'Phỏng vấn AI', 'dash.qInterviewSub': 'Giọng nói, có chấm điểm',
      'dash.qSdlc': 'Mô phỏng SDLC', 'dash.qSdlcSub': 'Từ requirement tới sự cố',
      'dash.qRoadmap': 'Lộ trình', 'dash.qRoadmapSub': 'Tuần {n}/{total}', 'dash.qRoadmapStart': 'Chưa bắt đầu',
      'dash.weekTitle': '14 ngày gần nhất',
      'dash.dayAria': '{day}: {n} hoạt động',
      'dash.weakTitle': 'Lỗ hổng cần lấp',
      'dash.weakItem': '{known}/{total} đã thuộc',
      'dash.weakNone': 'Chưa có dữ liệu. Tự chấm vài câu trong ngân hàng để thấy điểm yếu.',
      'dash.quotes': [
        'Interviewer không chấm bạn biết bao nhiêu, mà chấm bạn hiểu sâu tới đâu.',
        'Mỗi câu bạn thuộc hôm nay là một câu không ai làm khó được bạn ngày phỏng vấn.',
        '30 phút mỗi ngày trong 60 ngày thắng một tuần học dồn.',
        'Senior không phải người không bao giờ sai, mà là người biết hệ thống hỏng thế nào.',
        'Nói thành tiếng câu trả lời: hiểu trong đầu và nói ra được là hai kỹ năng khác nhau.',
        'Thời layoff, công ty tuyển người gánh được việc ngay — hãy luyện kể impact bằng con số.',
        'AI viết được code. Thứ AI không thay được: giải thích vì sao và chịu trách nhiệm khi nó hỏng.',
        'Hôm nay mệt thì làm 1 mục thôi. Giữ chuỗi quan trọng hơn làm nhiều.',
        'Câu hỏi khó nhất trong phỏng vấn thường là “Tại sao?”. Ôn để trả lời được nó.',
        'Offer đến từ sự chuẩn bị lặp lại, không phải may mắn.',
      ],
    },
    en: {
      'dash.title': 'Home',
      'dash.morning': 'Good morning', 'dash.afternoon': 'Good afternoon', 'dash.evening': 'Good evening',
      'dash.daysLeft': '{n} days until your interview',
      'dash.daysLeftAt': '{n} days until your {company} interview',
      'dash.today': 'Interview day — you are ready! 💪',
      'dash.passed': 'Your interview date has passed. Set a new goal.',
      'dash.perDay': 'Learn ~{n} more questions a day in your focus topics.',
      'dash.setDate': 'When is your interview?',
      'dash.setDateHint': 'Set a date to get a countdown and a daily target.',
      'dash.date': 'Interview date',
      'dash.company': 'Company (optional)',
      'dash.save': 'Set goal',
      'dash.edit': 'Edit',
      'dash.clear': 'Clear',
      'dash.ready': 'ready',
      'dash.readyAria': 'Interview readiness {p}%',
      'dash.tier0': 'Warming up', 'dash.tier1': 'Picking up speed', 'dash.tier2': 'Solid mid-level',
      'dash.tier3': 'Senior-ready', 'dash.tier4': 'Offer-ready 🏆',
      'dash.nextTier': 'Learn {n} more questions to reach “{tier}”',
      'dash.streak': 'day streak',
      'dash.streakZero': 'Start your streak today',
      'dash.minutes': 'minutes today',
      'dash.goal': 'goal {n}',
      'dash.known': 'questions known',
      'dash.knownToday': '+{n} today',
      'dash.missionTitle': 'Today’s mission',
      'dash.missionDone': 'Mission complete! Your streak is safe 🔥',
      'dash.missionProgress': '{done}/{total} · ≈ {m} min',
      'dash.changePlan': 'Shuffle',
      'dash.changePlanAria': 'Change today’s plan',
      'dash.emptyPlan': 'Not enough data to build a plan yet.',
      'dash.start': 'Start',
      'dash.doneAria': 'Mark as done: {title}',
      'dash.cgTitle': 'Career goal', 'dash.cgSet': 'Set your goal: the role you want and the income (USD/hour) you aim for.',
      'dash.cgRole': 'Target role (e.g. Senior Java Backend, remote)', 'dash.cgNow': 'Current rate (USD/hour)', 'dash.cgTarget': 'Target rate (USD/hour)',
      'dash.cgProgress': 'Now ${now}/hour · ${gap}/hour to go', 'dash.cgReached': 'Target ${target}/hour reached 🎉 Aim higher?',
      'dash.cgMonthly': '≈ ${m}/month at 100 billed hours', 'dash.cgPlan': 'Plan: skills, English, finding clients',
      'dash.secTitle': 'Today, area by area',
      'dash.secLearn': 'Learn', 'dash.secPractice': 'Practice', 'dash.secInterview': 'Interview', 'dash.secCareer': 'Career',
      'dash.secDue': '{n} questions due', 'dash.secDueNone': 'Nothing due', 'dash.secLesson': 'Next lesson: {t}',
      'dash.secAlgo': 'Suggested: {t}', 'dash.secQuiz': '{n} quiz runs in the last 7 days', 'dash.secAlgoNone': 'Take a quiz',
      'dash.secMock': '{n} mock interviews done', 'dash.secSpeak': 'Speak English for 10 minutes',
      'dash.secJobs': '{n} jobs followed · {a} applied', 'dash.secJobsNone': 'See today’s job digest',
      'dash.secRemote': 'Freelance & remote: Upwork, clients, pricing',
      'dash.duration': '{n}′',
      'dash.pomoStart': '▶ 25-min focus', 'dash.pomoPause': '⏸ Pause', 'dash.pomoResume': '▶ Resume',
      'dash.pomoReset': 'Reset Pomodoro',
      'dash.pomoDone': '25 minutes done — take a 5-minute break!',
      'dash.itemReview': 'Review due questions', 'dash.itemReviewSub': '{n} questions to recall today',
      'dash.itemLesson': 'Next lesson', 'dash.itemAlgo': 'One algorithm problem',
      'dash.itemSpeak': 'Speak English for 10 min', 'dash.itemSd': 'One system design problem',
      'dash.itemMock': 'Mock interview', 'dash.weekend': 'Weekend',
      'dash.quickTitle': 'Quick practice',
      'dash.qDue': 'Due reviews', 'dash.qDueSub': '{n} questions', 'dash.qDueNone': 'Nothing due',
      'dash.qInterview': 'AI interview', 'dash.qInterviewSub': 'Voice, with scoring',
      'dash.qSdlc': 'SDLC simulation', 'dash.qSdlcSub': 'From requirement to incident',
      'dash.qRoadmap': 'Roadmap', 'dash.qRoadmapSub': 'Week {n}/{total}', 'dash.qRoadmapStart': 'Not started',
      'dash.weekTitle': 'Last 14 days',
      'dash.dayAria': '{day}: {n} activities',
      'dash.weakTitle': 'Gaps to close',
      'dash.weakItem': '{known}/{total} known',
      'dash.weakNone': 'No data yet. Self-grade a few questions in the bank to see your gaps.',
      'dash.quotes': [
        'Interviewers do not score how much you know, but how deeply you understand it.',
        'Every question you master today is one nobody can trip you up on later.',
        '30 minutes a day for 60 days beats one week of cramming.',
        'A senior is not someone who is never wrong, but someone who knows how systems fail.',
        'Say your answers out loud: understanding and explaining are two different skills.',
        'In a layoff market, companies hire people who deliver from day one — practise telling impact in numbers.',
        'AI can write code. It cannot explain why, or own it when it breaks.',
        'Tired today? Do just one item. Keeping the streak beats doing a lot.',
        'The hardest interview question is usually “Why?”. Study to answer it.',
        'Offers come from repeated preparation, not luck.',
      ],
    },
  });

  const tr = (key, vars) => App.t('dash.' + key, vars);
  const DAY = 86400000;
  const GOAL_MIN = 60;
  const TIERS = [0, 10, 30, 55, 80];   // readiness % thresholds for tier0..tier4
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const dayNumber = () => Math.floor(App.startOfDay(Date.now()) / DAY);
  const isWeekend = () => { const d = new Date().getDay(); return d === 0 || d === 6; };

  // ---------- roadmap helpers ----------
  function allWeeks() {
    const rm = window.ROADMAP;
    if (!rm || !rm.phases) return [];
    const out = [];
    rm.phases.forEach(ph => (ph.weeks || []).forEach(w => out.push(Object.assign({ phase: ph.name }, w))));
    return out;
  }
  function roadmapStart() {
    const s = (App.store.data.roadmap || {}).start;
    if (s == null || s === '') return null;
    if (typeof s === 'number') return s;
    if (typeof s === 'string') { if (/^\d+$/.test(s)) return Number(s); const t = Date.parse(s); return isNaN(t) ? null : t; }
    return null;
  }
  function weekNumber() {
    const weeks = allWeeks(), start = roadmapStart();
    if (!weeks.length || !start) return 1;
    return Math.max(1, Math.min(weeks.length, Math.floor((App.startOfDay(Date.now()) - App.startOfDay(start)) / (7 * DAY)) + 1));
  }

  // ---------- today's plan (persisted once per day) ----------
  function nextLesson() {
    const lessons = App.lite('lessons'), byId = {}, order = [], seen = {};
    lessons.forEach(l => { byId[l.id] = l; });
    const path = Array.isArray(window.PATH) ? window.PATH.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    path.forEach(st => (st.lessons || []).forEach(id => { if (!seen[id]) { seen[id] = 1; order.push(id); } }));
    lessons.forEach(l => { if (!seen[l.id]) { seen[l.id] = 1; order.push(l.id); } });
    for (const id of order) { const l = byId[id]; if (l && App.store.getStatus(l.id) !== 'known') return l; }
    return null;
  }
  function pickAlgo() {
    const algos = App.lite('algos');
    if (!algos.length) return null;
    const due = App.dueItems().filter(x => String(x.id).indexOf('algo-') === 0);
    if (due.length) { const a = algos.find(x => x.id === due[0].id); if (a) return a; }
    let pool = algos.filter(a => !App.store.getStatus(a.id));
    if (!pool.length) pool = algos.filter(a => App.store.getStatus(a.id) !== 'known');
    if (!pool.length) return null;
    const raw = String((allWeeks()[weekNumber() - 1] || {}).algo || '').toLowerCase();
    const stop = { bai: 1, on: 1, lai: 1, sai: 1, easy: 1, medium: 1, hard: 1, tron: 1, chon: 1, loc: 1 };
    const tokens = raw.split(/[^a-z0-9]+/).filter(t => t.length > 1 && !stop[t]);
    if (/\bdp\b/.test(raw)) tokens.push('dynamic');
    if (tokens.length) { const m = pool.filter(a => tokens.some(t => String(a.pattern || '').toLowerCase().indexOf(t) >= 0)); if (m.length) pool = m; }
    const level = /easy/.test(raw) ? 'easy' : /hard/.test(raw) ? 'hard' : /medium/.test(raw) ? 'medium' : null;
    if (level) { const m = pool.filter(a => a.difficulty === level); if (m.length) pool = m; }
    return pool[0];
  }
  function pickSd() {
    const list = App.lite('sd').filter(x => x && x.id);
    return list.length ? list[dayNumber() % list.length] : null;
  }
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
  function buildPlan() {
    const items = [];
    const dueQ = App.dueItems().filter(x => String(x.id).indexOf('algo-') !== 0).slice(0, 10);
    if (dueQ.length) items.push({ kind: 'review', ids: dueQ.map(x => x.id), minutes: 15 });
    const lesson = nextLesson();
    if (lesson) items.push({ kind: 'lesson', id: lesson.id, minutes: lesson.minutes || 25 });
    if (isWeekend()) {
      const sd = pickSd();
      items.push(sd ? { kind: 'sd', id: sd.id, minutes: 45 } : { kind: 'mock', minutes: 30 });
    } else {
      const algo = pickAlgo();
      if (algo) items.push({ kind: 'algo', id: algo.id, minutes: 30 });
    }
    const speak = pickSpeak();
    if (speak) items.push(speak);
    return items;
  }
  function ensurePlan(force) {
    const data = App.store.data, today = App.dayKey(Date.now()), old = data.todayPlan;
    if (!force && old && old.day === today && Array.isArray(old.items) && old.items.length) {
      if (!old.done || typeof old.done !== 'object') old.done = {};
      return old;
    }
    data.todayPlan = { day: today, items: buildPlan(), done: (old && old.day === today && old.done && typeof old.done === 'object') ? old.done : {} };
    App.store.save();
    return data.todayPlan;
  }
  function itemKey(it) {
    if (it.kind === 'review') return 'review:' + (it.ids || []).slice().sort().join(',');
    if (it.kind === 'speak') return 'speak:' + (it.drill || it.q || '');
    return it.kind + ':' + (it.id || '');
  }
  function planItemView(it) {
    if (!it || !it.kind) return null;
    if (it.kind === 'review') {
      const n = (it.ids || []).filter(id => App.lite('questions').some(q => q.id === id)).length;
      return n ? { icon: '🔁', title: tr('itemReview'), sub: tr('itemReviewSub', { n }), href: '#/flash/due' } : null;
    }
    if (it.kind === 'lesson') {
      const l = App.lite('lessons').find(x => x.id === it.id);
      if (!l) return null;
      const topic = App.topic(l.track);
      return { icon: '📘', title: l.title, sub: tr('itemLesson') + (topic && topic.name ? ' · ' + topic.name : ''), href: '#/learn/' + encodeURIComponent(l.id) };
    }
    if (it.kind === 'algo') {
      const a = App.lite('algos').find(x => x.id === it.id);
      return a ? { icon: '🧩', title: a.title, sub: tr('itemAlgo') + (a.pattern ? ' · ' + a.pattern : ''), href: '#/algo/' + encodeURIComponent(a.id) } : null;
    }
    if (it.kind === 'speak') {
      if (it.drill) {
        const d = App.lite('drills').find(x => x.id === it.drill);
        if (!d) return null;
        const detail = d.kind === 'qa' ? d.q : d.kind === 'term' ? d.term + ' — ' + d.example : d.en;
        return { icon: '🎤', title: tr('itemSpeak'), sub: detail || '', lang: 'en', href: '#/speak' };
      }
      const q = it.q && App.lite('questions').find(x => x.id === it.q);
      return q ? { icon: '🎤', title: tr('itemSpeak'), sub: q.q, lang: 'en', href: '#/bank/english' } : null;
    }
    if (it.kind === 'sd') {
      const p = App.lite('sd').find(x => x.id === it.id);
      return p ? { icon: '🏗️', title: p.title, sub: tr('itemSd'), href: '#/sd/' + encodeURIComponent(p.id) } : null;
    }
    if (it.kind === 'mock') return { icon: '🎯', title: tr('itemMock'), sub: tr('weekend'), href: '#/mock' };
    return null;
  }

  // ---------- interview goal ----------
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.getMonth() === Number(m[2]) - 1 ? d : null;
  }
  function goal() {
    const plan = App.store.data.interviewPlan || {};
    if (plan.deleted) return null;
    const d = parseDate(plan.date);
    if (!d) return null;
    const days = Math.round((d.getTime() - App.startOfDay(Date.now())) / DAY);
    const companies = App.lite('companies');
    const company = companies.find(c => c.name === plan.company) || companies.find(c => c.id === plan.company);
    const focus = company && Array.isArray(company.focus) && company.focus.length ? company.focus : App.topics().map(t => t.id);
    const left = focus.reduce((n, id) => { const s = App.stats(id); return n + Math.max(0, s.total - s.known); }, 0);
    return { plan, days, perDay: days > 0 ? Math.ceil(left / days) : 0 };
  }

  // ---------- pieces ----------
  function ring(p) {
    const r = 52, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, p)) / 100);
    return '<svg class="db-ring" viewBox="0 0 120 120" role="img" aria-label="' + App.esc(tr('readyAria', { p })) + '">' +
      '<defs><linearGradient id="dbRingGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="db-stop-a"/><stop offset="1" class="db-stop-b"/></linearGradient></defs>' +
      '<circle class="db-ring-bg" cx="60" cy="60" r="' + r + '"/>' +
      '<circle class="db-ring-fg" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/>' +
      '<text class="db-ring-val" x="60" y="60">' + p + '%</text><text class="db-ring-lbl" x="60" y="80">' + App.esc(tr('ready')) + '</text></svg>';
  }

  /** Decorative illustration (inline SVG, colours from CSS tokens so it follows light/dark). */
  function heroArt() {
    return '<svg class="db-art" viewBox="0 0 260 210" aria-hidden="true" focusable="false">' +
      '<path class="il-blob" d="M44 58C70 14 150 4 196 34s56 98 22 138-122 44-162 18S18 102 44 58z"/>' +
      '<g class="il-float">' +
        '<rect class="il-card" x="38" y="52" width="160" height="112" rx="14"/>' +
        '<rect class="il-bar" x="38" y="52" width="160" height="24" rx="14"/><rect class="il-bar" x="38" y="64" width="160" height="12"/>' +
        '<circle class="il-dot-r" cx="54" cy="64" r="4"/><circle class="il-dot-y" cx="67" cy="64" r="4"/><circle class="il-dot-g" cx="80" cy="64" r="4"/>' +
        '<rect class="il-code-a" x="54" y="90" width="58" height="7" rx="3.5"/><rect class="il-code-m" x="118" y="90" width="40" height="7" rx="3.5"/>' +
        '<rect class="il-code-m" x="66" y="104" width="34" height="7" rx="3.5"/><rect class="il-code-b" x="106" y="104" width="64" height="7" rx="3.5"/>' +
        '<rect class="il-code-m" x="66" y="118" width="76" height="7" rx="3.5"/>' +
        '<rect class="il-code-a" x="54" y="132" width="28" height="7" rx="3.5"/><rect class="il-code-m" x="88" y="132" width="50" height="7" rx="3.5"/>' +
        '<rect class="il-cursor" x="144" y="131" width="3" height="10" rx="1.5"/>' +
      '</g>' +
      '<g class="il-float il-d1">' +
        '<rect class="il-bubble" x="160" y="14" width="78" height="42" rx="14"/><path class="il-bubble" d="M178 54l-6 14 18-14z"/>' +
        '<text class="il-bubble-txt" x="199" y="41">Why?</text>' +
      '</g>' +
      '<g class="il-float il-d2"><circle class="il-ok" cx="42" cy="164" r="20"/><path class="il-tick" d="M33 164l6 6 12-13"/></g>' +
      '<g class="il-float il-d3"><circle class="il-ring" cx="218" cy="150" r="16"/><path class="il-tick-a" d="M218 140v10l7 5"/></g>' +
      '<path class="il-spark" d="M120 22l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/>' +
      '<path class="il-spark il-s2" d="M236 92l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>' +
      '<path class="il-spark il-s3" d="M18 104l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>' +
    '</svg>';
  }

  function heroHtml(st, editing) {
    const h = new Date().getHours();
    const hello = h < 11 ? tr('morning') : h < 18 ? tr('afternoon') : tr('evening');
    const quotes = App.t('dash.quotes');
    const quote = Array.isArray(quotes) ? quotes[dayNumber() % quotes.length] : '';
    const readiness = pct(st.known, st.total);
    let tier = 0;
    TIERS.forEach((v, i) => { if (readiness >= v) tier = i; });
    const next = tier < TIERS.length - 1 ? Math.max(1, Math.ceil(TIERS[tier + 1] / 100 * st.total) - st.known) : 0;
    const g = goal();
    let goalHtml;
    if (g && !editing) {
      const msg = g.days > 0
        ? (g.plan.company ? tr('daysLeftAt', { n: g.days, company: App.esc(g.plan.company) }) : tr('daysLeft', { n: g.days }))
        : g.days === 0 ? tr('today') : tr('passed');
      goalHtml = '<div class="db-goal"><span class="db-goal-num" aria-hidden="true">' + (g.days > 0 ? g.days : '🎯') + '</span>' +
        '<div><b>' + msg + '</b>' + (g.days > 0 ? '<div class="db-dim small">' + tr('perDay', { n: g.perDay }) + '</div>' : '') + '</div>' +
        '<button type="button" class="btn ghost sm" data-goal-edit>' + tr('edit') + '</button></div>';
    } else {
      const p = App.store.data.interviewPlan || {};
      const opts = App.lite('companies').map(c => '<option value="' + App.esc(c.name) + '"></option>').join('');
      goalHtml = '<form class="db-goal-form" data-goal-form>' +
        '<div class="db-goal-q"><b>' + tr('setDate') + '</b><span class="db-dim small">' + tr('setDateHint') + '</span></div>' +
        '<input class="input" type="date" name="date" required aria-label="' + App.esc(tr('date')) + '" value="' + App.esc(p.deleted ? '' : p.date || '') + '">' +
        '<input class="input" type="text" name="company" list="db-companies" placeholder="' + App.esc(tr('company')) + '" aria-label="' + App.esc(tr('company')) + '" value="' + App.esc(p.deleted ? '' : p.company || '') + '">' +
        '<datalist id="db-companies">' + opts + '</datalist>' +
        '<button type="submit" class="btn primary sm">' + tr('save') + '</button>' +
        (g ? '<button type="button" class="btn ghost sm" data-goal-clear>' + tr('clear') + '</button>' : '') +
      '</form>';
    }
    return '<section class="db-hero">' +
      '<div class="db-hero-main">' +
        '<p class="db-hello">' + hello + ' 👋</p>' +
        '<h1 class="db-quote">' + App.esc(quote) + '</h1>' +
        goalHtml +
      '</div>' +
      '<div class="db-hero-art">' + heroArt() + '</div>' +
      '<div class="db-hero-ring">' + ring(readiness) +
        '<div class="db-tier"><span class="db-tier-name">' + tr('tier' + tier) + '</span>' +
        (next ? '<span class="db-dim small">' + tr('nextTier', { n: next, tier: tr('tier' + (tier + 1)) }) + '</span>' : '') + '</div>' +
      '</div>' +
    '</section>';
  }

  function metricsHtml(st) {
    const streak = App.store.streak();
    const day = App.store.day() || {};
    const mins = day.minutes || 0;
    const minP = Math.min(100, pct(mins, GOAL_MIN));
    return '<section class="db-metrics">' +
      '<div class="db-metric db-m-fire"><span class="db-m-ico" aria-hidden="true">🔥</span><div><b class="db-m-num">' + streak + '</b>' +
        '<span class="db-m-lbl">' + (streak ? tr('streak') : tr('streakZero')) + '</span></div></div>' +
      '<div class="db-metric"><span class="db-m-ico" aria-hidden="true">⏱️</span><div class="db-m-grow"><b class="db-m-num">' + mins + '</b>' +
        '<span class="db-m-lbl">' + tr('minutes') + ' · ' + tr('goal', { n: GOAL_MIN }) + '</span>' +
        '<div class="progress db-m-bar"><i class="accent" style="width:' + minP + '%"></i></div></div></div>' +
      '<div class="db-metric"><span class="db-m-ico" aria-hidden="true">✅</span><div><b class="db-m-num">' + st.known + '<small>/' + st.total + '</small></b>' +
        '<span class="db-m-lbl">' + tr('known') + (day.known ? ' · <em class="db-up">' + tr('knownToday', { n: day.known }) + '</em>' : '') + '</span></div></div>' +
    '</section>';
  }

  function pomoLabel(pomo) {
    if (pomo.running) return tr('pomoPause');
    return pomo.left === POMO || pomo.left <= 0 ? tr('pomoStart') : tr('pomoResume');
  }
  const POMO = 25 * 60;
  const clock = s => String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0') + ':' + String(Math.max(0, s) % 60).padStart(2, '0');

  function missionHtml(pomo) {
    const tp = ensurePlan(false);
    const rows = (tp.items || []).map(it => ({ it, v: planItemView(it) })).filter(x => x.v);
    const isDone = x => !!(tp.done && tp.done[itemKey(x.it)]);
    const done = rows.filter(isDone).length;
    const totalMin = rows.reduce((s, x) => s + (x.it.minutes || 0), 0);
    const p = rows.length ? pct(done, rows.length) : 0;
    const firstOpen = rows.findIndex(x => !isDone(x));
    const list = rows.length ? '<ol class="db-tasks">' + rows.map((x, i) => {
      const key = itemKey(x.it), d = isDone(x);
      return '<li class="db-task' + (d ? ' is-done' : '') + (i === firstOpen ? ' is-next' : '') + '">' +
        '<label class="db-check"><input type="checkbox" data-plan-done="' + App.esc(key) + '"' + (d ? ' checked' : '') +
          ' aria-label="' + App.esc(tr('doneAria', { title: x.v.title })) + '"><span aria-hidden="true">' + App.esc(x.v.icon) + '</span></label>' +
        '<a class="db-task-body" href="' + App.esc(x.v.href) + '"><b>' + App.esc(x.v.title) + '</b>' +
          (x.v.sub ? '<span class="db-dim small"' + (x.v.lang ? ' lang="' + x.v.lang + '"' : '') + '>' + App.esc(x.v.sub) + '</span>' : '') + '</a>' +
        '<span class="badge">' + tr('duration', { n: x.it.minutes || 0 }) + '</span>' +
        (i === firstOpen ? '<a class="btn primary sm" href="' + App.esc(x.v.href) + '">' + tr('start') + '</a>' : '') +
      '</li>';
    }).join('') + '</ol>' : '<p class="db-dim">' + tr('emptyPlan') + '</p>';
    return '<section class="card db-mission">' +
      '<div class="db-mission-head"><div><h2>🎯 ' + tr('missionTitle') + '</h2>' +
        '<span class="db-dim small">' + tr('missionProgress', { done, total: rows.length, m: totalMin }) + '</span></div>' +
        '<div class="db-pomo"><span class="db-pomo-time" data-pomo-time>' + clock(pomo.left) + '</span>' +
          '<button type="button" class="btn sm" data-pomo-toggle>' + pomoLabel(pomo) + '</button>' +
          '<button type="button" class="btn ghost sm" data-pomo-reset aria-label="' + App.esc(tr('pomoReset')) + '" title="' + App.esc(tr('pomoReset')) + '">↺</button>' +
          '<button type="button" class="btn ghost sm" data-plan-change aria-label="' + App.esc(tr('changePlanAria')) + '">🔀 ' + tr('changePlan') + '</button></div>' +
      '</div>' +
      '<div class="progress db-mission-bar"><i class="accent" style="width:' + p + '%"></i></div>' +
      '<p class="db-pomo-msg small" data-pomo-msg hidden>' + tr('pomoDone') + '</p>' +
      list +
      (rows.length && done === rows.length ? '<p class="db-celebrate">' + tr('missionDone') + '</p>' : '') +
    '</section>';
  }

  // ---------- career goal (role + USD rate) and the 4 area cards (Learn / Practice / Interview / Career) ----------
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  function careerHtml(editing) {
    const g = App.store.data.careerGoal || {};
    const target = Number(g.target) || 0, now = Number(g.now) || 0;
    if (!editing && target > 0) {
      const p = Math.min(100, pct(now, target));
      const line = now >= target ? tr('cgReached', { target: money(target).slice(1) }) : tr('cgProgress', { now: money(now).slice(1), gap: money(target - now).slice(1) });
      return '<section class="card db-career" data-group="career">' +
        '<div class="db-career-head"><div><span class="db-career-k">💼 ' + tr('cgTitle') + '</span>' +
          '<h2>' + App.esc(g.role || '') + ' <span class="db-career-rate">' + money(target) + '/h</span></h2>' +
          '<span class="db-dim small">' + line + ' · ' + tr('cgMonthly', { m: money(target * 100).slice(1) }) + '</span></div>' +
          '<div class="db-career-act"><a class="btn sm" href="#/bank/remote">🌍 ' + tr('cgPlan') + '</a>' +
          '<button type="button" class="btn ghost sm" data-career-edit>' + tr('edit') + '</button></div></div>' +
        '<div class="progress db-career-bar"><i class="accent" style="width:' + p + '%"></i></div>' +
      '</section>';
    }
    return '<section class="card db-career" data-group="career"><form class="db-career-form" data-career-form>' +
      '<div class="db-goal-q"><b>💼 ' + tr('cgTitle') + '</b><span class="db-dim small">' + tr('cgSet') + '</span></div>' +
      '<input class="input" name="role" maxlength="80" required placeholder="' + App.esc(tr('cgRole')) + '" aria-label="' + App.esc(tr('cgRole')) + '" value="' + App.esc(g.role || '') + '">' +
      '<input class="input" name="now" type="number" min="0" max="1000" step="1" placeholder="' + App.esc(tr('cgNow')) + '" aria-label="' + App.esc(tr('cgNow')) + '" value="' + (now || '') + '">' +
      '<input class="input" name="target" type="number" min="1" max="1000" step="1" required placeholder="' + App.esc(tr('cgTarget')) + '" aria-label="' + App.esc(tr('cgTarget')) + '" value="' + (target || '') + '">' +
      '<button type="submit" class="btn primary sm">' + tr('save') + '</button>' +
    '</form></section>';
  }

  function sectionsHtml() {
    const st = App.stats(), due = App.dueItems().length, lesson = nextLesson(), algo = pickAlgo();
    const weekAgo = Date.now() - 7 * DAY;
    const quizzes = (App.store.data.quizHistory || []).filter(r => r && r.at >= weekAgo).length;
    const mocks = (App.store.data.mockHistory || []).length;
    const jobs = (App.store.data.jobs || []).filter(j => j && !j.deleted);
    const applied = jobs.filter(j => j.status && j.status !== 'watch').length;
    const card = (group, ico, name, big, bigLbl, line, href, more) => '<a class="db-sec" data-group="' + group + '" href="' + href + '">' +
      '<span class="db-sec-top"><span class="db-sec-ico" aria-hidden="true">' + ico + '</span><b>' + name + '</b></span>' +
      '<span class="db-sec-big">' + big + '<small>' + bigLbl + '</small></span>' +
      '<span class="db-sec-line">' + line + '</span>' + (more ? '<span class="db-dim small">' + more + '</span>' : '') + '</a>';
    return '<section class="db-secs" aria-label="' + App.esc(tr('secTitle')) + '">' +
      card('learn', '📖', tr('secLearn'), pct(st.known, st.total) + '%', tr('ready'),
        due ? tr('secDue', { n: due }) : tr('secDueNone'), due ? '#/flash/due' : (lesson ? '#/learn/' + encodeURIComponent(lesson.id) : '#/learn'),
        lesson ? App.esc(tr('secLesson', { t: lesson.title })) : '') +
      card('practice', '💪', tr('secPractice'), String(quizzes), '/ 7d',
        algo ? App.esc(tr('secAlgo', { t: algo.title })) : tr('secAlgoNone'), algo ? '#/algo/' + encodeURIComponent(algo.id) : '#/quiz',
        tr('secQuiz', { n: quizzes })) +
      card('interview', '🎤', tr('secInterview'), String(mocks), 'mock', tr('secSpeak'), '#/speak', tr('secMock', { n: mocks })) +
      card('career', '💼', tr('secCareer'), String(jobs.length), 'jobs',
        jobs.length ? tr('secJobs', { n: jobs.length, a: applied }) : tr('secJobsNone'), jobs.length ? '#/jobs/mine' : '#/jobs', tr('secRemote')) +
    '</section>';
  }

  function bottomHtml() {
    const cells = [];
    for (let i = 13; i >= 0; i--) {
      const key = App.dayKey(Date.now() - i * DAY);
      const d = App.store.day(key) || {};
      const n = (d.review || 0) + (d.known || 0) + (d.quiz || 0) + (d.mock || 0) + (d.algo || 0) + Math.floor((d.minutes || 0) / 10);
      const lv = n === 0 ? 0 : n < 5 ? 1 : n < 15 ? 2 : 3;
      cells.push('<i class="db-day l' + lv + (i === 0 ? ' now' : '') + '" title="' + App.esc(tr('dayAria', { day: key, n })) + '" aria-label="' + App.esc(tr('dayAria', { day: key, n })) + '"></i>');
    }
    const weak = App.topics().map(t => ({ t, s: App.stats(t.id) })).filter(x => x.s.total && (x.s.known || x.s.review || x.s.unknown))
      .sort((a, b) => a.s.known / a.s.total - b.s.known / b.s.total).slice(0, 3);
    return '<section class="db-bottom">' +
      '<div class="card db-week"><h3>' + tr('weekTitle') + '</h3><div class="db-days">' + cells.join('') + '</div></div>' +
      '<div class="card db-weak"><h3>' + tr('weakTitle') + '</h3>' + (weak.length
        ? '<ul>' + weak.map(x => '<li><a href="#/flash/' + encodeURIComponent(x.t.id) + '"><span aria-hidden="true">' + App.esc(x.t.icon || '•') + '</span> ' + App.esc(x.t.name) + '</a>' +
            '<span class="db-dim small">' + tr('weakItem', { known: x.s.known, total: x.s.total }) + '</span>' +
            '<div class="progress"><i class="accent" style="width:' + pct(x.s.known, x.s.total) + '%"></i></div></li>').join('') + '</ul>'
        : '<p class="db-dim small">' + tr('weakNone') + '</p>') + '</div>' +
    '</section>';
  }

  App.registerView('dashboard', {
    get title() { return App.t('dash.title'); },
    render(root) {
      const pomo = { left: POMO, id: null, running: false };
      let editing = false, editingCareer = false;
      const paint = () => {
        const st = App.stats();
        root.innerHTML = heroHtml(st, editing) + careerHtml(editingCareer) + metricsHtml(st) + sectionsHtml() + missionHtml(pomo) + bottomHtml();
      };
      const refreshCareer = () => {
        const box = root.querySelector('.db-career');
        if (box) box.outerHTML = careerHtml(editingCareer);
      };
      const paintPomo = () => {
        const time = root.querySelector('[data-pomo-time]');
        if (time) time.textContent = clock(pomo.left);
        const btn = root.querySelector('[data-pomo-toggle]');
        if (btn) btn.textContent = pomoLabel(pomo);
        const msg = root.querySelector('[data-pomo-msg]');
        if (msg) msg.hidden = pomo.left > 0;
      };
      const stopPomo = () => { if (pomo.id) clearInterval(pomo.id); pomo.id = null; pomo.running = false; };
      const refreshMission = () => {
        const card = root.querySelector('.db-mission');
        if (card) card.outerHTML = missionHtml(pomo);
        paintPomo();
      };
      const refreshHero = () => {
        const hero = root.querySelector('.db-hero');
        if (hero) hero.outerHTML = heroHtml(App.stats(), editing);
      };
      paint();

      const onSubmit = e => {
        const cf = e.target.closest('[data-career-form]');
        if (cf) {
          e.preventDefault();
          const v = new FormData(cf);
          const num = k => Math.max(0, Math.min(1000, Number(v.get(k)) || 0));
          App.store.data.careerGoal = { role: String(v.get('role') || '').trim().slice(0, 80), now: num('now'), target: num('target'), updatedAt: Date.now() };
          App.store.save();
          editingCareer = false;
          refreshCareer();
          return;
        }
        const form = e.target.closest('[data-goal-form]');
        if (!form) return;
        e.preventDefault();
        const v = new FormData(form);
        App.store.data.interviewPlan = { date: String(v.get('date') || ''), company: String(v.get('company') || '').trim(), round: (App.store.data.interviewPlan || {}).round || 'technical', updatedAt: Date.now() };
        App.store.save();
        editing = false;
        refreshHero();
      };
      const onChange = e => {
        const cb = e.target.closest('[data-plan-done]');
        if (!cb) return;
        const tp = ensurePlan(false), key = cb.getAttribute('data-plan-done');
        if (cb.checked) tp.done[key] = true; else delete tp.done[key];
        App.store.save();
        refreshMission();
      };
      const onClick = e => {
        if (e.target.closest('[data-plan-change]')) { ensurePlan(true); refreshMission(); return; }
        if (e.target.closest('[data-pomo-toggle]')) {
          if (pomo.running) stopPomo();
          else {
            if (pomo.left <= 0) pomo.left = POMO;
            pomo.running = true;
            pomo.id = setInterval(() => { pomo.left -= 1; if (pomo.left <= 0) stopPomo(); paintPomo(); }, 1000);
          }
          paintPomo();
          return;
        }
        if (e.target.closest('[data-pomo-reset]')) { stopPomo(); pomo.left = POMO; paintPomo(); return; }
        if (e.target.closest('[data-goal-edit]')) { editing = true; refreshHero(); return; }
        if (e.target.closest('[data-career-edit]')) { editingCareer = true; refreshCareer(); return; }
        if (e.target.closest('[data-goal-clear]')) {
          App.store.data.interviewPlan = { deleted: true, updatedAt: Date.now() };   // marker so sync does not bring it back
          App.store.save();
          editing = false;
          refreshHero();
        }
      };
      root.addEventListener('submit', onSubmit);
      root.addEventListener('change', onChange);
      root.addEventListener('click', onClick);
      return () => {
        stopPomo();
        root.removeEventListener('submit', onSubmit);
        root.removeEventListener('change', onChange);
        root.removeEventListener('click', onClick);
      };
    },
  });
})();
