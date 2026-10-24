(function () {
  'use strict';
  // Stub: T140 builds the full learning-path view on window.PATH.
  App.registerView('path', {
    title: 'Lộ trình học',
    render(root) {
      const stages = window.PATH || [];
      root.innerHTML = `<div class="page-head"><h1>Lộ trình học Java junior → Senior</h1>
        <p>Học theo thứ tự từng chặng: bài học có bài tập tự chấm, rồi câu hỏi chốt chặng.</p></div>
        ${stages.map(s => `<div class="card"><h3>${s.order}. ${App.esc(s.title)} <span class="badge">${App.esc(s.phase)} · tuần ${App.esc(s.weeks)}</span></h3>
          <div class="md">${App.md(s.goal)}</div>
          <ul>${s.lessons.map(id => `<li><a href="#/learn/${App.esc(id)}">${App.esc((App.lessons().find(l => l.id === id) || {}).title || id)}</a></li>`).join('')}</ul></div>`).join('')}`;
    },
  });
})();
