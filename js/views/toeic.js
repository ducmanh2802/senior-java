(function () {
  'use strict';
  // Placeholder; the real view is written by task T1515 (tasks/T1515-*.md).
  App.registerView('toeic', {
    title: 'TOEIC Speaking & Writing',
    render(root) {
      root.innerHTML = '<div class="page-head"><h1>📝 TOEIC Speaking &amp; Writing</h1></div><div class="empty">Đang xây dựng. Có ' + (window.TOEIC || []).length + ' bài luyện.</div>';
    },
  });
})();
