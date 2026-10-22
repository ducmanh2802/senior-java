/* View "companies" — owner: task T21. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';
  App.registerView('companies', {
    title: 'Lộ trình theo công ty',
    render(root, params) {
      root.innerHTML = '<div class="empty"><h2>Lộ trình theo công ty</h2><p>Đang xây dựng (T21).</p></div>';
      return () => {};
    },
  });
})();
