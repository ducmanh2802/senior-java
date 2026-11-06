/* View "jobs" — placeholder until task T862 writes the real view (tasks/T862-view-jobs.md). */
(function () {
  'use strict';
  App.registerView('jobs', {
    title: 'Việc làm',
    render(root) {
      root.innerHTML = '<div class="page-head"><h1>💼 Việc làm</h1></div><div class="card empty">Đang xây dựng: việc làm hôm nay + danh sách việc bạn theo dõi.</div>';
    },
  });
})();
