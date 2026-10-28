/* View "news" — owner: task T157. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'news.title': 'Tin tức mỗi sáng',
      'news.subtitle': 'Blog công nghệ đang hot: Java/Spring và engineering blog của các công ty lớn — cập nhật lúc 6h sáng mỗi ngày.',
      'news.updated': 'Cập nhật lúc {time}',
      'news.refresh': 'Làm mới',
      'news.filterAll': 'Tất cả',
      'news.filterTech': 'Java & kiến trúc',
      'news.filterHiring': 'Tuyển dụng',
      'news.filterCompany': 'Engineering blog',
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
    },
    en: {
      'news.title': 'Morning news',
      'news.subtitle': 'Hot tech blogs: Java/Spring and big-tech engineering blogs — updated at 6 AM daily.',
      'news.updated': 'Updated at {time}',
      'news.refresh': 'Refresh',
      'news.filterAll': 'All',
      'news.filterTech': 'Java & architecture',
      'news.filterHiring': 'Hiring',
      'news.filterCompany': 'Engineering blog',
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
    },
  });

  const READ_KEY = 'sjp.news.read';
  const SAVED_KEY = 'sjp.news.saved';
  const MAX_STORED = 2000;

  const CATEGORIES = [
    { id: 'all', vi: 'news.filterAll', en: 'news.filterAll' },
    { id: 'tech', vi: 'news.filterTech', en: 'news.filterTech' },
    { id: 'company', vi: 'news.filterCompany', en: 'news.filterCompany' },
  ];

  const DAY_OPTIONS = [
    { value: 1, vi: 'news.days1', en: 'news.days1' },
    { value: 3, vi: 'news.days3', en: 'news.days3' },
    { value: 7, vi: 'news.days7', en: 'news.days7' },
  ];

  const tr = (key, vars) => App.t('news.' + key, vars);
  const esc = App.esc;

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

  function isRead(id) {
    return readSet.has(id);
  }

  function markRead(id) {
    if (!readSet.has(id)) {
      readSet.add(id);
      saveSet(READ_KEY, readSet);
      renderList();
    }
  }

  function isSaved(id) {
    return savedSet.has(id);
  }

  function toggleSaved(id) {
    if (savedSet.has(id)) {
      savedSet.delete(id);
    } else {
      savedSet.add(id);
    }
    saveSet(SAVED_KEY, savedSet);
    renderList();
  }

  function formatDayLabel(date) {
    const today = App.startOfDay(Date.now());
    const target = App.startOfDay(date);
    const diff = (target - today) / App.DAY;

    if (diff === 0) return tr('today');
    if (diff === -1) return tr('yesterday');

    const locale = App.lang === 'en' ? 'en-US' : 'vi-VN';
    return new Date(date).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString(App.lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  function formatUpdatedAt(ts) {
    return new Date(ts).toLocaleString(App.lang === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function groupByDay(items) {
    const groups = new Map();
    items.forEach(item => {
      const dayStart = App.startOfDay(item.published);
      if (!groups.has(dayStart)) groups.set(dayStart, { label: formatDayLabel(dayStart), items: [] });
      groups.get(dayStart).items.push(item);
    });
    // Sort groups by day descending (newest first)
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([_, g]) => g);
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
    const sources = new Set();
    items.forEach(item => sources.add(item.source));
    return Array.from(sources).sort();
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
      const sourceClass = 'badge';
      return `
        <article class="news-item${read ? '' : ' unread'}${saved ? ' saved' : ''}" data-id="${esc(item.id)}">
          <div class="news-meta">
            <span class="badge news-source" title="${esc(tr('sourceLabel'))}: ${esc(item.source)}">${esc(item.source)}</span>
            ${saved ? `<span class="badge accent news-saved" title="${esc(tr('savedLabel'))}">☆ ${esc(tr('savedLabel'))}</span>` : ''}
            ${!read ? `<span class="badge info news-unread" title="${esc(tr('unread'))}">${esc(tr('unread'))}</span>` : ''}
          </div>
          <h3 class="news-title">
            <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" class="news-link" data-action="open" aria-label="${esc(tr('open'))}: ${esc(item.title)}">${esc(item.title)}</a>
          </h3>
          ${item.summary ? `<p class="news-summary">${esc(item.summary)}</p>` : ''}
          <div class="news-footer">
            <time class="news-time" datetime="${new Date(item.published).toISOString()}">${formatTime(item.published)}</time>
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
        <h2 class="news-day-label">${esc(group.label)}</h2>
        <div class="news-list">${itemsHtml}</div>
      </section>
    `;
  }

  function renderEmpty() {
    return `<div class="empty card"><p>${esc(tr('empty'))}</p></div>`;
  }

  function renderError(message) {
    return `<div class="empty card"><p class="warn">${esc(message)}</p></div>`;
  }

  function renderLoading() {
    return `<div class="news-loading">${renderSkeleton(6)}</div>`;
  }

  function renderView() {
    const categoryChips = CATEGORIES.map(c => `
      <button type="button" class="chip${activeCategory === c.id ? ' active' : ''}" data-category="${esc(c.id)}" aria-pressed="${activeCategory === c.id}">
        ${esc(tr(c.vi))}
      </button>
    `).join('');

    const dayChips = DAY_OPTIONS.map(d => `
      <button type="button" class="chip${activeDays === d.value ? ' active' : ''}" data-days="${d.value}" aria-pressed="${activeDays === d.value}">
        ${esc(tr(d.vi))}
      </button>
    `).join('');

    const sources = getSources(allItems);
    const sourceChips = sources.map(s => `
      <button type="button" class="chip${activeSource === s ? ' active' : ''}" data-source="${esc(s)}" aria-pressed="${activeSource === s}">
        ${esc(s)}
      </button>
    `).join('');

    const filtered = filterItems(allItems);
    const groups = groupByDay(filtered);
    const listHtml = filtered.length
      ? groups.map(renderDayGroup).join('')
      : renderEmpty();

    const updatedHtml = lastUpdatedAt
      ? `<span class="news-updated">${esc(tr('updated', { time: formatUpdatedAt(lastUpdatedAt) }))}</span>`
      : '';

    root.innerHTML = `
      <div class="page-head">
        <div>
          <h1>${esc(tr('title'))}</h1>
          <p class="muted">${esc(tr('subtitle'))}</p>
        </div>
        <div class="row">
          ${updatedHtml}
          <button type="button" class="btn primary" data-action="refresh" aria-label="${esc(tr('refresh'))}">
            ↻ ${esc(tr('refresh'))}
          </button>
        </div>
      </div>

      <div class="news-toolbar card">
        <div class="news-toolbar-row">
          <div class="chips news-categories" role="group" aria-label="${esc(tr('filterAll'))}">${categoryChips}</div>
        </div>
        <div class="news-toolbar-row">
          <div class="chips news-days" role="group" aria-label="Khoảng thời gian">${dayChips}</div>
        </div>
        <div class="news-toolbar-row">
          <div class="row" style="flex: 1; min-width: 0;">
            <input type="search" class="input news-search" placeholder="${esc(tr('searchPlaceholder'))}" value="${esc(searchTerm)}" aria-label="${esc(tr('searchPlaceholder'))}" data-i18n-placeholder="news.searchPlaceholder">
          </div>
          <div class="chips news-sources" role="group" aria-label="${esc(tr('sourceLabel'))}">
            <button type="button" class="chip${!activeSource ? ' active' : ''}" data-source="" aria-pressed="${!activeSource}">${esc(tr('filterAll'))}</button>
            ${sourceChips}
          </div>
        </div>
      </div>

      <div class="news-results" role="feed" aria-label="${esc(tr('title'))}">${listHtml}</div>
    `;
  }

  let root;
  let allItems = [];
  let lastUpdatedAt = null;
  let activeCategory = 'all';
  let activeDays = 7;
  let activeSource = '';
  let searchTerm = '';
  let readSet = new Set();
  let savedSet = new Set();
  let loading = false;
  let abortController = null;
  let keyCleanup = null;

  async function loadNews(showLoading = true) {
    if (loading) return;
    loading = true;

    if (showLoading) {
      root.querySelector('.news-results').innerHTML = renderLoading();
    }

    try {
      if (abortController) abortController.abort();
      abortController = new AbortController();

      const data = await App.news.list({ days: activeDays, category: activeCategory === 'all' ? null : activeCategory });
      lastUpdatedAt = data.updatedAt ? new Date(data.updatedAt).getTime() : null;
      allItems = data.items || [];

      // Ensure items have IDs
      allItems.forEach((item, i) => {
        if (!item.id) item.id = `news-${activeDays}-${activeCategory}-${i}-${item.published}`;
      });

      renderView();
      attachEvents();
    } catch (e) {
      let msg = '';
      if (e.code === 'no_server') {
        msg = tr('errorNoServer');
      } else if (e.code === 'not_configured' || !App.news.configured) {
        msg = tr('errorNotConfigured');
      } else {
        msg = e.message || String(e);
      }
      root.querySelector('.news-results').innerHTML = renderError(msg);
    } finally {
      loading = false;
    }
  }

  function attachEvents() {
    // Category chips
    root.querySelectorAll('[data-category]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.category;
        loadNews();
      });
    });

    // Day chips
    root.querySelectorAll('[data-days]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeDays = Number(btn.dataset.days);
        loadNews();
      });
    });

    // Source chips
    root.querySelectorAll('[data-source]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSource = btn.dataset.source || '';
        renderView();
        attachEvents();
      });
    });

    // Search input
    const searchInput = root.querySelector('.news-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        searchTerm = e.target.value;
        renderView();
        attachEvents();
      });
    }

    // Refresh button
    root.querySelector('[data-action="refresh"]').addEventListener('click', () => loadNews());

    // News item actions (delegation)
    root.querySelector('.news-results').addEventListener('click', e => {
      const item = e.target.closest('.news-item');
      if (!item) return;

      const id = item.dataset.id;
      const action = e.target.closest('[data-action]')?.dataset.action;

      if (action === 'save') {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(id);
      } else if (action === 'read') {
        e.preventDefault();
        e.stopPropagation();
        markRead(id);
      } else if (action === 'open') {
        // Let the link navigate normally, but mark as read
        markRead(id);
      } else {
        // Click on the item itself - mark as read
        markRead(id);
      }
    });

    // Keyboard shortcut for opening links with Enter/Space on news items
    root.querySelector('.news-results').addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.news-item') && !e.target.closest('button, a')) {
        e.preventDefault();
        const item = e.target.closest('.news-item');
        const link = item.querySelector('.news-link');
        if (link) {
          markRead(item.dataset.id);
          link.click();
        }
      }
    });
  }

  App.registerView('news', {
    get title() { return App.t('news.title'); },
    render(rootEl, params) {
      root = rootEl;

      // Load persisted sets
      readSet = loadSet(READ_KEY);
      savedSet = loadSet(SAVED_KEY);

      // Parse params: #/news/[category]/[days]
      if (params[0] && CATEGORIES.some(c => c.id === params[0])) {
        activeCategory = params[0];
      }
      if (params[1] && DAY_OPTIONS.some(d => d.value === Number(params[1]))) {
        activeDays = Number(params[1]);
      }

      renderView();
      attachEvents();
      loadNews(true);

      // Keyboard shortcuts
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
        if (keyCleanup) keyCleanup();
        if (abortController) abortController.abort();
      };
    },
  });
})();