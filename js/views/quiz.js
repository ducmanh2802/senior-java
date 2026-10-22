/* View "quiz" — owner: task T10. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';
  App.registerView('quiz', {
    title: 'Trắc nghiệm',
    render(root, params) {
      root.innerHTML = '<div class="empty"><h2>Trắc nghiệm</h2><p>Đang xây dựng (T10).</p></div>';
      return () => {}; // cleanup: remove timers / key handlers here
    },
  });
})();
