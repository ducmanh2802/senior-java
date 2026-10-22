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
      throw new AiError('Tính năng AI cần chạy trên bản deploy (Vercel) hoặc `vercel dev`, không chạy khi mở file trực tiếp.', 'no_server');
    }
    // signed-in users authenticate with their session (per-user AI quota); the passcode is the owner/admin fallback
    const headers = { 'Content-Type': 'application/json' };
    const token = App.auth && App.auth.user ? await App.auth.token() : null;
    if (token) headers.Authorization = 'Bearer ' + token;
    else if (getPasscode()) headers['x-app-passcode'] = getPasscode();
    else if (App.auth && App.auth.enabled) throw new AiError('Đăng nhập để dùng AI chấm điểm (miễn phí, có hạn mức mỗi ngày).', 'no_auth');
    else throw new AiError('Chưa nhập mật mã truy cập — bấm ⚙️ để cài đặt.', 'no_passcode');
    let res;
    try {
      res = await fetch('/api/' + path, {
        method: 'POST',
        headers,
        body: JSON.stringify(body || {}),
      });
    } catch (e) {
      throw new AiError('Không kết nối được server.', 'network');
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON (e.g. 404 page) */ }
    if (res.status === 404 && !data) throw new AiError('Server chưa có API (cần deploy lên Vercel).', 'no_server', 404);
    if (!res.ok) throw new AiError((data && data.error) || ('Lỗi ' + res.status), data && data.code, res.status);
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
      if (!Recognition) throw new Error('Trình duyệt không hỗ trợ nhận dạng giọng nói (dùng Chrome hoặc Edge).');
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
        if (opts.onError) opts.onError(e.error === 'not-allowed' ? 'Chưa cấp quyền micro cho trang này.' : 'Lỗi nhận dạng giọng nói: ' + e.error);
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
      const tests = strip(harness);
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
    const pace = m.wpm < 90 ? 'hơi chậm' : m.wpm > 170 ? 'hơi nhanh' : 'tốt';
    return '<div class="ai-speech-stats"><span>⏱ ' + m.seconds + 's</span><span>🗣 ' + m.words + ' từ</span>' +
      '<span>⚡ ' + m.wpm + ' từ/phút (' + pace + ')</span><span>💬 Từ đệm: ' + (fillers || 'không có 👍') + '</span></div>';
  }

  const ui = {
    scoreBadge,
    speechStats,
    /** HTML for a grade() result. `lang` = 'en' marks English parts with lang="en". */
    feedback(r, lang) {
      if (!r) return '';
      const en = lang === 'en' ? ' lang="en"' : '';
      const g = (r.language && r.language.grammar) || [];
      const grammar = g.length ? '<div class="ai-fb-sec"><h5>Ngữ pháp & từ vựng</h5><ul>' + g.map(x =>
        '<li><s' + en + '>' + esc(x.wrong) + '</s> → <b' + en + '>' + esc(x.right) + '</b>' + (x.note ? ' <span class="muted">— ' + esc(x.note) + '</span>' : '') + '</li>').join('') + '</ul></div>' : '';
      const tips = r.language ? list('Diễn đạt tự nhiên hơn', r.language.phrasing_tips) : '';
      const fluency = r.language && r.language.fluency ? '<div class="ai-fb-sec"><h5>Độ trôi chảy</h5><p>' + esc(r.language.fluency) + '</p></div>' : '';
      return '<div class="ai-fb">' +
        '<div class="ai-fb-head">' + scoreBadge(r.score) + '<p>' + esc(r.verdict) + '</p></div>' +
        list('Điểm mạnh', r.strengths, 'ok') + list('Còn thiếu', r.missing, 'warn') + list('Chưa đúng', r.mistakes, 'bad') +
        grammar + tips + fluency +
        (r.improved_answer ? '<details class="ai-fb-sec"><summary>Câu trả lời gợi ý</summary><p' + en + '>' + esc(r.improved_answer) + '</p></details>' : '') +
        (r.follow_up ? '<div class="ai-follow"><b>🎤 Interviewer hỏi tiếp:</b> <span' + en + '>' + esc(r.follow_up) + '</span></div>' : '') +
        '</div>';
    },
    /** HTML for a review() result. */
    codeFeedback(r) {
      if (!r) return '';
      return '<div class="ai-fb">' +
        '<div class="ai-fb-head">' + scoreBadge(r.score) + '<p>' + (r.correct ? '✅ ' : '❌ ') + esc(r.verdict) + '</p></div>' +
        list('Bug', r.bugs, 'bad') + list('Input làm code sai', r.failing_cases, 'bad') +
        (r.complexity ? '<div class="ai-fb-sec"><h5>Độ phức tạp</h5><p>' + esc(r.complexity) + '</p></div>' : '') +
        list('Code style', r.style) +
        (r.improved_answer ? '<details class="ai-fb-sec"><summary>Cách trình bày hướng giải</summary><p>' + esc(r.improved_answer) + '</p></details>' : '') +
        (r.follow_up ? '<div class="ai-follow"><b>🎤 Interviewer hỏi tiếp:</b> ' + esc(r.follow_up) + '</div>' : '') +
        '</div>';
    },
    /** HTML for code.parse() + raw run response. */
    runResult(run, parsed) {
      if (!run) return '';
      if (run.compile_output) return '<div class="run-box bad"><b>Lỗi biên dịch</b><pre class="code"><code>' + esc(run.compile_output) + '</code></pre></div>';
      const head = parsed && parsed.total
        ? '<b class="' + (parsed.allPassed ? 'ok' : 'bad') + '">' + (parsed.allPassed ? '✅' : '❌') + ' ' + parsed.passed + '/' + parsed.total + ' test pass</b>'
        : '<b>' + esc(run.status || '') + '</b>';
      const cases = parsed && parsed.cases.length ? '<ul class="run-cases">' + parsed.cases.map(c =>
        '<li class="' + (c.ok ? 'ok' : 'bad') + '">' + (c.ok ? '✔' : '✘') + ' ' + esc(c.name) + (c.detail ? ' — <span class="muted">' + esc(c.detail) + '</span>' : '') + '</li>').join('') + '</ul>' : '';
      const err = run.stderr ? '<pre class="code"><code>' + esc(run.stderr.slice(0, 3000)) + '</code></pre>' : '';
      const meta = run.time ? ' <span class="muted small">' + esc(run.time) + 's · ' + Math.round((run.memory || 0) / 1024) + ' MB</span>' : '';
      return '<div class="run-box">' + head + meta + cases + err + '</div>';
    },
    /** Friendly message for an AiError, with a settings hint when relevant. */
    error(e) {
      const code = e && e.code;
      const hint = code === 'no_passcode' || code === 'bad_passcode' ? ' <button type="button" class="link-btn" data-open-settings>Mở cài đặt</button>'
        : code === 'no_auth' || code === 'bad_token' ? ' <a class="link-btn" href="#/account">Đăng nhập</a>'
        : code === 'quota_exceeded' ? ' <a class="link-btn" href="#/account">Xem hạn mức</a>' : '';
      return '<div class="ai-error">⚠️ ' + esc(e && e.message || 'Lỗi không xác định') + hint + '</div>';
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
      '<h3>⚙️ Cài đặt AI</h3>' +
      '<p class="muted small">Chấm điểm bằng AI, chạy code và luyện nói cần server (bản deploy trên Vercel). Mật mã truy cập do bạn đặt ở biến môi trường <code>APP_PASSCODE</code> trên Vercel; trang chỉ lưu nó trong trình duyệt này.</p>' +
      '<label class="field"><span>Mật mã truy cập</span><input class="input" type="password" id="aiPass" autocomplete="current-password" value="' + esc(getPasscode()) + '"></label>' +
      '<div id="aiStatus" class="small"></div>' +
      '<div class="row"><button type="button" class="btn" id="aiCheck">Kiểm tra kết nối</button><span class="spacer"></span>' +
      '<button value="cancel" class="btn ghost">Đóng</button><button type="button" class="btn primary" id="aiSave">Lưu</button></div>' +
      '<p class="muted small">Giọng nói: ' + (speech.supported ? '✅ trình duyệt hỗ trợ (cần cấp quyền micro)' : '❌ trình duyệt không hỗ trợ — dùng Chrome hoặc Edge') + '</p>' +
      '</form>';
    const status = dlg.querySelector('#aiStatus');
    dlg.querySelector('#aiSave').onclick = () => { setPasscode(dlg.querySelector('#aiPass').value.trim()); dlg.close(); };
    dlg.querySelector('#aiCheck').onclick = async () => {
      setPasscode(dlg.querySelector('#aiPass').value.trim());
      status.textContent = 'Đang kiểm tra…';
      try {
        const s = await ai.status();
        status.innerHTML = '✅ Kết nối OK · Chấm AI: ' + (s.ai ? '✅ ' + esc(s.model) : '❌ thiếu ANTHROPIC_API_KEY') +
          ' · Chạy code: ' + (s.run ? '✅' : '❌ thiếu JUDGE0_KEY (sẽ dùng AI review code thay thế)');
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
