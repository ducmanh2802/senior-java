/*
 * View "interview" — continuous AI mock interview by voice (AGENTS.md section 11).
 * Screens: setup → session (chat; interviewer speaks via speechSynthesis, candidate answers by mic or keyboard)
 * → result (Claude's panel feedback). The running session is kept in localStorage so a reload resumes it.
 */
(function () {
  'use strict';

  const STORE_KEY = 'sjp.interview.current';
  const SESSION_MS = 90 * 60000;          // server-side session token lifetime
  const SILENCE_MS = 2500;                // hands-free: send after this much silence
  const esc = App.esc;
  const INTENT = { question: 'Câu hỏi', follow_up: 'Đào sâu', clarify: 'Làm rõ', hint: 'Gợi ý', wrap_up: 'Kết thúc' };
  const SIGNAL = {
    strong_no: ['Không đạt rõ ràng', 'bad'], no: ['Chưa đạt', 'bad'], lean_no: ['Hơi nghiêng về chưa đạt', 'warn'],
    lean_yes: ['Hơi nghiêng về đạt', 'warn'], yes: ['Đạt', 'ok'], strong_yes: ['Đạt rất tốt', 'ok'],
  };
  const LEVELS = { mid: 'Middle', senior: 'Senior', lead: 'Lead' };

  const load = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } };
  const save = s => { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } };
  const clear = () => { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } };
  const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  /** First paragraph after "**Tóm tắt:**", markup stripped — the interviewer only needs the gist. */
  function gist(a) {
    const m = /\*\*Tóm tắt:\*\*\s*([\s\S]*?)(\n\s*\n|$)/.exec(a || '');
    return (m ? m[1] : String(a || '').slice(0, 400)).replace(/\{\{|\}\}|\*\*/g, '').replace(/\s+/g, ' ').trim().slice(0, 600);
  }

  /** ≤ 12 seed questions: the company's reported questions first, then due / weak / unseen bank questions. */
  function pickSeeds(topics, company, lang) {
    const seeds = [];
    if (company) (company.questions || []).slice(0, 4).forEach(q => seeds.push({ topic: company.name, q, ref: '' }));
    const ts = new Set(topics);
    if (lang === 'en') ts.add('english');
    const rank = q => App.store.isDue(q.id) ? 0 : ({ unknown: 1, review: 2 }[App.store.getStatus(q.id)] ?? (App.store.getStatus(q.id) ? 4 : 3));
    App.shuffle(App.questions().filter(q => ts.has(q.topic)))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 12 - seeds.length)
      .forEach(q => seeds.push({ topic: q.topic, q: q.q.replace(/\{\{|\}\}/g, ''), ref: gist(q.a) }));
    return seeds;
  }

  // ---------- text to speech ----------
  const tts = {
    ok: 'speechSynthesis' in window,
    muted: false,
    speak(text, lang, onEnd) {
      if (!this.ok || this.muted) { if (onEnd) onEnd(); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'en' ? 'en-US' : 'vi-VN';
      const voice = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(lang === 'en' ? 'en' : 'vi'));
      if (voice) u.voice = voice;
      u.rate = 1.02;
      u.onend = u.onerror = () => { if (onEnd) onEnd(); };
      speechSynthesis.speak(u);
    },
    stop() { if (this.ok) speechSynthesis.cancel(); },
  };

  App.registerView('interview', {
    title: 'Phỏng vấn AI',
    render(root) {
      let s = null;               // live session: { config, topics, companyId, transcript, token, startedAt, scores[], done }
      let mic = null, silence = null, ticker = null, busy = false, showScores = false, handsFree = false;
      const cleanups = [];

      // ---------- setup ----------
      const pref = { lang: 'vi', level: 'senior', minutes: 20, persona: 'friendly', mode: 'topics', topics: ['core', 'spring', 'db'], company: '' };

      function setup() {
        stopAll();
        const prev = load();
        const resumable = prev && prev.token && Date.now() - prev.startedAt < SESSION_MS && !prev.done;
        const companies = window.COMPANIES || [];
        const chips = (name, opts, cur) => '<div class="chips" data-pref="' + name + '">' + Object.entries(opts).map(([v, l]) =>
          '<button type="button" class="chip' + (String(cur) === v ? ' active' : '') + '" data-v="' + esc(v) + '">' + esc(l) + '</button>').join('') + '</div>';
        const needLogin = App.auth.enabled && !App.auth.user && !App.ai.getPasscode();
        root.innerHTML = `
          <div class="page-head"><h1>Phỏng vấn AI</h1>
            <p class="muted">Hội thoại liên tục với interviewer AI bằng giọng nói: hỏi, nghe bạn trả lời, đào sâu như vòng phỏng vấn thật, rồi chấm và nhận xét cuối buổi.</p></div>
          ${resumable ? `<div class="card iv-resume"><b>Bạn có một buổi đang dở</b> (${prev.transcript.filter(t => t.role === 'candidate').length} câu trả lời, bắt đầu ${esc(App.fmtDate(prev.startedAt))}).
            <div class="row"><button class="btn primary" data-act="resume">Tiếp tục</button><button class="btn" data-act="discard">Bỏ buổi này</button></div></div>` : ''}
          <div class="card iv-setup">
            <div class="iv-field"><label>Ngôn ngữ</label>${chips('lang', { vi: 'Tiếng Việt', en: 'English' }, pref.lang)}</div>
            <div class="iv-field"><label>Level</label>${chips('level', LEVELS, pref.level)}</div>
            <div class="iv-field"><label>Thời lượng</label>${chips('minutes', { 10: '10 phút', 20: '20 phút', 30: '30 phút', 45: '45 phút' }, pref.minutes)}</div>
            <div class="iv-field"><label>Phong cách interviewer</label>${chips('persona', { friendly: 'Thân thiện', strict: 'Khó tính, hỏi dồn' }, pref.persona)}</div>
            <div class="iv-field"><label>Trọng tâm</label>${chips('mode', companies.length ? { topics: 'Theo chủ đề', company: 'Theo công ty' } : { topics: 'Theo chủ đề' }, pref.mode)}
              ${pref.mode === 'company' && companies.length
                ? `<select class="select iv-company" aria-label="Công ty">${companies.map(c => `<option value="${esc(c.id)}"${c.id === pref.company ? ' selected' : ''}>${esc((c.icon || '') + ' ' + c.name)}</option>`).join('')}</select>`
                : `<div class="chips iv-topics">${App.topics().filter(t => t.id !== 'english').map(t =>
                    `<button type="button" class="chip${pref.topics.includes(t.id) ? ' active' : ''}" data-topic="${esc(t.id)}">${esc(t.icon + ' ' + t.name)}</button>`).join('')}</div>`}
            </div>
            <div class="row iv-start">
              <button class="btn primary lg" data-act="start"${needLogin ? ' disabled' : ''}>🎙️ Bắt đầu phỏng vấn</button>
              <span class="muted small">Mỗi buổi tốn 1 lượt AI trong hạn mức ngày.${App.speech.supported ? '' : ' Trình duyệt này không nhận dạng giọng nói — bạn sẽ gõ câu trả lời (dùng Chrome/Edge để nói).'}</span>
            </div>
            ${needLogin ? '<p class="iv-note">Cần <a href="#/account">đăng nhập</a> để dùng AI.</p>' : ''}
          </div>`;
        if (!pref.company && companies.length) pref.company = companies[0].id;
      }

      function startNew() {
        const companies = window.COMPANIES || [];
        const company = pref.mode === 'company' ? companies.find(c => c.id === pref.company) : null;
        const topics = company ? (company.focus || []) : pref.topics;
        if (!topics.length) { alert('Chọn ít nhất một chủ đề.'); return; }
        const names = topics.map(t => App.topic(t).name).join(', ');
        s = {
          config: {
            lang: pref.lang, level: pref.level, minutes: Number(pref.minutes), persona: pref.persona,
            focus: company ? company.name + ' (' + (company.type === 'bank' ? 'ngân hàng' : 'công ty công nghệ') + ') — ' + names : names,
            seeds: pickSeeds(topics, company, pref.lang),
          },
          topics, companyId: company ? company.id : null,
          transcript: [], token: null, startedAt: Date.now(), scores: [], done: false,
        };
        save(s);
        session();
        next();
      }

      // ---------- session ----------
      function session() {
        const c = s.config;
        root.innerHTML = `
          <div class="iv-bar card">
            <div><b>${esc(LEVELS[c.level])} · ${c.lang === 'en' ? 'English' : 'Tiếng Việt'}</b><div class="muted small iv-focus">${esc(c.focus)}</div></div>
            <div class="iv-timer" aria-live="off">00:00</div>
            <div class="row iv-toggles">
              <button class="btn sm" data-act="mute" aria-pressed="${tts.muted}">${tts.muted ? '🔇 Đã tắt tiếng' : '🔊 Đọc câu hỏi'}</button>
              <button class="btn sm" data-act="scores" aria-pressed="${showScores}">${showScores ? '🙈 Ẩn điểm' : '👁 Hiện điểm'}</button>
              ${App.speech.supported ? `<button class="btn sm" data-act="handsfree" aria-pressed="${handsFree}">${handsFree ? '✋ Rảnh tay: bật' : '✋ Rảnh tay: tắt'}</button>` : ''}
              <button class="btn sm bad" data-act="end">Kết thúc &amp; đánh giá</button>
            </div>
          </div>
          <div class="iv-chat" aria-live="polite"></div>
          <div class="iv-compose card">
            <textarea class="textarea" rows="3" placeholder="${App.speech.supported ? 'Bấm 🎤 để nói, hoặc gõ câu trả lời…' : 'Gõ câu trả lời…'}" aria-label="Câu trả lời"></textarea>
            <div class="iv-interim muted small"></div>
            <div class="row">
              ${App.speech.supported ? '<button class="btn mic-btn lg" data-act="mic" aria-label="Bật/tắt micro">🎤</button>' : ''}
              <button class="btn primary" data-act="send">Trả lời xong</button>
              <span class="iv-status"></span>
              <span class="muted small iv-keys"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> gửi</span>
            </div>
          </div>`;
        drawChat();
        clearInterval(ticker);
        ticker = setInterval(tick, 1000);
        tick();
      }

      function tick() {
        const el = root.querySelector('.iv-timer');
        if (!el || !s) return;
        const sec = (Date.now() - s.startedAt) / 1000, limit = s.config.minutes * 60;
        el.textContent = mmss(sec) + ' / ' + mmss(limit);
        el.classList.toggle('warn', sec > limit - 120 && sec <= limit);
        el.classList.toggle('bad', sec > limit);
        if (sec > limit + 120 && !busy && !s.done) finish();   // hard stop 2 minutes after the planned length
      }

      function drawChat() {
        const box = root.querySelector('.iv-chat');
        if (!box) return;
        let answer = 0;
        box.innerHTML = s.transcript.map((t, i) => {
          if (t.role === 'interviewer') {
            return `<div class="iv-msg iv-ai"><div class="iv-avatar" aria-hidden="true">AI</div><div class="iv-bubble">
              ${t.intent ? `<span class="badge">${esc(INTENT[t.intent] || t.intent)}</span>` : ''}<p>${esc(t.text)}</p>
              ${tts.ok ? `<button class="link-btn" data-say="${i}" aria-label="Đọc lại">🔊</button>` : ''}</div></div>`;
          }
          const sc = s.scores[answer++];
          return `<div class="iv-msg iv-me"><div class="iv-bubble"><p>${esc(t.text)}</p>
            ${showScores && sc && sc.score ? `<div class="iv-score">${App.ui.scoreBadge(sc.score)} <span class="muted small">${esc(sc.note)}</span></div>` : ''}</div></div>`;
        }).join('') + (busy ? '<div class="iv-msg iv-ai"><div class="iv-avatar" aria-hidden="true">AI</div><div class="iv-bubble"><span class="ai-loading">Interviewer đang nghĩ…</span></div></div>' : '');
        box.scrollTop = box.scrollHeight;
      }

      function setBusy(v) {
        busy = v;
        root.querySelectorAll('[data-act="send"], [data-act="mic"]').forEach(b => { b.disabled = v; });
        drawChat();
      }

      function status(html) { const el = root.querySelector('.iv-status'); if (el) el.innerHTML = html || ''; }

      async function next() {
        setBusy(true);
        status('');
        try {
          const r = await App.ai.interview.turn({
            session_token: s.token, config: s.config, transcript: s.transcript,
            elapsed_seconds: Math.round((Date.now() - s.startedAt) / 1000),
          });
          s.token = r.session_token;
          if (s.transcript.some(t => t.role === 'candidate')) s.scores.push(r.last_answer);
          s.transcript.push({ role: 'interviewer', text: r.say, intent: r.intent });
          s.done = !!r.done;
          save(s);
          setBusy(false);
          tts.speak(r.say, s.config.lang, () => {
            if (s && s.done) finish();
            else if (handsFree && !mic) listen();
          });
        } catch (e) {
          setBusy(false);
          status(App.ui.error(e) + (e.code === 'bad_session' || e.code === 'session_full' ? ' <button class="btn sm" data-act="end">Xem đánh giá</button>' : ''));
          if (!s.token && !s.transcript.length) { clear(); }
        }
      }

      function listen() {
        if (mic || busy || !App.speech.supported) return;
        tts.stop();
        const ta = root.querySelector('.iv-compose textarea');
        const base = ta.value.trim();
        try {
          mic = App.speech.start({
            lang: s.config.lang,
            onText(finalText, interim) {
              ta.value = (base ? base + ' ' : '') + finalText;
              const el = root.querySelector('.iv-interim');
              if (el) el.textContent = interim;
              if (handsFree) { clearTimeout(silence); silence = setTimeout(() => { if (ta.value.trim()) send(); }, SILENCE_MS); }
            },
            onError(msg) { stopMic(); status('<span class="ai-error">' + esc(msg) + '</span>'); },
          });
        } catch (e) { status('<span class="ai-error">' + esc(e.message) + '</span>'); return; }
        const b = root.querySelector('[data-act="mic"]');
        if (b) b.classList.add('recording');
      }

      function stopMic() {
        clearTimeout(silence);
        if (mic) { try { mic.stop(); } catch (e) { /* ignore */ } mic = null; }
        const b = root.querySelector('[data-act="mic"]');
        if (b) b.classList.remove('recording');
        const el = root.querySelector('.iv-interim');
        if (el) el.textContent = '';
      }

      function send() {
        if (busy || !s) return;
        stopMic();
        const ta = root.querySelector('.iv-compose textarea');
        const text = ta.value.trim();
        if (!text) { status('<span class="muted">Hãy nói hoặc gõ câu trả lời trước.</span>'); return; }
        ta.value = '';
        s.transcript.push({ role: 'candidate', text });
        save(s);
        next();
      }

      // ---------- result ----------
      async function finish() {
        stopAll();
        if (!s) return;
        const answers = s.transcript.filter(t => t.role === 'candidate').length;
        if (!answers) { clear(); s = null; setup(); return; }
        root.innerHTML = '<div class="card iv-wait"><span class="ai-loading">Hội đồng đang chấm buổi phỏng vấn…</span></div>';
        try {
          const r = await App.ai.interview.summary({ session_token: s.token, config: s.config, transcript: s.transcript });
          const minutes = Math.round((Date.now() - s.startedAt) / 60000);
          App.store.addMockResult({
            kind: 'ai-interview', score: r.overall_score, hire_signal: r.hire_signal, minutes, lang: s.config.lang,
            level: s.config.level, topics: s.topics, company: s.companyId, answers, verdict: r.verdict,
          });
          result(r, minutes);
          clear();
        } catch (e) {
          root.innerHTML = '<div class="card">' + App.ui.error(e) +
            '<div class="row"><button class="btn primary" data-act="retry-summary">Thử lại</button><button class="btn" data-act="download">Tải transcript</button><button class="btn" data-act="new">Buổi mới</button></div></div>';
        }
      }

      function result(r, minutes) {
        const sig = SIGNAL[r.hire_signal] || [r.hire_signal, 'warn'];
        const list = (title, items) => items && items.length ? `<div class="card"><h3>${title}</h3><ul>${items.map(x => '<li>' + esc(x) + '</li>').join('')}</ul></div>` : '';
        root.innerHTML = `
          <div class="page-head"><h1>Đánh giá buổi phỏng vấn</h1><p class="muted">${minutes} phút · ${esc(s.config.focus)}</p></div>
          <div class="card iv-verdict">
            <div class="row">${App.ui.scoreBadge(r.overall_score)}<span class="badge ${sig[1]}">${esc(sig[0])}</span></div>
            <p>${esc(r.verdict)}</p>
          </div>
          <div class="card"><h3>Từng câu hỏi</h3>
            ${(r.by_question || []).map(q => `<details class="iv-q"><summary>${App.ui.scoreBadge(q.score)} <span>${esc(q.question)}</span></summary>
              <p>${esc(q.comment)}</p><p class="iv-better"><b>Trả lời tốt hơn:</b> <span${s.config.lang === 'en' ? ' lang="en"' : ''}>${esc(q.better_answer)}</span></p></details>`).join('')}
          </div>
          <div class="grid">${list('Điểm mạnh', r.strengths)}${list('Cần cải thiện', r.improvements)}${list('Nên ôn tiếp', r.study_next)}</div>
          ${r.communication ? `<div class="card"><h3>Cách trình bày</h3><p>${esc(r.communication)}</p></div>` : ''}
          <div class="row iv-actions">
            <button class="btn primary" data-act="new">Phỏng vấn lại</button>
            ${s.topics[0] ? `<a class="btn" href="#/bank/${esc(s.topics[0])}">Ôn ${esc(App.topic(s.topics[0]).name)}</a>` : ''}
            <button class="btn" data-act="download">Tải transcript</button>
          </div>`;
      }

      function download() {
        if (!s) return;
        const lines = ['Phỏng vấn AI — ' + new Date(s.startedAt).toLocaleString('vi-VN'), s.config.focus, ''];
        s.transcript.forEach(t => lines.push((t.role === 'candidate' ? 'Bạn: ' : 'Interviewer: ') + t.text, ''));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
        a.download = 'phong-van-ai-' + App.dayKey(s.startedAt) + '.txt';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }

      function stopAll() { stopMic(); tts.stop(); clearInterval(ticker); ticker = null; }

      // ---------- events ----------
      function onClick(e) {
        const chip = e.target.closest('[data-pref] .chip');
        if (chip) {
          const key = chip.parentElement.dataset.pref;
          pref[key] = key === 'minutes' ? Number(chip.dataset.v) : chip.dataset.v;
          setup(); return;
        }
        const topic = e.target.closest('[data-topic]');
        if (topic) {
          const id = topic.dataset.topic;
          pref.topics = pref.topics.includes(id) ? pref.topics.filter(t => t !== id) : pref.topics.concat(id);
          topic.classList.toggle('active'); return;
        }
        const say = e.target.closest('[data-say]');
        if (say && s) { const t = s.transcript[Number(say.dataset.say)]; if (t) { const m = tts.muted; tts.muted = false; tts.speak(t.text, s.config.lang); tts.muted = m; } return; }
        const act = e.target.closest('[data-act]');
        if (!act) return;
        switch (act.dataset.act) {
          case 'start': startNew(); break;
          case 'resume': s = load(); session(); if (s.transcript.length && s.transcript[s.transcript.length - 1].role === 'candidate') next(); break;
          case 'discard': clear(); setup(); break;
          case 'mic': if (mic) stopMic(); else listen(); break;
          case 'send': send(); break;
          case 'end': finish(); break;
          case 'retry-summary': finish(); break;
          case 'download': download(); break;
          case 'new': s = null; setup(); break;
          case 'mute': tts.muted = !tts.muted; if (tts.muted) tts.stop(); session(); break;
          case 'scores': showScores = !showScores; session(); break;
          case 'handsfree': handsFree = !handsFree; session(); if (handsFree && !busy) listen(); break;
        }
      }
      function onChange(e) { if (e.target.matches('.iv-company')) pref.company = e.target.value; }
      function onKeydown(e) { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.matches('.iv-compose textarea')) { e.preventDefault(); send(); } }

      root.addEventListener('click', onClick);
      root.addEventListener('change', onChange);
      root.addEventListener('keydown', onKeydown);
      cleanups.push(() => { root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.removeEventListener('keydown', onKeydown); });
      if (tts.ok) speechSynthesis.getVoices();   // warm up the voice list (loads async in Chrome)

      setup();
      return () => { stopAll(); cleanups.forEach(f => f()); };
    },
  });
})();
