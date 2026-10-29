/* View "news" — owner: task T157 (+ daily digest). Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'news.title': 'Tin tức mỗi sáng',
      'news.subtitle': 'Bản tin chọn lọc mỗi ngày cho dev Java, kèm tin mới từ blog Java/Spring, DevOps, cloud và engineering blog của các công ty lớn.',
      'news.feedTitle': 'Tin mới từ các blog',
      'news.updated': 'Cập nhật lúc {time}',
      'news.refresh': 'Làm mới',
      'news.filterAll': 'Tất cả',
      'news.filterTech': 'Java & backend',
      'news.filterHiring': 'Tuyển dụng',
      'news.filterCompany': 'Engineering blog',
      'news.filterDevops': 'DevOps & hạ tầng',
      'news.filterCloud': 'Cloud (AWS/GCP)',
      'news.categoryLabel': 'Chuyên mục',
      'news.daysLabel': 'Khoảng thời gian',
      'news.days1': '1 ngày',
      'news.days3': '3 ngày',
      'news.days7': '7 ngày',
      'news.searchPlaceholder': 'Tìm theo tiêu đề, tóm tắt, nguồn…',
      'news.sourceLabel': 'Nguồn',
      'news.savedLabel': 'Đã lưu',
      'news.readMore': 'Đọc thêm',
      'news.loading': 'Đang tải tin tức…',
      'news.errorNoServer': 'Tin tức chỉ có trên bản deploy (Vercel). Khi mở file:// hoặc chưa deploy, API không khả dụng.',
      'news.errorNotConfigured': 'Chưa cấu hình Supabase. Cần bật database để có tin tức tự động.',
      'news.empty': 'Chưa có tin tức nào trong khoảng thời gian này.',
      'news.today': 'Hôm nay',
      'news.yesterday': 'Hôm qua',
      'news.unread': 'Chưa đọc',
      'news.saved': 'Đã lưu',
      'news.unsave': 'Bỏ lưu',
      'news.markRead': 'Đánh dấu đã đọc',
      'news.open': 'Mở bài viết',
      'news.shortcutRefresh': 'Làm mới',
      'news.shortcutSearch': 'Tìm kiếm',
      'news.dayFormat': '{day}/{month}',
      'news.digestTitle': 'Bản tin hôm nay',
      'news.digestTitleDate': 'Bản tin ngày {date}',
      'news.digestPick': 'Xem bản tin ngày khác',
      'news.digestLatest': 'mới nhất',
      'news.digestLoading': 'Đang tải bản tin…',
      'news.digestEmpty': 'Chưa có bản tin nào. Bản tin được biên tập và đăng mỗi sáng, quay lại sau nhé.',
      'news.digestMissing': 'Không có bản tin cho ngày này.',
      'news.digestSetup': 'Database chưa có bảng news_digest. Quản trị viên cần chạy SQL trong docs/NEWS-DIGEST.md.',
      'news.digestNoServer': 'Bản tin chỉ xem được trên bản deploy (Vercel), không có khi mở qua file://.',
      'news.digestNotConfigured': 'Server chưa cấu hình Supabase nên chưa có bản tin.',
      'news.digestWhy': 'Vì sao dev Java nên quan tâm',
      'news.digestQ': 'Câu hỏi phỏng vấn gợi ý',
      'news.digestRelated': 'Ôn lại trong ngân hàng câu hỏi',
      'news.digestOriginal': 'Bài gốc',
      'news.digestRead': 'Đọc bài gốc',
      'news.digestCount': '{n} tin',
      'news.digestPublished': 'Đăng lúc {time}',
    },
    en: {
      'news.title': 'Morning news',
      'news.subtitle': 'A curated daily digest for Java devs, plus fresh posts from Java/Spring, DevOps, cloud and big-tech engineering blogs.',
      'news.feedTitle': 'Latest from the blogs',
      'news.updated': 'Updated at {time}',
      'news.refresh': 'Refresh',
      'news.filterAll': 'All',
      'news.filterTech': 'Java & backend',
      'news.filterHiring': 'Hiring',
      'news.filterCompany': 'Engineering blog',
      'news.filterDevops': 'DevOps & infra',
      'news.filterCloud': 'Cloud (AWS/GCP)',
      'news.categoryLabel': 'Category',
      'news.daysLabel': 'Time range',
      'news.days1': '1 day',
      'news.days3': '3 days',
      'news.days7': '7 days',
      'news.searchPlaceholder': 'Search title, summary, source…',
      'news.sourceLabel': 'Source',
      'news.savedLabel': 'Saved',
      'news.readMore': 'Read more',
      'news.loading': 'Loading news…',
      'news.errorNoServer': 'News is only available on the deployed version (Vercel). API unavailable when opened via file:// or not deployed.',
      'news.errorNotConfigured': 'Supabase not configured. Enable database to get automatic news.',
      'news.empty': 'No news in this time range.',
      'news.today': 'Today',
      'news.yesterday': 'Yesterday',
      'news.unread': 'Unread',
      'news.saved': 'Saved',
      'news.unsave': 'Unsave',
      'news.markRead': 'Mark as read',
      'news.open': 'Open article',
      'news.shortcutRefresh': 'Refresh',
      'news.shortcutSearch': 'Search',
      'news.dayFormat': '{month}/{day}',
      'news.digestTitle': "Today's digest",
      'news.digestTitleDate': 'Digest of {date}',
      'news.digestPick': 'Show another day',
      'news.digestLatest': 'latest',
      'news.digestLoading': 'Loading the digest…',
      'news.digestEmpty': 'No digest yet. It is edited and published every morning, check back later.',
      'news.digestMissing': 'No digest for this day.',
      'news.digestSetup': 'The news_digest table does not exist yet. An admin must run the SQL in docs/NEWS-DIGEST.md.',
      'news.digestNoServer': 'The digest is only available on the deployed site (Vercel), not via file://.',
      'news.digestNotConfigured': 'The server has no Supabase configured, so there is no digest yet.',
      'news.digestWhy': 'Why it matters for Java devs',
      'news.digestQ': 'Interview question to practise',
      'news.digestRelated': 'Review in the question bank',
      'news.digestOriginal': 'Original',
      'news.digestRead': 'Read the original',
      'news.digestCount': '{n} stories',
      'news.digestPublished': 'Published {time}',
    },
  });

  const READ_KEY = 'sjp.news.read';
  const SAVED_KEY = 'sjp.news.saved';
  const MAX_STORED = 2000;

  // category ids must match api/_feeds.js CATEGORIES
  const CATEGORIES = [
    { id: 'all', key: 'filterAll' },
    { id: 'tech', key: 'filterTech' },
    { id: 'devops', key: 'filterDevops' },
    { id: 'cloud', key: 'filterCloud' },
    { id: 'company', key: 'filterCompany' },
  ];
  const CATEGORY_KEY = { tech: 'filterTech', devops: 'filterDevops', cloud: 'filterCloud', company: 'filterCompany', hiring: 'filterHiring' };

  const DAY_OPTIONS = [
    { value: 1, key: 'days1' },
    { value: 3, key: 'days3' },
    { value: 7, key: 'days7' },
  ];

  const tr = (key, vars) => App.t('news.' + key, vars);
  const esc = App.esc;
  const locale = () => (App.lang === 'en' ? 'en-US' : 'vi-VN');
  const safeUrl = u => (/^https:\/\//i.test(String(u || '')) ? String(u) : '');

  function loadSet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function saveSet(key, set) {
    try {
      const arr = Array.from(set).slice(-MAX_STORED);
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) {
      // private mode / quota exceeded
    }
  }

  // ---------------- state ----------------
  let root;
  let mainEl;
  let digestEl;
  let alive = false;
  let allItems = [];
  let lastUpdatedAt = null;
  let activeCategory = 'all';
  let activeDays = 7;
  let activeSource = '';
  let searchTerm = '';
  let readSet = new Set();
  let savedSet = new Set();
  let loading = false;
  let keyCleanup = null;
  let digestReq = 0;

  // ---------------- daily digest ----------------

  /** 'YYYY-MM-DD' → local date label (no timezone shift). */
  function fmtDigestDate(s, opts) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return String(s || '');
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
      .toLocaleDateString(locale(), opts || { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function isToday(s) {
    return s === App.dayKey(Date.now());
  }

  function digestHead(title, extra) {
    return '<div class="digest-head">' +
      '<h2 class="digest-title" id="newsDigestTitle">📰 ' + esc(title) + '</h2>' + (extra || '') + '</div>';
  }

  function datePicker(dates, current) {
    if (!dates || dates.length < 2) return '';
    const opts = dates.map((d, i) =>
      '<option value="' + esc(d) + '"' + (d === current ? ' selected' : '') + '>' +
        esc(fmtDigestDate(d, { day: '2-digit', month: '2-digit', year: 'numeric' })) +
        (i === 0 ? ' (' + esc(tr('digestLatest')) + ')' : '') + '</option>').join('');
    return '<label class="digest-pick"><span class="small muted">' + esc(tr('digestPick')) + '</span>' +
      '<select class="select sm digest-date" data-digest-date aria-label="' + esc(tr('digestPick')) + '">' + opts + '</select></label>';
  }

  function digestItemHtml(it, i) {
    const url = safeUrl(it.url);
    const cat = CATEGORY_KEY[it.category] ? tr(CATEGORY_KEY[it.category]) : (it.category || '');
    const related = Array.isArray(it.related) ? it.related.filter(x => typeof x === 'string' && x) : [];
    const tags = Array.isArray(it.tags) ? it.tags.filter(x => typeof x === 'string' && x) : [];
    const titleVi = it.title_vi || it.title || '';
    return '<article class="digest-item">' +
      '<div class="digest-meta">' +
        '<span class="digest-num" aria-hidden="true">' + (i + 1) + '</span>' +
        (cat ? '<span class="badge digest-cat">' + esc(cat) + '</span>' : '') +
        (it.source ? '<span class="badge news-source">' + esc(it.source) + '</span>' : '') +
      '</div>' +
      '<h3 class="digest-item-title">' +
        (url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(titleVi) + '</a>' : esc(titleVi)) +
      '</h3>' +
      (it.title && it.title !== titleVi
        ? '<p class="digest-orig small muted" lang="en">' + esc(tr('digestOriginal')) + ': ' + esc(it.title) + '</p>' : '') +
      '<div class="md digest-summary">' + App.md(it.summary || '') + '</div>' +
      (it.why ? '<div class="digest-box digest-why"><h4>' + esc(tr('digestWhy')) + '</h4><div class="md">' + App.md(it.why) + '</div></div>' : '') +
      (it.interview_q ? '<div class="digest-box digest-q"><h4>' + esc(tr('digestQ')) + '</h4><div class="md">' + App.md(it.interview_q) + '</div></div>' : '') +
      '<div class="digest-foot">' +
        (tags.length ? '<div class="chips digest-tags">' + tags.map(t => '<span class="chip sm">#' + esc(t) + '</span>').join('') + '</div>' : '<span></span>') +
        (url ? '<a class="btn sm" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(tr('digestRead')) + ' ↗</a>' : '') +
      '</div>' +
      (related.length ? '<div class="digest-related" data-related="' + esc(related.join(',')) + '"></div>' : '') +
    '</article>';
  }

  function renderDigest(state) {
    if (!digestEl) return;
    if (state.loading) {
      digestEl.innerHTML = digestHead(tr('digestTitle')) +
        '<p class="muted digest-state" role="status">' + esc(tr('digestLoading')) + '</p>';
      return;
    }
    if (state.error) {
      const e = state.error;
      const msg = e.code === 'no_server' ? '<p class="muted digest-state">' + esc(tr('digestNoServer')) + '</p>' : App.ui.error(e);
      digestEl.innerHTML = digestHead(tr('digestTitle')) + msg;
      return;
    }
    const data = state.data;
    if (!data.configured) {
      digestEl.innerHTML = digestHead(tr('digestTitle')) + '<p class="muted digest-state">' + esc(tr('digestNotConfigured')) + '</p>';
      return;
    }
    if (data.setup === 'missing_table') {
      digestEl.innerHTML = digestHead(tr('digestTitle')) + '<p class="muted digest-state">' + esc(tr('digestSetup')) + '</p>';
      return;
    }
    const d = data.digest;
    if (!d) {
      digestEl.innerHTML = digestHead(tr('digestTitle'), datePicker(data.dates, state.date)) +
        '<p class="muted digest-state">' + esc(state.date ? tr('digestMissing') : tr('digestEmpty')) + '</p>';
      return;
    }
    const items = Array.isArray(d.items) ? d.items : [];
    const title = isToday(d.date) ? tr('digestTitle') : tr('digestTitleDate', { date: fmtDigestDate(d.date, { day: '2-digit', month: '2-digit', year: 'numeric' }) });
    const meta = '<p class="digest-sub small muted">' + esc(fmtDigestDate(d.date)) + ' · ' + esc(tr('digestCount', { n: items.length })) +
      (d.published_at ? ' · ' + esc(tr('digestPublished', { time: new Date(d.published_at).toLocaleString(locale(), { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) })) : '') + '</p>';
    digestEl.innerHTML = digestHead(title, datePicker(data.dates, d.date)) + meta +
      (d.intro ? '<div class="md digest-intro">' + App.md(d.intro) + '</div>' : '') +
      '<div class="digest-list">' + items.map(digestItemHtml).join('') + '</div>';
    fillRelated();
  }

  /** Related bank questions need the (large) questions group: load it only when a digest item links to one. */
  function fillRelated() {
    const slots = digestEl ? digestEl.querySelectorAll('.digest-related[data-related]') : [];
    if (!slots.length || !App.ui || !App.ui.relatedQuestions) return;
    const req = digestReq;
    App.need(['questions']).then(() => {
      if (!alive || req !== digestReq) return;
      slots.forEach(slot => {
        const ids = slot.dataset.related.split(',').filter(Boolean);
        slot.innerHTML = App.ui.relatedQuestions({ ids, limit: ids.length, title: tr('digestRelated') });
      });
    }).catch(e => console.error(e));
  }

  async function loadDigest(date) {
    const req = ++digestReq;
    renderDigest({ loading: true });
    let state;
    try {
      state = { data: await App.news.digest({ date: date || null }), date: date || null };
    } catch (e) {
      state = { error: e };
    }
    if (!alive || req !== digestReq) return;
    renderDigest(state);
  }

  // ---------------- feed list ----------------

  function isRead(id) { return readSet.has(id); }
  function isSaved(id) { return savedSet.has(id); }

  function markRead(id) {
    if (!readSet.has(id)) {
      readSet.add(id);
      saveSet(READ_KEY, readSet);
      renderView();
    }
  }

  function toggleSaved(id) {
    if (savedSet.has(id)) savedSet.delete(id);
    else savedSet.add(id);
    saveSet(SAVED_KEY, savedSet);
    renderView();
  }

  function formatDayLabel(date) {
    const today = App.startOfDay(Date.now());
    const target = App.startOfDay(date);
    const diff = Math.round((target - today) / App.DAY);
    if (diff === 0) return tr('today');
    if (diff === -1) return tr('yesterday');
    return new Date(date).toLocaleDateString(locale(), { day: '2-digit', month: '2-digit' });
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });
  }

  function formatUpdatedAt(ts) {
    return new Date(ts).toLocaleString(locale(), { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function groupByDay(items) {
    const groups = new Map();
    items.forEach(item => {
      const dayStart = App.startOfDay(item.published);
      if (!groups.has(dayStart)) groups.set(dayStart, { label: formatDayLabel(dayStart), items: [] });
      groups.get(dayStart).items.push(item);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]).map(([, g]) => g);
  }

  function filterItems(items) {
    const term = searchTerm.toLowerCase().trim();
    return items.filter(item => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (activeSource && item.source !== activeSource) return false;
      if (term) {
        const haystack = (item.title + ' ' + (item.summary || '') + ' ' + item.source).toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }

  function getSources(items) {
    return Array.from(new Set(items.map(item => item.source))).sort();
  }

  function renderSkeleton(count) {
    return Array.from({ length: count }, () => `
      <div class="news-item skeleton">
        <div class="news-badge"></div>
        <div class="news-title-line"></div>
        <div class="news-summary-line"></div>
        <div class="news-meta-line"></div>
      </div>
    `).join('');
  }

  function renderDayGroup(group) {
    const itemsHtml = group.items.map(item => {
      const read = isRead(item.id);
      const saved = isSaved(item.id);
      const url = /^https?:\/\//i.test(item.url || '') ? item.url : '#';
      return `
        <article class="news-item${read ? '' : ' unread'}${saved ? ' saved' : ''}" data-id="${esc(item.id)}">
          <div class="news-meta">
            <span class="badge news-source" title="${esc(tr('sourceLabel'))}: ${esc(item.source)}">${esc(item.source)}</span>
            ${saved ? `<span class="badge accent news-saved" title="${esc(tr('savedLabel'))}">☆ ${esc(tr('savedLabel'))}</span>` : ''}
            ${!read ? `<span class="badge info news-unread" title="${esc(tr('unread'))}">${esc(tr('unread'))}</span>` : ''}
          </div>
          <h3 class="news-title">
            <a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="news-link" data-action="open" aria-label="${esc(tr('open'))}: ${esc(item.title)}">${esc(item.title)}</a>
          </h3>
          ${item.summary ? `<p class="news-summary">${esc(item.summary)}</p>` : ''}
          <div class="news-footer">
            <time class="news-time" datetime="${esc(new Date(item.published).toISOString())}">${esc(formatTime(item.published))}</time>
            <div class="news-actions">
              <button type="button" class="btn ghost sm news-save-btn" data-action="save" aria-pressed="${saved}" aria-label="${saved ? esc(tr('unsave')) : esc(tr('saved'))}">
                ${saved ? '★' : '☆'}
              </button>
              <button type="button" class="btn ghost sm news-read-btn" data-action="read" aria-label="${esc(tr('markRead'))}"${read ? ' disabled' : ''}>
                ✓ ${esc(tr('markRead'))}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    return `
      <section class="news-day-group">
        <h3 class="news-day-label">${esc(group.label)}</h3>
        <div class="news-list">${itemsHtml}</div>
      </section>
    `;
  }

  const renderEmpty = () => `<div class="empty card"><p>${esc(tr('empty'))}</p></div>`;
  const renderError = message => `<div class="empty card"><p class="warn">${esc(message)}</p></div>`;
  const renderLoading = () => `<div class="news-loading" role="status" aria-label="${esc(tr('loading'))}">${renderSkeleton(6)}</div>`;

  function renderView() {
    if (!mainEl) return;
    const search = mainEl.querySelector('.news-search');
    const hadFocus = search && document.activeElement === search;
    const caret = hadFocus ? search.selectionStart : null;

    const categoryChips = CATEGORIES.map(c => `
      <button type="button" class="chip${activeCategory === c.id ? ' active' : ''}" data-category="${esc(c.id)}" aria-pressed="${activeCategory === c.id}">${esc(tr(c.key))}</button>
    `).join('');

    const dayChips = DAY_OPTIONS.map(d => `
      <button type="button" class="chip${activeDays === d.value ? ' active' : ''}" data-days="${d.value}" aria-pressed="${activeDays === d.value}">${esc(tr(d.key))}</button>
    `).join('');

    const sourceChips = getSources(allItems).map(s => `
      <button type="button" class="chip${activeSource === s ? ' active' : ''}" data-source="${esc(s)}" aria-pressed="${activeSource === s}">${esc(s)}</button>
    `).join('');

    const filtered = filterItems(allItems);
    const listHtml = filtered.length ? groupByDay(filtered).map(renderDayGroup).join('') : renderEmpty();
    const updatedHtml = lastUpdatedAt
      ? `<span class="news-updated">${esc(tr('updated', { time: formatUpdatedAt(lastUpdatedAt) }))}</span>`
      : '';

    mainEl.innerHTML = `
      <div class="news-feed-head">
        <h2 class="news-feed-title">${esc(tr('feedTitle'))}</h2>
        <div class="row">
          ${updatedHtml}
          <button type="button" class="btn primary" data-action="refresh" aria-label="${esc(tr('refresh'))}">↻ ${esc(tr('refresh'))} <kbd>R</kbd></button>
        </div>
      </div>

      <div class="news-toolbar card">
        <div class="news-toolbar-row">
          <div class="chips news-categories" role="group" aria-label="${esc(tr('categoryLabel'))}">${categoryChips}</div>
        </div>
        <div class="news-toolbar-row">
          <div class="chips news-days" role="group" aria-label="${esc(tr('daysLabel'))}">${dayChips}</div>
        </div>
        <div class="news-toolbar-row">
          <div class="row news-search-wrap">
            <input type="search" class="input news-search" placeholder="${esc(tr('searchPlaceholder'))}" value="${esc(searchTerm)}" aria-label="${esc(tr('searchPlaceholder'))}">
            <kbd class="news-kbd">/</kbd>
          </div>
          <div class="chips news-sources" role="group" aria-label="${esc(tr('sourceLabel'))}">
            <button type="button" class="chip${!activeSource ? ' active' : ''}" data-source="" aria-pressed="${!activeSource}">${esc(tr('filterAll'))}</button>
            ${sourceChips}
          </div>
        </div>
      </div>

      <div class="news-results" role="feed" aria-label="${esc(tr('feedTitle'))}" aria-busy="${loading}">${loading ? renderLoading() : listHtml}</div>
    `;

    if (hadFocus) {
      const input = mainEl.querySelector('.news-search');
      input.focus();
      try { input.setSelectionRange(caret, caret); } catch (e) { /* type=search may not support it */ }
    }
  }

  async function loadNews() {
    if (loading) return;
    loading = true;
    renderView();
    try {
      const data = await App.news.list({ days: activeDays, category: activeCategory === 'all' ? null : activeCategory });
      if (!alive) return;
      lastUpdatedAt = data.updatedAt ? new Date(data.updatedAt).getTime() : null;
      allItems = data.items || [];
      allItems.forEach((item, i) => {
        if (!item.id) item.id = `news-${activeDays}-${activeCategory}-${i}-${item.published}`;
      });
      loading = false;
      renderView();
    } catch (e) {
      loading = false;
      if (!alive) return;
      let msg;
      if (e.code === 'no_server') msg = tr('errorNoServer');
      else if (e.code === 'not_configured' || !App.news.configured) msg = tr('errorNotConfigured');
      else msg = e.message || String(e);
      renderView();
      mainEl.querySelector('.news-results').innerHTML = renderError(msg);
    } finally {
      loading = false;
    }
  }

  // ---------------- events (delegated once on root) ----------------

  function onClick(e) {
    const t = e.target;
    const cat = t.closest('[data-category]');
    if (cat) { activeCategory = cat.dataset.category; loadNews(); return; }
    const days = t.closest('[data-days]');
    if (days) { activeDays = Number(days.dataset.days); loadNews(); return; }
    const src = t.closest('[data-source]');
    if (src) { activeSource = src.dataset.source || ''; renderView(); return; }
    if (t.closest('[data-action="refresh"]')) { loadNews(); return; }

    const item = t.closest('.news-item');
    if (!item || item.classList.contains('skeleton')) return;
    const id = item.dataset.id;
    const actionEl = t.closest('[data-action]');
    const action = actionEl ? actionEl.dataset.action : '';
    if (action === 'save') { e.preventDefault(); toggleSaved(id); }
    else if (action === 'read') { e.preventDefault(); markRead(id); }
    else markRead(id);   // opening the link (target=_blank) or clicking the card counts as read
  }

  function onInput(e) {
    if (e.target.classList.contains('news-search')) {
      searchTerm = e.target.value;
      renderView();
    }
  }

  function onChange(e) {
    if (e.target.matches('[data-digest-date]')) {
      const v = e.target.value;
      loadDigest(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    }
  }

  App.registerView('news', {
    get title() { return App.t('news.title'); },
    render(rootEl, params) {
      root = rootEl;
      alive = true;
      readSet = loadSet(READ_KEY);
      savedSet = loadSet(SAVED_KEY);

      // #/news/[category]/[days]
      if (params[0] && CATEGORIES.some(c => c.id === params[0])) activeCategory = params[0];
      if (params[1] && DAY_OPTIONS.some(d => d.value === Number(params[1]))) activeDays = Number(params[1]);

      root.innerHTML = `
        <div class="page-head">
          <div>
            <h1>${esc(tr('title'))}</h1>
            <p class="muted">${esc(tr('subtitle'))}</p>
          </div>
        </div>
        <section class="card news-digest" aria-labelledby="newsDigestTitle"></section>
        <div class="news-main"></div>
      `;
      digestEl = root.querySelector('.news-digest');
      mainEl = root.querySelector('.news-main');

      root.addEventListener('click', onClick);
      root.addEventListener('input', onInput);
      root.addEventListener('change', onChange);

      loadDigest(null);
      loadNews();

      keyCleanup = App.onKey(e => {
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          loadNews();
        } else if (e.key === '/') {
          e.preventDefault();
          const input = root.querySelector('.news-search');
          if (input) input.focus();
        }
      });

      return () => {
        alive = false;
        digestReq++;
        if (keyCleanup) keyCleanup();
        keyCleanup = null;
        root.removeEventListener('click', onClick);
        root.removeEventListener('input', onInput);
        root.removeEventListener('change', onChange);
        digestEl = null;
        mainEl = null;
      };
    },
  });
})();
