/* View "dashboard" — owner: task T9. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';
  App.registerView('dashboard', {
    title: 'Tổng quan',
    render(root, params) {
      root.innerHTML = '<div class="empty"><h2>Tổng quan</h2><p>Đang xây dựng (T9).</p></div>';
      return () => {}; // cleanup: remove timers / key handlers here
    },
  });
})();
