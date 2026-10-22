/* View "bank" — owner: task T09. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  const PAGE_SIZE = 150;
  const DEBOUNCE_MS = 150;

  const STATUS_CHIPS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'due', label: 'Đến hạn ôn' },
    { id: 'unseen', label: 'Chưa học' },
    { id: 'unknown', label: 'Chưa biết' },
    { id: 'review', label: 'Cần ôn' },
    { id: 'known', label: 'Đã thuộc' },
    { id: 'bookmarked', label: 'Đã đánh dấu' },
  ];
  const GRADES = [
    { id: 'known', label: 'Đã thuộc', cls: 'ok' },
    { id: 'review', label: 'Cần ôn', cls: 'warn' },
    { id: 'unknown', label: 'Chưa biết', cls: 'bad' },
  ];

  /** Trạng thái filter giữ giữa các lần render. */
  const S = {
    topic: 'all',
    level: 'all',
    status: 'all',
    q: '',
    shown: PAGE_SIZE,
    expanded: {},   // id -> true (đã mở)
    loaded: {},     // id -> true (đáp án đã render)
  };

  let rootEl = null;
  let searchTimer = null;

  function esc(s) { return App.esc(s); }

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
      (on ? 'Bỏ đánh dấu câu hỏi' : 'Đánh dấu câu hỏi') + '" aria-pressed="' + (on ? 'true' : 'false') +
      '" title="' + (on ? 'Bỏ đánh dấu' : 'Đánh dấu') + '">' + (on ? '★' : '☆') + '</button>';
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

  /** Thân câu hỏi khi đang mở (expanded). */
  function bodyHtml(q) {
    const follow = (q.follow || []).map(f => '<li>' + App.md(f) + '</li>').join('');
    return '<div class="bank-body">' +
      '<div class="md">' + App.md(q.a) + '</div>' +
      (follow ? '<div class="bank-follow"><h4>Interviewer có thể hỏi tiếp</h4><ul>' + follow + '</ul></div>' : '') +
      '<div class="bank-grade">' +
        '<span class="small muted">Tự đánh giá:</span>' +
        GRADES.map(g => '<button type="button" class="btn ' + g.cls + ' sm" data-grade="' + g.id + '" data-id="' +
          esc(q.id) + '">' + g.label + '</button>').join('') +
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
        esc(s.label) + '</button>').join('') +
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
    return '<section class="card bank-filters">' +
      '<div class="bank-search-row">' +
        '<label class="field bank-search"><span>Tìm kiếm</span>' +
          '<input class="input" id="bankSearch" type="search" placeholder="Từ khoá trong câu hỏi, đáp án, tag…" value="' +
          esc(S.q) + '" autocomplete="off"></label>' +
        levelSelect() +
      '</div>' +
      topicChips() +
      statusChips() +
    '</section>';
  }

  /** Render danh sách câu hỏi + nút "Xem thêm" (phân trang). */
  function listHtml() {
    const all = filtered();
    if (!all.length) {
      return '<div class="empty"><p>Không có câu hỏi nào khớp bộ lọc hiện tại.</p>' +
        '<p class="small">Thử bỏ bớt điều kiện lọc hoặc xem tất cả chủ đề.</p></div>';
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
    listWrap.innerHTML = listHtml();
    syncExpandButtons(all);
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
        star.setAttribute('aria-label', on ? 'Bỏ đánh dấu câu hỏi' : 'Đánh dấu câu hỏi');
        star.title = on ? 'Bỏ đánh dấu' : 'Đánh dấu';
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

  /** Mở/thu gọn một câu hỏi (render lại card đó). */
  function toggleCard(id) {
    S.expanded[id] = !S.expanded[id];
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    const q = App.questions().find(x => x.id === id);
    if (!q) return;
    const open = !!S.expanded[id];
    card.classList.toggle('is-open', open);
    card.innerHTML = headHtml(q, card.querySelector('.bank-idx') ? Number(card.querySelector('.bank-idx').textContent) : 0) +
      (open ? bodyHtml(q) : '');
  }

  /** Cập nhật chấm trạng thái sau khi tự đánh giá. */
  function updateStatusDot(id) {
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    const dotWrap = card.querySelector('.bank-dot-wrap');
    if (!dotWrap) return;
    const s = App.store.getStatus(id);
    const info = s && App.STATUS[s] ? App.STATUS[s] : { label: 'Chưa học', cls: '' };
    dotWrap.innerHTML = '<span class="dot ' + info.cls + '"></span>';
    dotWrap.title = info.label;
  }

  App.registerView('bank', {
    title: 'Ngân hàng câu hỏi',
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
            '<button type="button" class="btn sm" id="bankExpandAll">Mở tất cả</button>' +
          '</div>' +
        '</div>';

      root.innerHTML = '<div id="bankRoot">' + head + filterBar() +
        '<div id="bankListWrap">' + listHtml() + '</div></div>';

      rootEl = document.getElementById('bankRoot');
      bindEvents();
      syncExpandButtons(all);

      return () => {
        clearTimeout(searchTimer);
        rootEl = null;
      };
    },
  });
})();
