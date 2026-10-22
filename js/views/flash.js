/* View "flash" — owner: task T10. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';
  App.registerView('flash', {
    title: 'Flashcard',
    render(root, params) {
      root.innerHTML = '<div class="empty"><h2>Flashcard</h2><p>Đang xây dựng (T10).</p></div>';
      return () => {}; // cleanup: remove timers / key handlers here
    },
  });
})();
