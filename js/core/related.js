/*
 * T289 — Inline related interview questions, shared by lessons, path, labs and the glossary modal.
 * Public API: App.ui.relatedQuestions({ ids, topic, tags, text, limit, title }) → HTML string ('' when none).
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

  function keywords(text) {
    return String(text || '')
      .split(/[^\p{L}\p{N}]+/u)
      .map(w => w.toLowerCase())
      .filter(w => w.length >= 4 && !STOP.has(w));
  }

  function statusOf(id) {
    const s = App.store.getStatus(id);
    const info = s && App.STATUS[s] ? App.STATUS[s] : { label: App.t('rq.unknown'), cls: '' };
    return { value: s || 'unknown', label: info.label, cls: info.cls || '' };
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

  function itemHtml(q) {
    const en = q.lang === 'en' ? ' lang="en"' : '';
    const follow = Array.isArray(q.follow) ? q.follow : [];
    const st = statusOf(q.id);
    const marked = App.store.isBookmarked(q.id);
    const actions = ['known', 'review', 'unknown'].map(k =>
      '<button type="button" class="btn sm rq-st' + (st.value === k ? ' is-active' : '') +
      '" data-rq-status="' + App.esc(k) + '" data-rq-id="' + App.esc(q.id) + '"' +
      ' aria-pressed="' + (st.value === k ? 'true' : 'false') + '">' + App.esc(App.t('rq.' + k)) + '</button>').join('');
    return '<details class="rq-item" data-rq-id="' + App.esc(q.id) + '">' +
      '<summary class="rq-sum">' +
        '<span class="rq-q md"' + en + '>' + stripP(App.md(q.q)) + '</span>' +
        levelBadge(q) + statusChip(q.id) +
      '</summary>' +
      '<div class="rq-body">' +
        '<h4 class="rq-h">' + App.esc(App.t('rq.answer')) + '</h4>' +
        '<div class="md rq-a"' + en + '>' + App.md(q.a || '') + '</div>' +
        (follow.length ? '<h4 class="rq-h">' + App.esc(App.t('rq.follow')) + '</h4><ul class="rq-follow">' +
          follow.map(f => '<li class="md"' + en + '>' + stripP(App.md(f)) + '</li>').join('') + '</ul>' : '') +
        '<div class="row rq-actions">' + actions +
          '<button type="button" class="btn sm rq-bookmark' + (marked ? ' is-active' : '') +
            '" data-rq-bookmark="' + App.esc(q.id) + '" aria-pressed="' + (marked ? 'true' : 'false') + '">' +
            (marked ? '★ ' + App.esc(App.t('rq.bookmarked')) : '☆ ' + App.esc(App.t('rq.bookmark'))) + '</button>' +
          '<a class="btn sm" href="#/bank/' + encodeURIComponent(q.topic) + '">' +
            App.esc(App.t('rq.openBank')) + '</a>' +
        '</div>' +
      '</div>' +
    '</details>';
  }

  App.ui.relatedQuestions = function (opts) {
    const o = opts || {};
    const limit = Math.max(1, Math.min(50, Number(o.limit) || 5));
    const all = App.questions() || [];
    if (!all.length) return '';
    const byId = new Map(all.map(q => [q.id, q]));
    const picked = [];
    const seen = new Set();

    (Array.isArray(o.ids) ? o.ids : []).forEach(id => {
      const q = byId.get(id);
      if (q && !seen.has(id) && picked.length < limit) { picked.push(q); seen.add(id); }
    });
    if (picked.length >= limit) return wrap(picked, o.title);

    const tagSet = new Set((Array.isArray(o.tags) ? o.tags : []).map(lower));
    const words = keywords(o.text);
    const scored = [];
    all.forEach(q => {
      if (seen.has(q.id)) return;
      let score = 0;
      if (o.topic && q.topic === o.topic) score += 3;
      const qtags = (Array.isArray(q.tags) ? q.tags : []).map(lower);
      qtags.forEach(t => { if (tagSet.has(t)) score += 2; });
      if (words.length) {
        const hay = lower((q.q || '') + ' ' + qtags.join(' ') + ' ' + (q.a || ''));
        words.forEach(w => { if (hay.includes(w)) score += 1; });
      }
      if (score > 0) scored.push({ q, score });
    });
    scored.sort((a, b) => b.score - a.score ||
      (LEVEL_RANK[a.q.level] ?? 9) - (LEVEL_RANK[b.q.level] ?? 9));
    scored.forEach(({ q }) => {
      if (picked.length >= limit || seen.has(q.id)) return;
      picked.push(q); seen.add(q.id);
    });
    return picked.length ? wrap(picked, o.title) : '';
  };

  function wrap(list, title) {
    return '<section class="rq-wrap"><h3 class="rq-title">' +
      App.esc(title || App.t('rq.title')) + '</h3>' +
      list.map(itemHtml).join('') + '</section>';
  }

  function refreshStatus(id) {
    document.querySelectorAll('.rq-item[data-rq-id="' + id + '"]').forEach(item => {
      const chip = item.querySelector('.rq-status');
      if (chip) chip.outerHTML = statusChip(id);
      item.querySelectorAll('[data-rq-status]').forEach(btn => {
        const active = btn.dataset.rqStatus === App.store.getStatus(id);
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    });
  }

  function onClick(e) {
    const stat = e.target.closest('[data-rq-status]');
    if (stat) {
      const id = stat.dataset.rqId;
      if (id) {
        App.store.setStatus(id, stat.dataset.rqStatus);
        refreshStatus(id);
      }
      return;
    }
    const bm = e.target.closest('[data-rq-bookmark]');
    if (bm) {
      const id = bm.dataset.rqBookmark;
      if (!id) return;
      const on = App.store.toggleBookmark(id);
      bm.classList.toggle('is-active', on);
      bm.setAttribute('aria-pressed', on ? 'true' : 'false');
      bm.textContent = on ? '★ ' + App.t('rq.bookmarked') : '☆ ' + App.t('rq.bookmark');
    }
  }

  if (!document.documentElement.dataset.rqBound) {
    document.documentElement.dataset.rqBound = '1';
    document.addEventListener('click', onClick);
  }
})();
