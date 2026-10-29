/*
 * UI language (vi | en). Content (questions, answers, lessons) stays Vietnamese; only the interface switches.
 *   App.i18n.add({ vi: { 'bank.title': 'Ngân hàng câu hỏi' }, en: { 'bank.title': 'Question bank' } })
 *   App.t('bank.found', { n: 12 })        // '{n}' placeholders; missing en → vi → the key itself
 *   App.lang                              // current language
 *   App.setLang('en')                     // saves, relabels static markup, re-renders the current view
 * Static markup: data-i18n="key" (textContent), data-i18n-title, data-i18n-aria, data-i18n-placeholder.
 * Views: define `get title() { return App.t('x.title'); }` so the tab title follows the language.
 */
(function () {
  'use strict';
  const KEY = 'sjp.lang';
  const dict = { vi: {}, en: {} };
  let lang = 'vi';
  try { if (localStorage.getItem(KEY) === 'en') lang = 'en'; } catch (e) { /* storage blocked */ }

  function add(d) {
    for (const l of ['vi', 'en']) Object.assign(dict[l], (d && d[l]) || {});
  }

  function t(key, vars) {
    let s = dict[lang][key];
    if (s == null) s = dict.vi[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    return s;
  }

  // labels owned by app.js: mutate in place so App.LEVELS / App.STATUS stay the same objects
  const LABELS = {
    vi: { levels: { mid: 'Middle', senior: 'Senior', lead: 'Lead / Architect' },
          status: { known: 'Đã thuộc', review: 'Cần ôn', unknown: 'Chưa biết' } },
    en: { levels: { mid: 'Mid-level', senior: 'Senior', lead: 'Lead / Architect' },
          status: { known: 'Known', review: 'Review', unknown: 'Don\'t know' } },
  };

  function applyLabels() {
    const L = LABELS[lang];
    Object.keys(L.levels).forEach(k => { if (App.LEVELS) App.LEVELS[k] = L.levels[k]; });
    Object.keys(L.status).forEach(k => { if (App.STATUS && App.STATUS[k]) App.STATUS[k].label = L.status[k]; });
  }

  function applyStatic(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    scope.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
    scope.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.documentElement.lang = lang;
    const btn = document.getElementById('langToggle');
    if (btn) btn.textContent = lang === 'vi' ? 'EN' : 'VI';
  }

  // ---------- content translation ----------
  // js/i18n/<data file>.en.js call App.i18n.content({ '<item id>': { q, a, follow, … } }); listed in
  // js/i18n/manifest.js (window.I18N_FILES) and only loaded when English is chosen. Fields are deep-merged
  // over the Vietnamese item (arrays of objects by index), originals kept in item.__vi for switching back.
  // Special id '__roadmap' merges into window.ROADMAP. Untranslated items simply stay Vietnamese.
  const overlay = {};
  let loading = null;
  function content(map) { Object.assign(overlay, map || {}); }

  function loadContent() {
    if (loading) return loading;
    const files = window.I18N_FILES || [];
    loading = Promise.all(files.map(name => new Promise(resolve => {
      const s = document.createElement('script');
      s.src = 'js/i18n/' + name + '.en.js';
      s.onload = s.onerror = resolve;          // a missing file must not block the switch
      document.head.appendChild(s);
    })));
    return loading;
  }

  function merge(base, over) {
    if (Array.isArray(over)) {
      if (!Array.isArray(base)) return over;
      return base.map((b, i) => (i < over.length && over[i] != null ? merge(b, over[i]) : b));
    }
    if (over && typeof over === 'object') {
      const out = Object.assign({}, base);
      Object.keys(over).forEach(k => { out[k] = merge(base && base[k], over[k]); });
      return out;
    }
    return over;
  }

  function collections() {
    return [window.TOPICS, window.QUESTIONS, window.QUIZ, window.ALGOS, window.LESSONS, window.LABS,
      window.GLOSSARY, window.PATH, window.ROADMAP && [Object.assign(window.ROADMAP, { id: '__roadmap' })]]
      // light index (App.lite) copies: only the fields they carry are swapped (titles), never whole bodies
      .concat(Object.values((App.lightIndex && App.lightIndex()) || {}));
  }

  function swapContent() {
    if (App.questions) App.questions();         // append refs to the Vietnamese answers first (once)
    collections().forEach(list => (list || []).forEach(item => {
      const over = overlay[item.id];
      if (!over) return;
      if (lang === 'en' && !item.__vi) {
        item.__vi = {};
        Object.keys(over).forEach(k => {
          if (item.__light && !(k in item)) return;
          item.__vi[k] = item[k];
          let v = merge(item[k], over[k]);
          if (k === 'a' && typeof v === 'string' && Array.isArray(item.refs) && item.refs.length) {
            const i = String(item[k]).indexOf('\n\n### 📚 ');
            if (i >= 0) v += '\n\n### 📚 Learn more' + item[k].slice(item[k].indexOf('\n', i + 2));
          }
          item[k] = v;
        });
      } else if (lang === 'vi' && item.__vi) {
        Object.assign(item, item.__vi);
        delete item.__vi;
      }
    }));
  }

  async function setLang(l) {
    lang = l === 'en' ? 'en' : 'vi';
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage blocked */ }
    App.lang = lang;
    if (lang === 'en') await loadContent();
    swapContent();
    applyLabels();
    applyStatic();
    if (App.route) App.route();
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  add({
    vi: {
      'nav.main': 'Điều hướng chính', 'nav.dashboard': 'Tổng quan', 'nav.roadmap': 'Lộ trình', 'nav.news': '📰 Tin tức mỗi sáng',
      'nav.study': 'Ôn tập', 'nav.path': '🗺️ Lộ trình học', 'nav.learn': '📖 Bài học', 'nav.bank': '📚 Câu hỏi',
      'nav.flash': '🃏 Flashcard', 'nav.quiz': '✅ Trắc nghiệm', 'nav.exam': '📝 Thi thử', 'nav.practice': 'Luyện tập',
      'nav.algo': '🧠 Thuật toán', 'nav.labs': '🔧 Debug lab', 'nav.sd': '🏗️ Luyện System Design', 'nav.projects': '🛠️ Pet project',
      'nav.speak': '🗣️ Luyện nói tiếng Anh', 'nav.interview': '🎙️ Phỏng vấn AI (giọng nói)',
      'nav.career': '🧭 Sự nghiệp', 'nav.mock': '🎤 Phỏng vấn thử', 'nav.companies': '🏢 Theo công ty',
      'nav.account': 'Tài khoản', 'nav.settings': 'Cài đặt AI', 'nav.theme': 'Đổi giao diện sáng/tối',
      'nav.lang': 'Switch to English',
      'footer.saved': 'Tiến độ được lưu trong trình duyệt (localStorage).', 'footer.export': 'Xuất tiến độ',
      'footer.import': 'Nhập tiến độ', 'footer.reset': 'Xoá tiến độ', 'footer.privacy': 'Quyền riêng tư',
      'footer.terms': 'Điều khoản', 'footer.about': 'Giới thiệu',
    },
    en: {
      'nav.main': 'Main navigation', 'nav.dashboard': 'Dashboard', 'nav.roadmap': 'Roadmap', 'nav.news': '📰 Morning news',
      'nav.study': 'Study', 'nav.path': '🗺️ Learning path', 'nav.learn': '📖 Lessons', 'nav.bank': '📚 Questions',
      'nav.flash': '🃏 Flashcards', 'nav.quiz': '✅ Quiz', 'nav.exam': '📝 Mock exams', 'nav.practice': 'Practice',
      'nav.algo': '🧠 Algorithms', 'nav.labs': '🔧 Debug lab', 'nav.sd': '🏗️ System design practice', 'nav.projects': '🛠️ Pet projects',
      'nav.speak': '🗣️ English speaking', 'nav.interview': '🎙️ AI interview (voice)',
      'nav.career': '🧭 Career', 'nav.mock': '🎤 Mock interview', 'nav.companies': '🏢 By company',
      'nav.account': 'Account', 'nav.settings': 'AI settings', 'nav.theme': 'Toggle light/dark theme',
      'nav.lang': 'Chuyển sang tiếng Việt',
      'footer.saved': 'Progress is saved in your browser (localStorage).', 'footer.export': 'Export progress',
      'footer.import': 'Import progress', 'footer.reset': 'Reset progress', 'footer.privacy': 'Privacy',
      'footer.terms': 'Terms', 'footer.about': 'About',
    },
  });

  // data groups arrive lazily (App.need): translate the newly loaded items too
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('datagroupload', () => { if (lang === 'en') swapContent(); });
  }

  App.i18n = { add, dict, content, overlay };
  App.t = t;
  App.lang = lang;
  App.setLang = setLang;
  applyLabels();

  function init() {
    applyStatic();
    if (lang === 'en') setLang('en');           // saved choice: load translations, then re-render
    const btn = document.getElementById('langToggle');
    if (btn) btn.addEventListener('click', () => setLang(lang === 'vi' ? 'en' : 'vi'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
