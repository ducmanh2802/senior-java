/* View "dashboard" — owner: task T09. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  const DAY = 86400000;

  function pct(a, b) { return b > 0 ? Math.round((a / b) * 100) : 0; }

  /** SVG ring showing % of questions marked "Đã thuộc". */
  function ring(percent) {
    const r = 52;
    const c = 2 * Math.PI * r;
    const p = Math.max(0, Math.min(100, percent));
    const off = c * (1 - p / 100);
    return '<svg class="ring" viewBox="0 0 120 120" role="img" aria-label="Đã thuộc ' + p + '%">' +
      '<circle class="ring-bg" cx="60" cy="60" r="' + r + '"></circle>' +
      '<circle class="ring-fg" cx="60" cy="60" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"></circle>' +
      '<text class="ring-val" x="60" y="58">' + p + '%</text>' +
      '<text class="ring-lbl" x="60" y="78">đã thuộc</text>' +
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

  /** Topic cards grouped by topic.group, each with known/total + progress bar. */
  function topicGroups() {
    const topics = App.topics();
    if (!topics.length) return '';
    const groups = [];
    const byName = {};
    topics.forEach(t => {
      const g = t.group || 'Khác';
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
          '<div class="progress" role="progressbar" aria-label="' + App.esc(t.name) + ': ' + p + '% đã thuộc" aria-valuenow="' + p + '" aria-valuemin="0" aria-valuemax="100">' +
            '<i class="' + barCls + '" style="width:' + p + '%"></i>' +
          '</div>' +
          '<div class="topic-links">' +
            '<a class="btn sm" href="#/bank/' + encodeURIComponent(t.id) + '">Câu hỏi</a>' +
            '<a class="btn sm" href="#/flash/' + encodeURIComponent(t.id) + '">Flashcard</a>' +
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
    if (r.kind === 'quiz' && h.correct != null) score = h.correct + '/' + total + ' đúng';
    else if (r.kind === 'mock' && h.score != null) score = 'điểm ' + h.score;
    else if (h.score != null) score = 'điểm ' + h.score;
    return '<li class="hist-item">' +
      '<span class="badge ' + (r.kind === 'mock' ? 'accent' : 'info') + '">' + (r.kind === 'mock' ? 'Phỏng vấn thử' : 'Trắc nghiệm') + '</span>' +
      '<span class="hist-meta">' + App.esc(score || (total + ' câu')) + '</span>' +
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
        '<div class="plan-txt"><strong> câu/bài đến hạn ôn lại</strong>' +
          '<div class="small muted">Sau khi tự chấm, mỗi câu được lên lịch ôn lại: chấm “Chưa biết” sẽ quay lại ngày mai, “Cần ôn” sau 2+ ngày, “Đã thuộc” giãn dần 3 → 8 → 20+ ngày.</div>' +
          '<div class="small muted">' + due.q + ' câu hỏi' + (due.a ? ' · ' + due.a + ' bài thuật toán' : '') + '</div>' +
        '</div>' +
        '<a class="btn primary" href="#/flash/due">Ôn ngay</a>' +
      '</div>';
    } else {
      const w = weakestTopic();
      plan += '<div class="plan-row">' +
        '<div class="plan-num">0</div>' +
        '<div class="plan-txt"><strong>Chưa có câu nào đến hạn ôn</strong>' +
          '<div class="small muted">' + (w
            ? 'Gợi ý: <a href="#/bank/' + encodeURIComponent(w.t.id) + '">' + App.esc(w.t.name) + '</a> đang ở mức thấp nhất (' + w.s.known + '/' + w.s.total + ' đã thuộc).'
            : 'Bắt đầu bằng cách đánh giá vài câu trong ngân hàng câu hỏi.') + '</div>' +
        '</div>' +
        '<a class="btn" href="#/bank">Mở ngân hàng câu hỏi</a>' +
      '</div>';
    }

    let weekPart = '';
    if (week) {
      const tasks = week.tasks || [];
      const doneCount = tasks.filter((_, i) => done[week.id + '-' + i]).length;
      weekPart += '<div class="plan-row">' +
        '<div class="plan-num">' + week.index + '<span class="plan-den">/' + week.total + '</span></div>' +
        '<div class="plan-txt"><strong>Tuần ' + week.index + ': ' + App.esc(week.title) + '</strong>' +
          '<div class="small muted">' + App.esc(week.phase || '') + (tasks.length ? ' · đã xong ' + doneCount + '/' + tasks.length + ' việc' : '') + '</div>' +
        '</div>' +
        '<a class="btn" href="#/roadmap">Mở lộ trình</a>' +
      '</div>';
    } else {
      weekPart += '<div class="plan-row">' +
        '<div class="plan-num">–</div>' +
        '<div class="plan-txt"><strong>Chưa bắt đầu lộ trình 6 tháng</strong>' +
          '<div class="small muted">Chọn ngày bắt đầu để theo dõi tuần hiện tại và tiến độ từng giai đoạn.</div>' +
        '</div>' +
        '<a class="btn primary" href="#/roadmap">Bắt đầu lộ trình 6 tháng</a>' +
      '</div>';
    }

    const act = [
      day.review ? day.review + ' câu đã ôn' : '',
      day.known ? day.known + ' đã thuộc' : '',
      day.quiz ? day.quiz + ' bài trắc nghiệm' : '',
      day.mock ? day.mock + ' phiên phỏng vấn' : '',
      day.algo ? day.algo + ' bài thuật toán' : '',
      day.minutes ? day.minutes + ' phút' : ''
    ].filter(Boolean);

    return '<section class="card plan-card">' +
      '<div class="plan-head"><h2>Kế hoạch hôm nay</h2>' +
        '<span class="streak" title="Số ngày học liên tục">🔥 ' + streak + ' ngày</span></div>' +
      plan + weekPart +
      '<div class="plan-activity small muted">' +
        (act.length ? 'Hôm nay đã làm: ' + App.esc(act.join(' · ')) : 'Hôm nay chưa có hoạt động nào. Bắt đầu bằng 5 câu ôn nhé!') +
      '</div>' +
    '</section>';
  }

  /** Recent mock + quiz history. */
  function historyCard() {
    const rows = recentHistory();
    if (!rows.length) {
      return '<section class="card"><h2>Lịch sử gần đây</h2>' +
        '<div class="empty"><p>Chưa có phiên trắc nghiệm hay phỏng vấn thử nào.</p>' +
        '<p><a class="btn" href="#/quiz">Làm một bài trắc nghiệm</a></p></div></section>';
    }
    return '<section class="card"><h2>Lịch sử gần đây</h2>' +
      '<ul class="hist-list">' + rows.map(historyRow).join('') + '</ul></section>';
  }

  function localDateValue(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function interviewPlanCard() {
    const plan = App.store.data.interviewPlan || {};
    const companies = window.COMPANIES || [];
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
      ? '<div class="interview-plan-summary"><div class="interview-count"><strong>' + (days < 0 ? 'Đã qua ' + Math.abs(days) + ' ngày' : days === 0 ? 'Hôm nay' : 'Còn ' + days + ' ngày') + '</strong><span>' + (days < 0 ? 'Ngày phỏng vấn đã qua' : daily + ' câu chưa thuộc/ngày') + '</span></div>' +
        '<div class="interview-plan-topics"><strong>3 chủ đề cần ưu tiên</strong>' +
          (weakest.length ? '<ol>' + weakest.map(x => '<li><a href="#/flash/' + encodeURIComponent(x.t.id) + '">' + App.esc(x.t.name) + '</a><span>' + (x.s.total - x.s.known) + ' câu chưa thuộc</span></li>').join('') + '</ol>' : '<p class="muted small">Chưa có câu hỏi trong các chủ đề này.</p>') +
        '</div></div>' +
        '<div class="interview-last-day"><strong>Checklist ngày cuối</strong><ul><li><a href="#/career">Đọc lại STAR stories</a></li><li><a href="#/interview">Làm một phiên mock</a></li><li>Chuẩn bị 2–3 câu hỏi ngược cho interviewer</li></ul></div>'
      : '<p class="muted small">Chọn ngày để tính ngược số câu cần ôn mỗi ngày và các chủ đề ưu tiên.</p>';

    return '<section class="card interview-plan-card"><div class="interview-plan-head"><div><h2>🎯 Buổi phỏng vấn sắp tới</h2><p class="muted small">Lập kế hoạch ôn tập theo ngày phỏng vấn.</p></div>' +
      (plan.date || plan.company || plan.round ? '<button type="button" class="btn sm" data-interview-plan-delete>Xoá kế hoạch</button>' : '') + '</div>' +
      '<form class="interview-plan-form" data-interview-plan-form>' +
        '<label>Ngày phỏng vấn<input class="input" type="date" name="date" required value="' + App.esc(plan.date || '') + '"></label>' +
        '<label>Công ty<input class="input" type="text" name="company" list="interview-company-list" placeholder="Tên công ty (không bắt buộc)" value="' + App.esc(plan.company || '') + '"><datalist id="interview-company-list">' + companyOptions + '</datalist></label>' +
        '<label>Vòng<select class="select" name="round"><option value="HR"' + (plan.round === 'HR' ? ' selected' : '') + '>HR</option><option value="technical"' + (plan.round === 'technical' ? ' selected' : '') + '>Technical</option><option value="final"' + (plan.round === 'final' ? ' selected' : '') + '>Final</option></select></label>' +
        '<button type="submit" class="btn primary">Lưu kế hoạch</button>' +
      '</form>' + summary + '</section>';
  }

  App.registerView('dashboard', {
    title: 'Tổng quan',
    render(root, params) {
      const st = App.stats();
      const knownPct = pct(st.known, st.total);

      const hero =
        '<section class="card hero">' +
          '<div class="hero-txt">' +
            '<h1>Ôn luyện phỏng vấn Senior Java</h1>' +
            '<p class="muted">Kế hoạch 6 tháng từ Java core đến system design, microservices và phỏng vấn tiếng Anh — ôn theo lặp lại ngắt quãng để câu nào cũng "đã thuộc" khi đi phỏng vấn thật.</p>' +
            '<div class="row hero-actions">' +
              '<a class="btn primary lg" href="#/mock">Phỏng vấn thử</a>' +
              '<a class="btn lg" href="#/flash">Ôn flashcard</a>' +
              '<a class="btn ghost" href="#/bank">Ngân hàng câu hỏi</a>' +
            '</div>' +
          '</div>' +
          '<div class="hero-ring">' + ring(knownPct) + '</div>' +
        '</section>';

      const stats =
        '<section class="stat-grid">' +
          statTile(st.known, 'Đã thuộc', 'ok') +
          statTile(st.review, 'Cần ôn', 'warn') +
          statTile(st.unknown, 'Chưa biết', 'bad') +
          statTile(st.unseen, 'Chưa học') +
        '</section>';

      const topics = topicGroups();
      const topicsSection = topics
        ? '<section class="card"><h2>Tiến độ theo chủ đề</h2>' + topics + '</section>'
        : '<section class="card"><h2>Tiến độ theo chủ đề</h2><div class="empty"><p>Chưa có chủ đề nào được đăng ký.</p></div></section>';

      root.innerHTML =
        hero +
        interviewPlanCard() +
        todayCard() +
        stats +
        topicsSection +
        historyCard();

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
      const onClick = e => {
        if (!e.target.closest('[data-interview-plan-delete]')) return;
        delete App.store.data.interviewPlan;
        App.store.save();
        const card = root.querySelector('.interview-plan-card');
        if (card) card.outerHTML = interviewPlanCard();
      };
      root.addEventListener('submit', onSubmit);
      root.addEventListener('click', onClick);
      return () => {
        root.removeEventListener('submit', onSubmit);
        root.removeEventListener('click', onClick);
      };
    },
  });
})();
