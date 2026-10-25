/* View "flash" — owner: task T10. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

App.i18n.add({
  vi: {
    'flash.title': 'Flashcard',
    'flash.subtitle': 'Lật thẻ, tự chấm điểm — lịch ôn được lên tự động theo lặp lại ngắt quãng.',
    'flash.topicLabel': 'Chủ đề',
    'flash.modeLabel': 'Chế độ',
    'flash.topicAll': 'Tất cả chủ đề',
    'flash.modeDue': 'Đến hạn ôn (lặp lại ngắt quãng)',
    'flash.modeSmart': 'Thông minh (ưu tiên câu yếu)',
    'flash.modeWeak': 'Chỉ câu chưa thuộc',
    'flash.modeBookmarked': 'Đã đánh dấu',
    'flash.modeAll': 'Tất cả (ngẫu nhiên)',
    'flash.flipBtn': 'Lật thẻ',
    'flash.flipHint': 'Nghĩ trước khi lật thẻ',
    'flash.gradeTitle': 'Chấm để tự đánh giá:',
    'flash.gradeUnknown': 'Chưa biết',
    'flash.gradeReview': 'Cần ôn',
    'flash.gradeKnown': 'Đã thuộc',
    'flash.emptyTitle': 'Chưa có câu nào trong bộ bài này',
    'flash.emptyHint': 'Bộ bài đang chọn không có câu phù hợp. Hãy đổi chủ đề hoặc chế độ ôn.',
    'flash.newDeckBtn': 'Bộ bài mới',
    'flash.viewBankBtn': 'Xem ngân hàng câu hỏi',
    'flash.summaryTitle': 'Hết bộ bài',
    'flash.summaryText': 'Bạn đã chấm {n} câu trong phiên này.',
    'flash.weakBtn': 'Ôn lại câu chưa thuộc',
    'flash.toastSaved': 'Đã lưu tiến độ',
    'flash.toastDueDays': 'Ôn lại sau {n} ngày',
    'flash.followTitle': 'Câu hỏi đào sâu thường gặp',
    'flash.bookmarkedBadge': '★ Đã đánh dấu',
    'flash.keysFlip': 'lật thẻ',
    'flash.keysUnknown': 'chưa biết',
    'flash.keysReview': 'cần ôn',
    'flash.keysKnown': 'đã thuộc',
    'flash.keysNav': 'điều hướng',
    'flash.keysBookmark': 'đánh dấu',
      'flash.toastBookmarked': 'Đã đánh dấu câu hỏi', 'flash.toastUnmarked': 'Đã bỏ đánh dấu',
      'flash.hint.due': 'Câu chưa vững sẽ quay lại sau 1–2 ngày, câu đã thuộc giãn dần 3 → 8 → 20+ ngày.',
      'flash.hint.smart': 'Ưu tiên: đến hạn → chưa biết → chưa học → cần ôn → đã thuộc.',
      'flash.hint.weak': 'Chỉ luyện những câu bạn chưa thuộc (chưa biết / cần ôn / chưa học).',
      'flash.hint.bookmarked': 'Chỉ những câu bạn đã đánh dấu sao.',
      'flash.hint.all': 'Toàn bộ câu hỏi trong bộ, xáo trộn ngẫu nhiên.',
  },
  en: {
    'flash.title': 'Flashcards',
    'flash.subtitle': 'Flip cards, self-rate — reviews are scheduled automatically with spaced repetition.',
    'flash.topicLabel': 'Topic',
    'flash.modeLabel': 'Mode',
    'flash.topicAll': 'All topics',
    'flash.modeDue': 'Due (spaced review)',
    'flash.modeSmart': 'Smart (prioritize weak)',
    'flash.modeWeak': 'Only unlearned',
    'flash.modeBookmarked': 'Bookmarked',
    'flash.modeAll': 'All (random)',
    'flash.flipBtn': 'Flip <kbd>Space</kbd>',
    'flash.flipHint': 'Think before flipping',
    'flash.gradeTitle': 'Self-rate:',
    'flash.gradeUnknown': "Don't know",
    'flash.gradeReview': 'Review',
    'flash.gradeKnown': 'Known',
    'flash.emptyTitle': 'No cards in this deck',
    'flash.emptyHint': 'The selected deck has no matching questions. Try changing the topic or mode.',
    'flash.newDeckBtn': 'New deck',
    'flash.viewBankBtn': 'View question bank',
    'flash.summaryTitle': 'Deck complete',
    'flash.summaryText': 'You rated {n} cards in this session.',
    'flash.weakBtn': 'Review weak cards',
    'flash.toastSaved': 'Progress saved',
    'flash.toastDueDays': 'Review in {n} days',
    'flash.followTitle': 'Common follow-up questions',
    'flash.bookmarkedBadge': '★ Bookmarked',
    'flash.keysFlip': 'flip',
    'flash.keysUnknown': "don't know",
    'flash.keysReview': 'review',
    'flash.keysKnown': 'known',
    'flash.keysNav': 'navigate',
    'flash.keysBookmark': 'bookmark',
      'flash.toastBookmarked': 'Bookmarked', 'flash.toastUnmarked': 'Unbookmarked',
      'flash.hint.due': 'Weak questions return after 1–2 days, known questions stretch 3 → 8 → 20+ days.',
      'flash.hint.smart': 'Priority: due → unknown → unseen → review → known.',
      'flash.hint.weak': 'Only practice questions you haven\'t learned (unknown / review / unseen).',
      'flash.hint.bookmarked': 'Only bookmarked questions.',
      'flash.hint.all': 'All questions in the set, randomly shuffled.',
  },
});

  const MODES = [
    { id: 'due', label: 'Đến hạn ôn (lặp lại ngắt quãng)' },
    { id: 'smart', label: 'Thông minh (ưu tiên câu yếu)' },
    { id: 'weak', label: 'Chỉ câu chưa thuộc' },
    { id: 'bookmarked', label: 'Đã đánh dấu' },
    { id: 'all', label: 'Tất cả (ngẫu nhiên)' },
  ];
  const GRADES = [
    { id: 'unknown', label: 'Chưa biết', key: '1', cls: 'bad' },
    { id: 'review', label: 'Cần ôn', key: '2', cls: 'warn' },
    { id: 'known', label: 'Đã thuộc', key: '3', cls: 'ok' },
  ];
  const MODE_HINT = {
    due: 'Câu chưa vững sẽ quay lại sau 1–2 ngày, câu đã thuộc giãn dần 3 → 8 → 20+ ngày.',
    smart: 'Ưu tiên: đến hạn → chưa biết → chưa học → cần ôn → đã thuộc.',
    weak: 'Chỉ luyện những câu bạn chưa thuộc (chưa biết / cần ôn / chưa học).',
    bookmarked: 'Chỉ những câu bạn đã đánh dấu sao.',
    all: 'Toàn bộ câu hỏi trong bộ, xáo trộn ngẫu nhiên.',
  };

  // State giữ giữa các lần render (đổi chế độ / topic không reset phiên đang chạy).
  const S = {
    topic: 'all',
    mode: 'due',
    deck: [],
    idx: 0,
    flipped: false,
    counts: { unknown: 0, review: 0, known: 0 },
    done: false,
    graded: {},      // id -> status đã chấm trong phiên
    timer: null,
    toastTimer: null,
  };

  /** Câu hỏi của topic đang chọn. */
  function pool() {
    const all = App.questions();
    if (S.topic === 'all') return all;
    return all.filter(q => q.topic === S.topic);
  }

  /** Sắp xếp theo độ ưu tiên của chế độ "thông minh". */
  function smartOrder(list) {
    const rank = q => {
      const due = App.store.isDue(q.id);
      if (due) return 0;
      const s = App.store.getStatus(q.id);
      if (s === 'unknown') return 1;
      if (!s) return 2;
      if (s === 'review') return 3;
      return 4;
    };
    const groups = [[], [], [], [], []];
    list.forEach(q => groups[rank(q)].push(q));
    const out = [];
    groups.forEach(g => out.push.apply(out, App.shuffle(g)));
    return out;
  }

  /** Dựng bộ bài theo chế độ hiện tại. */
  function buildDeck() {
    let list = pool();
    if (S.mode === 'due') {
      list = list.filter(q => App.store.isDue(q.id))
        .sort((a, b) => App.store.getDue(a.id) - App.store.getDue(b.id));
    } else if (S.mode === 'weak') {
      list = list.filter(q => {
        const s = App.store.getStatus(q.id);
        return !s || s === 'unknown' || s === 'review';
      });
    } else if (S.mode === 'bookmarked') {
      list = list.filter(q => App.store.isBookmarked(q.id));
    } else if (S.mode === 'smart') {
      list = smartOrder(list);
    } else {
      list = App.shuffle(list);
    }
    return list;
  }

  function topicName(id) {
    if (id === 'all') return 'Tất cả chủ đề';
    const t = App.topic(id);
    return (t.icon ? t.icon + ' ' : '') + t.name;
  }
  /** Badge level của câu hỏi. */
  function levelBadge(q) {
    const lv = App.LEVELS[q.level];
    return lv ? '<span class="badge accent">' + App.esc(lv) + '</span>' : '';
  }

  /** Badge trạng thái đã lưu của câu hỏi. */
  function statusBadge(id) {
    const s = App.store.getStatus(id);
    if (s && App.STATUS[s]) return '<span class="badge ' + App.STATUS[s].cls + '">' + App.STATUS[s].label + '</span>';
    return '<span class="badge">' + App.t('flash.gradeUnknown') + '</span>';
  }

  /** Select chủ đề (mặc định lấy từ param của route). */
  function topicSelect() {
    const opts = ['<option value="all"' + (S.topic === 'all' ? ' selected' : '') + '>Tất cả chủ đề</option>'];
    App.topics().forEach(t => {
      opts.push('<option value="' + App.esc(t.id) + '"' + (S.topic === t.id ? ' selected' : '') + '>' +
        App.esc((t.icon ? t.icon + ' ' : '') + t.name) + '</option>');
    });
    return '<label class="field flash-field"><span>Chủ đề</span>' +
      '<select class="select" id="flashTopic">' + opts.join('') + '</select></label>';
  }

  /** Select chế độ bộ bài. */
  function modeSelect() {
    const opts = MODES.map(m => '<option value="' + m.id + '"' + (S.mode === m.id ? ' selected' : '') + '>' +
      App.esc(m.label) + '</option>');
    return '<label class="field flash-field"><span>Chế độ</span>' +
      '<select class="select" id="flashMode">' + opts.join('') + '</select></label>';
  }

  /** Thanh thiết lập phía trên: chủ đề + chế độ + dòng giải thích. */
  function setupBar() {
    return '<section class="card flash-setup">' +
      '<div class="flash-setup-row">' + topicSelect() + modeSelect() +
        '<div class="flash-setup-info"><div class="flash-hint">' + App.esc(MODE_HINT[S.mode]) + '</div>' +
        '<div class="flash-deck-info small muted">' + S.deck.length + ' câu trong bộ · ' +
        App.esc(topicName(S.topic)) + '</div></div>' +
      '</div>' +
    '</section>';
  }

  /** Mặt trước của thẻ: topic, level, câu hỏi. */
  function cardFront(q) {
    const t = App.topic(q.topic);
    return '<div class="flash-card-inner">' +
      '<div class="flash-card-meta">' +
        '<span class="badge">' + App.esc((t.icon ? t.icon + ' ' : '') + t.name) + '</span>' +
        levelBadge(q) + statusBadge(q.id) +
        (App.store.isBookmarked(q.id) ? '<span class="badge accent">' + App.t('flash.bookmarkedBadge') + '</span>' : '') +
      '</div>' +
      '<div class="flash-q"' + (q.lang === 'en' ? ' lang="en"' : '') + '>' + App.md(q.q) + '</div>' +
      '<div class="flash-card-foot"><span class="small muted">Nghĩ trước khi lật thẻ</span>' +
        '<button type="button" class="btn primary" id="flashFlip">' + App.t('flash.flipBtn') + '</button>' +
      '</div>' +
    '</div>';
  }

  /** Mặt sau: đáp án mẫu + câu hỏi đào sâu. */
  function cardBack(q) {
    const follow = (q.follow || []).map(f => '<li>' + App.md(f) + '</li>').join('');
    return '<div class="flash-card-inner">' +
      '<div class="flash-card-meta">' +
        '<span class="badge">' + App.esc((App.topic(q.topic).icon || '') + ' ' + App.topic(q.topic).name) + '</span>' +
        levelBadge(q) +
      '</div>' +
      '<div class="flash-q flash-q-back"' + (q.lang === 'en' ? ' lang="en"' : '') + '>' + App.md(q.q) + '</div>' +
      '<div class="flash-a md">' + App.md(q.a) + '</div>' +
      (follow ? '<div class="flash-follow"><h4>Câu hỏi đào sâu thường gặp</h4><ul>' + follow + '</ul></div>' : '') +
      '<div class="flash-grade">' +
        '<span class="small muted">' + App.t('flash.gradeTitle') + '</span>' +
        GRADES.map(g => '<button type="button" class="btn ' + g.cls + '" data-grade="' + g.id + '">' +
          g.label + ' <kbd>' + g.key + '</kbd></button>').join('') +
      '</div>' +
    '</div>';
  }

  /** Thẻ hiện tại. */
  function cardHtml(q) {
    return '<article class="card flash-card' + (S.flipped ? ' is-flipped' : '') + '" id="flashCard">' +
      (S.flipped ? cardBack(q) : cardFront(q)) +
    '</article>';
  }





  /** Thanh tiến độ + đếm số lần chấm trong phiên. */
  function progressHtml() {
    const total = S.deck.length || 1;
    const done = Math.min(S.idx, S.deck.length);
    const pct = Math.round((done / total) * 100);
    const c = S.counts;
    return '<div class="flash-progress card">' +
      '<div class="flash-progress-top">' +
        '<span class="flash-count">' + done + ' / ' + S.deck.length + '</span>' +
        '<span class="flash-counts">' +
          '<span class="badge bad">' + App.t('flash.gradeUnknown') + ': ' + c.unknown + '</span>' +
          '<span class="badge warn">' + App.t('flash.gradeReview') + ': ' + c.review + '</span>' +
          '<span class="badge ok">' + App.t('flash.gradeKnown') + ': ' + c.known + '</span>' +
        '</span>' +
      '</div>' +
      '<div class="progress"><i class="accent" style="width:' + pct + '%"></i></div>' +
    '</div>';
  }

  /** Gợi ý phím tắt. */
  function keysHtml() {
    return '<div class="flash-keys small muted">' +
      '<span><kbd>Space</kbd> ' + App.t('flash.keysFlip') + '</span>' +
      '<span><kbd>1</kbd> ' + App.t('flash.keysUnknown') + '</span>' +
      '<span><kbd>2</kbd> ' + App.t('flash.keysReview') + '</span>' +
      '<span><kbd>3</kbd> ' + App.t('flash.keysKnown') + '</span>' +
      '<span><kbd>←</kbd> <kbd>→</kbd> ' + App.t('flash.keysNav') + '</span>' +
      '<span><kbd>B</kbd> ' + App.t('flash.keysBookmark') + '</span>' +
    '</div>';
  }

  /** Màn tóm tắt khi hết bộ bài. */
  function summaryHtml() {
    const c = S.counts;
    const graded = c.unknown + c.review + c.known;
    const weak = S.deck.filter(q => {
      const s = App.store.getStatus(q.id);
      return s === 'unknown' || s === 'review';
    });
    return '<section class="card flash-summary">' +
      '<h2>' + App.t('flash.summaryTitle') + '</h2>' +
      '<p class="muted">' + App.t('flash.summaryText', {n: graded}) + '</p>' +
      '<div class="flash-sum-stats">' +
        '<div class="stat"><div class="num bad">' + c.unknown + '</div><div class="lbl">' + App.t('flash.gradeUnknown') + '</div></div>' +
        '<div class="stat"><div class="num warn">' + c.review + '</div><div class="lbl">' + App.t('flash.gradeReview') + '</div></div>' +
        '<div class="stat"><div class="num ok">' + c.known + '</div><div class="lbl">' + App.t('flash.gradeKnown') + '</div></div>' +
      '</div>' +
      '<div class="row flash-sum-actions">' +
        '<button type="button" class="btn primary" id="flashRetryWeak"' + (weak.length ? '' : ' disabled') + '>' +
          'Ôn lại câu chưa thuộc (' + weak.length + ')</button>' +
        '<button type="button" class="btn" id="flashNewDeck">Bộ bài mới</button>' +
        '<a class="btn ghost" href="#/bank">' + App.t('flash.viewBankBtn') + '</a>' +
      '</div>' +
    '</section>';
  }

  /** Số ngày tới hạn ôn lại sau khi chấm. */
  function nextDueDays(id) {
    const due = App.store.getDue(id);
    if (due == null) return null;
    return Math.max(0, Math.round((due - App.startOfDay(Date.now())) / App.DAY));
  }

  /** Chấm câu hiện tại và sang câu tiếp. */
  function grade(status) {
    const q = S.deck[S.idx];
    if (!q) return;
    App.store.setStatus(q.id, status);
    S.counts[status] = (S.counts[status] || 0) + 1;
    S.graded[q.id] = status;
    const days = nextDueDays(q.id);
    showToast(days == null ? App.t('flash.toastSaved') : App.t('flash.toastDueDays', {n: days}));
    goNext();
  }

  /** Toast tự ẩn. */
  function showToast(msg) {
    const el = document.getElementById('flashToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    if (S.toastTimer) clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /** Lật thẻ. */
  function flip() {
    if (!S.deck.length) return;
    S.flipped = !S.flipped;
    renderCard();
  }

  /** Điều hướng trong bộ bài. */
  function go(delta) {
    if (!S.deck.length) return;
    S.idx = Math.max(0, Math.min(S.deck.length - 1, S.idx + delta));
    S.flipped = false;
    renderCard();
  }

  /** Vẽ lại phần thẻ + thanh tiến độ (không vẽ lại setup). */
  function renderCard() {
    const cardWrap = document.getElementById('flashCardWrap');
    if (!cardWrap) return;
    const q = S.deck[S.idx];
    if (!S.deck.length) { cardWrap.innerHTML = emptyHtml(); return; }
    if (!q) { cardWrap.innerHTML = summaryHtml(); bindCardEvents(); return; }
    cardWrap.innerHTML = progressHtml() + cardHtml(q) + keysHtml();
    bindCardEvents();
  }

  /** Sang câu tiếp; hết bộ thì hiện tóm tắt. */
  function goNext() {
    if (!S.deck.length) return;
    S.idx += 1;
    S.flipped = false;
    if (S.idx >= S.deck.length) { S.idx = S.deck.length; S.done = true; }
    renderCard();
  }

  /** Bộ bài rỗng: hướng dẫn đổi chế độ/topic. */
  function emptyHtml() {
    return '<section class="card flash-empty">' +
      '<h2>' + App.t('flash.emptyTitle') + '</h2>' +
      '<p class="muted">' + App.t('flash.emptyHint') + '</p>' +
      '<div class="row">' +
        '<button type="button" class="btn primary" id="flashNewDeck">' + App.t('flash.newDeckBtn') + '</button>' +
        '<a class="btn ghost" href="#/bank">' + App.t('flash.viewBankBtn') + '</a>' +
      '</div>' +
    '</section>';
  }

  /** Dựng lại bộ bài từ chế độ/topic hiện tại và render lại toàn bộ view. */
  function rebuild(root) {
    S.deck = buildDeck();
    S.idx = 0;
    S.flipped = false;
    S.done = false;
    S.counts = { unknown: 0, review: 0, known: 0 };
    S.graded = {};
    render(root);
  }



  let rootEl = null;

  /** Gắn event cho thẻ hiện tại (delegation trên #flashCardWrap). */
  function bindCardEvents() {
    const wrap = document.getElementById('flashCardWrap');
    if (!wrap || wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    wrap.addEventListener('click', e => {
      if (e.target.closest('#flashFlip')) { flip(); return; }
      const gradeBtn = e.target.closest('[data-grade]');
      if (gradeBtn) { grade(gradeBtn.dataset.grade); return; }
      if (e.target.closest('#flashRetryWeak')) {
        const weak = S.deck.filter(q => {
          const s = App.store.getStatus(q.id);
          return s === 'unknown' || s === 'review';
        });
        S.deck = weak;
        S.idx = 0;
        S.flipped = false;
        S.done = false;
        renderCard();
        return;
      }
      if (e.target.closest('#flashNewDeck')) rebuild(rootEl);
    });
  }

  /** Render toàn bộ view. */
  function render(root) {
    rootEl = root;
    const q = S.deck[S.idx];
    let body;
    if (!S.deck.length) body = emptyHtml();
    else if (S.done || !q) body = summaryHtml();
    else body = progressHtml() + cardHtml(q) + keysHtml();
    root.innerHTML =
      '<div class="page-head"><div><h1>Flashcard</h1>' +
      '<p>Lật thẻ, tự chấm điểm — lịch ôn được lên tự động theo lặp lại ngắt quãng.</p></div></div>' +
      setupBar() +
      '<div id="flashCardWrap" class="flash-wrap">' + body + '</div>' +
      '<div id="flashToast" class="flash-toast" role="status" aria-live="polite"></div>';
    bindCardEvents();
    bindSetup(root);
  }

  /** Gắn event cho select topic / mode. */
  function bindSetup(root) {
    const topic = document.getElementById('flashTopic');
    const mode = document.getElementById('flashMode');
    if (topic) topic.addEventListener('change', () => {
      S.topic = topic.value;
      rebuild(root);
    });
    if (mode) mode.addEventListener('change', () => {
      S.mode = mode.value;
      rebuild(root);
    });
  }



  /** Phím tắt. */
  function onKeyDown(e) {
    if (!S.deck.length || S.done) return;
    const k = e.key;
    if (k === ' ' || k === 'Spacebar') { e.preventDefault(); flip(); return; }
    if (k === '1') { e.preventDefault(); grade('unknown'); return; }
    if (k === '2') { e.preventDefault(); grade('review'); return; }
    if (k === '3') { e.preventDefault(); grade('known'); return; }
    if (k === 'ArrowRight') { e.preventDefault(); go(1); return; }
    if (k === 'ArrowLeft') { e.preventDefault(); go(-1); return; }
    if (k === 'b' || k === 'B') {
      const q = S.deck[S.idx];
      if (!q) return;
      const on = App.store.toggleBookmark(q.id);
      showToast(on ? App.t('flash.toastBookmarked') : App.t('flash.toastUnmarked'));
      renderCard();
    }
  }

  App.registerView('flash', {
    get title() { return App.t('flash.title'); },
    render(root, params) {
      const p = (params && params[0]) || '';
      // Route #/flash/due => chế độ đến hạn; #/flash/<topicId> => chủ đề đó.
      if (p === 'due') {
        S.mode = 'due';
      } else if (p && App.topics().some(t => t.id === p)) {
        S.topic = p;
        if (S.mode === 'due') S.mode = 'smart';
      }
      if (S.mode === 'due' && !App.questions().some(q => App.store.isDue(q.id))) {
        // Không có câu đến hạn: mặc định sang chế độ thông minh để vẫn có bài ôn.
        S.mode = 'smart';
      }
      S.deck = buildDeck();
      S.idx = 0;
      S.flipped = false;
      S.done = false;
      S.counts = { unknown: 0, review: 0, known: 0 };
      S.graded = {};
      render(root);
      const off = App.onKey(onKeyDown);
      return () => {
        off();
        if (S.toastTimer) clearTimeout(S.toastTimer);
      };
    },
  });
})();
