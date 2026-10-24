(function () {
  'use strict';
  // Stub: T157 builds the daily news view on App.news.
  App.registerView('news', {
    get title() { return App.t('news.title'); },
    render(root) {
      App.i18n.add({ vi: { 'news.title': 'Tin tức mỗi sáng' }, en: { 'news.title': 'Morning news' } });
      root.innerHTML = '<div class="page-head"><h1>' + App.esc(App.t('news.title')) + '</h1><p>Tin công nghệ, thị trường tuyển dụng và engineering blog — cập nhật lúc 6h sáng mỗi ngày.</p></div><div class="empty card">Đang xây dựng.</div>';
    },
  });
})();
