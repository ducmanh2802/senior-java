(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'projects.title': 'Pet project',
      'projects.filterBySkill': 'Lọc theo kỹ năng',
      'projects.allSkills': 'Tất cả kỹ năng',
      'projects.weeks': 'tuần',
      'projects.milestones': 'mốc',
      'projects.percent': '%',
      'projects.pitch': 'Tóm tắt ý tưởng',
      'projects.requirements': 'Yêu cầu',
      'projects.architecture': 'Kiến trúc',
      'projects.milestonesTitle': 'Các mốc thực hiện',
      'projects.completionCriteria': 'Tiêu chí hoàn thành',
      'projects.technicalChallenges': 'Thách thức kỹ thuật',
      'projects.challenge': 'Thách thức',
      'projects.readmeTemplate': 'Mẫu README',
      'projects.copyReadme': 'Copy README',
      'projects.copied': 'Đã chép README.',
      'projects.copyFailed': 'Could not copy automatically; please select and copy the README content.',
      'projects.interviewStory': 'Interview Story',
      'projects.interviewQuestions': 'Interview Practice Questions',
      'projects.relatedStudy': 'Related Study',
      'projects.backToList': '← All Pet Projects',
      'projects.notFound': 'Pet Project Not Found',
      'projects.notFoundDesc': 'Pet project does not exist.',
      'projects.backToProjects': 'Back to Projects',
      'projects.design': 'Detailed Design',
      'projects.designHeading': 'Detailed Design',
      'projects.interviewAnswer': 'Suggested answer',
      'projects.toc': 'Table of contents',
      'projects.tocPitch': 'Pitch',
      'projects.tocRequirements': 'Requirements',
      'projects.tocArchitecture': 'Architecture',
      'projects.tocDesign': 'Detailed Design',
      'projects.tocMilestones': 'Milestones',
      'projects.tocChallenges': 'Challenges',
      'projects.tocReadme': 'README',
      'projects.tocInterview': 'Interview',
    },
    en: {
      'projects.title': 'Pet Projects',
      'projects.filterBySkill': 'Filter by skill',
      'projects.allSkills': 'All skills',
      'projects.weeks': 'weeks',
      'projects.milestones': 'milestones',
      'projects.percent': '%',
      'projects.pitch': 'Pitch',
      'projects.requirements': 'Requirements',
      'projects.architecture': 'Architecture',
      'projects.milestonesTitle': 'Milestones',
      'projects.completionCriteria': 'Completion Criteria',
      'projects.technicalChallenges': 'Technical Challenges',
      'projects.challenge': 'Challenge',
      'projects.readmeTemplate': 'README Template',
      'projects.copyReadme': 'Copy README',
      'projects.copied': 'README copied.',
      'projects.copyFailed': 'Could not copy automatically; please select and copy the README content.',
      'projects.interviewStory': 'Interview Story',
      'projects.interviewQuestions': 'Interview Practice Questions',
      'projects.relatedStudy': 'Related Study',
      'projects.backToList': '← All Pet Projects',
      'projects.notFound': 'Pet Project Not Found',
      'projects.notFoundDesc': 'Pet project does not exist.',
      'projects.backToProjects': 'Back to Projects',
      'projects.design': 'Detailed Design',
      'projects.designHeading': 'Detailed Design',
      'projects.interviewAnswer': 'Suggested answer',
      'projects.toc': 'Table of contents',
      'projects.tocPitch': 'Pitch',
      'projects.tocRequirements': 'Requirements',
      'projects.tocArchitecture': 'Architecture',
      'projects.tocDesign': 'Detailed Design',
      'projects.tocMilestones': 'Milestones',
      'projects.tocChallenges': 'Challenges',
      'projects.tocReadme': 'README',
      'projects.tocInterview': 'Interview',
    }
  });

  const esc = App.esc;
  const progress = p => p.milestones.reduce((n, _, i) => n + (App.store.getStatus(p.id + '#m' + i) === 'known' ? 1 : 0), 0);
  const pct = p => Math.round(progress(p) / p.milestones.length * 100);

  function list(root) {
    const all = window.PROJECTS || [];
    const skills = [...new Set(all.flatMap(p => p.skills))].sort();
    root.innerHTML = `<div class="page-head"><h1>${App.t('projects.title')}</h1><p class="muted">${App.t('projects.filterBySkill')}</p></div>
      <label class="pr-filter-label" for="projectSkill">${App.t('projects.filterBySkill')}</label>
      <select class="select pr-filter" id="projectSkill"><option value="">${App.t('projects.allSkills')}</option>${skills.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}</select>
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
      <p class="muted">${p.weeks} ${App.t('projects.weeks')} · ${n}/${p.milestones.length} ${App.t('projects.milestones')} · ${percent}${App.t('projects.percent')}</p>
      <div class="progress" aria-label="${App.t('projects.percent')} ${percent}"><i style="width:${percent}%"></i></div>
      <div class="chips">${p.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
      <p class="md">${App.md(p.pitch)}</p><a class="btn sm" href="#/projects/${esc(p.id)}">${App.t('projects.pitch')}</a>
    </article>`;
  }

  function detail(root, p) {
    const questions = App.questions(), lessons = App.lessons();
    const checked = p.milestones.map((_, i) => App.store.getStatus(p.id + '#m' + i) === 'known');
    const percent = Math.round(checked.filter(Boolean).length / checked.length * 100);
    const answers = Array.isArray(p.interview.answers) ? p.interview.answers : [];
    const hasDesign = typeof p.design === 'string' && p.design.trim();
    const toc = [
      ['pitch', 'projects.tocPitch'],
      ['requirements', 'projects.tocRequirements'],
      ['architecture', 'projects.tocArchitecture'],
      hasDesign ? ['design', 'projects.tocDesign'] : null,
      ['milestones', 'projects.tocMilestones'],
      ['challenges', 'projects.tocChallenges'],
      ['readme', 'projects.tocReadme'],
      ['interview', 'projects.tocInterview'],
    ].filter(Boolean);
    root.innerHTML = `<a class="link-btn" href="#/projects">${App.t('projects.backToList')}</a>
      <div class="page-head"><h1>${esc(p.title)}</h1><div class="row pr-meta"><span class="badge">${esc(App.LEVELS[p.level] || p.level)}</span><span class="badge">${p.weeks} ${App.t('projects.weeks')}</span><span class="badge" data-progress-label>${percent}${App.t('projects.percent')} ${App.t('projects.completionCriteria')}</span></div></div>
      <div class="chips pr-skills">${p.skills.map(s => `<span class="chip">${esc(s)}</span>`).join('')}</div>
      <nav class="pr-toc"><span class="muted">${App.t('projects.toc')}</span>${toc.map(([sec, key]) => `<a href="#pr-${sec}" data-scroll="${sec}">${App.t(key)}</a>`).join('')}</nav>
      <section class="card md" id="pr-pitch">${App.md(p.pitch)}</section>
      <section class="card md" id="pr-requirements">${App.md(p.requirements)}</section>
      <section class="card md" id="pr-architecture">${App.md(p.architecture)}</section>
      ${hasDesign ? `<section class="card md" id="pr-design"><h2>${App.t('projects.designHeading')}</h2>${App.md(p.design)}</section>` : ''}
      <section class="pr-milestones" id="pr-milestones"><h2>${App.t('projects.milestonesTitle')}</h2><div class="progress" aria-label="${App.t('projects.percent')} ${percent}"><i data-progress-bar style="width:${percent}%"></i></div>
      ${p.milestones.map((m, i) => `<article class="card pr-milestone"><label class="pr-check"><input type="checkbox" data-milestone="${i}"${checked[i] ? ' checked' : ''}><span><b>${i + 1}. ${esc(m.title)}</b></span></label>
        <div class="md">${App.md(m.tasks)}</div><details><summary>${App.t('projects.completionCriteria')}</summary><div class="md">${App.md(m.done)}</div></details></article>`).join('')}</section>
      <section class="pr-challenges" id="pr-challenges"><h2>${App.t('projects.technicalChallenges')}</h2>${p.challenges.map((c, i) => `<details class="card"><summary>${App.t('projects.challenge')} ${i + 1}</summary><div class="md">${App.md(c)}</div></details>`).join('')}</section>
      <section class="card pr-readme" id="pr-readme"><h2>${App.t('projects.readmeTemplate')}</h2><button type="button" class="btn sm" data-copy>${App.t('projects.copyReadme')}</button><span class="muted" data-copy-status aria-live="polite"></span><pre class="pr-readme-text">${esc(p.readme)}</pre></section>
      <section class="card md" id="pr-interview">${App.md(p.interview.story)}<h3>${App.t('projects.interviewQuestions')}</h3><ol>${p.interview.questions.map((q, i) => {
        const body = App.md(q).replace(/^<p>|<\/p>$/g, '');
        const ans = answers[i];
        const ansHtml = ans ? `<details class="pr-answer"><summary>${App.t('projects.interviewAnswer')} ${i + 1}</summary><div class="md">${App.md(ans)}</div></details>` : '';
        return `<li>${body}${ansHtml}</li>`;
      }).join('')}</ol></section>
      ${p.related && p.related.length ? `<section class="card"><h2>${App.t('projects.relatedStudy')}</h2><ul>${p.related.map(id => {
        const q = questions.find(x => x.id === id);
        if (q) return `<li><a href="#/bank/${esc(q.topic)}">${App.md(q.q).replace(/^<p>|<\/p>$/g, '')}</a></li>`;
        const l = lessons.find(x => x.id === id);
        return l ? `<li><a href="#/learn/${esc(l.id)}">${esc(l.title)}</a></li>` : '';
      }).join('')}</ul></section>` : ''}`;

    function updateProgress() {
      const boxes = [...root.querySelectorAll('[data-milestone]')];
      const done = boxes.filter(b => b.checked).length, value = Math.round(done / boxes.length * 100);
      root.querySelector('[data-progress-label]').textContent = value + App.t('projects.percent') + ' ' + App.t('projects.completionCriteria');
      root.querySelector('[data-progress-bar]').style.width = value + '%';
    }
    function onScroll(e) {
      const a = e.target.closest('[data-scroll]');
      if (!a) return;
      e.preventDefault();
      const target = root.querySelector('#' + esc(a.dataset.scroll));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    async function onClick(e) {
      const button = e.target.closest('[data-copy]');
      if (!button) return;
      const status = root.querySelector('[data-copy-status]');
      try {
        await navigator.clipboard.writeText(p.readme);
        status.textContent = App.t('projects.copied');
      } catch (_) {
        const area = document.createElement('textarea');
        area.value = p.readme; area.setAttribute('readonly', ''); area.className = 'pr-copy-fallback';
        root.appendChild(area); area.select();
        const copied = document.execCommand('copy'); area.remove();
        status.textContent = copied ? App.t('projects.copied') : App.t('projects.copyFailed');
      }
    }
    function onChange(e) {
      const box = e.target.closest('[data-milestone]');
      if (!box) return;
      App.store.setStatus(p.id + '#m' + box.dataset.milestone, box.checked ? 'known' : 'unknown');
      updateProgress();
    }
    root.addEventListener('click', onScroll);
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    return () => { root.removeEventListener('click', onScroll); root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); };
  }

  App.registerView('projects', {
    get title() { return App.t('projects.title'); },
    render(root, params) {
      const id = params && params[0];
      if (!id) return list(root);
      const p = (window.PROJECTS || []).find(x => x.id === id);
      if (!p) { root.innerHTML = '<div class="empty"><h2>' + App.t('projects.notFound') + '</h2><p><a href="#/projects">' + App.t('projects.backToProjects') + '</a></p></div>'; return () => {}; }
      return detail(root, p);
    },
  });
})();
