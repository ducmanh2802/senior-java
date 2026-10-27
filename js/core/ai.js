/*
 * AI + speech + code-run helpers shared by views (loaded after js/core/app.js).
 *   App.ai      — calls /api/* serverless functions (session token, or passcode in x-app-passcode)
 *   App.speech  — Web Speech API dictation with fluency metrics
 *   App.code    — assemble user code + test harness into a runnable Main, parse results
 *   App.ui      — shared renderers for AI feedback
 * See AGENTS.md "AI, speech & code run".
 */
(function () {
  'use strict';

  // ---------- i18n (core strings) ----------
  App.i18n.add({
    vi: {
      'ai.noServer': 'Tính năng AI cần chạy trên bản deploy (Vercel) hoặc `vercel dev`, không chạy khi mở file trực tiếp.',
      'ai.noPasscode': 'Chưa nhập mật mã truy cập — bấm ⚙️ để cài đặt.',
      'ai.noAuth': 'Đăng nhập để dùng AI chấm điểm (miễn phí, có hạn mức mỗi ngày).',
      'ai.networkError': 'Không kết nối được server.',
      'ai.noServerDeployed': 'Server chưa có API (cần deploy lên Vercel).',
      'ai.settings.title': '⚙️ Cài đặt AI',
      'ai.settings.desc': 'Chấm điểm bằng AI, chạy code và luyện nói cần server (bản deploy trên Vercel). Mật mã truy cập do bạn đặt ở biến môi trường <code>APP_PASSCODE</code> trên Vercel; trang chỉ lưu nó trong trình duyệt này.',
      'ai.settings.passcodeLabel': 'Mật mã truy cập',
      'ai.settings.checkBtn': 'Kiểm tra kết nối',
      'ai.settings.closeBtn': 'Đóng',
      'ai.settings.saveBtn': 'Lưu',
      'ai.settings.checking': 'Đang kiểm tra…',
      'ai.settings.connected': '✅ Kết nối OK · Chấm AI: {ai} · Chạy code: {run}',
      'ai.settings.aiOk': '✅ {model}',
      'ai.settings.aiMissing': '❌ thiếu OPENROUTER_API_KEY',
      'ai.settings.runOk': '✅',
      'ai.settings.runMissing': '❌ thiếu JUDGE0_KEY (sẽ dùng AI review code thay thế)',
      'ai.settings.speech': 'Giọng nói: {supported}',
      'ai.settings.speechSupported': '✅ trình duyệt hỗ trợ (cần cấp quyền micro)',
      'ai.settings.speechUnsupported': '❌ trình duyệt không hỗ trợ — dùng Chrome hoặc Edge',
      'ai.errorPrefix': '⚠️ ',
      'ai.error.openSettings': 'Mở cài đặt',
      'ai.error.signIn': 'Đăng nhập',
      'ai.error.viewQuota': 'Xem hạn mức',
      'ai.feedback.head.strengths': 'Điểm mạnh',
      'ai.feedback.head.missing': 'Còn thiếu',
      'ai.feedback.head.mistakes': 'Chưa đúng',
      'ai.feedback.head.grammar': 'Ngữ pháp & từ vựng',
      'ai.feedback.head.phrasing': 'Diễn đạt tự nhiên hơn',
      'ai.feedback.head.fluency': 'Độ trôi chảy',
      'ai.feedback.improved': 'Câu trả lời gợi ý',
      'ai.feedback.followup': '🎤 Interviewer hỏi tiếp:',
      'ai.codeFeedback.head.bugs': 'Bug',
      'ai.codeFeedback.head.failing': 'Input làm code sai',
      'ai.codeFeedback.head.complexity': 'Độ phức tạp',
      'ai.codeFeedback.head.style': 'Code style',
      'ai.codeFeedback.improved': 'Cách trình bày hướng giải',
      'ai.codeFeedback.followup': '🎤 Interviewer hỏi tiếp:',
      'ai.runResult.compileError': 'Lỗi biên dịch',
      'ai.runResult.passed': '✅ {passed}/{total} test pass',
      'ai.runResult.failed': '❌ {passed}/{total} test pass',
      'ai.runResult.time': '{time}s · {mem} MB',
      'ai.speech.stats': '⏱ {seconds}s · 🗣 {words} từ · ⚡ {wpm} từ/phút ({pace}) · 💬 Từ đệm: {fillers}',
      'ai.speech.paceSlow': 'hơi chậm',
      'ai.speech.paceFast': 'hơi nhanh',
      'ai.speech.paceGood': 'tốt',
      'ai.speech.noFillers': 'không có 👍',
      'ai.speech.unsupported': 'Trình duyệt không hỗ trợ nhận dạng giọng nói (dùng Chrome hoặc Edge).',
      'ai.speech.noSpeech': 'Không nghe thấy giọng nói.',
      'ai.speech.notAllowed': 'Chưa cấp quyền micro cho trang này.',
      'ai.speech.error': 'Lỗi nhận dạng giọng nói: {error}',
      'ai.interview.error.badSession': 'Phiên đã hết hạn. Hãy bắt đầu phiên mới.',
      'ai.interview.error.sessionFull': 'Đã đạt số câu tối đa cho phiên này.',
      'ai.interview.error.quotaExceeded': 'Đã dùng hết hạn mức AI hôm nay.',
      'ai.interview.error.noAuth': 'Cần đăng nhập để tiếp tục.',
      'ai.error.unknown': 'Lỗi không xác định',
    },
    en: {
      'ai.noServer': 'AI features require a deployed Vercel app or `vercel dev`; they do not work when opening the file directly.',
      'ai.noPasscode': 'No passcode set — click ⚙️ to configure.',
      'ai.noAuth': 'Sign in to use AI grading (free, with daily quota).',
      'ai.networkError': 'Cannot connect to server.',
      'ai.noServerDeployed': 'Server has no API (deploy to Vercel).',
      'ai.settings.title': '⚙️ AI Settings',
      'ai.settings.desc': 'AI grading, code running, and speech practice require a server (deploy on Vercel). The passcode is set via the <code>APP_PASSCODE</code> env var on Vercel; this page only stores it in your browser.',
      'ai.settings.passcodeLabel': 'Passcode',
      'ai.settings.checkBtn': 'Check connection',
      'ai.settings.closeBtn': 'Close',
      'ai.settings.saveBtn': 'Save',
      'ai.settings.checking': 'Checking…',
      'ai.settings.connected': '✅ Connected · AI grading: {ai} · Code run: {run}',
      'ai.settings.aiOk': '✅ {model}',
      'ai.settings.aiMissing': '❌ thiếu OPENROUTER_API_KEY',
      'ai.settings.runOk': '✅',
      'ai.settings.runMissing': '❌ missing JUDGE0_KEY (will use AI code review instead)',
      'ai.settings.speech': 'Speech: {supported}',
      'ai.settings.speechSupported': '✅ browser supports (needs mic permission)',
      'ai.settings.speechUnsupported': '❌ browser does not support — use Chrome or Edge',
      'ai.errorPrefix': '⚠️ ',
      'ai.error.openSettings': 'Open settings',
      'ai.error.signIn': 'Sign in',
      'ai.error.viewQuota': 'View quota',
      'ai.feedback.head.strengths': 'Strengths',
      'ai.feedback.head.missing': 'Missing',
      'ai.feedback.head.mistakes': 'Incorrect',
      'ai.feedback.head.grammar': 'Grammar & vocabulary',
      'ai.feedback.head.phrasing': 'Natural phrasing',
      'ai.feedback.head.fluency': 'Fluency',
      'ai.feedback.improved': 'Suggested answer',
      'ai.feedback.followup': '🎤 Interviewer follows up:',
      'ai.codeFeedback.head.bugs': 'Bugs',
      'ai.codeFeedback.head.failing': 'Failing inputs',
      'ai.codeFeedback.head.complexity': 'Complexity',
      'ai.codeFeedback.head.style': 'Code style',
      'ai.codeFeedback.improved': 'Suggested solution',
      'ai.codeFeedback.followup': '🎤 Interviewer follows up:',
      'ai.runResult.compileError': 'Compile error',
      'ai.runResult.passed': '✅ {passed}/{total} tests passed',
      'ai.runResult.failed': '❌ {passed}/{total} tests passed',
      'ai.runResult.time': '{time}s · {mem} MB',
      'ai.speech.stats': '⏱ {seconds}s · 🗣 {words} words · ⚡ {wpm} wpm ({pace}) · 💬 Fillers: {fillers}',
      'ai.speech.paceSlow': 'slow',
      'ai.speech.paceFast': 'fast',
      'ai.speech.paceGood': 'good',
      'ai.speech.noFillers': 'none 👍',
      'ai.speech.unsupported': 'Browser does not support speech recognition (use Chrome or Edge).',
      'ai.speech.noSpeech': 'No speech detected.',
      'ai.speech.notAllowed': 'Microphone permission not granted for this page.',
      'ai.speech.error': 'Speech recognition error: {error}',
      'ai.interview.error.badSession': 'Session expired. Please start a new one.',
      'ai.interview.error.sessionFull': 'Maximum answers reached for this session.',
      'ai.interview.error.quotaExceeded': 'Daily AI quota exceeded.',
      'ai.interview.error.noAuth': 'Sign in required to continue.',
      'ai.error.unknown': 'Unknown error',
    },
  });

  const PASS_KEY = 'sjp.passcode';
  const esc = App.esc;

  // ---------- AI client ----------
  function getPasscode() { try { return localStorage.getItem(PASS_KEY) || ''; } catch (e) { return ''; } }
  function setPasscode(v) { try { localStorage.setItem(PASS_KEY, v || ''); } catch (e) { /* ignore */ } }

  class AiError extends Error {
    constructor(message, code, status) { super(message); this.code = code; this.status = status; }
  }

  async function call(path, body) {
    if (location.protocol === 'file:') {
      throw new AiError(App.t('ai.noServer'), 'no_server');
    }
    // signed-in users authenticate with their session (per-user AI quota); the passcode is the owner/admin fallback
    const headers = { 'Content-Type': 'application/json' };
    const token = App.auth && App.auth.user ? await App.auth.token() : null;
    if (token) headers.Authorization = 'Bearer ' + token;
    else if (getPasscode()) headers['x-app-passcode'] = getPasscode();
    else if (App.auth && App.auth.enabled) throw new AiError(App.t('ai.noAuth'), 'no_auth');
    else throw new AiError(App.t('ai.noPasscode'), 'no_passcode');
    let res;
    try {
      res = await fetch('/api/' + path, {
        method: 'POST',
        headers,
        body: JSON.stringify(body || {}),
      });
    } catch (e) {
      throw new AiError(App.t('ai.networkError'), 'network');
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON (e.g. 404 page) */ }
    if (res.status === 404 && !data) throw new AiError(App.t('ai.noServerDeployed'), 'no_server', 404);
    if (!res.ok) throw new AiError((data && data.error) || (App.t('ai.errorPrefix') + ' ' + res.status), data && data.code, res.status);
    return data;
  }

  const ai = {
    AiError,
    getPasscode, setPasscode,
    status: () => call('status', {}),
    /**
     * Grade a free-text answer.
     * @param {{question, reference, answer, lang?, topic?, level?, history?, speech?}} p
     * @returns {Promise<{score, verdict, strengths[], missing[], mistakes[], follow_up, improved_answer, language:{grammar[], phrasing_tips[], fluency}}>}
     */
    grade: p => call('grade', Object.assign({ kind: 'answer' }, p)),
    /**
     * Review a coding solution.
     * @param {{title, prompt, reference, code, complexity?, run?}} p
     * @returns {Promise<{score, verdict, correct, bugs[], failing_cases[], complexity, style[], follow_up, improved_answer}>}
     */
    review: p => call('grade', Object.assign({ kind: 'code' }, p)),
    /** Run a complete Java program (must contain public class Main). */
    run: source => call('run', { source }),
    /**
     * Continuous mock interview (AGENTS.md section 11). One session = one quota unit.
     * turn({session_token?, config, transcript, elapsed_seconds}) → {say, intent, topic, seed_index, last_answer{score,note}, done, session_token}
     * summary({session_token, config, transcript}) → {overall_score, hire_signal, verdict, by_question[], strengths[], improvements[], study_next[], communication}
     */
    /**
     * Analyse a pasted job description (AGENTS.md section 14). One call = 1 AI quota unit.
     * → {role, company, level, domain, summary, must_have[{skill, topic, weight}], nice_to_have[], likely_questions[{q, topic, why}], prep_tips[], questions_to_ask[]}
     */
    jd: text => call('jd', { jd: text, topics: (App.topics() || []).map(t => ({ id: t.id, name: t.name })) }),
    /** Career coach (AGENTS.md section 15): star({situation, theme?, lang?}) / cv({cv, target?}). 1 quota unit each. */
    coach: {
      star: p => call('coach', Object.assign({ mode: 'star' }, p)),
      cv: p => call('coach', Object.assign({ mode: 'cv' }, p)),
    },
    interview: {
      turn: p => call('interview', Object.assign({ action: 'turn' }, p)),
      summary: p => call('interview', Object.assign({ action: 'summary' }, p)),
    },
  };

  // ---------- speech ----------
  const FILLERS = {
    vi: ['ờ', 'ừm', 'ừ', 'ơ', 'à', 'thì là', 'kiểu như', 'nói chung là', 'đại loại là', 'cái mà'],
    en: ['um', 'uh', 'erm', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of', 'i mean'],
  };

  /** Fluency metrics for a transcript. */
  function analyze(text, seconds, lang) {
    const t = ' ' + String(text || '').toLowerCase().replace(/[.,!?;:()"]/g, ' ').replace(/\s+/g, ' ') + ' ';
    const words = t.trim() ? t.trim().split(' ').length : 0;
    const fillers = {};
    (FILLERS[lang === 'en' ? 'en' : 'vi']).forEach(f => {
      const n = t.split(' ' + f + ' ').length - 1;
      if (n) fillers[f] = n;
    });
    const secs = Math.max(1, Math.round(seconds || 0));
    return { text: String(text || '').trim(), seconds: secs, words, wpm: Math.round(words / (secs / 60)), fillers };
  }

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speech = {
    supported: !!Recognition,
    analyze,
    /**
     * Start dictation. Chrome stops after silence, so we restart until stop() is called.
     * @param {{lang?: 'vi'|'en', onText?: (finalText: string, interim: string) => void, onError?: (msg) => void}} opts
     * @returns {{stop: () => {text, seconds, words, wpm, fillers}}}
     */
    start(opts) {
      opts = opts || {};
      if (!Recognition) throw new Error(App.t('ai.speech.unsupported'));
      const lang = opts.lang === 'en' ? 'en' : 'vi';
      const started = Date.now();
      let finalText = '', active = true;
      const rec = new Recognition();
      rec.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = e => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += (finalText ? ' ' : '') + r[0].transcript.trim();
          else interim += r[0].transcript;
        }
        if (opts.onText) opts.onText(finalText, interim);
      };
      rec.onerror = e => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        active = false;
        if (opts.onError) opts.onError(e.error === 'not-allowed' ? App.t('ai.speech.notAllowed') : App.t('ai.speech.error', { error: e.error }));
      };
      rec.onend = () => { if (active) { try { rec.start(); } catch (e) { /* already started */ } } };
      rec.start();
      return {
        stop() {
          active = false;
          try { rec.stop(); } catch (e) { /* ignore */ }
          return analyze(finalText, (Date.now() - started) / 1000, lang);
        },
      };
    },
  };



  function topLevelClasses(src) {
    const out = [];
    const lines = String(src || '').split('\n');
    let i = 0, open = false, name = null, depth = 0, startIdx = 0;
    for (; i < lines.length; i++) {
      const l = lines[i];
      if (!open) {
        const m = l.match(/^(?:public\s+|abstract\s+|final\s+|sealed\s+)*(class|interface|record|enum)\s+(\w+)/);
        if (m) { open = true; name = m[2]; depth = (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length; startIdx = i; }
      } else {
        depth += (l.match(/\{/g) || []).length - (l.match(/\}/g) || []).length;
        if (depth <= 0) { out.push({ name, from: startIdx, to: i }); open = false; name = null; }
      }
    }
    return out;
  }

  // ---------- code assembly ----------
  const DEFAULT_IMPORTS = ['import java.util.*;', 'import java.util.function.*;', 'import java.util.stream.*;', 'import java.util.concurrent.*;', 'import java.util.concurrent.atomic.*;', 'import java.math.*;'];

  const code = {
    /** True if this algo problem has a runnable test harness. */
    hasTests: algo => !!(algo && typeof algo.tests === 'string' && /public\s+class\s+Main\b/.test(algo.tests)),
    /**
     * Combine user code and the problem's harness into one compilable file.
     * Imports are hoisted and de-duplicated; `package` lines dropped; user classes made non-public
     * (a Java file may only have one public class: Main).
     */
    assemble(userCode, harness) {
      const imports = new Set(DEFAULT_IMPORTS);
      const strip = src => String(src || '').split('\n').filter(line => {
        const l = line.trim();
        if (/^package\s+[\w.]+\s*;/.test(l)) return false;
        if (/^import\s+(static\s+)?[\w.*]+\s*;/.test(l)) { imports.add(l); return false; }
        return true;
      }).join('\n');
      const user = strip(userCode).replace(/\bpublic\s+((?:final\s+|abstract\s+)*)(class|interface|record|enum)\s+/g, '$1$2 ');
      let tests = strip(harness);
      const userNames = new Set(topLevelClasses(user).map(b => b.name));
      const sblocks = topLevelClasses(tests).filter(b => userNames.has(b.name));
      if (sblocks.length) {
        const drop = new Set();
        sblocks.forEach(b => { for (let k = b.from; k <= b.to; k++) drop.add(k); });
        tests = tests.split('\n').filter((_, k) => !drop.has(k)).join('\n');
      }
      return [...imports].join('\n') + '\n\n' + user + '\n\n' + tests + '\n';
    },
    /** Parse harness stdout: lines "PASS name" / "FAIL name: detail" and a final "RESULT passed/total". */
    parse(stdout) {
      const lines = String(stdout || '').split(/\r?\n/);
      const cases = [];
      let passed = null, total = null;
      lines.forEach(l => {
        let m;
        if ((m = l.match(/^PASS\s+(.*)$/))) cases.push({ ok: true, name: m[1].trim(), detail: '' });
        else if ((m = l.match(/^FAIL\s+([^:]*):?\s*(.*)$/))) cases.push({ ok: false, name: m[1].trim(), detail: m[2].trim() });
        else if ((m = l.match(/^RESULT\s+(\d+)\s*\/\s*(\d+)/))) { passed = +m[1]; total = +m[2]; }
      });
      if (total == null) { total = cases.length; passed = cases.filter(c => c.ok).length; }
      return { cases, passed, total, allPassed: total > 0 && passed === total };
    },
  };

  // ---------- shared renderers ----------
  const list = (title, items, cls) => (items && items.length)
    ? '<div class="ai-fb-sec ' + (cls || '') + '"><h5>' + title + '</h5><ul>' + items.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>'
    : '';

  function scoreBadge(score) {
    const cls = score >= 4 ? 'ok' : score === 3 ? 'warn' : 'bad';
    return '<span class="ai-score ' + cls + '">' + score + '<small>/5</small></span>';
  }

  function speechStats(m) {
    if (!m) return '';
    const fillers = Object.entries(m.fillers || {}).map(([k, v]) => esc(k) + ' ×' + v).join(', ');
    const pace = m.wpm < 90 ? App.t('ai.speech.paceSlow') : m.wpm > 170 ? App.t('ai.speech.paceFast') : App.t('ai.speech.paceGood');
    const noFillers = fillers || App.t('ai.speech.noFillers');
    return '<div class="ai-speech-stats">' + App.t('ai.speech.stats', { seconds: m.seconds, words: m.words, wpm: m.wpm, pace, fillers: noFillers }) + '</div>';
  }

const ui = {
    scoreBadge,
    speechStats,
    /** HTML for a grade() result. `lang` = 'en' marks English parts with lang="en". */
    feedback(r, lang) {
      if (!r) return '';
      const en = lang === 'en' ? ' lang="en"' : '';
      const g = (r.language && r.language.grammar) || [];
      const grammar = g.length ? '<div class="ai-fb-sec"><h5>' + App.t('ai.feedback.head.grammar') + '</h5><ul>' + g.map(x =>
        '<li><s' + en + '>' + esc(x.wrong) + ' says → <b' + en + '>' + esc(x.right) + '</b>' + (x.note ? ' <span class="muted">— ' + esc(x.note) + '</span>' : '') + '</li>').join('') + '</ul></div>' : '';
      const tips = r.language ? list(App.t('ai.feedback.head.phrasing'), r.language.phrasing_tips) : '';
      const fluency = r.language && r.language.fluency ? '<div class="ai-fb-sec"><h5>' + App.t('ai.feedback.head.fluency') + '</h5><p>' + esc(r.language.fluency) + '</p></div>' : '';
      return '<div class="ai-fb">' +
        '<div class="ai-fb-head">' + scoreBadge(r.score) + '<p>' + esc(r.verdict) + '</p></div>' +
        list(App.t('ai.feedback.head.strengths'), r.strengths, 'ok') + list(App.t('ai.feedback.head.missing'), r.missing, 'warn') + list(App.t('ai.feedback.head.mistakes'), r.mistakes, 'bad') +
        grammar + tips + fluency +
        (r.improved_answer ? '<details class="ai-fb-sec"><summary>' + App.t('ai.feedback.improved') + '</summary><p' + en + '>' + esc(r.improved_answer) + '</p></details>' : '') +
        (r.follow_up ? '<div class="ai-follow"><b>' + App.t('ai.feedback.followup') + '</b> <span' + en + '>' + esc(r.follow_up) + '</span></div>' : '') +
        '</div>';
    },
    /** HTML for a review() result. */
    codeFeedback(r) {
      if (!r) return '';
      return '<div class="ai-fb">' +
        '<div class="ai-fb-head">' + scoreBadge(r.score) + '<p>' + (r.correct ? '✅ ' : '❌ ') + esc(r.verdict) + '</p></div>' +
        list(App.t('ai.codeFeedback.head.bugs'), r.bugs, 'bad') + list(App.t('ai.codeFeedback.head.failing'), r.failing_cases, 'bad') +
        (r.complexity ? '<div class="ai-fb-sec"><h5>' + App.t('ai.codeFeedback.head.complexity') + '</h5><p>' + esc(r.complexity) + '</p></div>' : '') +
        list(App.t('ai.codeFeedback.head.style'), r.style) +
        (r.improved_answer ? '<details class="ai-fb-sec"><summary>' + App.t('ai.codeFeedback.improved') + '</summary><p>' + esc(r.improved_answer) + '</p></details>' : '') +
        (r.follow_up ? '<div class="ai-follow"><b>' + App.t('ai.codeFeedback.followup') + '</b> ' + esc(r.follow_up) + '</div>' : '') +
        '</div>';
    },
    /** HTML for code.parse() + raw run response. */
    runResult(run, parsed) {
      if (!run) return '';
      if (run.compile_output) return '<div class="run-box bad"><b>' + App.t('ai.runResult.compileError') + '</b><pre class="code"><code>' + esc(run.compile_output) + '</code></pre></div>';
      const head = parsed && parsed.total
        ? '<b class="' + (parsed.allPassed ? 'ok' : 'bad') + '">' + (parsed.allPassed ? App.t('ai.runResult.passed', { passed: parsed.passed, total: parsed.total }) : App.t('ai.runResult.failed', { passed: parsed.passed, total: parsed.total })) + '</b>'
        : '<b>' + esc(run.status || '') + '</b>';
      const cases = parsed && parsed.cases.length ? '<ul class="run-cases">' + parsed.cases.map(c =>
        '<li class="' + (c.ok ? 'ok' : 'bad') + '">' + (c.ok ? '✔' : '✘') + ' ' + esc(c.name) + (c.detail ? ' — <span class="muted">' + esc(c.detail) + '</span>' : '') + '</li>').join('') + '</ul>' : '';
      const err = run.stderr ? '<pre class="code"><code>' + esc(run.stderr.slice(0, 3000)) + '</code></pre>' : '';
      const meta = run.time ? ' <span class="muted small">' + App.t('ai.runResult.time', { time: run.time, mem: Math.round((run.memory || 0) / 1024) }) + '</span>' : '';
      return '<div class="run-box">' + head + meta + cases + err + '</div>';
    },
    /** Friendly message for an AiError, with a settings hint when relevant. */
    error(e) {
      const code = e && e.code;
      const hint = code === 'no_passcode' || code === 'bad_passcode' ? ' <button type="button" class="link-btn" data-open-settings>' + App.t('ai.error.openSettings') + '</button>'
        : code === 'no_auth' || code === 'bad_token' ? ' <a class="link-btn" href="#/account">' + App.t('ai.error.signIn') + '</a>'
        : code === 'quota_exceeded' ? ' <a class="link-btn" href="#/account">' + App.t('ai.error.viewQuota') + '</a>' : '';
      return '<div class="ai-error">' + App.t('ai.errorPrefix') + esc(e && e.message || App.t('ai.error.unknown')) + hint + '</div>';
    },
  };

  // ---------- settings dialog ----------
  function openSettings() {
    let dlg = document.getElementById('aiSettings');
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.id = 'aiSettings';
      dlg.className = 'ai-settings';
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = '<form method="dialog" class="stack">' +
      '<h3>' + App.t('ai.settings.title') + '</h3>' +
      '<p class="muted small">' + App.t('ai.settings.desc') + '</p>' +
      '<label class="field"><span>' + App.t('ai.settings.passcodeLabel') + '</span><input class="input" type="password" id="aiPass" autocomplete="current-password" value="' + esc(getPasscode()) + '"></label>' +
      '<div id="aiStatus" class="small"></div>' +
      '<div class="row"><button type="button" class="btn" id="aiCheck">' + App.t('ai.settings.checkBtn') + '</button><span class="spacer"></span>' +
      '<button value="cancel" class="btn ghost">' + App.t('ai.settings.closeBtn') + '</button><button type="button" class="btn primary" id="aiSave">' + App.t('ai.settings.saveBtn') + '</button></div>' +
      '<p class="muted small">' + App.t('ai.settings.speech', { supported: speech.supported ? App.t('ai.settings.speechSupported') : App.t('ai.settings.speechUnsupported') }) + '</p>' +
      '</form>';
    const status = dlg.querySelector('#aiStatus');
    dlg.querySelector('#aiSave').onclick = () => { setPasscode(dlg.querySelector('#aiPass').value.trim()); dlg.close(); };
    dlg.querySelector('#aiCheck').onclick = async () => {
      setPasscode(dlg.querySelector('#aiPass').value.trim());
      status.textContent = App.t('ai.settings.checking');
      try {
        const s = await ai.status();
        const aiPart = s.ai ? App.t('ai.settings.aiOk', { model: esc(s.model) }) : App.t('ai.settings.aiMissing');
        const runPart = s.run ? App.t('ai.settings.runOk') : App.t('ai.settings.runMissing');
        status.innerHTML = App.t('ai.settings.connected', { ai: aiPart, run: runPart });
      } catch (e) { status.innerHTML = ui.error(e); }
    };
    dlg.showModal();
  }

  document.addEventListener('click', e => { if (e.target.closest('[data-open-settings]')) openSettings(); });

  App.ai = ai;
  App.speech = speech;
  App.code = code;
  App.ui = ui;
  App.openSettings = openSettings;
})();
