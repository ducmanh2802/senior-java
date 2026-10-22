/* View "roadmap" — owner: task T17. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';
  App.registerView('roadmap', {
    title: 'Lộ trình 6 tháng',
    render(root, params) {
      root.innerHTML = '<div class="empty"><h2>Lộ trình 6 tháng</h2><p>Đang xây dựng (T17).</p></div>';
      return () => {};
    },
  });
})();
