(function () {
  'use strict';

  class NewsError extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'NewsError';
      this.code = code;
    }
  }

  let lastConfigured = false;

  App.news = {
    get configured() { return lastConfigured; },

    async list({ days = 7, category = null } = {}) {
      try {
        const params = new URLSearchParams();
        params.set('days', String(days));
        if (category) params.set('category', category);
        const res = await fetch('/api/news?' + params.toString(), { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new NewsError('Server error: ' + res.status, 'server_error');
        const data = await res.json();
        lastConfigured = data.configured === true;
        return {
          updatedAt: data.updatedAt,
          items: data.items || [],
        };
      } catch (e) {
        if (e.name === 'NewsError') throw e;
        lastConfigured = false;
        throw new NewsError('Không kết nối được server (chạy qua file:// hoặc mạng lỗi)', 'no_server');
      }
    },

    /**
     * Daily curated digest ("Bản tin hôm nay"). date = 'YYYY-MM-DD' or null for the latest.
     * → { configured, digest: {date, intro, items[], published_at} | null, dates: [], setup? }
     */
    async digest({ date = null } = {}) {
      let res;
      try {
        res = await fetch('/api/digest' + (date ? '?date=' + encodeURIComponent(date) : ''), { signal: AbortSignal.timeout(10000) });
      } catch (e) {
        throw new NewsError('Không kết nối được server (chạy qua file:// hoặc mạng lỗi)', 'no_server');
      }
      let data = null;
      try { data = await res.json(); } catch (e) { /* non-JSON: static host without api/ */ }
      if (!data || typeof data !== 'object') throw new NewsError('Không kết nối được server (chạy qua file:// hoặc mạng lỗi)', 'no_server');
      if (!res.ok) throw new NewsError(data.error || ('Server error: ' + res.status), data.code || 'server_error');
      return {
        configured: data.configured === true,
        digest: data.digest || null,
        dates: Array.isArray(data.dates) ? data.dates : [],
        setup: data.setup || null,
      };
    },
  };
})();