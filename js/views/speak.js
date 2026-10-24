(function () {
  'use strict';
  // Stub: T144 builds the speaking-practice view on window.DRILLS.
  App.registerView('speak', {
    title: 'Luyện nói tiếng Anh',
    render(root) {
      const n = k => (window.DRILLS || []).filter(d => d.kind === k).length;
      root.innerHTML = `<div class="page-head"><h1>Luyện nói tiếng Anh</h1>
        <p>Nghe và nhắc lại, trả lời nhanh có bấm giờ, phát âm thuật ngữ — luyện không giới hạn, không tốn lượt AI.</p></div>
        <div class="grid"><div class="card stat"><b>${n('shadow')}</b> câu shadowing</div>
        <div class="card stat"><b>${n('qa')}</b> câu hỏi nhanh</div><div class="card stat"><b>${n('term')}</b> thuật ngữ</div></div>`;
    },
  });
})();
