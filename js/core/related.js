/*
 * T289 — Inline related interview questions, shared by lessons, path, labs and the glossary modal.
 * Public API: App.ui.relatedQuestions({ ids, topic, tags, text, limit, title }) → HTML string ('' when none).
 * Answers render lazily: a question's body (answer, follow-ups, buttons) is built the first time it is opened,
 * so a page listing dozens of related questions does not render and glossary-link dozens of hidden answers.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  App.ui = App.ui || {};
  App.i18n.add({
    vi: {
      'rq.title': 'Câu hỏi phỏng vấn liên quan',
      'rq.openBank': 'Mở trong ngân hàng câu hỏi',
      'rq.follow': 'Câu hỏi đào sâu',
      'rq.known': 'Đã thuộc',
      'rq.review': 'Cần ôn',
      'rq.unknown': 'Chưa biết',
      'rq.unseen': 'Chưa học',
      'rq.bookmark': 'Lưu câu này',
      'rq.bookmarked': 'Đã lưu',
      'rq.answer': 'Đáp án mẫu',
    },
    en: {
      'rq.title': 'Related interview questions',
      'rq.openBank': 'Open in question bank',
      'rq.follow': 'Follow-up questions',
      'rq.known': 'Known',
      'rq.review': 'Review',
      'rq.unknown': "Don't know",
      'rq.unseen': 'Not studied',
      'rq.bookmark': 'Bookmark this question',
      'rq.bookmarked': 'Bookmarked',
      'rq.answer': 'Sample answer',
    },
  });

  const LEVEL_RANK = { mid: 0, senior: 1, lead: 2 };
  const STOP = new Set(['that', 'this', 'with', 'have', 'from', 'your', 'what', 'when', 'which', 'would', 'could',
    'should', 'there', 'their', 'about', 'into', 'than', 'then', 'them', 'they', 'will', 'does', 'java', 'code',
    'using', 'make', 'made', 'more', 'most', 'some', 'such', 'only', 'also', 'each', 'other', 'same', 'very']);

  const stripP = html => String(html || '').replace(/^<p>|<\/p>$/g, '');
  const lower = s => String(s || '').toLowerCase();
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function keywords(text) {
    return String(text || '')
      .split(/[^\p{L}\p{N}]+/u)
      .map(w => w.toLowerCase())
      .filter(w => w.length >= 4 && !STOP.has(w));
  }

  // id -> question, rebuilt only when the bank grows (questions arrive lazily, group by group)
  let byIdSrc = null, byIdLen = -1, byIdMap = null, bankGen = 0;
  function questionMap(all) {
    if (all !== byIdSrc || all.length !== byIdLen) {
      byIdMap = new Map(all.map(q => [q.id, q]));
      byIdSrc = all; byIdLen = all.length; bankGen++;
    }
    return byIdMap;
  }

  /** Never-rated questions have no status: shown as "Chưa học", with no rating button pressed. */
  function statusOf(id) {
    const s = App.store.getStatus(id);
    const info = s && App.STATUS[s] ? App.STATUS[s] : { label: App.t('rq.unseen'), cls: '' };
    return { value: s || null, label: info.label, cls: info.cls || '' };
  }

  function levelBadge(q) {
    const label = App.LEVELS[q.level] || q.level || '';
    return label ? '<span class="badge rq-level">' + App.esc(label) + '</span>' : '';
  }

  function statusChip(id) {
    const st = statusOf(id);
    return '<span class="chip rq-status"><span class="dot ' + App.esc(st.cls) + '"></span>' +
      App.esc(st.label) + '</span>';
  }

  function bookmarkLabel(on) {
    return on ? '★ ' + App.t('rq.bookmarked') : '☆ ' + App.t('rq.bookmark');
  }

  // answer + follow-ups + actions: built on first open (see onToggle)
  function bodyHtml(q) {
    const en = q.lang === 'en' ? ' lang="en"' : '';
    const follow = Array.isArray(q.follow) ? q.follow : [];
    const st = statusOf(q.id);
    const marked = App.store.isBookmarked(q.id);
    const actions = ['known', 'review', 'unknown'].map(k =>
      '<button type="button" class="btn sm rq-st' + (st.value === k ? ' is-active' : '') +
      '" data-rq-status="' + App.esc(k) + '" data-rq-id="' + App.esc(q.id) + '"' +
      ' aria-pressed="' + (st.value === k ? 'true' : 'false') + '">' + App.esc(App.t('rq.' + k)) + '</button>').join('');
    return '<h4 class="rq-h">' + App.esc(App.t('rq.answer')) + '</h4>' +
      '<div class="md rq-a"' + en + '>' + App.md(q.a || '') + '</div>' +
      (follow.length ? '<h4 class="rq-h">' + App.esc(App.t('rq.follow')) + '</h4><ul class="rq-follow">' +
        follow.map(f => '<li class="md"' + en + '>' + stripP(App.md(f)) + '</li>').join('') + '</ul>' : '') +
      '<div class="row rq-actions">' + actions +
        '<button type="button" class="btn sm rq-bookmark' + (marked ? ' is-active' : '') +
          '" data-rq-bookmark="' + App.esc(q.id) + '" aria-pressed="' + (marked ? 'true' : 'false') + '">' +
          App.esc(bookmarkLabel(marked)) + '</button>' +
        '<a class="btn sm" href="#/bank/' + encodeURIComponent(q.topic) + '">' +
          App.esc(App.t('rq.openBank')) + '</a>' +
      '</div>';
  }

  function itemHtml(q) {
    const en = q.lang === 'en' ? ' lang="en"' : '';
    return '<details class="rq-item" data-rq-id="' + App.esc(q.id) + '">' +
      '<summary class="rq-sum">' +
        '<span class="rq-q md"' + en + '>' + stripP(App.md(q.q)) + '</span>' +
        levelBadge(q) + statusChip(q.id) +
      '</summary>' +
      '<div class="rq-body" data-rq-lazy></div>' +
    '</details>';
  }

  // Selection (which questions, in which order) depends only on the options, the bank and the language, so a
  // glossary term opened again, or a page re-rendered, reuses it instead of re-scanning ~15 MB of answers.
  const pickCache = new Map();
  const PICK_CACHE_MAX = 40;

  function pick(all, o, limit) {
    const byId = questionMap(all);
    const key = JSON.stringify([o.ids || null, o.topic || '', o.tags || null, o.text || '', limit, bankGen, App.lang || '']);
    if (pickCache.has(key)) return pickCache.get(key);
    const picked = [];
    const seen = new Set();

    (Array.isArray(o.ids) ? o.ids : []).forEach(id => {
      const q = byId.get(id);
      if (q && !seen.has(id) && picked.length < limit) { picked.push(q); seen.add(id); }
    });

    const tagSet = new Set((Array.isArray(o.tags) ? o.tags : []).map(lower));
    // case-insensitive regex per keyword instead of lower-casing every answer: same matches, ~3× faster, no copies.
    // A keyword repeated in the text still counts once per repeat (weight), as before.
    const weight = new Map();
    keywords(o.text).forEach(w => weight.set(w, (weight.get(w) || 0) + 1));
    const res = Array.from(weight, ([w, n]) => ({ re: new RegExp(reEsc(w), 'i'), n }));
    if (picked.length < limit && (o.topic || tagSet.size || res.length)) {
      const scored = [];
      all.forEach(q => {
        if (seen.has(q.id)) return;
        let score = 0;
        if (o.topic && q.topic === o.topic) score += 3;
        const qtags = Array.isArray(q.tags) ? q.tags : [];
        if (tagSet.size) qtags.forEach(t => { if (tagSet.has(lower(t))) score += 2; });
        if (res.length) {
          const qq = String(q.q || ''), tg = qtags.join(' '), qa = String(q.a || '');
          res.forEach(k => { if (k.re.test(qq) || k.re.test(tg) || k.re.test(qa)) score += k.n; });
        }
        if (score > 0) scored.push({ q, score });
      });
      scored.sort((a, b) => b.score - a.score ||
        (LEVEL_RANK[a.q.level] ?? 9) - (LEVEL_RANK[b.q.level] ?? 9));
      scored.forEach(({ q }) => {
        if (picked.length >= limit || seen.has(q.id)) return;
        picked.push(q); seen.add(q.id);
      });
    }
    if (pickCache.size >= PICK_CACHE_MAX) pickCache.delete(pickCache.keys().next().value);
    pickCache.set(key, picked);
    return picked;
  }

  App.ui.relatedQuestions = function (opts) {
    const o = opts || {};
    const limit = Math.max(1, Math.min(50, Number(o.limit) || 5));
    const all = App.questions() || [];
    if (!all.length) return '';
    const picked = pick(all, o, limit);
    return picked.length ? wrap(picked, o.title) : '';
  };

  function wrap(list, title) {
    return '<section class="rq-wrap"><h3 class="rq-title">' +
      App.esc(title || App.t('rq.title')) + '</h3>' +
      list.map(itemHtml).join('') + '</section>';
  }

  const sel = id => (window.CSS && CSS.escape ? CSS.escape(id) : String(id).replace(/["\\]/g, '\\$&'));

  function refreshStatus(id) {
    const now = App.store.getStatus(id);
    document.querySelectorAll('.rq-item[data-rq-id="' + sel(id) + '"]').forEach(item => {
      const chip = item.querySelector('.rq-status');
      if (chip) chip.outerHTML = statusChip(id);
      item.querySelectorAll('[data-rq-status]').forEach(btn => {
        const active = btn.dataset.rqStatus === now;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    });
  }

  function onClick(e) {
    const tgt = e.target;
    if (!tgt || !tgt.closest) return;
    const stat = tgt.closest('[data-rq-status]');
    if (stat) {
      const id = stat.dataset.rqId;
      if (id) {
        App.store.setStatus(id, stat.dataset.rqStatus);
        refreshStatus(id);
      }
      return;
    }
    const bm = tgt.closest('[data-rq-bookmark]');
    if (bm) {
      const id = bm.dataset.rqBookmark;
      if (!id) return;
      const on = App.store.toggleBookmark(id);
      // the same question can be listed twice on a page (lesson + glossary modal): keep every copy in sync
      document.querySelectorAll('[data-rq-bookmark="' + sel(id) + '"]').forEach(b => {
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = bookmarkLabel(on);
      });
    }
  }

  // 'toggle' does not bubble: listen in the capture phase to fill a lazy body the first time it opens
  function onToggle(e) {
    const item = e.target;
    if (!item || !item.classList || !item.classList.contains('rq-item') || !item.open) return;
    const body = item.querySelector(':scope > .rq-body[data-rq-lazy]');
    if (!body) return;
    const all = App.questions() || [];
    const q = questionMap(all).get(item.dataset.rqId);
    if (!q) return;
    body.removeAttribute('data-rq-lazy');
    body.innerHTML = bodyHtml(q);
  }

  if (!document.documentElement.dataset.rqBound) {
    document.documentElement.dataset.rqBound = '1';
    document.addEventListener('click', onClick);
    document.addEventListener('toggle', onToggle, true);
  }
})();
