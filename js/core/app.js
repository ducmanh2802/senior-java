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
    stories: [],
    interviewLog: [],
    jobs: [],            // #/jobs: job postings the user follows (id, updatedAt, deleted: synced like stories)
    aiFlags: [],
  });
  const DAY = 86400000;

  const LEVELS = { mid: 'Middle', senior: 'Senior', lead: 'Lead / Architect' };
  const STATUS = {
    known: { label: 'Đã thuộc', cls: 'ok' },
    review: { label: 'Cần ôn', cls: 'warn' },
    unknown: { label: 'Chưa biết', cls: 'bad' },
  };

  // ---------- storage ----------
  const isObj = v => !!v && typeof v === 'object' && !Array.isArray(v);
  // defaults for missing keys + the right container types, so views never crash on old/odd saved data
  function normalize(raw) {
    const d = Object.assign(DEFAULT_DATA(), isObj(raw) ? raw : {});
    ['progress', 'bookmarks', 'daily'].forEach(k => { if (!isObj(d[k])) d[k] = {}; });
    ['quizHistory', 'mockHistory', 'aiFlags', 'stories', 'interviewLog', 'jobs'].forEach(k => { if (!Array.isArray(d[k])) d[k] = []; });
    if (!isObj(d.roadmap)) d.roadmap = { start: null, done: {} };
    else if (!isObj(d.roadmap.done)) d.roadmap.done = {};
    return d;
  }
  function loadData() {
    try {
      return normalize(JSON.parse(localStorage.getItem(STORE_KEY)));
    } catch (e) {
      return DEFAULT_DATA();
    }
  }
  let data = loadData();
  // add n to today's counter without writing storage (callers save once)
  function bump(kind, n) {
    const k = dayKey(Date.now());
    const d = data.daily[k] || (data.daily[k] = {});
    d[kind] = (d[kind] || 0) + (n == null ? 1 : n);
  }

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
      bump('review');
      if (s === 'known') bump('known');
      store.save();   // one write (and one cloud-sync schedule) instead of three
    },
    /** Next review timestamp (start of day) or null if never assessed. */
    getDue(id) { return data.progress[id] ? data.progress[id].due || null : null; },
    /** Assessed item whose review date is today or earlier. */
    isDue(id) { const d = store.getDue(id); return d != null && d <= startOfDay(Date.now()); },
    /** Daily activity log; kinds: review, known, quiz, mock, algo, minutes. */
    log(kind, n) {
      bump(kind, n);
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
    replace(next) { data = normalize(next); store.save(); },
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
  let refsAppended = 0;   // questions arrive lazily (App.need): process only the not-yet-seen tail
  function questions() {
    const qs = window.QUESTIONS || [];
    if (refsAppended < qs.length) {
      const from = refsAppended;
      refsAppended = qs.length;
      qs.slice(from).forEach(q => {
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
  // ---------- light index (js/data/index-light.js, generated by scripts/build-light-index.js) ----------
  // window.DATA_INDEX lets light routes (#/, #/roadmap, #/account) show stats, due items and today's plan
  // without the heavy groups. App.lite(kind) returns the FULL list once its group is loaded (or when there is
  // no index, e.g. Node tools), otherwise compact objects: questions {id, topic, level[, lang, q]},
  // algos {id, title, difficulty, pattern}, lessons {id, track, order, title, level, minutes}, sd {id, title},
  // drills {id, kind, q|term+example|en}, companies {id, name, focus}, quiz {id, topic}. Light objects carry __light = true.
  const LITE_GROUP = { questions: 'questions', algos: 'algos', lessons: 'lessons', sd: 'sd', drills: 'drills', companies: 'companies', quiz: 'quiz' };
  const LITE_FULL = {
    questions: () => questions(), algos: () => algos(), lessons: () => lessons(),
    sd: () => window.SD_PROBLEMS || [], drills: () => window.DRILLS || [], companies: () => window.COMPANIES || [],
    quiz: () => quiz(),
  };
  let liteCache = null;
  function lightIndex() {
    const I = window.DATA_INDEX;
    if (!I) return null;
    if (liteCache && liteCache.src === I) return liteCache.lists;
    const mark = o => { o.__light = true; return o; };
    const obj = list => (list || []).map(x => mark(Object.assign({}, x)));
    const order = topics().map(t => t.id);
    const lists = {
      questions: (I.questions || []).map(r => mark(r[3] ? { id: r[0], topic: r[1], level: r[2], lang: r[3], q: r[4] } : { id: r[0], topic: r[1], level: r[2] })),
      algos: obj(I.algos),
      lessons: obj(I.lessons).sort((a, b) => order.indexOf(a.track) - order.indexOf(b.track) || a.order - b.order),
      sd: obj(I.sd), drills: obj(I.drills), companies: obj(I.companies),
      quiz: (I.quiz || []).map(r => mark({ id: r[0], topic: r[1] })),
    };
    liteCache = { src: I, lists };
    return lists;
  }
  function lite(kind) {
    const full = LITE_FULL[kind];
    if (!full) throw new Error('App.lite: unknown kind ' + kind);
    const idx = lightIndex();
    const has = window.App && window.App.hasData ? window.App.hasData([LITE_GROUP[kind]]) : groupDone[LITE_GROUP[kind]];
    return (!idx || has) ? full() : idx[kind];
  }
  /** Questions + algo problems due for spaced-repetition review today, most overdue first.
   *  Full objects when the groups are loaded, light objects (id, topic…) otherwise — callers needing text await the group. */
  function dueItems() {
    const today = startOfDay(Date.now()), prog = data.progress;
    const dueOf = x => { const p = prog[x.id]; return p && p.due ? p.due : null; };   // same rule as store.getDue
    const out = [];
    [lite('questions'), lite('algos')].forEach(list => list.forEach(x => { const d = dueOf(x); if (d != null && d <= today) out.push(x); }));
    return out.sort((a, b) => dueOf(a) - dueOf(b));
  }
  // id -> topic map, rebuilt only when window.TOPICS changes (views call App.topic() inside list loops)
  let topicMap = null, topicSrc = null, topicLen = -1;
  function topic(id) {
    const list = topics();
    if (list !== topicSrc || list.length !== topicLen) {
      topicMap = Object.create(null);
      list.forEach(t => { if (t && !(t.id in topicMap)) topicMap[t.id] = t; });
      topicSrc = list; topicLen = list.length;
    }
    return topicMap[id] || { id, name: id, icon: '•' };
  }

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
    const qs = lite('questions');
    const list = topicId ? qs.filter(x => x.topic === topicId) : qs;
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

  // one Intl formatter per language (toLocaleString with options builds a new one on every call: slow in long lists)
  const dateFmt = {};
  function fmtDate(ts) {
    const loc = App.lang === 'en' ? 'en-US' : 'vi-VN';
    if (!dateFmt[loc]) {
      const opts = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      try { dateFmt[loc] = new Intl.DateTimeFormat(loc, opts); }
      catch (e) { dateFmt[loc] = { format: d => d.toLocaleString(loc, opts) }; }
    }
    const d = new Date(ts);
    return isNaN(d.getTime()) ? String(d) : dateFmt[loc].format(d);   // format() throws on Invalid Date
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
        if (lang === 'seq' && window.Diagram) { html += window.Diagram.seqBlock(buf.join('\n')); continue; }
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

  // ---------- i18n (core strings) ----------
  // App.i18n comes from js/core/i18n.js, which loads after this file: register on DOMContentLoaded
  // (this listener is added before i18n.js's own init, so the strings exist when it relabels the page).
  document.addEventListener('DOMContentLoaded', () => App.i18n && App.i18n.add({
    vi: {
      'app.title': 'Senior Java Prep',
      'app.toast.exported': 'Đã xuất file tiến độ.',
      'app.toast.imported': 'Đã nhập tiến độ.',
      'app.toast.reset': 'Đã xoá tiến độ.',
      'app.confirm.reset': 'Xoá toàn bộ tiến độ học? Không thể hoàn tác.',
      'app.alert.importError': 'File không hợp lệ.',
      'app.footer.saved': 'Tiến độ được lưu trong trình duyệt (localStorage).',
      'app.footer.export': 'Xuất tiến độ',
      'app.footer.import': 'Nhập tiến độ',
      'app.footer.reset': 'Xoá tiến độ',
      'app.footer.privacy': 'Quyền riêng tư',
      'app.footer.terms': 'Điều khoản',
      'app.footer.about': 'Giới thiệu',
      'app.error.render': 'Lỗi khi hiển thị',
      'app.error.load': 'Không tải được trang này',
      'app.error.loadHint': 'Mạng chập chờn hoặc mất kết nối nên mã của trang chưa tải xong. Kiểm tra kết nối rồi bấm Thử lại.',
      'app.error.data': 'Một phần dữ liệu chưa tải được nên trang này có thể thiếu nội dung.',
      'app.retry': 'Thử lại',
      'app.home': 'Về trang Tổng quan',
      'app.settings.ai': 'Cài đặt AI',
      'app.settings.theme': 'Đổi giao diện sáng/tối',
      'app.settings.lang': 'Switch to English',
      'app.theme.light': 'Sáng',
      'app.theme.dark': 'Tối',
    },
    en: {
      'app.title': 'Senior Java Prep',
      'app.toast.exported': 'Progress exported.',
      'app.toast.imported': 'Progress imported.',
      'app.toast.reset': 'Progress reset.',
      'app.confirm.reset': 'Delete all study progress? Cannot be undone.',
      'app.alert.importError': 'Invalid file.',
      'app.footer.saved': 'Progress is saved in your browser (localStorage).',
      'app.footer.export': 'Export progress',
      'app.footer.import': 'Import progress',
      'app.footer.reset': 'Reset progress',
      'app.footer.privacy': 'Privacy',
      'app.footer.terms': 'Terms',
      'app.footer.about': 'About',
      'app.error.render': 'Render error',
      'app.error.load': 'This page could not be loaded',
      'app.error.loadHint': 'The network dropped before the page code finished loading. Check your connection, then retry.',
      'app.error.data': 'Some data did not load, so this page may be incomplete.',
      'app.retry': 'Retry',
      'app.home': 'Back to dashboard',
      'app.settings.ai': 'AI settings',
      'app.settings.theme': 'Toggle light/dark theme',
      'app.settings.lang': 'Chuyển sang tiếng Việt',
      'app.theme.light': 'Light',
      'app.theme.dark': 'Dark',
    },
  }));
  // ---------- lazy data (js/core/data-manifest.js, docs/PERFORMANCE.md) ----------
  // App.need(['questions', 'algos']) → Promise resolved once every file of those groups has run.
  // Classic <script> injection (works on file://); async=false keeps execution in insertion order, so
  // QUESTIONS/QUIZ/GLOSSARY keep the manifest order while files still download in parallel.
  // After each group: 'datagroupload' event (glossary re-indexes, i18n overlays English on new items).
  const MANIFEST = window.DATA_MANIFEST || { groups: {}, routes: {}, prefetch: [], needsFor: () => [] };
  const groupState = {};   // group -> Promise (pending or resolved); dropped again if a file failed
  const groupDone = {};    // group -> true once loaded
  const fileState = {};    // data file -> Promise<ok>; dropped again if it failed (retried by the next need)
  function loadScript(src, fallback) {
    return new Promise(resolve => {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = () => resolve(true);
      s.onerror = () => {
        if (fallback) { loadScript(fallback).then(resolve); return; }   // CDN data: second jsDelivr host
        console.error('Không tải được ' + src); resolve(false);
      };
      (document.body || document.head).appendChild(s);
    });
  }
  // data files come from jsDelivr when deployed (js/core/data-base.js); '' = same origin (local runs)
  const dataUrl = f => (window.DATA_BASE || '') + 'js/data/' + f;
  const dataFallback = f => (window.DATA_BASE_FALLBACK ? window.DATA_BASE_FALLBACK + 'js/data/' + f : null);
  // Each data file runs at most once: data files push into shared arrays (window.QUESTIONS…), and a file can sit in
  // two groups (q-sql.js is in 'questions' and 'q:q-sql.js'), so running it again would duplicate every item.
  // A retry after a partial failure also re-requests only the files that failed.
  function loadDataFile(f) {
    if (!fileState[f]) {
      fileState[f] = loadScript(dataUrl(f), dataFallback(f)).then(ok => { if (!ok) delete fileState[f]; return ok; });
    }
    return fileState[f];
  }
  function loadGroup(g) {
    if (groupState[g]) return groupState[g];
    const files = MANIFEST.groups[g];
    if (!files) { console.warn('App.need: unknown data group ' + g); return Promise.resolve(); }
    groupState[g] = Promise.all(files.map(loadDataFile)).then(oks => {
      if (oks.every(Boolean)) groupDone[g] = true; else delete groupState[g];   // retry on next need
      try { window.dispatchEvent(new CustomEvent('datagroupload', { detail: g })); } catch (e) { console.error(e); }
    });
    return groupState[g];
  }
  function need(groups) {
    return Promise.all((groups || []).map(loadGroup)).then(() => undefined);
  }
  function hasData(groups) { return (groups || []).every(g => groupDone[g]); }

  // ---------- lazy views: css/views/<v>.css + js/views/<v>.js on first visit ----------
  // Must run after DOMContentLoaded (a view script needs App.i18n/App.ai…); before that only preloadView().
  const VIEW_NAMES = MANIFEST.views || [];
  const viewState = {};
  function loadCss(href) {
    return new Promise(resolve => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      l.onload = () => resolve(true);
      l.onerror = () => { console.error('Không tải được ' + href); resolve(false); };
      document.head.appendChild(l);
    });
  }
  const cssState = {};
  function loadView(name) {
    if (hasView(name) || VIEW_NAMES.indexOf(name) < 0) return Promise.resolve();
    if (!viewState[name]) {
      // the stylesheet is kept once it loaded, so a retry after a failed script does not add a second <link>
      const css = cssState[name] || (cssState[name] = loadCss('css/views/' + name + '.css').then(ok => { if (!ok) delete cssState[name]; return ok; }));
      viewState[name] = Promise.all([css, loadScript('js/views/' + name + '.js')])
        .then(oks => { if (!oks[1]) delete viewState[name]; });   // script failed → retry on next visit
    }
    return viewState[name];
  }
  // download (not run) the landing view while the rest of the shell is still parsing
  function preloadView(name) {
    if (VIEW_NAMES.indexOf(name) < 0) return;
    [['script', 'js/views/' + name + '.js'], ['style', 'css/views/' + name + '.css']].forEach(([as, href]) => {
      const l = document.createElement('link');
      l.rel = 'preload'; l.as = as; l.href = href;
      document.head.appendChild(l);
    });
  }

  let prefetchStarted = false;
  // Data Saver / 2G: prefetch only the small view files; data groups then load when a route needs them
  function saveData() {
    const c = typeof navigator !== 'undefined' && navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
  }
  function prefetchAll() {
    if (prefetchStarted) return;
    prefetchStarted = true;
    const idle = window.requestIdleCallback ? fn => window.requestIdleCallback(fn, { timeout: 3000 }) : fn => setTimeout(fn, 1200);
    const queue = saveData() ? [] : (MANIFEST.prefetch || Object.keys(MANIFEST.groups)).filter(g => MANIFEST.groups[g]);
    if (queue.length) Object.keys(MANIFEST.groups).forEach(g => { if (queue.indexOf(g) < 0) queue.push(g); });
    // likely next views first (small), then data; one item per idle slot, so a navigation in between is not
    // stuck behind the whole bank
    const items = (MANIFEST.prefetchViews || []).map(v => () => loadView(v)).concat(queue.map(g => () => loadGroup(g)));
    const next = () => { const it = items.shift(); if (it) idle(() => it().then(next)); };
    next();
  }

  // ---------- router ----------
  const views = {};
  let cleanup = null;
  let routeSeq = 0;

  let renderedHash = null;   // hash of the last finished render (same hash again = refresh: keep the scroll position)

  function registerView(name, def) { views[name] = def; }
  // own keys only: '#/constructor' or '#/__proto__' must not resolve to Object.prototype members
  function hasView(name) { return Object.prototype.hasOwnProperty.call(views, name); }

  function navigate(hash) { location.hash = hash; }

  // a malformed escape ('#/bank/%E0%A4') must not throw out of the router and leave a blank page
  const safeDecode = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  function routeParts() {
    return location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(safeDecode);
  }

  function route() {
    const root = document.getElementById('main');
    if (!root) return;                       // hashchange before the shell is parsed: DOMContentLoaded routes
    const parts = routeParts();
    const name = hasView(parts[0]) || VIEW_NAMES.indexOf(parts[0]) >= 0 ? parts[0] : 'dashboard';
    const seq = ++routeSeq;
    const hash = location.hash;
    const keepY = hash === renderedHash ? (window.scrollY || 0) : 0;   // re-render (language, sync, view refresh)
    renderedHash = null;
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    document.querySelectorAll('.nav a').forEach(a => {
      const on = a.dataset.route === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.nav-group[open]').forEach(d => d.removeAttribute('open'));
    updateSection(name);
    root.innerHTML = '';
    root.className = 'container view-' + name;
    const groups = MANIFEST.needsFor(name, parts[1]);
    const known = groups.filter(g => MANIFEST.groups[g]);   // an unknown group (warned by need) can never be "loaded"
    const show = () => {
      if (!hasView(name)) { renderLoadError(root, name); return; }   // view script failed (offline, blocked)
      renderView(views[name], root, parts, keepY);
      renderedHash = hash;
      setNotice(!hasData(known));          // some data file failed: the view renders with what it has
      prefetchAll();
    };
    if (hasView(name) && hasData(known)) { show(); return; }
    root.innerHTML = '<div class="route-loading muted" role="status" aria-live="polite">' +
      (App.lang === 'en' ? 'Loading…' : 'Đang tải dữ liệu…') + '</div>';
    Promise.all([loadView(name), need(groups)]).then(() => {
      if (seq !== routeSeq) return;          // the user navigated away meanwhile
      root.innerHTML = '';
      show();
    });
  }

  // ---------- load errors: blocking card when the view itself is missing, slim notice when only data failed ----------
  function renderLoadError(root, name) {
    setNotice(false);
    root.innerHTML = '<div class="card route-error" role="alert"><h2>⚠️ ' + esc(App.t('app.error.load')) + '</h2>' +
      '<p class="muted">' + esc(App.t('app.error.loadHint')) + '</p>' +
      '<div class="row"><button type="button" class="btn primary" data-route-retry>↻ ' + esc(App.t('app.retry')) + '</button>' +
      (name !== 'dashboard' ? '<a class="btn" href="#/">' + esc(App.t('app.home')) + '</a>' : '') +
      '</div></div>';
  }
  function setNotice(on) {
    let el = document.getElementById('routeNotice');
    if (!on) { if (el) el.remove(); return; }
    const main = document.getElementById('main');
    if (el || !main || !main.parentNode) return;
    el = document.createElement('div');
    el.id = 'routeNotice';
    el.className = 'container route-notice';
    el.style.paddingBottom = '0';
    el.setAttribute('role', 'alert');
    el.innerHTML = '<div class="card row"><span>⚠️ ' + esc(App.t('app.error.data')) + '</span>' +
      '<button type="button" class="btn sm" data-route-retry>↻ ' + esc(App.t('app.retry')) + '</button></div>';
    // above the breadcrumb strip, so the `.secbar + main` spacing rule in base.css still applies
    const bar = document.getElementById('secbar');
    main.parentNode.insertBefore(el, bar && bar.parentNode === main.parentNode ? bar : main);
  }

  // Section of the current route = its nav group (index.html). Sets body[data-group] (per-group colour palette in
  // base.css) and fills the shared header strip #secbar: "group › page — one-line description", read from the nav
  // markup so it follows the menu and the current language. Lives outside <main>, so views never overwrite it.
  const SECTION = { study: ['learn', '📖'], practice: ['practice', '💪'], interviewGroup: ['interview', '🎤'], careerGroup: ['career', '💼'] };
  function updateSection(name) {
    const link = document.querySelector('.nav a[data-route="' + name + '"]');
    const sum = link && link.closest('.nav-group') && link.closest('.nav-group').querySelector('summary');
    const sec = sum && SECTION[(sum.dataset.i18n || '').replace('nav.', '')];
    document.body.dataset.group = sec ? sec[0] : 'home';
    const bar = document.getElementById('secbar');
    if (!bar) return;
    if (!sec) { bar.hidden = true; bar.innerHTML = ''; return; }
    const page = link.querySelector('span'), desc = link.querySelector('small');
    bar.innerHTML = '<div class="secbar-inner"><span class="secbar-group">' + sec[1] + ' ' + esc(sum.textContent.trim()) + '</span>' +
      '<span class="secbar-sep" aria-hidden="true">›</span><span class="secbar-page">' + esc(page ? page.textContent : '') + '</span>' +
      (desc && desc.textContent ? '<span class="secbar-desc">' + esc(desc.textContent) + '</span>' : '') + '</div>';
    bar.hidden = false;
  }

  function renderView(view, root, parts, keepY) {
    // default title first; a view that sets document.title itself during render (legal) keeps its own
    const fallback = view.title ? view.title + ' · Senior Java Prep' : 'Senior Java Prep';
    document.title = fallback;
    try {
      const c = view.render(root, parts.slice(1));
      if (typeof c === 'function') cleanup = c;
    } catch (e) {
      console.error(e);
      root.innerHTML = '<div class="card"><h2>' + App.t('app.error.render') + '</h2><pre class="code"><code>' + esc(e.stack || e) + '</code></pre></div>';
    }
    window.scrollTo(0, keepY || 0);
  }

  // ---------- theme + footer ----------
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', data.theme || 'dark'); // default: dark
  }

  function initChrome() {
    // nav dropdowns: one open at a time, close on outside click / Escape
    const groups = () => document.querySelectorAll('.nav-group[open]');
    document.addEventListener('click', e => groups().forEach(d => { if (!d.contains(e.target)) d.removeAttribute('open'); }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') groups().forEach(d => d.removeAttribute('open')); });
    document.querySelectorAll('.nav-group').forEach(d => d.addEventListener('toggle', () => {
      if (d.open) groups().forEach(o => { if (o !== d) o.removeAttribute('open'); });
    }));
    // "Thử lại" on the load-error card / data notice: failed files were dropped from the cache, so this re-requests them
    document.addEventListener('click', e => {
      if (e.target && e.target.closest && e.target.closest('[data-route-retry]')) { e.preventDefault(); route(); }
    });
    applyTheme();
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', () => {
      const dark = (data.theme || 'dark') === 'dark';
      data.theme = dark ? 'light' : 'dark';
      store.save(); applyTheme();
    });
    const exp = document.getElementById('exportBtn');
    if (exp) exp.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'senior-java-prep-progress-' + dayKey(Date.now()) + '.json';   // dated: exports do not overwrite each other
      document.body.appendChild(a);   // a detached <a> does not download in every browser
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      alert(App.t('app.toast.exported'));
    });
    const imp = document.getElementById('importBtn');
    const file = document.getElementById('importFile');
    if (imp && file) {
      imp.addEventListener('click', () => file.click());
      file.addEventListener('change', async () => {
        try {
          const next = JSON.parse(await file.files[0].text());
          // any other JSON (array, null, a different app's file) would silently wipe the progress
          if (!isObj(next) || !isObj(next.progress)) throw new Error('not a progress export');
          store.replace(next);
          applyTheme(); route();
          alert(App.t('app.toast.imported'));
        } catch (e) { alert(App.t('app.alert.importError')); }
        file.value = '';
      });
    }
    const rst = document.getElementById('resetBtn');
    if (rst) rst.addEventListener('click', () => {
      if (confirm(App.t('app.confirm.reset'))) { store.reset(); applyTheme(); route(); alert(App.t('app.toast.reset')); }
    });
  }

  window.App = {
    LEVELS, STATUS, store, esc, md, highlight, shuffle, onKey, fmtDate,
    questions, quiz, algos, lessons, topics, dueItems, lite, lightIndex, dayKey, startOfDay, DAY, topic, filterQuestions, stats,
    registerView, navigate, route, need, hasData, loadView,
  };

  // start downloading the landing route's data + view now, in parallel with the remaining core scripts
  (function () {
    const p = routeParts();
    const name = VIEW_NAMES.indexOf(p[0]) >= 0 ? p[0] : 'dashboard';
    need(MANIFEST.needsFor(name, p[1]));
    preloadView(name);
  })();

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
