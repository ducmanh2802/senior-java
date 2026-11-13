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
      'nav.main': 'Điều hướng chính', 'nav.dashboard': 'Tổng quan', 'nav.roadmap': '📅 Kế hoạch 26 tuần', 'nav.news': '📰 Tin tức mỗi sáng', 'nav.jobs': '💼 Việc làm',
      'nav.study': 'Học', 'nav.path': '🗺️ Lộ trình học', 'nav.learn': '📖 Bài học', 'nav.bank': '📚 Ngân hàng câu hỏi',
      'nav.flash': '🃏 Flashcard', 'nav.quiz': '✅ Trắc nghiệm', 'nav.exam': '📝 Thi thử', 'nav.aws': '☁️ AWS Pro (SAP + DOP)', 'nav.practice': 'Luyện',
      'nav.algo': '🧠 Thuật toán', 'nav.labs': '🔧 Debug lab', 'nav.bugs': '🐞 Sửa bug thật', 'nav.sd': '🏗️ System Design', 'nav.projects': '🛠️ Pet project', 'nav.sdlc': '🔄 Mô phỏng SDLC',
      'nav.speak': '🗣️ Luyện nói tiếng Anh', 'nav.interview': '🎙️ Phỏng vấn với AI', 'nav.toeic': '📝 TOEIC Speaking & Writing', 'navd.toeic': 'Luyện 11 câu Speaking và 8 câu Writing theo đúng format, AI chấm',
      'nav.career': '🧭 STAR, CV, nhật ký', 'nav.mock': '🎤 Phỏng vấn thử', 'nav.companies': '🏢 Theo công ty',
      'nav.account': 'Tài khoản', 'nav.settings': 'Cài đặt AI', 'nav.theme': 'Đổi giao diện sáng/tối',
      'nav.interviewGroup': 'Phỏng vấn', 'nav.careerGroup': 'Sự nghiệp', 'navd.path': 'Thứ tự học từng bước, từ nền tảng tới Senior', 'navd.roadmap': 'Lịch học theo tuần + nhật ký mỗi ngày', 'navd.learn': 'Bài giảng có ví dụ + bài tập Java tự chấm', 'navd.bank': 'Câu hỏi phỏng vấn kèm đáp án mẫu chi tiết', 'navd.flash': 'Ôn nhanh các câu đến hạn (lặp lại ngắt quãng)', 'navd.aws': 'Ôn chứng chỉ AWS SAP-C02 và DOP-C02', 'navd.quiz': 'Câu nhiều lựa chọn, giải thích từng phương án', 'navd.exam': 'Đề thi bấm giờ, chấm điểm theo từng mảng', 'navd.algo': 'Đề, gợi ý từng bước, chạy và chấm code Java', 'navd.labs': 'Tìm nguyên nhân sự cố từ thread dump, GC log, EXPLAIN thật', 'navd.bugs': 'Code dự án thật đang lỗi: tái hiện, sửa, chạy test, giải thích', 'navd.sd': 'Thiết kế hệ thống từng bước, có đáp án tham khảo', 'navd.sdlc': 'Đi trọn một tính năng: yêu cầu → thiết kế → code → deploy → sửa lỗi', 'navd.projects': 'Ý tưởng dự án cá nhân để đưa vào CV', 'navd.mock': 'Phỏng vấn thử bấm giờ, tự chấm điểm 1–5', 'navd.interview': 'AI đóng vai interviewer, hỏi đáp bằng giọng nói', 'navd.speak': 'Trả lời câu hỏi phỏng vấn bằng tiếng Anh, AI chấm', 'navd.companies': 'Bộ câu hỏi theo từng công ty tuyển dụng', 'navd.jobs': 'Tin tuyển dụng Java mỗi sáng + việc bạn đang ứng tuyển', 'navd.career': 'Câu chuyện STAR, AI review CV, ghi lại các vòng phỏng vấn', 'navd.news': 'Bản tin Backend/DevOps/Cloud chọn lọc mỗi ngày',
      'nav.lang': 'Switch to English',
      'footer.saved': 'Tiến độ được lưu trong trình duyệt (localStorage).', 'footer.export': 'Xuất tiến độ',
      'footer.import': 'Nhập tiến độ', 'footer.reset': 'Xoá tiến độ', 'footer.privacy': 'Quyền riêng tư',
      'footer.terms': 'Điều khoản', 'footer.about': 'Giới thiệu',
    },
    en: {
      'nav.main': 'Main navigation', 'nav.dashboard': 'Dashboard', 'nav.roadmap': '📅 26-week plan', 'nav.news': '📰 Morning news', 'nav.jobs': '💼 Jobs',
      'nav.study': 'Learn', 'nav.path': '🗺️ Learning path', 'nav.learn': '📖 Lessons', 'nav.bank': '📚 Question bank',
      'nav.flash': '🃏 Flashcards', 'nav.quiz': '✅ Quiz', 'nav.exam': '📝 Mock exams', 'nav.aws': '☁️ AWS Pro (SAP + DOP)', 'nav.practice': 'Practice',
      'nav.algo': '🧠 Algorithms', 'nav.labs': '🔧 Debug lab', 'nav.bugs': '🐞 Fix real bugs', 'nav.sd': '🏗️ System design', 'nav.projects': '🛠️ Pet projects', 'nav.sdlc': '🔄 SDLC simulation',
      'nav.speak': '🗣️ English speaking', 'nav.interview': '🎙️ AI interview', 'nav.toeic': '📝 TOEIC Speaking & Writing', 'navd.toeic': 'Practise the 11 Speaking and 8 Writing tasks in the real format, AI-graded',
      'nav.career': '🧭 STAR, CV & log', 'nav.mock': '🎤 Mock interview', 'nav.companies': '🏢 By company',
      'nav.account': 'Account', 'nav.settings': 'AI settings', 'nav.theme': 'Toggle light/dark theme',
      'nav.interviewGroup': 'Interview', 'nav.careerGroup': 'Career', 'navd.path': 'Step-by-step order from basics to Senior', 'navd.roadmap': 'Weekly schedule + daily study log', 'navd.learn': 'Lessons with examples + self-graded Java exercises', 'navd.bank': 'Interview questions with detailed model answers', 'navd.flash': 'Quick spaced-repetition review of due cards', 'navd.aws': 'Prep for AWS SAP-C02 and DOP-C02', 'navd.quiz': 'Multiple choice, every option explained', 'navd.exam': 'Timed exams scored by domain', 'navd.algo': 'Problems, step-by-step hints, run and grade Java', 'navd.labs': 'Find root causes in real thread dumps, GC logs, EXPLAIN', 'navd.bugs': 'Buggy project code: reproduce, fix, run tests, explain', 'navd.sd': 'Design systems step by step, with reference answers', 'navd.sdlc': 'Ship one feature end to end: requirement → bugfix', 'navd.projects': 'Side-project ideas for your CV', 'navd.mock': 'Timed mock interview, self-scored 1–5', 'navd.interview': 'AI plays the interviewer, voice conversation', 'navd.speak': 'Answer interview questions in English, AI-graded', 'navd.companies': 'Question sets by hiring company', 'navd.jobs': 'Daily Java job digest + your applications', 'navd.career': 'STAR stories, AI CV review, interview round log', 'navd.news': 'Curated daily Backend/DevOps/Cloud digest',
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
