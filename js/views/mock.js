/* View "mock" — owner: task T11. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';
  App.registerView('mock', {
    title: 'Phỏng vấn thử',
    render(root, params) {
      root.innerHTML = '<div class="empty"><h2>Phỏng vấn thử</h2><p>Đang xây dựng (T11).</p></div>';
      return () => {}; // cleanup: remove timers / key handlers here
    },
  });
})();
