/* View "bank" — owner: task T09. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'bank.title': 'Ngân hàng câu hỏi',
      'bank.subtitle': 'Lọc theo chủ đề, level, trạng thái; mở đáp án mẫu và tự đánh giá để lên lịch ôn SRS.',
      'bank.searchLabel': 'Tìm kiếm',
      'bank.searchPlaceholder': 'Từ khoá trong câu hỏi, đáp án, tag…',
      'bank.levelLabel': 'Level',
      'bank.allLevel': 'Mọi level',
      'bank.hideAnswerLabel': 'Ẩn đáp án cho tới khi tự trả lời',
      'bank.topicFilterAria': 'Lọc theo chủ đề',
      'bank.statusFilterAria': 'Lọc theo trạng thái',
      'bank.all': 'Tất cả', 'bank.due': 'Đến hạn ôn', 'bank.unseen': 'Chưa học', 'bank.unknown': 'Chưa biết', 'bank.review': 'Cần ôn', 'bank.known': 'Đã thuộc', 'bank.bookmarked': 'Đã đánh dấu',
      'bank.dueLabel': 'ôn lại:', 'bank.topicAll': 'Tất cả',
      'bank.bookmarkRemoveLabel': 'Bỏ đánh dấu câu hỏi', 'bank.bookmarkAddLabel': 'Đánh dấu câu hỏi',
      'bank.bookmarkRemoveTitle': 'Bỏ đánh dấu', 'bank.bookmarkAddTitle': 'Đánh dấu',
      'bank.practiceTitle': '✍️ Luyện trả lời', 'bank.answerLabel': 'Câu trả lời của bạn',
      'bank.answerPlaceholder': 'Trả lời bằng lời của bạn rồi nhờ AI chấm…',
      'bank.gradeAiBtn': '🤖 Chấm bằng AI', 'bank.micBtn': '🎤 Nói',
      'bank.micAria': 'Đọc câu trả lời bằng giọng nói', 'bank.micStopAria': 'Dừng ghi âm', 'bank.micStopLabel': 'Dừng',
      'bank.scoreHint': 'Điểm ≥ 4 → Đã thuộc · 3 → Cần ôn · ≤ 2 → Chưa biết',
      'bank.hiddenAnswerMsg': 'Đang bật chế độ ẩn đáp án — hãy tự trả lời trước khi xem.',
      'bank.revealBtn': 'Xem đáp án mẫu',
      'bank.followTitle': 'Interviewer có thể hỏi tiếp',
      'bank.selfAssessLabel': 'Tự đánh giá:',
      'bank.gradeKnown': 'Đã thuộc', 'bank.gradeReview': 'Cần ôn', 'bank.gradeUnknown': 'Chưa biết',
      'bank.expandAll': 'Mở tất cả', 'bank.collapseAll': 'Thu gọn tất cả',
      'bank.moreBtn': 'Xem thêm (', 'bank.moreRemaining': ' câu còn lại)',
      'bank.countDisplay': '{n} câu hỏi đang hiển thị',
      'bank.emptyTitle': 'Không có câu hỏi nào khớp bộ lọc hiện tại.',
      'bank.emptyHint': 'Thử bỏ bớt điều kiện lọc hoặc xem tất cả chủ đề.',
      'bank.noMicMsg': 'Không mở được micro.',
      'bank.aiWait': 'AI đang chấm…',
      'bank.hiddenAnswerTitle': 'Ẩn đáp án cho tới khi tự trả lời',
    },
    en: {
      'bank.title': 'Question Bank',
      'bank.subtitle': 'Filter by topic, level, status; open model answers and self-rate to schedule SRS reviews.',
      'bank.searchLabel': 'Search',
      'bank.searchPlaceholder': 'Keywords in questions, answers, tags…',
      'bank.levelLabel': 'Level',
      'bank.allLevel': 'All levels',
      'bank.hideAnswerLabel': 'Hide answers until you respond',
      'bank.topicFilterAria': 'Filter by topic',
      'bank.statusFilterAria': 'Filter by status',
      'bank.all': 'All', 'bank.due': 'Due for review', 'bank.unseen': 'Not studied', 'bank.unknown': 'Don\'t know', 'bank.review': 'Review', 'bank.known': 'Known', 'bank.bookmarked': 'Bookmarked',
      'bank.dueLabel': 'review:', 'bank.topicAll': 'All',
      'bank.bookmarkRemoveLabel': 'Remove bookmark', 'bank.bookmarkAddLabel': 'Bookmark question',
      'bank.bookmarkRemoveTitle': 'Unbookmark', 'bank.bookmarkAddTitle': 'Bookmark',
      'bank.practiceTitle': '✍️ Practice your answer', 'bank.answerLabel': 'Your answer',
      'bank.answerPlaceholder': 'Answer in your own words, then ask AI to grade…',
      'bank.gradeAiBtn': '🤖 Grade with AI', 'bank.micBtn': '🎤 Speak',
      'bank.micAria': 'Speak your answer aloud', 'bank.micStopAria': 'Stop recording', 'bank.micStopLabel': 'Stop',
      'bank.scoreHint': 'Score ≥ 4 → Known · 3 → Review · ≤ 2 → Don\'t know',
      'bank.hiddenAnswerMsg': 'Hidden-answer mode is on — respond first before viewing.',
      'bank.revealBtn': 'Show model answer',
      'bank.followTitle': 'Interviewer may follow up',
      'bank.selfAssessLabel': 'Self-assess:',
      'bank.gradeKnown': 'Known', 'bank.gradeReview': 'Review', 'bank.gradeUnknown': 'Don\'t know',
      'bank.expandAll': 'Open all', 'bank.collapseAll': 'Collapse all',
      'bank.moreBtn': 'Show more (', 'bank.moreRemaining': ' remaining)',
      'bank.countDisplay': '{n} questions shown',
      'bank.emptyTitle': 'No questions match the current filter.',
      'bank.emptyHint': 'Try removing some filter conditions or view all topics.',
      'bank.noMicMsg': 'Could not open microphone.',
      'bank.aiWait': 'AI is grading…',
      'bank.hiddenAnswerTitle': 'Hide answers until you respond',
    },
  });


  const PAGE_SIZE = 150;
  const DEBOUNCE_MS = 150;

  const STATUS_CHIPS = [
    { id: 'all', label: 'all' },
    { id: 'due', label: 'due' },
    { id: 'unseen', label: 'unseen' },
    { id: 'unknown', label: 'unknown' },
    { id: 'review', label: 'review' },
    { id: 'known', label: 'known' },
    { id: 'bookmarked', label: 'bookmarked' },
  ];
  const GRADES = [
    { id: 'known', label: 'gradeKnown', cls: 'ok' },
    { id: 'review', label: 'gradeReview', cls: 'warn' },
    { id: 'unknown', label: 'gradeUnknown', cls: 'bad' },
  ];

  /** Trạng thái filter giữ giữa các lần render. */
  const S = {
    topic: 'all',
    level: 'all',
    status: 'all',
    q: '',
    shown: PAGE_SIZE,
    expanded: {},     // id -> true (đã mở)
    loaded: {},       // id -> true (đáp án đã render)
    answers: {},      // id -> câu trả lời đang gõ (giữ khi đổi bộ lọc)
    practiceOpen: {}, // id -> true (khối luyện trả lời đang mở)
    revealed: {},     // id -> true (đã bấm xem đáp án khi bật chế độ ẩn)
    aiResult: {},     // id -> kết quả App.ai.grade
    speech: {},       // id -> metrics của lần đọc gần nhất
    answerCollapsed: {}, // id -> true (thân đáp án đang thu gọn)
  };

  const HIDE_KEY = 'sjp.bank.hideAnswer';
  const READ_KEY = 'sjp.bank.readPos';
  let rootEl = null;
  let searchTimer = null;
  let mic = null;   // { id, handle } — chỉ một phiên ghi âm tại một thời điểm
  let keyCleanup = null; // App.onKey cleanup
  let filtersOpen = false; // thu gọn bộ lọc trên mobile
  let pendingScrollId = null; // id câu hỏi cần cuộn tới sau render
  let lastOpenId = null; // câu hỏi đang đọc (để nhớ vị trí)

  function esc(s) { return App.esc(s); }

  function hideAnswer() {
    try { return localStorage.getItem(HIDE_KEY) === '1'; } catch (e) { return false; }
  }
  function setHideAnswer(on) {
    try { localStorage.setItem(HIDE_KEY, on ? '1' : '0'); } catch (e) { /* private mode */ }
  }
  function saveReadPos(id) {
    if (!id) return;
    try { localStorage.setItem(READ_KEY, JSON.stringify({ id: id, y: window.scrollY || 0, t: Date.now() })); } catch (e) { /* ignore */ }
  }
  function loadReadPos() {
    try { return JSON.parse(localStorage.getItem(READ_KEY) || 'null'); } catch (e) { return null; }
  }

  /** Tạo id ổn định cho heading trong đáp án. */
  function secId(qid, n) { return 'bank-sec-' + qid + '-' + n; }

  /** Trích các mục ### từ markup đáp án để làm mục lục. */
  function tocItems(answer) {
    const lines = String(answer || '').replace(/\r/g, '').split('\n');
    const items = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].indexOf('### ') === 0) items.push(lines[i].slice(4).trim());
    }
    return items;
  }

  /** Gắn id tuần tự vào các thẻ <h4> trong HTML đã render. */
  function addHeadingIds(html, qid) {
    let n = 0;
    return html.replace(/<h4>/g, function () { return '<h4 id="' + esc(secId(qid, n++)) + '">'; });
  }

  /** Câu hỏi sau khi áp dụng filter. */
  function filtered() {
    return App.filterQuestions({ topic: S.topic, level: S.level, status: S.status, q: S.q });
  }

  /** Ngày đến hạn ôn (dd/mm) hoặc null. */
  function dueText(id) {
    const d = App.store.getDue(id);
    if (d == null) return null;
    const dt = new Date(d);
    return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  function statusDot(id) {
    const s = App.store.getStatus(id);
    const cls = s && App.STATUS[s] ? App.STATUS[s].cls : '';
    const label = s && App.STATUS[s] ? App.STATUS[s].label : 'Chưa học';
    return '<span class="bank-dot-wrap" title="' + esc(label) + '"><span class="dot ' + cls + '"></span></span>';
  }

  function levelBadge(q) {
    const label = App.LEVELS[q.level] || q.level;
    return '<span class="badge bank-level level-' + esc(q.level) + '">' + esc(label) + '</span>';
  }

  function topicBadge(q) {
    const t = App.topic(q.topic);
    return '<span class="badge">' + esc((t.icon ? t.icon + ' ' : '') + t.name) + '</span>';
  }

  /** Nút bookmark ★/☆. */
  function bookmarkBtn(id) {
    const on = App.store.isBookmarked(id);
    return '<button type="button" class="bank-star" data-bookmark="' + esc(id) + '" aria-label="' +
      (on ? App.t('bank.bookmarkRemoveLabel') : App.t('bank.bookmarkAddLabel')) + '" aria-pressed="' + (on ? 'true' : 'false') +
      '" title="' + (on ? App.t('bank.bookmarkRemoveTitle') : App.t('bank.bookmarkAddTitle')) + '">' + (on ? '★' : '☆') + '</button>';
  }

  /** Thân câu hỏi khi đang đóng (collapsed). */
  function headHtml(q, idx) {
    const due = dueText(q.id);
    return '<div class="bank-head">' +
      '<span class="bank-idx">' + idx + '</span>' +
      '<span class="bank-q"' + (q.lang === 'en' ? ' lang="en"' : '') + '>' + App.md(q.q) + '</span>' +
      '<span class="bank-meta">' + topicBadge(q) + levelBadge(q) + statusDot(q.id) +
        (due ? '<span class="small muted bank-due">ôn lại: ' + due + '</span>' : '') +
      '</span>' +
      bookmarkBtn(q.id) +
      '<span class="bank-caret" aria-hidden="true">▾</span>' +
    '</div>';
  }

  /** Khối "✍️ Luyện trả lời" (mặc định thu gọn). */
  function practiceHtml(q) {
    const openAttr = S.practiceOpen[q.id] ? ' open' : '';
    const enAttr = q.lang === 'en' ? ' lang="en"' : '';
    const value = S.answers[q.id] || '';
    const micBtn = App.speech.supported
      ? '<button type="button" class="btn sm mic-btn" data-mic="' + esc(q.id) +
        ' aria-label="' + App.t('bank.micAria') + '">' + App.t('bank.micBtn') + '</button>'
      : '';
    const stats = S.speech[q.id] ? App.ui.speechStats(S.speech[q.id]) : '';
    const result = S.aiResult[q.id] ? App.ui.feedback(S.aiResult[q.id], q.lang) : '';
    return '<section class="bank-practice">' +
      '<details class="bank-practice-box" data-practice="' + esc(q.id) + '"' + openAttr + '>' +
        '<summary>' + App.t('bank.practiceTitle') + '</summary>' +
        '<div class="bank-practice-body">' +
          '<label class="field"><span>' + App.t('bank.answerLabel') + '</span>' +
            '<textarea class="textarea bank-answer" data-answer="' + esc(q.id) + '"' + enAttr +
              ' rows="4" placeholder="Trả lời bằng lời của bạn rồi nhờ AI chấm…">' + esc(value) + '</textarea></label>' +
          '<div class="row bank-practice-actions">' +
            '<button type="button" class="btn sm primary" data-grade-ai="' + esc(q.id) + '">' + App.t('bank.gradeAiBtn') + '</button>' +
            micBtn +
            '<span class="spacer"></span>' +
            '<span class="small muted">' + App.t('bank.scoreHint') + '</span>' +
          '</div>' +
          '<div class="bank-speech" data-speech="' + esc(q.id) + '">' + stats + '</div>' +
          '<div class="bank-ai-result" data-feedback="' + esc(q.id) + '">' + result + '</div>' +
        '</div>' +
      '</details>' +
    '</section>';
  }

  /** Đáp án mẫu, có thể bị che khi bật "Ẩn đáp án cho tới khi tự trả lời". */
  function answerHtml(q) {
    if (hideAnswer() && !S.revealed[q.id]) {
      return '<div class="bank-answer-hidden">' +
        '<p class="small muted">Đang bật chế độ ẩn đáp án — hãy tự trả lời trước khi xem.</p>' +
        '<button type="button" class="btn sm" data-reveal="' + esc(q.id) + '">' + App.t('bank.revealBtn') + '</button>' +
      '</div>';
    }
    const reportUrl = 'https://github.com/ducmanh2802/senior-java/issues/new?title=' +
      encodeURIComponent('Sai nội dung: ' + q.id) + '&body=' +
      encodeURIComponent('ID: ' + q.id + '\nTrang: ' + location.href + '\n\nSai ở đâu / nên sửa thế nào:\n') +
      '&labels=content';
    const items = tocItems(q.a);
    let toc = '';
    if (items.length > 1) {
      const links = items.map((t, i) => '<a href="#' + esc(secId(q.id, i)) + '" data-toc="' + esc(q.id) + '" data-idx="' + i + '">' + esc(t) + '</a>').join('');
      toc = '<nav class="bank-toc" aria-label="Mục lục đáp án"><div class="bank-toc-title">Mục lục</div><div class="bank-toc-list">' + links + '</div></nav>';
    }
    const collapsed = S.answerCollapsed[q.id] === true;
    const inner = addHeadingIds(App.md(q.a), q.id);
    return '<div class="bank-answer-wrap">' +
      '<div class="bank-answer-head"><button type="button" class="btn sm" data-toggle-answer="' + esc(q.id) + '">' + (collapsed ? 'Mở rộng đáp án' : 'Thu gọn đáp án') + '</button></div>' +
      toc +
      '<div class="bank-answer-body' + (collapsed ? ' is-collapsed' : '') + '" data-answer-body="' + esc(q.id) + '">' +
        '<div class="md">' + inner + '</div>' +
      '</div>' +
      '<div class="bank-report"><a class="btn sm" target="_blank" rel="noopener noreferrer" href="' +
        App.esc(reportUrl) + '">🚩 Báo sai</a></div>' +
    '</div>';
  }

  /** Mức tự đánh giá mà AI gợi ý (chỉ để highlight, người dùng tự bấm). */
  function suggestedMark(q) {
    const r = S.aiResult[q.id];
    if (!r || typeof r.score !== 'number') return '';
    return r.score >= 4 ? 'known' : r.score === 3 ? 'review' : 'unknown';
  }

  /** Thân câu hỏi khi đang mở (expanded). */
  function bodyHtml(q) {
    const follow = (q.follow || []).map(f => '<li>' + App.md(f) + '</li>').join('');
    const suggest = suggestedMark(q);
    return '<div class="bank-body">' +
      practiceHtml(q) +
      answerHtml(q) +
      (follow ? '<div class="bank-follow"><h4>' + App.t('bank.followTitle') + '</h4><ul>' + follow + '</ul></div>' : '') +
      '<div class="bank-grade">' +
        '<span class="small muted">' + App.t('bank.selfAssessLabel') + '</span>' +
        GRADES.map(g => '<button type="button" class="btn ' + g.cls + ' sm' +
          (suggest === g.id ? ' is-suggest' : '') + '" data-grade="' + g.id + '" data-id="' +
          esc(q.id) + '">' + App.t('bank.' + g.label) + '</button>').join('') +
      '</div>' +
    '</div>';
  }

  /** Một card câu hỏi. */
  function cardHtml(q, idx) {
    const open = !!S.expanded[q.id];
    return '<article class="card bank-card' + (open ? ' is-open' : '') + '" data-id="' + esc(q.id) + '">' +
      headHtml(q, idx) +
      (open ? bodyHtml(q) : '') +
    '</article>';
  }

  /** Chips chọn topic. */
  function topicChips() {
    const items = [{ id: 'all', name: 'Tất cả', icon: '📚' }].concat(App.topics());
    return '<div class="chips bank-topic-chips" role="group" aria-label="Lọc theo chủ đề">' +
      items.map(t => '<button type="button" class="chip' + (S.topic === t.id ? ' active' : '') +
        '" data-topic="' + esc(t.id) + '" aria-pressed="' + (S.topic === t.id ? 'true' : 'false') + '">' +
        esc((t.icon ? t.icon + ' ' : '') + t.name) + '</button>').join('') +
      '</div>';
  }

  /** Chips trạng thái. */
  function statusChips() {
    return '<div class="chips bank-status-chips" role="group" aria-label="Lọc theo trạng thái">' +
      STATUS_CHIPS.map(s => '<button type="button" class="chip' + (S.status === s.id ? ' active' : '') +
        '" data-status="' + s.id + '" aria-pressed="' + (S.status === s.id ? 'true' : 'false') + '">' +
        esc(App.t('bank.' + s.label)) + '</button>').join('') +
      '</div>';
  }

  /** Select level. */
  function levelSelect() {
    const opts = ['<option value="all"' + (S.level === 'all' ? ' selected' : '') + '>Mọi level</option>'];
    Object.keys(App.LEVELS).forEach(k => {
      opts.push('<option value="' + esc(k) + '"' + (S.level === k ? ' selected' : '') + '>' +
        esc(App.LEVELS[k]) + '</option>');
    });
    return '<label class="field bank-field"><span>Level</span><select class="select" id="bankLevel">' +
      opts.join('') + '</select></label>';
  }

  /** Thanh lọc: tìm kiếm + topic + level + trạng thái. */
  function filterBar() {
    const open = filtersOpen;
    const activeInfo = (S.topic !== 'all' || S.status !== 'all' || S.level !== 'all' || S.q)
      ? '<span class="badge bank-filter-badge">đang lọc</span>' : '';
    return '<section class="card bank-filters">' +
      '<div class="bank-search-row">' +
        '<label class="field bank-search"><span>' + App.t('bank.searchLabel') + '</span>' +
          '<input class="input" id="bankSearch" type="search" placeholder="' + App.t('bank.searchPlaceholder') + '" value="' +
          esc(S.q) + '" autocomplete="off"></label>' +
        levelSelect() +
      '</div>' +
      '<div class="bank-filter-toggle-row">' +
        '<label class="bank-toggle"><input type="checkbox" id="bankHideAnswer"' +
          (hideAnswer() ? ' checked' : '') + '> <span>' + App.t('bank.hideAnswerLabel') + '</span></label>' +
        '<button type="button" class="btn sm bank-filters-toggle" id="bankFiltersToggle" aria-expanded="' + (open ? 'true' : 'false') + '">Bộ lọc ' + (open ? '▲' : '▼') + '</button>' +
        activeInfo +
      '</div>' +
      '<div class="bank-filter-body' + (open ? ' is-open' : '') + '" id="bankFilterBody">' +
        topicChips() +
        statusChips() +
      '</div>' +
    '</section>';
  }

  /** Render danh sách câu hỏi + nút "Xem thêm" (phân trang). */
  function listHtml() {
    const all = filtered();
    if (!all.length) {
      return '<div class="empty bank-empty">' +
        '<p><strong>' + App.t('bank.emptyTitle') + '</strong></p>' +
        '<p class="small muted">' + App.t('bank.emptyHint') + '</p>' +
        '<button type="button" class="btn sm" id="bankClearFilters">Xoá bộ lọc</button>' +
      '</div>';
    }
    const slice = all.slice(0, S.shown);
    const cards = slice.map((q, i) => cardHtml(q, i + 1)).join('');
    const more = all.length > S.shown
      ? '<div class="bank-more"><button type="button" class="btn" id="bankMore">Xem thêm (' +
        (all.length - S.shown) + ' câu còn lại)</button></div>'
      : '';
    return '<div class="bank-list" id="bankList">' + cards + '</div>' + more;
  }

  /** Render lại phần tiêu đề + danh sách (giữ nguyên focus ô tìm kiếm). */
  function renderList() {
    const listWrap = document.getElementById('bankListWrap');
    if (!listWrap) return;
    const all = filtered();
    const count = document.getElementById('bankCount');
    if (count) count.textContent = all.length + ' câu hỏi đang hiển thị';
    // Dừng ghi âm trước khi thay DOM, tránh ghi vào textarea đã bị gỡ.
    if (mic) stopMic();
    listWrap.innerHTML = listHtml();
    syncExpandButtons(all);
    if (pendingScrollId) {
      const id = pendingScrollId; pendingScrollId = null;
      scrollToQuestion(id);
    }
  }

  function scrollToQuestion(id) {
    if (!rootEl) return;
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (card) card.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  /** Tìm index (1-based trong danh sách lọc) của một card. */
  function findCardIndex(card) {
    if (!card) return -1;
    const list = rootEl ? rootEl.querySelectorAll('.bank-card') : [];
    for (let i = 0; i < list.length; i++) if (list[i] === card) return i;
    return -1;
  }

  /** Đặt lại toàn bộ bộ lọc về mặc định. */
  function clearFilters() {
    S.topic = 'all'; S.level = 'all'; S.status = 'all'; S.q = '';
    S.shown = PAGE_SIZE;
    // render lại toàn view để đồng bộ input/select/chips
    if (rootEl) {
      const params = S.topic === 'all' ? [] : [S.topic];
      // gọi lại render bằng cách cập nhật url và rebuild UI đơn giản
    }
    syncUrl();
    rebuildUI();
  }

  function rebuildUI() {
    if (!rootEl) return;
    const container = rootEl.parentElement || rootEl;
    const all = filtered();
    const head =
      '<div class="page-head">' +
        '<div><h1>Ngân hàng câu hỏi</h1>' +
        '<p class="muted">Lọc theo chủ đề, level, trạng thái; mở đáp án mẫu và tự đánh giá để lên lịch ôn SRS.</p></div>' +
        '<div class="row bank-head-actions">' +
          '<span class="small muted" id="bankCount">' + all.length + ' câu hỏi đang hiển thị</span>' +
          '<button type="button" class="btn sm" id="bankExpandAll">Mở tất cả</button>' +
        '</div>' +
      '</div>';
    const resume = renderResumeBanner(all);
    rootEl.innerHTML = head + filterBar() + resume + '<div id="bankListWrap">' + listHtml() + '</div>';
    bindEvents();
    syncExpandButtons(all);
  }

  /** Banner gợi ý tiếp tục đọc câu hỏi lần trước. */
  function renderResumeBanner(all) {
    const pos = loadReadPos();
    if (!pos || !pos.id) return '';
    if (all.some(q => q.id === pos.id) && !S.expanded[pos.id]) {
      return '<div class="card bank-resume" id="bankResume">' +
        '<div><strong>Tiếp tục đọc</strong> <span class="small muted">bạn đang dở câu hỏi trước đó.</span></div>' +
        '<div class="row bank-resume-actions">' +
          '<button type="button" class="btn sm primary" id="bankResumeBtn" data-resume="' + esc(pos.id) + '">Mở lại</button>' +
          '<button type="button" class="btn sm" id="bankResumeDismiss">Ẩn</button>' +
        '</div></div>';
    }
    return '';
  }

  /** Cập nhật trạng thái nút "Mở/Thu gọn tất cả". */
  function syncExpandButtons(list) {
    const btn = document.getElementById('bankExpandAll');
    if (!btn) return;
    const arr = list || filtered();
    const anyClosed = arr.some(q => !S.expanded[q.id]);
    btn.textContent = anyClosed ? 'Mở tất cả' : 'Thu gọn tất cả';
    btn.dataset.mode = anyClosed ? 'open' : 'close';
  }

  /** Mở/thu gọn tất cả các câu đang hiển thị. */
  function toggleAll(mode) {
    const arr = filtered().slice(0, S.shown);
    arr.forEach(q => { S.expanded[q.id] = (mode === 'open'); });
    renderList();
  }

  /** Cập nhật URL (topic) mà không reload trang. */
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    const hash = S.topic === 'all' ? '#/bank' : '#/bank/' + encodeURIComponent(S.topic);
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  /** Gắn event cho toàn bộ view (delegation trên root). */
  function bindEvents() {
    if (!rootEl) return;

    // Listener trên #main chỉ gắn 1 lần (root tồn tại xuyên suốt các route).
    if (rootEl.dataset.bankBound !== '1') {
      rootEl.dataset.bankBound = '1';
      rootEl.addEventListener('click', onRootClick);
      rootEl.addEventListener('input', onRootInput);
      rootEl.addEventListener('toggle', onRootToggle, true);
    }

    // Ô tìm kiếm / select được tạo lại mỗi lần render -> gắn lại listener.
    const search = document.getElementById('bankSearch');
    if (search) {
      search.addEventListener('input', () => {
        const v = search.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          S.q = v;
          S.shown = PAGE_SIZE;
          renderList();
        }, DEBOUNCE_MS);
      });
    }

    const level = document.getElementById('bankLevel');
    if (level) level.addEventListener('change', () => {
      S.level = level.value;
      S.shown = PAGE_SIZE;
      renderList();
    });

    const hide = document.getElementById('bankHideAnswer');
    if (hide) hide.addEventListener('change', () => {
      setHideAnswer(hide.checked);
      renderList();
    });
  }

  /** Lưu câu trả lời đang gõ vào bộ nhớ (không lưu bền vững). */
  function onRootInput(e) {
    const ta = e.target.closest('[data-answer]');
    if (ta) S.answers[ta.dataset.answer] = ta.value;
  }

  /** Ghi nhớ khối "Luyện trả lời" đang mở hay đóng. */
  function onRootToggle(e) {
    const det = e.target && e.target.closest ? e.target.closest('[data-practice]') : null;
    if (det) S.practiceOpen[det.dataset.practice] = det.open;
  }

  /** Xử lý click trong view bank (event delegation). */
  function onRootClick(e) {
    const topicChip = e.target.closest('[data-topic]');
      if (topicChip) {
        S.topic = topicChip.dataset.topic;
        S.shown = PAGE_SIZE;
        rootEl.querySelectorAll('[data-topic]').forEach(b => {
          const on = b.dataset.topic === S.topic;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        syncUrl();
        renderList();
        return;
      }

      const statusChip = e.target.closest('[data-status]');
      if (statusChip) {
        S.status = statusChip.dataset.status;
        S.shown = PAGE_SIZE;
        rootEl.querySelectorAll('[data-status]').forEach(b => {
          const on = b.dataset.status === S.status;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        renderList();
        return;
      }

      const star = e.target.closest('[data-bookmark]');
      if (star) {
        e.stopPropagation();
        const on = App.store.toggleBookmark(star.dataset.bookmark);
        star.textContent = on ? '★' : '☆';
        star.setAttribute('aria-pressed', on ? 'true' : 'false');
        star.setAttribute('aria-label', on ? App.t('bank.bookmarkRemoveLabel') : App.t('bank.bookmarkAddLabel'));
        star.title = on ? App.t('bank.bookmarkRemoveTitle') : App.t('bank.bookmarkAddTitle');
        return;
      }

      const reveal = e.target.closest('[data-reveal]');
      if (reveal) {
        e.stopPropagation();
        S.revealed[reveal.dataset.reveal] = true;
        refreshCard(reveal.dataset.reveal);
        return;
      }

      const tocLink = e.target.closest('[data-toc]');
      if (tocLink) {
        e.preventDefault();
        e.stopPropagation();
        const id = tocLink.dataset.toc;
        const idx = Number(tocLink.dataset.idx || 0);
        const target = document.getElementById(secId(id, idx));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const toggleAns = e.target.closest('[data-toggle-answer]');
      if (toggleAns) {
        e.stopPropagation();
        const id = toggleAns.dataset.toggleAnswer;
        S.answerCollapsed[id] = !S.answerCollapsed[id];
        refreshCard(id);
        return;
      }

      if (e.target.closest('#bankFiltersToggle')) {
        filtersOpen = !filtersOpen;
        const body = document.getElementById('bankFilterBody');
        const btn = document.getElementById('bankFiltersToggle');
        if (body) body.classList.toggle('is-open', filtersOpen);
        if (btn) { btn.setAttribute('aria-expanded', filtersOpen ? 'true' : 'false'); btn.textContent = 'Bộ lọc ' + (filtersOpen ? '▲' : '▼'); }
        return;
      }

      if (e.target.closest('#bankClearFilters')) {
        clearFilters();
        return;
      }

      if (e.target.closest('#bankResumeBtn')) {
        const id = e.target.closest('#bankResumeBtn').dataset.resume;
        const banner = document.getElementById('bankResume');
        if (banner) banner.remove();
        openAndScroll(id);
        return;
      }
      if (e.target.closest('#bankResumeDismiss')) {
        const banner = document.getElementById('bankResume');
        if (banner) banner.remove();
        try { localStorage.removeItem(READ_KEY); } catch (ex) { /* ignore */ }
        return;
      }

      const micBtn = e.target.closest('[data-mic]');
      if (micBtn) {
        e.stopPropagation();
        toggleMic(micBtn.dataset.mic);
        return;
      }

      const aiBtn = e.target.closest('[data-grade-ai]');
      if (aiBtn) {
        e.stopPropagation();
        gradeAnswer(aiBtn.dataset.gradeAi, aiBtn);
        return;
      }

      const grade = e.target.closest('[data-grade]');
      if (grade) {
        e.stopPropagation();
        App.store.setStatus(grade.dataset.id, grade.dataset.grade);
        updateStatusDot(grade.dataset.id);
        return;
      }

      if (e.target.closest('#bankMore')) {
        S.shown += PAGE_SIZE;
        renderList();
        return;
      }

      const expandAll = e.target.closest('#bankExpandAll');
      if (expandAll) {
        toggleAll(expandAll.dataset.mode === 'close' ? 'close' : 'open');
        return;
      }

    const head = e.target.closest('.bank-head');
    if (head) {
      const card = head.closest('.bank-card');
      if (card) toggleCard(card.dataset.id);
    }
  }

  /** Mở một câu và cuộn tới nó (kể cả nếu chưa render do phân trang). */
  function openAndScroll(id) {
    if (!id) return;
    const all = filtered();
    const idx = all.findIndex(q => q.id === id);
    if (idx === -1) return;
    if (idx >= S.shown) S.shown = Math.ceil((idx + 1) / PAGE_SIZE) * PAGE_SIZE;
    S.expanded[id] = true;
    lastOpenId = id;
    saveReadPos(id);
    pendingScrollId = id;
    renderList();
  }

  /** Mở/thu gọn một câu hỏi (render lại card đó). */
  function toggleCard(id) {
    S.expanded[id] = !S.expanded[id];
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    const q = App.questions().find(x => x.id === id);
    if (!q) return;
    const open = !!S.expanded[id];
    if (open) { lastOpenId = id; saveReadPos(id); }
    card.classList.toggle('is-open', open);
    card.innerHTML = headHtml(q, card.querySelector('.bank-idx') ? Number(card.querySelector('.bank-idx').textContent) : 0) +
      (open ? bodyHtml(q) : '');
  }

  /** Render lại thân một card đang mở (giữ nguyên câu trả lời đang gõ). */
  function refreshCard(id) {
    if (!rootEl || !S.expanded[id]) return;
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    const q = App.questions().find(x => x.id === id);
    if (!q) return;
    const idx = card.querySelector('.bank-idx') ? Number(card.querySelector('.bank-idx').textContent) : 0;
    card.innerHTML = headHtml(q, idx) + bodyHtml(q);
  }

  /** Chấm câu trả lời tự luận bằng AI; chỉ highlight mức tự đánh giá gợi ý. */
  async function gradeAnswer(id, btn) {
    const q = App.questions().find(x => x.id === id);
    if (!q || !rootEl) return;
    const viewRoot = rootEl;
    const ta = rootEl.querySelector('textarea[data-answer="' + CSS.escape(id) + '"]');
    const answer = (ta ? ta.value : S.answers[id] || '').trim();
    const box = rootEl.querySelector('[data-feedback="' + CSS.escape(id) + '"]');
    if (!box) return;
    if (!answer) {
      box.innerHTML = '<div class="ai-error">⚠️ Hãy viết câu trả lời (hoặc dùng micro) trước khi nhờ AI chấm.</div>';
      return;
    }
    const buttons = rootEl.querySelectorAll('[data-grade-ai="' + CSS.escape(id) + '"]');
    buttons.forEach(b => { b.disabled = true; });
    box.innerHTML = '<span class="ai-loading">' + App.t('bank.aiWait') + '</span>';
    try {
      const r = await App.ai.grade({
        question: q.q,
        reference: q.a,
        answer: answer,
        lang: q.lang === 'en' ? 'en' : 'vi',
        topic: q.topic,
        level: q.level,
        speech: S.speech[id] || undefined,
      });
      S.aiResult[id] = r;
      if (rootEl !== viewRoot) return;
      const currentBox = viewRoot.querySelector('[data-feedback="' + CSS.escape(id) + '"]');
      if (currentBox) currentBox.innerHTML = App.ui.feedback(r, q.lang);
      const suggest = r.score >= 4 ? 'known' : r.score === 3 ? 'review' : 'unknown';
      const card = viewRoot.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
      if (card) card.querySelectorAll('[data-grade]').forEach(b => {
        b.classList.toggle('is-suggest', b.dataset.grade === suggest);
      });
    } catch (e) {
      if (rootEl === viewRoot) {
        const currentBox = viewRoot.querySelector('[data-feedback="' + CSS.escape(id) + '"]');
        if (currentBox) currentBox.innerHTML = App.ui.error(e);
      }
    } finally {
      buttons.forEach(b => { b.disabled = false; });
    }
  }

  function setMicBtn(id, recording) {
    if (!rootEl) return;
    const btn = rootEl.querySelector('[data-mic="' + CSS.escape(id) + '"]');
    if (!btn) return;
    btn.classList.toggle('recording', recording);
    btn.textContent = recording ? '⏹ ' + App.t('bank.micStopLabel') : '🎤 ' + App.t('bank.micBtn');
    btn.setAttribute('aria-label', recording ? App.t('bank.micStopAria') : App.t('bank.micAria'));
  }

  function micError(id, msg) {
    if (!rootEl) return;
    const box = rootEl.querySelector('[data-feedback="' + CSS.escape(id) + '"]');
    if (box) box.innerHTML = '<div class="ai-error">⚠️ ' + esc(msg) + '</div>';
  }

  function stopMic() {
    if (!mic) return;
    const id = mic.id;
    const handle = mic.handle;
    mic = null;
    let metrics = null;
    try { metrics = handle.stop(); } catch (e) { /* ignore */ }
    setMicBtn(id, false);
    if (!metrics) return;
    S.speech[id] = metrics;
    if (!rootEl) return;
    const ta = rootEl.querySelector('textarea[data-answer="' + CSS.escape(id) + '"]');
    if (ta) S.answers[id] = ta.value;
    const stats = rootEl.querySelector('[data-speech="' + CSS.escape(id) + '"]');
    if (stats) stats.innerHTML = App.ui.speechStats(metrics);
  }

  function toggleMic(id) {
    if (mic && mic.id === id) { stopMic(); return; }
    if (mic) stopMic();
    const q = App.questions().find(x => x.id === id);
    if (!q || !rootEl) return;
    const ta = rootEl.querySelector('textarea[data-answer="' + CSS.escape(id) + '"]');
    if (!ta) return;
    try {
      const handle = App.speech.start({
        lang: q.lang === 'en' ? 'en' : 'vi',
        onText(finalText, interim) {
          const v = finalText + (interim ? (finalText ? ' ' : '') + interim : '');
          ta.value = v;
          S.answers[id] = v;
        },
        onError(msg) {
          mic = null;
          setMicBtn(id, false);
          micError(id, msg);
        },
      });
      mic = { id: id, handle: handle };
      setMicBtn(id, true);
    } catch (e) {
      micError(id, e && e.message ? e.message : 'Không mở được micro.');
    }
  }

  /** Cập nhật chấm trạng thái sau khi tự đánh giá. */
  function updateStatusDot(id) {
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    const dotWrap = card.querySelector('.bank-dot-wrap');
    if (!dotWrap) return;
    const s = App.store.getStatus(id);
    const info = s && App.STATUS[s] ? App.STATUS[s] : { label: App.t('bank.unknown'), cls: '' };
    dotWrap.innerHTML = '<span class="dot ' + info.cls + '"></span>';
    dotWrap.title = info.label;
  }

  App.registerView('bank', {
    get title() { return App.t('bank.title'); },
    render(root, params) {
      // Topic lấy từ route (#/bank/core), mặc định "all".
      const topicParam = (params && params[0]) || 'all';
      S.topic = topicParam === 'all' ? 'all' : topicParam;
      if (S.topic !== 'all' && !App.topics().some(t => t.id === S.topic)) S.topic = 'all';
      S.shown = PAGE_SIZE;

      const all = filtered();
      const head =
        '<div class="page-head">' +
          '<div><h1>Ngân hàng câu hỏi</h1>' +
          '<p class="muted">Lọc theo chủ đề, level, trạng thái; mở đáp án mẫu và tự đánh giá để lên lịch ôn SRS.</p></div>' +
          '<div class="row bank-head-actions">' +
            '<span class="small muted" id="bankCount">' + all.length + ' câu hỏi đang hiển thị</span>' +
            '<button type="button" class="btn sm" id="bankExpandAll" title="Phím tắt: E">Mở tất cả <kbd>E</kbd></button>' +
          '</div>' +
        '</div>';
      const resume = renderResumeBanner(all);
      const kbdHint = '<p class="small muted bank-kbd-hint" aria-label="Phím tắt">Phím tắt: <kbd>/</kbd> tìm kiếm · <kbd>E</kbd> mở/thu gọn tất cả · <kbd>F</kbd> bộ lọc</p>';

      root.innerHTML = '<div id="bankRoot">' + head + filterBar() + kbdHint + resume +
        '<div id="bankListWrap">' + listHtml() + '</div></div>';

      rootEl = document.getElementById('bankRoot');
      bindEvents();
      syncExpandButtons(all);
      keyCleanup = App.onKey(function (e) {
        if (!rootEl) return;
        if (e.key === '/') {
          e.preventDefault();
          const s = document.getElementById('bankSearch');
          if (s) { s.focus(); s.select(); }
          return;
        }
        if (e.key === 'e' || e.key === 'E') {
          const btn = document.getElementById('bankExpandAll');
          if (btn) toggleAll(btn.dataset.mode === 'close' ? 'close' : 'open');
          return;
        }
        if (e.key === 'f' || e.key === 'F') {
          const t = document.getElementById('bankFiltersToggle');
          if (t) t.click();
        }
      });

      return () => {
        clearTimeout(searchTimer);
        if (mic) stopMic();
        if (keyCleanup) keyCleanup();
        keyCleanup = null;
        if (lastOpenId) saveReadPos(lastOpenId);
        rootEl = null;
      };
    },
  });
})();
