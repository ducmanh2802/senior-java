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

  function setLang(l) {
    lang = l === 'en' ? 'en' : 'vi';
    try { localStorage.setItem(KEY, lang); } catch (e) { /* storage blocked */ }
    App.lang = lang;
    applyLabels();
    applyStatic();
    if (App.route) App.route();
    window.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }

  add({
    vi: {
      'nav.main': 'Điều hướng chính', 'nav.dashboard': 'Tổng quan', 'nav.roadmap': 'Lộ trình',
      'nav.study': 'Ôn tập', 'nav.path': '🗺️ Lộ trình học', 'nav.learn': '📖 Bài học', 'nav.bank': '📚 Câu hỏi',
      'nav.flash': '🃏 Flashcard', 'nav.quiz': '✅ Trắc nghiệm', 'nav.practice': 'Luyện tập',
      'nav.algo': '🧠 Thuật toán', 'nav.labs': '🔧 Debug lab', 'nav.projects': '🛠️ Pet project',
      'nav.speak': '🗣️ Luyện nói tiếng Anh', 'nav.interview': '🎙️ Phỏng vấn AI (giọng nói)',
      'nav.career': '🧭 Sự nghiệp', 'nav.mock': '🎤 Phỏng vấn thử', 'nav.companies': '🏢 Theo công ty',
      'nav.account': 'Tài khoản', 'nav.settings': 'Cài đặt AI', 'nav.theme': 'Đổi giao diện sáng/tối',
      'nav.lang': 'Switch to English',
      'footer.saved': 'Tiến độ được lưu trong trình duyệt (localStorage).', 'footer.export': 'Xuất tiến độ',
      'footer.import': 'Nhập tiến độ', 'footer.reset': 'Xoá tiến độ', 'footer.privacy': 'Quyền riêng tư',
      'footer.terms': 'Điều khoản', 'footer.about': 'Giới thiệu',
    },
    en: {
      'nav.main': 'Main navigation', 'nav.dashboard': 'Dashboard', 'nav.roadmap': 'Roadmap',
      'nav.study': 'Study', 'nav.path': '🗺️ Learning path', 'nav.learn': '📖 Lessons', 'nav.bank': '📚 Questions',
      'nav.flash': '🃏 Flashcards', 'nav.quiz': '✅ Quiz', 'nav.practice': 'Practice',
      'nav.algo': '🧠 Algorithms', 'nav.labs': '🔧 Debug lab', 'nav.projects': '🛠️ Pet projects',
      'nav.speak': '🗣️ English speaking', 'nav.interview': '🎙️ AI interview (voice)',
      'nav.career': '🧭 Career', 'nav.mock': '🎤 Mock interview', 'nav.companies': '🏢 By company',
      'nav.account': 'Account', 'nav.settings': 'AI settings', 'nav.theme': 'Toggle light/dark theme',
      'nav.lang': 'Chuyển sang tiếng Việt',
      'footer.saved': 'Progress is saved in your browser (localStorage).', 'footer.export': 'Export progress',
      'footer.import': 'Import progress', 'footer.reset': 'Reset progress', 'footer.privacy': 'Privacy',
      'footer.terms': 'Terms', 'footer.about': 'About',
    },
  });

  App.i18n = { add, dict };
  App.t = t;
  App.lang = lang;
  App.setLang = setLang;
  applyLabels();

  function init() {
    applyStatic();
    const btn = document.getElementById('langToggle');
    if (btn) btn.addEventListener('click', () => setLang(lang === 'vi' ? 'en' : 'vi'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
