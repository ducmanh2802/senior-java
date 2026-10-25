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
  };
})();