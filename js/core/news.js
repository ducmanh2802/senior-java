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
  const NO_SERVER = 'Không kết nối được server (chạy qua file:// hoặc mạng lỗi)';
  // AbortSignal.timeout is missing on older Safari/iOS (< 16): calling it threw inside fetch's try, so the page
  // reported "no server" even when /api was fine. Fall back to an AbortController + timer.
  function timeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(ms);
    if (typeof AbortController !== 'function') return undefined;
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    return c.signal;
  }

  App.news = {
    get configured() { return lastConfigured; },

    async list({ days = 7, category = null } = {}) {
      try {
        const params = new URLSearchParams();
        params.set('days', String(days));
        if (category) params.set('category', category);
        const res = await fetch('/api/news?' + params.toString(), { signal: timeoutSignal(10000) });
        if (!res.ok) throw new NewsError('Server error: ' + res.status, 'server_error');
        const data = await res.json();
        lastConfigured = data.configured === true;
        return {
          updatedAt: data.updatedAt,
          items: Array.isArray(data.items) ? data.items : [],
        };
      } catch (e) {
        if (e.name === 'NewsError') throw e;
        lastConfigured = false;
        throw new NewsError(NO_SERVER, 'no_server');
      }
    },

    /**
     * Daily curated digest ("Bản tin hôm nay"). date = 'YYYY-MM-DD' or null for the latest.
     * kind = 'jobs' → the daily job digest ("Việc làm hôm nay", docs/JOBS-DIGEST.md), same shape with job items.
     * → { configured, digest: {date, intro, items[], published_at} | null, dates: [], setup? }
     */
    async digest({ date = null, kind = 'news' } = {}) {
      let res;
      try {
        res = await fetch('/api/digest?' + new URLSearchParams(Object.assign(kind === 'jobs' ? { kind: 'jobs' } : {}, date ? { date } : {})).toString(), { signal: timeoutSignal(10000) });
      } catch (e) {
        throw new NewsError(NO_SERVER, 'no_server');
      }
      let data = null;
      try { data = await res.json(); } catch (e) { /* non-JSON: static host without api/ */ }
      if (!data || typeof data !== 'object') throw new NewsError(NO_SERVER, 'no_server');
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