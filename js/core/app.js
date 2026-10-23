/*
 * App core — shared contract for every view and data file.
 * Classic script (no ES modules) so the site works when opened via file://.
 * Views register themselves with App.registerView(); see AGENTS.md.
 */
(function () {
  'use strict';

  const STORE_KEY = 'sjp.v1';
  const DEFAULT_DATA = () => ({
    progress: {},        // id -> { s: status, t: lastTs, n: reviews, iv: intervalDays, ef: ease, due: ts }
    bookmarks: {},
    quizHistory: [], mockHistory: [],
    daily: {},           // 'YYYY-MM-DD' -> { review, known, quiz, mock, algo, minutes }
    roadmap: { start: null, done: {} },  // roadmap view: start date + checked task keys
    theme: null,
  });
  const DAY = 86400000;

  const LEVELS = { mid: 'Middle', senior: 'Senior', lead: 'Lead / Architect' };
  const STATUS = {
    known: { label: 'Đã thuộc', cls: 'ok' },
    review: { label: 'Cần ôn', cls: 'warn' },
    unknown: { label: 'Chưa biết', cls: 'bad' },
  };

  // ---------- storage ----------
  function loadData() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY));
      return Object.assign(DEFAULT_DATA(), raw || {});
    } catch (e) {
      return DEFAULT_DATA();
    }
  }
  let data = loadData();

  const store = {
    get data() { return data; },
    save() {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
    },
    getStatus(id) { return data.progress[id] ? data.progress[id].s : null; },
    /**
     * Record a self-assessment and schedule the next review (simplified SM-2):
     * unknown -> tomorrow, review -> short interval, known -> interval grows by ease.
     */
    setStatus(id, s) {
      const p = data.progress[id] || { n: 0, iv: 0, ef: 2.5 };
      if (p.ef == null) { p.ef = 2.5; p.iv = 0; }
      if (s === 'unknown') { p.iv = 1; p.ef = Math.max(1.3, p.ef - 0.2); }
      else if (s === 'review') { p.iv = Math.max(2, Math.round(p.iv * 1.2)); p.ef = Math.max(1.3, p.ef - 0.05); }
      else { p.iv = p.iv < 3 ? 3 : Math.round(p.iv * p.ef); p.ef = Math.min(3, p.ef + 0.1); }
      p.s = s; p.t = Date.now(); p.n += 1;
      p.due = startOfDay(Date.now()) + p.iv * DAY;
      data.progress[id] = p;
      store.log('review');
      if (s === 'known') store.log('known');
      store.save();
    },
    /** Next review timestamp (start of day) or null if never assessed. */
    getDue(id) { return data.progress[id] ? data.progress[id].due || null : null; },
    /** Assessed item whose review date is today or earlier. */
    isDue(id) { const d = store.getDue(id); return d != null && d <= startOfDay(Date.now()); },
    /** Daily activity log; kinds: review, known, quiz, mock, algo, minutes. */
    log(kind, n) {
      const k = dayKey(Date.now());
      const d = data.daily[k] || (data.daily[k] = {});
      d[kind] = (d[kind] || 0) + (n == null ? 1 : n);
      store.save();
    },
    day(key) { return data.daily[key || dayKey(Date.now())] || {}; },
    /** Consecutive days with any activity, ending today (or yesterday if today is still empty). */
    streak() {
      let t = Date.now(), n = 0;
      if (!Object.keys(store.day(dayKey(t))).length) t -= DAY;
      while (Object.keys(store.day(dayKey(t))).length) { n++; t -= DAY; }
      return n;
    },
    isBookmarked(id) { return !!data.bookmarks[id]; },
    toggleBookmark(id) {
      if (data.bookmarks[id]) delete data.bookmarks[id]; else data.bookmarks[id] = 1;
      store.save();
      return !!data.bookmarks[id];
    },
    addQuizResult(r) { data.quizHistory.unshift(Object.assign({ at: Date.now() }, r)); data.quizHistory.length = Math.min(data.quizHistory.length, 50); store.log('quiz'); },
    addMockResult(r) { data.mockHistory.unshift(Object.assign({ at: Date.now() }, r)); data.mockHistory.length = Math.min(data.mockHistory.length, 50); store.log('mock'); },
    replace(next) { data = Object.assign(DEFAULT_DATA(), next); store.save(); },
    reset() { data = DEFAULT_DATA(); store.save(); },
  };

  // ---------- helpers ----------
  function startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dayKey(ts) {
    const d = new Date(ts);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // optional q.refs [{type, title, url, note?}] are appended once as a "learn more" section of the answer
  const REF_ICON = { video: '🎬', doc: '📘', article: '📝', book: '📕', course: '🎓' };
  let refsAppended = false;
  function questions() {
    const qs = window.QUESTIONS || [];
    if (!refsAppended) {
      refsAppended = true;
      qs.forEach(q => {
        if (!Array.isArray(q.refs) || !q.refs.length) return;
        q.a += '\n\n### 📚 Tìm hiểu sâu hơn\n' + q.refs.map(r => '- ' + (REF_ICON[r.type] || '🔗') + ' [' +
          String(r.title).replace(/[[\]]/g, '') + '](' + r.url + ')' + (r.note ? ' — ' + r.note : '')).join('\n');
      });
    }
    return qs;
  }
  function quiz() { return window.QUIZ || []; }
  function algos() { return window.ALGOS || []; }
  /** Lessons sorted by track order then lesson order (AGENTS.md section 12). */
  function lessons() {
    const order = topics().map(t => t.id);
    return (window.LESSONS || []).slice().sort((a, b) => order.indexOf(a.track) - order.indexOf(b.track) || a.order - b.order);
  }
  function topics() { return window.TOPICS || []; }
  /** Questions + algo problems due for spaced-repetition review today, most overdue first. */
  function dueItems() {
    const all = questions().concat(algos());
    return all.filter(x => store.isDue(x.id)).sort((a, b) => store.getDue(a.id) - store.getDue(b.id));
  }
  function topic(id) { return topics().find(t => t.id === id) || { id, name: id, icon: '•' }; }

  /** Filter questions. All fields optional; 'all' or empty means no filter. */
  function filterQuestions(f) {
    f = f || {};
    const term = (f.q || '').trim().toLowerCase();
    return questions().filter(x => {
      if (f.topic && f.topic !== 'all' && x.topic !== f.topic) return false;
      if (f.level && f.level !== 'all' && x.level !== f.level) return false;
      if (f.status && f.status !== 'all') {
        const s = store.getStatus(x.id);
        if (f.status === 'bookmarked') { if (!store.isBookmarked(x.id)) return false; }
        else if (f.status === 'unseen') { if (s) return false; }
        else if (f.status === 'due') { if (!store.isDue(x.id)) return false; }
        else if (s !== f.status) return false;
      }
      if (term && !(x.q + ' ' + (x.tags || []).join(' ') + ' ' + x.a).toLowerCase().includes(term)) return false;
      return true;
    });
  }

  /** Per-topic + overall progress counts. */
  function stats(topicId) {
    const list = topicId ? questions().filter(x => x.topic === topicId) : questions();
    const c = { total: list.length, known: 0, review: 0, unknown: 0, unseen: 0 };
    list.forEach(x => { c[store.getStatus(x.id) || 'unseen'] += 1; });
    return c;
  }

  /** Register a keydown handler that ignores typing in form fields. Returns cleanup. */
  function onKey(handler) {
    const fn = e => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handler(e);
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ---------- light markup renderer (see AGENTS.md "Markup") ----------
  const JAVA_KW = 'abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|var|record|sealed|permits|yield|null|true|false';
  const SQL_KW = 'SELECT|FROM|WHERE|AND|OR|NOT|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|ON|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|IN|IS|NULL|BEGIN|COMMIT|ROLLBACK|FOR|EXPLAIN|ANALYZE|DISTINCT|UNION|EXISTS|PRIMARY|KEY|FOREIGN|REFERENCES|DESC|ASC|LIKE|BETWEEN|TRANSACTION|ISOLATION|LEVEL|WITH|SHARE|NOWAIT|SKIP|LOCKED';
  const HL_RE = new RegExp(
    '(\\/\\/.*$|\\/\\*[\\s\\S]*?\\*\\/|--\\s.*$|#\\s.*$)' +            // 1 comment
    '|("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\')' +       // 2 string
    '|(@[A-Za-z_]\\w*)' +                                            // 3 annotation
    '|\\b(' + JAVA_KW + '|' + SQL_KW + ')\\b' +                      // 4 keyword
    '|\\b(\\d[\\d_]*(?:\\.\\d+)?[lLfFdD]?)\\b',                         // 5 number
    'gm'
  );

  function highlight(code, lang) {
    if (lang === 'text' || lang === 'txt') return esc(code);
    let out = '', last = 0, m;
    HL_RE.lastIndex = 0;
    while ((m = HL_RE.exec(code))) {
      if (m[0] === '') { HL_RE.lastIndex++; continue; }
      out += esc(code.slice(last, m.index));
      const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'a' : m[4] ? 'k' : 'n';
      out += '<span class="t-' + cls + '">' + esc(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return out + esc(code.slice(last));
  }

  function inline(raw) {
    // {{code}} first so bold markers inside code stay literal
    return raw.split(/(\{\{[\s\S]+?\}\})/).map(part => {
      if (part.startsWith('{{') && part.endsWith('}}')) return '<code>' + esc(part.slice(2, -2)) + '</code>';
      return esc(part).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // [text](https://…) — https only; esc() already neutralised quotes, so the href cannot break out
        .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    }).join('');
  }

  function md(src) {
    const lines = String(src || '').replace(/\r/g, '').split('\n');
    let html = '', i = 0;
    const isSpecial = l => /^(~~~|### |- |\d+\. |\||> )/.test(l) || /^\s*$/.test(l);
    while (i < lines.length) {
      const l = lines[i];
      if (/^\s*$/.test(l)) { i++; continue; }
      if (l.startsWith('~~~')) {
        const lang = l.slice(3).trim() || 'java';
        const buf = []; i++;
        while (i < lines.length && !lines[i].startsWith('~~~')) buf.push(lines[i++]);
        i++;
        html += '<pre class="code" data-lang="' + esc(lang) + '"><code>' + highlight(buf.join('\n'), lang) + '</code></pre>';
        continue;
      }
      if (l.startsWith('### ')) { html += '<h4>' + inline(l.slice(4)) + '</h4>'; i++; continue; }
      if (l.startsWith('> ')) {
        const buf = [];
        while (i < lines.length && lines[i].startsWith('> ')) buf.push(lines[i++].slice(2));
        html += '<blockquote>' + inline(buf.join(' ')) + '</blockquote>';
        continue;
      }
      if (/^- /.test(l) || /^\d+\. /.test(l)) {
        const ordered = /^\d+\. /.test(l);
        const re = ordered ? /^\d+\. / : /^- /;
        const items = [];
        while (i < lines.length && (re.test(lines[i]) || /^ {2,}\S/.test(lines[i]))) {
          if (re.test(lines[i])) items.push(lines[i].replace(re, ''));
          else items[items.length - 1] += ' ' + lines[i].trim(); // continuation line
          i++;
        }
        const tag = ordered ? 'ol' : 'ul';
        html += '<' + tag + '>' + items.map(x => '<li>' + inline(x) + '</li>').join('') + '</' + tag + '>';
        continue;
      }
      if (l.startsWith('|')) {
        const rows = [];
        while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
        const cells = r => r.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
        const body = rows.filter(r => !/^\|[\s:|-]+\|?\s*$/.test(r));
        const [head, ...rest] = body;
        html += '<div class="table-wrap"><table><thead><tr>' + cells(head).map(c => '<th>' + inline(c) + '</th>').join('') +
          '</tr></thead><tbody>' + rest.map(r => '<tr>' + cells(r).map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') +
          '</tbody></table></div>';
        continue;
      }
      const buf = [];
      while (i < lines.length && !isSpecial(lines[i])) buf.push(lines[i++]);
      html += '<p>' + inline(buf.join(' ')) + '</p>';
    }
    return html;
  }

  // ---------- router ----------
  const views = {};
  let cleanup = null;

  function registerView(name, def) { views[name] = def; }

  function navigate(hash) { location.hash = hash; }

  function route() {
    const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    const name = views[parts[0]] ? parts[0] : 'dashboard';
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('active', a.dataset.route === name));
    document.querySelectorAll('.nav-group[open]').forEach(d => d.removeAttribute('open'));
    const root = document.getElementById('main');
    root.innerHTML = '';
    root.className = 'container view-' + name;
    const view = views[name];
    if (!view) { root.innerHTML = '<p class="muted">Chưa có view nào được đăng ký.</p>'; return; }
    try {
      const c = view.render(root, parts.slice(1));
      if (typeof c === 'function') cleanup = c;
    } catch (e) {
      console.error(e);
      root.innerHTML = '<div class="card"><h2>Lỗi khi hiển thị</h2><pre class="code"><code>' + esc(e.stack || e) + '</code></pre></div>';
    }
    if (view.title) document.title = view.title + ' · Senior Java Prep';
    window.scrollTo(0, 0);
  }

  // ---------- theme + footer ----------
  function applyTheme() {
    if (data.theme) document.documentElement.setAttribute('data-theme', data.theme);
    else document.documentElement.removeAttribute('data-theme');
  }

  function initChrome() {
    // nav dropdowns: one open at a time, close on outside click / Escape
    const groups = () => document.querySelectorAll('.nav-group[open]');
    document.addEventListener('click', e => groups().forEach(d => { if (!d.contains(e.target)) d.removeAttribute('open'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') groups().forEach(d => d.removeAttribute('open')); });
    document.querySelectorAll('.nav-group').forEach(d => d.addEventListener('toggle', () => {
      if (d.open) groups().forEach(o => { if (o !== d) o.removeAttribute('open'); });
    }));
    applyTheme();
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => {
      const dark = data.theme ? data.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      data.theme = dark ? 'light' : 'dark';
      store.save(); applyTheme();
    });
    const exp = document.getElementById('exportBtn');
    if (exp) exp.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'senior-java-prep-progress.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const imp = document.getElementById('importBtn');
    const file = document.getElementById('importFile');
    if (imp && file) {
      imp.addEventListener('click', () => file.click());
      file.addEventListener('change', async () => {
        try {
          store.replace(JSON.parse(await file.files[0].text()));
          applyTheme(); route();
        } catch (e) { alert('File không hợp lệ.'); }
        file.value = '';
      });
    }
    const rst = document.getElementById('resetBtn');
    if (rst) rst.addEventListener('click', () => {
      if (confirm('Xoá toàn bộ tiến độ học? Không thể hoàn tác.')) { store.reset(); applyTheme(); route(); }
    });
  }

  window.App = {
    LEVELS, STATUS, store, esc, md, highlight, shuffle, onKey, fmtDate,
    questions, quiz, algos, lessons, topics, dueItems, dayKey, startOfDay, DAY, topic, filterQuestions, stats,
    registerView, navigate, route,
  };

  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', () => { initChrome(); route(); });
  // installable + offline (sw.js); http(s) only — service workers do not exist on file://
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(e => console.warn('SW:', e.message)));
  }

  // Study-time tracking: +1 minute for each minute the tab is visible and the user interacted recently.
  let lastActive = Date.now();
  ['keydown', 'pointerdown', 'scroll'].forEach(ev => window.addEventListener(ev, () => { lastActive = Date.now(); }, { passive: true }));
  setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - lastActive < 120000) store.log('minutes');
  }, 60000);
})();
