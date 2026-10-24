/* View "companies" — owner: task T21. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'companies.title': 'Lộ trình theo công ty',
      'companies.all': 'Tất cả',
      'companies.bank': 'Ngân hàng',
      'companies.fintech': 'Fintech',
      'companies.bigtech': 'Big tech',
      'companies.product': 'Product',
      'companies.conf.high': 'Cao',
      'companies.conf.medium': 'Trung bình',
      'companies.conf.low': 'Thấp',
      'companies.dataSource': 'Thông tin tổng hợp từ nguồn công khai — có thể đã cũ, nên luôn kiểm tra lại.',
      'companies.noData': 'Chưa có dữ liệu công ty',
      'companies.noDataDesc': 'Kho dữ liệu đang được cập nhật. Quay lại sau nhé.',
      'companies.filterByType': 'Lọc theo loại công ty',
      'companies.sortReadiness': 'Sắp xếp readiness',
      'companies.sortDesc': 'Cao đến thấp',
      'companies.sortAsc': 'Thấp đến cao',
      'companies.noCompaniesInType': 'Không có công ty nào thuộc loại này.',
      'companies.process': 'Quy trình phỏng vấn',
      'companies.round': 'Vòng',
      'companies.focusNeed': 'Trọng tâm cần ôn',
      'companies.focusNone': 'Chưa có câu hỏi trong các topic trọng tâm.',
      'companies.percentKnown': '% thuộc',
      'companies.knownOfTotal': '/ câu đã thuộc',
      'companies.practiceQuestion': 'Ôn câu hỏi',
      'companies.practiceFlashcard': 'Ôn flashcard',
      'companies.backToList': '← Danh sách',
      'companies.mockBtn': 'Phỏng vấn thử theo công ty này',
      'companies.stack': 'Stack:',
      'companies.readiness': 'Readiness',
      'companies.knowledgeProgress': 'Tiến độ kiến thức tính theo số câu trong {n} topic trọng tâm. ',
      'companies.noRecentMock': 'Chưa có mock/interview phù hợp trong 90 ngày gần đây.',
      'companies.recentMockWeight': 'Điểm mock/interview gần đây chiếm 20% readiness.',
      'companies.sharedQuestions': 'Câu hỏi được chia sẻ công khai',
      'companies.noSampleAnswer': 'Không có đáp án mẫu — AI chấm theo kỳ vọng interviewer tại công ty này.',
      'companies.practiceThis': '✍️ Luyện câu này',
      'companies.yourAnswer': 'Câu trả lời của bạn',
      'companies.answerPlaceholder': 'Trả lời thành tiếng rồi ghi lại đây…',
      'companies.speakAnswer': 'Đọc trả lời bằng giọng nói',
      'companies.gradeAi': '🤖 Chấm bằng AI',
      'companies.enterAnswerFirst': 'Hãy nhập hoặc nói câu trả lời trước khi chấm.',
      'companies.aiGrading': 'AI đang chấm…',
      'companies.tips': 'Mẹo chuẩn bị',
      'companies.sources': 'Nguồn',
      'companies.dataMayChange': 'Dữ liệu tổng hợp từ nguồn công khai, có thể đã thay đổi.',
      'companies.englishRequired': 'Yêu cầu tiếng Anh',
      'companies.notFound': 'Không tìm thấy công ty',
      'companies.notFoundDesc': 'Mã <code>{id}</code> không có trong dữ liệu.',
      'companies.backToCompanies': '← Về danh sách',
    },
    en: {
      'companies.title': 'Roadmap by Company',
      'companies.all': 'All',
      'companies.bank': 'Bank',
      'companies.fintech': 'Fintech',
      'companies.bigtech': 'Big Tech',
      'companies.product': 'Product',
      'companies.conf.high': 'High',
      'companies.conf.medium': 'Medium',
      'companies.conf.low': 'Low',
      'companies.dataSource': 'Aggregated from public sources — may be outdated, always verify.',
      'companies.noData': 'No company data yet',
      'companies.noDataDesc': 'Data is being updated. Check back later.',
      'companies.filterByType': 'Filter by company type',
      'companies.sortReadiness': 'Sort readiness',
      'companies.sortDesc': 'High to low',
      'companies.sortAsc': 'Low to high',
      'companies.noCompaniesInType': 'No companies of this type.',
      'companies.process': 'Interview Process',
      'companies.round': 'Round',
      'companies.focusNeed': 'Focus Areas to Review',
      'companies.focusNone': 'No questions in focus topics yet.',
      'companies.percentKnown': '% Known',
      'companies.knownOfTotal': '/ questions known',
      'companies.practiceQuestion': 'Practice Questions',
      'companies.practiceFlashcard': 'Practice Flashcards',
      'companies.backToList': '← Back to List',
      'companies.mockBtn': 'Mock Interview for This Company',
      'companies.stack': 'Stack:',
      'companies.readiness': 'Readiness',
      'companies.knowledgeProgress': 'Knowledge progress based on questions in {n} focus topics. ',
      'companies.noRecentMock': 'No relevant mock/interview in the last 90 days.',
      'companies.recentMockWeight': 'Recent mock/interview score counts for 20% of readiness.',
      'companies.sharedQuestions': 'Publicly Shared Questions',
      'companies.noSampleAnswer': 'No sample answer — AI grades per interviewer expectations at this company.',
      'companies.practiceThis': '✍️ Practice This',
      'companies.yourAnswer': 'Your Answer',
      'companies.answerPlaceholder': 'Speak your answer then write it here…',
      'companies.speakAnswer': 'Speak answer',
      'companies.gradeAi': '🤖 Grade with AI',
      'companies.enterAnswerFirst': 'Please enter or speak an answer before grading.',
      'companies.aiGrading': 'AI is grading…',
      'companies.tips': 'Preparation Tips',
      'companies.sources': 'Sources',
      'companies.dataMayChange': 'Aggregated from public sources, may have changed.',
      'companies.englishRequired': 'English Required',
      'companies.notFound': 'Company Not Found',
      'companies.notFoundDesc': 'Code <code>{id}</code> not found in data.',
      'companies.backToCompanies': '← Back to Companies',
    }
  });

  const TYPES = [
    { id: 'all', label: App.t('companies.all') },
    { id: 'bank', label: App.t('companies.bank') },
    { id: 'fintech', label: App.t('companies.fintech') },
    { id: 'bigtech', label: App.t('companies.bigtech') },
    { id: 'product', label: App.t('companies.product') },
  ];
  const TYPE_LABEL = { bank: App.t('companies.bank'), fintech: App.t('companies.fintech'), bigtech: App.t('companies.bigtech'), product: App.t('companies.product') };
  const CONF_LABEL = { high: App.t('companies.conf.high'), medium: App.t('companies.conf.medium'), low: App.t('companies.conf.low') };
  const CONF_CLS = { high: 'ok', medium: 'warn', low: 'bad' };

  // Bộ lọc loại công ty giữ giữa các lần render.
  const state = { type: 'all', sort: 'desc' };
  // Listener trên #main tái sử dụng giữa các lần render — chỉ gắn một lần.
  let listHandler = null;
  let listChangeHandler = null;

  function companies() { return window.COMPANIES || []; }

  function byId(id) { return companies().find(c => c.id === id) || null; }

  function scoreCls(n) { return n < 40 ? 'bad' : n < 70 ? 'warn' : 'ok'; }

  /** Chuỗi câu hỏi: có thể là string hoặc object {q, lang?}. */
  function qText(x) { return typeof x === 'string' ? x : (x && x.q) || String(x); }
  function qLang(x) { return (typeof x === 'object' && x && x.lang) || null; }

  const RECENT_DAYS = 90;

  function timeOf(entry) {
    const value = entry && (entry.at || entry.date || entry.updatedAt);
    const time = typeof value === 'number' ? value : Date.parse(value || '');
    return Number.isFinite(time) ? time : 0;
  }

  /** Lịch sử phù hợp trong 90 ngày: điểm mock chung theo topic, interview AI theo company id. */
  function recentInterviewScore(c) {
    const cutoff = Date.now() - RECENT_DAYS * 86400000;
    const history = App.store.data.mockHistory || [];
    const mockRows = history.filter(x => {
      if (timeOf(x) < cutoff) return false;
      const topics = x.topics || [];
      const companyMatches = x.kind === 'ai-interview' && x.company === c.id;
      const topicMatches = topics.length > 0 && (c.focus || []).some(id => topics.indexOf(id) >= 0);
      return companyMatches || topicMatches;
    }).map(x => {
      const value = x.kind === 'ai-interview' ? x.score : (x.aiAvg || x.avg);
      return { at: timeOf(x), score: Number(value) };
    }).filter(x => Number.isFinite(x.score) && x.score >= 1 && x.score <= 5);
    const rows = mockRows.sort((a, b) => b.at - a.at);
    if (!rows.length) return null;
    const values = rows.slice(0, 5).map(x => Math.max(0, Math.min(1, x.score / 5)));
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Điểm readiness: độ thuộc theo tổng số câu của từng topic, kèm lịch sử phỏng vấn gần đây nếu có.
   */
  function readiness(c) {
    // Cân trọng số từng topic theo số câu trong ngân hàng, để topic lớn đóng góp tương ứng.
    const topics = (c.focus || []).map(id => ({ id: id, stats: App.stats(id) })).filter(x => x.stats.total > 0);
    const total = topics.reduce((sum, x) => sum + x.stats.total, 0);
    const knownEquivalent = topics.reduce((sum, x) =>
      sum + x.stats.known + 0.5 * x.stats.review, 0);
    const knowledge = total ? knownEquivalent / total : 0;
    const interview = recentInterviewScore(c);
    // Khi có phiên gần đây, dành 20% trọng số cho điểm phiên; nếu không thì readiness phản ánh kiến thức.
    const score = 100 * (interview == null ? knowledge : knowledge * 0.8 + interview * 0.2);
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      knowledge: knowledge, interview: interview, topicCount: topics.length,
      topics: topics.map(x => ({ id: x.id, stats: x.stats,
        ratio: (x.stats.known + 0.5 * x.stats.review) / x.stats.total })),
    };
  }

  /** Vòng tròn điểm sẵn sàng (SVG). */
  function ring(score, size) {
    const s = Math.max(0, Math.min(100, Math.round(score)));
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const off = circ * (1 - s / 100);
    const cls = scoreCls(s);
    return '<svg class="co-ring co-ring-' + cls + '" width="' + size + '" height="' + size + '"' +
      ' viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + App.t('companies.readiness') + ' ' + s + ' trên 100">' +
      '<circle class="co-ring-bg" cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" stroke-width="6"/>' +
      '<circle class="co-ring-fg" cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + r + '" fill="none" stroke-width="6"' +
      ' stroke-linecap="round" stroke-dasharray="' + circ.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"' +
      ' transform="rotate(-90 ' + (size / 2) + ' ' + (size / 2) + ')"/>' +
      '<text class="co-ring-num" x="50%" y="50%" text-anchor="middle" dominant-baseline="central">' + s + '</text>' +
      '</svg>';
  }

  App.registerView('companies', {
    get title() { return App.t('companies.title'); },
    render(root, params) {
      if (params && params.length) return renderDetail(root, params[0]);
      return renderList(root);
    },
  });

  function renderList(root) {
    const all = companies();
    if (!all.length) {
      root.innerHTML = '<div class="page-head"><div><h1>' + App.t('companies.title') + '</h1>' +
        '<p>' + App.t('companies.dataSource') + '</p></div></div>' +
        '<div class="empty"><h2>' + App.t('companies.noData') + '</h2>' +
        '<p>' + App.t('companies.noDataDesc') + '</p></div>';
      return () => {};
    }

    const filtered = (state.type === 'all' ? all : all.filter(c => c.type === state.type))
      .slice().sort((a, b) => (readiness(a).score - readiness(b).score) * (state.sort === 'asc' ? 1 : -1));
    const chips = TYPES.map(t =>
      '<button type="button" class="chip' + (state.type === t.id ? ' active' : '') + '" data-type="' + t.id + '"' +
      ' aria-pressed="' + (state.type === t.id ? 'true' : 'false') + '">' + App.esc(t.label) + '</button>').join('');

    const cards = filtered.map(c => {
      const r = readiness(c);
      const focus = (c.focus || []).slice(0, 3).map(id =>
        '<span class="badge">' + App.esc(App.topic(id).name) + '</span>').join('');
      const conf = CONF_CLS[c.confidence] || '';
      return '<a class="card co-card" href="#/companies/' + App.esc(c.id) + '">' +
        '<div class="co-card-top">' +
          '<span class="co-icon" aria-hidden="true">' + App.esc(c.icon || '🏢') + '</span>' +
          ring(r.score, 64) +
        '</div>' +
        '<h3 class="co-card-name">' + App.esc(c.name) + '</h3>' +
        '<div class="co-card-readiness"><div class="co-ready-label"><b>' + App.t('companies.readiness') + '</b><span>' + r.score + '%</span></div>' +
          '<div class="progress" role="progressbar" aria-label="' + App.t('companies.readiness') + ' ' + App.esc(c.name) + '" aria-valuenow="' + r.score + '" aria-valuemin="0" aria-valuemax="100"><i class="accent" style="width:' + r.score + '%"></i></div></div>' +
        '<div class="row co-card-meta">' +
          '<span class="badge accent">' + App.esc(TYPE_LABEL[c.type] || c.type || '') + '</span>' +
          '<span class="badge ' + conf + '">' + App.t('companies.dataSource').split(' ')[0] + ': ' + App.esc(CONF_LABEL[c.confidence] || c.confidence || '?') + '</span>' +
        '</div>' +
        (focus ? '<div class="row co-card-focus">' + focus + '</div>' : '') +
      '</a>';
    }).join('');

    root.innerHTML =
      '<div class="page-head">' +
        '<div><h1>' + App.t('companies.title') + '</h1>' +
        '<p>' + App.t('companies.dataSource') + '</p></div>' +
      '</div>' +
      '<div class="row co-list-controls"><div class="chips co-type-chips" role="group" aria-label="' + App.t('companies.filterByType') + '">' + chips + '</div>' +
      '<label class="co-sort-label">' + App.t('companies.sortReadiness') + ' <select class="select co-sort" aria-label="' + App.t('companies.sortReadiness') + '">' +
        '<option value="desc"' + (state.sort === 'desc' ? ' selected' : '') + '>' + App.t('companies.sortDesc') + '</option>' +
        '<option value="asc"' + (state.sort === 'asc' ? ' selected' : '') + '>' + App.t('companies.sortAsc') + '</option></select></label></div>' +
      (filtered.length
        ? '<div class="grid co-grid">' + cards + '</div>'
        : '<div class="empty"><p>' + App.t('companies.noCompaniesInType') + '</p></div>');

    const onClick = e => {
      const chip = e.target.closest('[data-type]');
      if (chip) { state.type = chip.dataset.type; renderList(root); }
    };
    const onChange = e => {
      if (!e.target.matches('.co-sort')) return;
      state.sort = e.target.value;
      renderList(root);
    };
    if (listHandler) root.removeEventListener('click', listHandler);
    if (listChangeHandler) root.removeEventListener('change', listChangeHandler);
    listHandler = onClick;
    listChangeHandler = onChange;
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    return () => {
      if (listHandler) root.removeEventListener('click', listHandler);
      if (listChangeHandler) root.removeEventListener('change', listChangeHandler);
      listHandler = null;
      listChangeHandler = null;
    };
  }

  /** Timeline dọc quy trình phỏng vấn. */
  function processHtml(c) {
    const steps = c.process || [];
    if (!steps.length) return '';
    const items = steps.map((s, i) =>
      '<li class="co-step">' +
        '<span class="co-step-no" aria-hidden="true">' + (i + 1) + '</span>' +
        '<div class="co-step-body"><b>' + App.esc(s.round || App.t('companies.round') + ' ' + (i + 1)) + '</b>' +
        (s.detail ? '<div class="md">' + App.md(s.detail) + '</div>' : '') +
        '</div>' +
      '</li>').join('');
    return '<section class="card co-section"><h2>' + App.t('companies.process') + '</h2>' +
      '<ol class="co-timeline">' + items + '</ol></section>';
  }

  /** Ba topic yếu nhất: thanh tiến độ + link bank/flash để bắt đầu ôn ngay. */
  function focusHtml(c) {
    const r = readiness(c);
    const rows = r.topics.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 3);
    if (!rows.length) return '<section class="card co-section"><h2>' + App.t('companies.focusNeed') + '</h2><p class="muted">' + App.t('companies.focusNone') + '</p></section>';
    const items = rows.map(x => {
      const s = x.stats;
      const pct = Math.round(x.ratio * 100);
      const t = App.topic(x.id);
      return '<li class="co-focus co-priority">' +
        '<div class="co-focus-head">' +
          '<b>' + App.esc((t.icon ? t.icon + ' ' : '') + t.name) + '</b>' +
          '<span class="badge accent">' + pct + App.t('companies.percentKnown') + '</span>' +
          '<span class="small muted">' + s.known + App.t('companies.knownOfTotal') + '</span>' +
        '</div>' +
        '<div class="progress" role="progressbar" aria-label="' + App.esc(t.name) + '" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">' +
          '<i class="accent" style="width:' + pct + '%"></i></div>' +
        '<div class="row co-focus-links">' +
          '<a class="btn sm" href="#/bank/' + App.esc(x.id) + '">' + App.t('companies.practiceQuestion') + '</a>' +
          '<a class="btn sm" href="#/flash/' + App.esc(x.id) + '">' + App.t('companies.practiceFlashcard') + '</a>' +
        '</div>' +
      '</li>';
    }).join('');
    return '<section class="card co-section"><h2>' + App.t('companies.focusNeed') + '</h2>' +
      '<ul class="co-focus-list">' + items + '</ul></section>';
  }

  function renderDetail(root, id) {
    const c = byId(id);
    if (!c) {
      root.innerHTML = '<div class="empty"><h2>' + App.t('companies.notFound') + '</h2>' +
        '<p>' + App.t('companies.notFoundDesc', { id: id }) + '</p>' +
        '<p><a class="btn" href="#/companies">' + App.t('companies.backToCompanies') + '</a></p></div>';
      return () => {};
    }

    const r = readiness(c);
    const stack = (c.stack || []).map(s => '<span class="badge">' + App.esc(s) + '</span>').join('');
    const conf = CONF_CLS[c.confidence] || '';

    root.innerHTML =
      '<div class="page-head co-head">' +
        '<div class="row">' +
          '<a class="link-btn" href="#/companies">' + App.t('companies.backToList') + '</a>' +
          '<span class="co-icon co-icon-lg" aria-hidden="true">' + App.esc(c.icon || '🏢') + '</span>' +
          '<div><h1>' + App.esc(c.name) + '</h1>' +
          '<div class="row co-head-meta">' +
            '<span class="badge accent">' + App.esc(TYPE_LABEL[c.type] || c.type || '') + '</span>' +
            '<span class="badge ' + conf + '">' + App.t('companies.dataSource').split(' ')[0] + ': ' + App.esc(CONF_LABEL[c.confidence] || c.confidence || '?') + '</span>' +
            (c.englishRequired ? '<span class="badge info">' + App.t('companies.englishRequired') + '</span>' : '') +
          '</div></div>' +
        '</div>' +
        '<button type="button" class="btn primary" id="coMockBtn">' + App.t('companies.mockBtn') + '</button>' +
      '</div>' +
      '<section class="card co-summary">' +
        (c.summary ? '<div class="md">' + App.md(c.summary) + '</div>' : '') +
        (stack ? '<div class="row co-stack"><span class="small muted">' + App.t('companies.stack') + '</span>' + stack + '</div>' : '') +
      '</section>' +
      '<section class="card co-ready">' +
        '<div class="co-ready-top">' + ring(r.score, 96) +
          '<div class="co-ready-parts"><b>' + App.t('companies.readiness') + ': ' + r.score + '%</b>' +
            '<div class="progress" role="progressbar" aria-label="' + App.t('companies.readiness') + ' ' + App.esc(c.name) + '" aria-valuenow="' + r.score + '" aria-valuemin="0" aria-valuemax="100"><i class="accent" style="width:' + r.score + '%"></i></div>' +
            '<p class="small muted">' + App.t('companies.knowledgeProgress', { n: r.topicCount }) +
            (r.interview == null ? App.t('companies.noRecentMock') : App.t('companies.recentMockWeight')) + '</p></div>' +
        '</div>' +
      '</section>' +
      '<div id="coBody"></div>';

    renderBody(root.querySelector('#coBody'), c, r);
    return bindDetail(root, c);
  }

  /** Câu hỏi chia sẻ công khai — mỗi câu có khối "Luyện trả lời" với AI. */
  function questionsHtml(c) {
    const qs = c.questions || [];
    if (!qs.length) return '';
    const items = qs.map((x, i) => {
      const text = qText(x);
      const lang = qLang(x);
      return '<li class="co-q" data-qi="' + i + '">' +
        '<p class="co-q-text"' + (lang === 'en' ? ' lang="en"' : '') + '>' + App.esc(text) + '</p>' +
        '<button type="button" class="btn sm" data-practice="' + i + '">' + App.t('companies.practiceThis') + '</button>' +
        '<div class="co-practice" data-practice-box="' + i + '" hidden>' +
          '<label class="field"><span>' + App.t('companies.yourAnswer') + '</span>' +
            '<textarea class="textarea" data-answer="' + i + '" rows="5" placeholder="' + App.t('companies.answerPlaceholder') + '"' +
            (lang === 'en' ? ' lang="en"' : '') + '></textarea></label>' +
          '<div class="row co-practice-actions">' +
            '<button type="button" class="btn mic-btn" data-mic="' + i + '"' + (App.speech.supported ? '' : ' hidden') +
              ' aria-label="' + App.t('companies.speakAnswer') + '">🎤</button>' +
            '<button type="button" class="btn primary" data-grade="' + i + '">' + App.t('companies.gradeAi') + '</button>' +
          '</div>' +
          '<div class="co-practice-out" data-out="' + i + '"></div>' +
        '</div>' +
      '</li>';
    }).join('');
    return '<section class="card co-section"><h2>' + App.t('companies.sharedQuestions') + '</h2>' +
      '<p class="small muted">' + App.t('companies.noSampleAnswer') + '</p>' +
      '<ul class="co-q-list">' + items + '</ul></section>';
  }

  function tipsHtml(c) {
    const tips = c.tips || [];
    if (!tips.length) return '';
    const items = tips.map(t => '<li>' + App.md(t).replace(/^<p>|<\/p>/g, '') + '</li>').join('');
    return '<section class="card co-section"><h2>' + App.t('companies.tips') + '</h2><ul class="co-tips">' + items + '</ul></section>';
  }

  function sourcesHtml(c) {
    const src = c.sources || [];
    if (!src.length) return '';
    const items = src.map(s =>
      '<li><a href="' + App.esc(s.url || '#') + '" target="_blank" rel="noopener">' +
      App.esc(s.title || s.url || 'Nguồn') + '</a></li>').join('');
    return '<section class="card co-section"><h2>' + App.t('companies.sources') + '</h2><ul class="co-sources">' + items + '</ul>' +
      '<p class="small muted">' + App.t('companies.dataMayChange') + '</p></section>';
  }

  function renderBody(body, c, r) {
    if (!body) return;
    body.innerHTML = processHtml(c) + focusHtml(c) + questionsHtml(c) + tipsHtml(c) + sourcesHtml(c);
  }

  /** Dừng mọi buổi ghi âm đang chạy khi rời trang. */
  function stopAllMics(state) {
    Object.keys(state.mics).forEach(k => {
      try { state.mics[k].stop(); } catch (e) { /* ignore */ }
      delete state.mics[k];
    });
  }

  function bindDetail(root, c) {
    const micState = { mics: {} };

    root.querySelector('#coMockBtn').addEventListener('click', () => {
      try {
        localStorage.setItem('sjp.mock.preset', JSON.stringify({
          topics: c.focus || [],
          english: !!c.englishRequired,
        }));
      } catch (e) { /* private mode */ }
      App.navigate('#/mock');
    });

    // Delegation cho các nút luyện câu / mic / chấm AI.
    const onClick = async e => {
      const prac = e.target.closest('[data-practice]');
      if (prac) {
        const i = prac.dataset.practice;
        const box = root.querySelector('[data-practice-box="' + i + '"]');
        if (box) {
          box.hidden = !box.hidden;
          if (!box.hidden) box.querySelector('[data-answer="' + i + '"]').focus();
        }
        return;
      }

      const micBtn = e.target.closest('[data-mic]');
      if (micBtn) {
        const i = micBtn.dataset.mic;
        if (micState.mics[i]) {
          try { micState.mics[i].stop(); } catch (err) { /* ignore */ }
          delete micState.mics[i];
          micBtn.classList.remove('recording');
          return;
        }
        const box = root.querySelector('[data-practice-box="' + i + '"]');
        const ta = box.querySelector('[data-answer="' + i + '"]');
        const q = (c.questions || [])[+i];
        const lang = qLang(q) === 'en' ? 'en' : 'vi';
        try {
          micBtn.classList.add('recording');
          micState.mics[i] = App.speech.start({
            lang: lang,
            onText: (fin, interim) => { ta.value = fin + (interim ? ' ' + interim : ''); },
            onError: () => { micBtn.classList.remove('recording'); delete micState.mics[i]; },
          });
        } catch (err) {
          micBtn.classList.remove('recording');
          const errBox = root.querySelector('[data-out="' + i + '"]');
          if (errBox) errBox.innerHTML = App.ui.error(err);
        }
        return;
      }

      const gradeBtn = e.target.closest('[data-grade]');
      if (gradeBtn && !gradeBtn.disabled) {
        const i = +gradeBtn.dataset.grade;
        const box = root.querySelector('[data-practice-box="' + i + '"]');
        const ta = box.querySelector('[data-answer="' + i + '"]');
        const out = box.querySelector('[data-out="' + i + '"]');
        const answer = ta.value.trim();
        if (!answer) { out.innerHTML = '<div class="ai-error">' + App.t('companies.enterAnswerFirst') + '</div>'; return; }
        const q = (c.questions || [])[+i];
        const lang = qLang(q) === 'en' ? 'en' : 'vi';
        let speech;
        if (micState.mics[i]) {
          try { speech = micState.mics[i].stop(); } catch (err) { /* ignore */ }
          delete micState.mics[i];
          const mb = box.querySelector('[data-mic="' + i + '"]');
          if (mb) mb.classList.remove('recording');
        }
        gradeBtn.disabled = true;
        out.innerHTML = '<span class="ai-loading">' + App.t('companies.aiGrading') + '</span>';
        try {
          const res = await App.ai.grade({
            question: qText(q),
            reference: 'Không có đáp án mẫu; hãy chấm theo kỳ vọng của interviewer Senior Java tại ' + c.name,
            answer: answer,
            lang: lang,
            topic: (c.focus && c.focus[0]) || 'scenario',
            level: 'senior',
            speech: speech || undefined,
          });
          out.innerHTML = App.ui.feedback(res, lang) + App.ui.speechStats(speech);
        } catch (err) {
          out.innerHTML = App.ui.error(err);
        } finally {
          gradeBtn.disabled = false;
        }
      }
    };

    root.addEventListener('click', onClick);

    return () => {
      root.removeEventListener('click', onClick);
      stopAllMics(micState);
    };
  }
})();
