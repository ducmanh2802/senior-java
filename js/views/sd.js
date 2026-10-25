(function () {
  'use strict';
  // Stub: T287 builds timed system-design practice on window.SD_PROBLEMS.
  App.registerView('sd', {
    get title() { return App.t('sd.title'); },
    render(root) {
      App.i18n.add({ vi: { 'sd.title': 'Luyện System Design' }, en: { 'sd.title': 'System design practice' } });
      root.innerHTML = '<div class="page-head"><h1>' + App.esc(App.t('sd.title')) + '</h1><p>Bấm giờ từng pha như vòng phỏng vấn 45 phút thật, AI chấm theo rubric.</p></div><div class="empty card">' + (window.SD_PROBLEMS || []).length + ' đề — đang xây dựng.</div>';
    },
  });
})();
