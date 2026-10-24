(function () {
  'use strict';
  // Stub: T156 implements App.news.list({ days, category }) → { updatedAt, items: [{ id, category, source, title, url, summary, published }] }
  App.news = {
    configured: false,
    async list() { return { updatedAt: null, items: [] }; },
  };
})();
