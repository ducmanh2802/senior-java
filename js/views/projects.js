(function () {
  'use strict';
  const esc = App.esc;
  const progress = p => p.milestones.reduce((n, _, i) => n + (App.store.getStatus(p.id + '#m' + i) === 'known' ? 1 : 0), 0);
  const pct = p => Math.round(progress(p) / p.milestones.length * 100);

  function list(root) {
    const all = window.PROJECTS || [];
    const skills = [...new Set(all.flatMap(p => p.skills))].sort();
    root.innerHTML = `<div class="page-head"><h1>Pet project</h1><p class="muted">Lộ trình làm sản phẩm có thể demo, đo lường và kể trong phỏng vấn. Chọn một kỹ năng để lọc.</p></div>
      <label class="pr-filter-label" for="projectSkill">Lọc theo kỹ năng</label>
      <select class="select pr-filter" id="projectSkill"><option value="">Tất cả kỹ năng</option>${skills.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
      <div class="pr-grid">${all.map(p => card(p)).join('')}</div>`;
    const onChange = e => {
      if (!e.target.matches('#projectSkill')) return;
      root.querySelectorAll('.pr-card').forEach(c => { c.hidden = !!e.target.value && !c.dataset.skills.split('|').includes(e.target.value); });
    };
    root.addEventListener('change', onChange);
    return () => root.removeEventListener('change', onChange);
  }

  function card(p) {
    const n = progress(p), percent = pct(p);
    return `<article class="card pr-card" data-skills="${esc(p.skills.join('|'))}">
      <div class="pr-card-head"><h2><a href="#/projects/${esc(p.id)}">${esc(p.title)}</a></h2><span class="badge">${esc(App.LEVELS[p.level] || p.level)}</span></div>
      <p class="muted">${p.weeks} tuần · ${n}/${p.milestones.length} mốc · ${percent}%</p>
      <div class="progress" aria-label="Hoàn thành ${percent}%"><i style="width:${percent}%"></i></div>
      <div class="chips">${p.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
      <p class="md">${App.md(p.pitch)}</p><a class="btn sm" href="#/projects/${esc(p.id)}">Xem kế hoạch</a>
    </article>`;
  }

  function detail(root, p) {
    const questions = App.questions(), lessons = App.lessons();
    const checked = p.milestones.map((_, i) => App.store.getStatus(p.id + '#m' + i) === 'known');
    const percent = Math.round(checked.filter(Boolean).length / checked.length * 100);
    root.innerHTML = `<a class="link-btn" href="#/projects">← Tất cả pet project</a>
      <div class="page-head"><h1>${esc(p.title)}</h1><div class="row pr-meta"><span class="badge">${esc(App.LEVELS[p.level] || p.level)}</span><span class="badge">${p.weeks} tuần</span><span class="badge" data-progress-label>${percent}% hoàn thành</span></div></div>
      <div class="chips pr-skills">${p.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
      <section class="card md">${App.md(p.pitch)}</section>
      <section class="card md">${App.md(p.requirements)}</section>
      <section class="card md">${App.md(p.architecture)}</section>
      <section class="pr-milestones"><h2>Các mốc thực hiện</h2><div class="progress" aria-label="Tiến độ dự án"><i data-progress-bar style="width:${percent}%"></i></div>
      ${p.milestones.map((m, i) => `<article class="card pr-milestone"><label class="pr-check"><input type="checkbox" data-milestone="${i}"${checked[i] ? ' checked' : ''}><span><b>${i + 1}. ${esc(m.title)}</b></span></label>
        <div class="md">${App.md(m.tasks)}</div><details><summary>Tiêu chí hoàn thành</summary><div class="md">${App.md(m.done)}</div></details></article>`).join('')}</section>
      <section class="pr-challenges"><h2>Thách thức kỹ thuật</h2>${p.challenges.map((c, i) => `<details class="card"><summary>Thách thức ${i + 1}</summary><div class="md">${App.md(c)}</div></details>`).join('')}</section>
      <section class="card pr-readme"><h2>Mẫu README</h2><button type="button" class="btn sm" data-copy>Copy README</button><span class="muted" data-copy-status aria-live="polite"></span><pre class="pr-readme-text">${esc(p.readme)}</pre></section>
      <section class="card md">${App.md(p.interview.story)}<h3>Câu hỏi luyện phỏng vấn</h3><ol>${p.interview.questions.map(q => `<li>${App.md(q).replace(/^<p>|<\/p>$/g, '')}</li>`).join('')}</ol></section>
      ${p.related && p.related.length ? `<section class="card"><h2>Ôn tập liên quan</h2><ul>${p.related.map(id => {
        const q = questions.find(x => x.id === id);
        if (q) return `<li><a href="#/bank/${esc(q.topic)}">${App.md(q.q).replace(/^<p>|<\/p>$/g, '')}</a></li>`;
        const l = lessons.find(x => x.id === id);
        return l ? `<li><a href="#/learn/${esc(l.id)}">${esc(l.title)}</a></li>` : '';
      }).join('')}</ul></section>` : ''}`;

    function updateProgress() {
      const boxes = [...root.querySelectorAll('[data-milestone]')];
      const done = boxes.filter(b => b.checked).length, value = Math.round(done / boxes.length * 100);
      root.querySelector('[data-progress-label]').textContent = value + '% hoàn thành';
      root.querySelector('[data-progress-bar]').style.width = value + '%';
    }
    async function onClick(e) {
      const button = e.target.closest('[data-copy]');
      if (!button) return;
      const status = root.querySelector('[data-copy-status]');
      try {
        await navigator.clipboard.writeText(p.readme);
        status.textContent = 'Đã chép README.';
      } catch (_) {
        const area = document.createElement('textarea');
        area.value = p.readme; area.setAttribute('readonly', ''); area.className = 'pr-copy-fallback';
        root.appendChild(area); area.select();
        const copied = document.execCommand('copy'); area.remove();
        status.textContent = copied ? 'Đã chép README.' : 'Không thể chép tự động; hãy chọn và sao chép nội dung README.';
      }
    }
    function onChange(e) {
      const box = e.target.closest('[data-milestone]');
      if (!box) return;
      App.store.setStatus(p.id + '#m' + box.dataset.milestone, box.checked ? 'known' : 'unknown');
      updateProgress();
    }
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    return () => { root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); };
  }

  App.registerView('projects', {
    title: 'Pet project',
    render(root, params) {
      const id = params && params[0];
      if (!id) return list(root);
      const p = (window.PROJECTS || []).find(x => x.id === id);
      if (!p) { root.innerHTML = '<div class="empty"><h2>Không tìm thấy pet project</h2><p><a href="#/projects">Về danh sách</a></p></div>'; return () => {}; }
      return detail(root, p);
    },
  });
})();
