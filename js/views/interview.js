/*
 * View "interview" — continuous AI mock interview by voice (AGENTS.md section 11).
 * Screens: setup → session (chat; interviewer speaks via speechSynthesis, candidate answers by mic or keyboard)
 * → result (Claude's panel feedback). The running session is kept in localStorage so a reload resumes it.
 */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'interview.title': 'Phỏng vấn AI',
      'interview.subtitle': 'Hội thoại liên tục với interviewer AI bằng giọng nói: hỏi, nghe bạn trả lời, đào sâu như vòng phỏng vấn thật, rồi chấm và nhận xét cuối buổi.',
      'interview.resume': 'Bạn có một buổi đang dở',
      'interview.resumeBtn': 'Tiếp tục',
      'interview.discardBtn': 'Bỏ buổi này',
      'interview.langLabel': 'Ngôn ngữ',
      'interview.levelLabel': 'Level',
      'interview.durationLabel': 'Thời lượng',
      'interview.personaLabel': 'Phong cách interviewer',
      'interview.focusLabel': 'Trọng tâm',
      'interview.modeTopics': 'Theo chủ đề',
      'interview.modeCompany': 'Theo công ty',
      'interview.modeJd': 'Theo JD',
      'interview.companyLabel': 'Công ty',
      'interview.jdText': 'Mô tả công việc (JD)',
      'interview.jdPlaceholder': 'Dán JD (ít nhất 200 ký tự)…',
      'interview.analyzeJd': 'Phân tích JD',
      'interview.startJd': 'Phỏng vấn theo JD này',
      'interview.start': 'Bắt đầu phỏng vấn',
      'interview.costHint': 'Mỗi buổi tốn 1 lượt AI trong hạn mức ngày.',
      'interview.speechNotSupported': 'Trình duyệt này không nhận dạng giọng nói — bạn sẽ gõ câu trả lời (dùng Chrome/Edge để nói).',
      'interview.needLogin': 'Cần đăng nhập để dùng AI.',
      'interview.jdTooShort': 'JD cần có ít nhất 200 ký tự.',
      'interview.analyzingJd': 'Đang phân tích JD…',
      'interview.jdChanged': 'JD đã thay đổi; hãy phân tích lại.',
      'interview.muteBtn': '🔇 Đã tắt tiếng',
      'interview.unmuteBtn': '🔊 Đọc câu hỏi',
      'interview.hideScore': '🙈 Ẩn điểm',
      'interview.showScore': '👁 Hiện điểm',
      'interview.endBtn': 'Kết thúc & đánh giá',
      'interview.answerPlaceholderVoice': 'Bấm 🎤 để nói, hoặc gõ câu trả lời…',
      'interview.answerPlaceholderText': 'Gõ câu trả lời…',
      'interview.answerAria': 'Câu trả lời',
      'interview.sendBtn': 'Trả lời xong',
      'interview.micAria': 'Bật/tắt micro',
      'interview.handsFreeOn': '✋ Rảnh tay: bật',
      'interview.handsFreeOff': '✋ Rảnh tay: tắt',
      'interview.readAgainAria': 'Đọc lại',
      'interview.grading': 'Hội đồng đang chấm buổi phỏng vấn…',
      'interview.resultTitle': 'Đánh giá buổi phỏng vấn',
      'interview.byQuestion': 'Từng câu hỏi',
      'interview.strengths': 'Điểm mạnh',
      'interview.improvements': 'Cần cải thiện',
      'interview.studyNext': 'Nên ôn tiếp',
      'interview.communication': 'Cách trình bày',
      'interview.retryBtn': 'Phỏng vấn lại',
      'interview.reviewTopic': 'Ôn {topic}',
      'interview.download': 'Tải transcript',
      'interview.viewScore': 'Xem đánh giá',
      'interview.retry': 'Thử lại',
      'interview.newSession': 'Buổi mới',
      'interview.confirmEnd': 'Kết thúc phiên phỏng vấn sớm? Kết quả vẫn được lưu.',
      'interview.confirmLeave': 'Bạn đang trong phiên phỏng vấn. Thoát ra sẽ mất tiến độ phiên này.',
      'interview.interim': 'Trả lời tạm thời',
      'interview.speakPlaceholder': 'Bấm 🎤 để nói, hoặc gõ câu trả lời…',
      'interview.selectTopic': 'Chọn ít nhất một chủ đề.',
      'interview.noItems': 'Không có mục nào.',
      'interview.answerEmpty': 'Hãy nói hoặc gõ câu trả lời trước.',
      'interview.mustHave': 'Must have',
      'interview.niceToHave': 'Nice to have',
      'interview.likelyQuestions': 'Câu hỏi có thể gặp',
      'interview.prepTips': 'Mẹo chuẩn bị',
      'interview.questionsToAsk': 'Câu nên hỏi nhà tuyển dụng',
      'interview.minutesOpt': '{n} phút',
      'interview.personaFriendly': 'Thân thiện',
      'interview.personaStrict': 'Khó tính, hỏi dồn',
      'interview.resumeMeta': '{n} câu trả lời, bắt đầu {date}',
      'interview.signIn': 'đăng nhập',
      'interview.intent.question': 'Câu hỏi',
      'interview.intent.follow_up': 'Đào sâu',
      'interview.intent.clarify': 'Làm rõ',
      'interview.intent.hint': 'Gợi ý',
      'interview.intent.wrap_up': 'Kết thúc',
      'interview.sig.strong_no': 'Không đạt rõ ràng',
      'interview.sig.no': 'Chưa đạt',
      'interview.sig.lean_no': 'Hơi nghiêng về chưa đạt',
      'interview.sig.lean_yes': 'Hơi nghiêng về đạt',
      'interview.sig.yes': 'Đạt',
      'interview.sig.strong_yes': 'Đạt rất tốt',
      'interview.thinking': 'Interviewer đang nghĩ…',
      'interview.sendHint': 'gửi',
      'interview.betterAnswer': 'Trả lời tốt hơn:',
      'interview.skillCol': 'Kỹ năng',
      'interview.weightCol': 'Nhấn mạnh',
      'interview.readyCol': 'Mức sẵn sàng',
      'interview.notInBank': 'Chưa có trong ngân hàng',
      'interview.defaultRole': 'Vai trò',
      'interview.unknownCompany': 'Công ty chưa rõ',
      'interview.unknownDomain': 'chưa rõ lĩnh vực',
      'interview.bankTopic': 'ngân hàng',
      'interview.techCompany': 'công ty công nghệ',
      'interview.transcriptTitle': 'Phỏng vấn AI — ',
      'interview.you': 'Bạn: ',
      'interview.minutesUnit': 'phút',
      'interview.continueSession': 'Tiếp tục phiên dở?',
      'interview.flagWrong': 'Chấm chưa đúng?',
      'interview.flagged': 'Đã đánh dấu',
      'interview.modelChip': 'Model',
      'interview.modelWarning': 'Điểm do model free chấm, có thể lệch ±1',
      'interview.flaggedCount': '{n} câu đã bị đánh dấu',
      'interview.retrySend': 'Gửi lại',
      'interview.downloadMd': 'Tải transcript (.md)',
      'interview.practiceWeak': 'Luyện lại câu yếu',
      'interview.progressTime': 'Thời gian',
      'interview.progressAnswers': 'Câu trả lời',
      'interview.shortcutHint': '<kbd>Space</kbd> mic · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> gửi · <kbd>Esc</kbd> dừng đọc',
      'interview.questionCount': 'Số câu',
      'interview.maxAnswers': 'Tối đa 24',
    },
    en: {
      'interview.title': 'AI Interview',
      'interview.subtitle': 'Continuous voice mock interview with AI: asks, listens to your answers, drills deeper like a real round, then scores and gives feedback.',
      'interview.resume': 'You have an unfinished session',
      'interview.resumeBtn': 'Resume',
      'interview.discardBtn': 'Discard this session',
      'interview.langLabel': 'Language',
      'interview.levelLabel': 'Level',
      'interview.durationLabel': 'Duration',
      'interview.personaLabel': 'Interviewer style',
      'interview.focusLabel': 'Focus',
      'interview.modeTopics': 'By topic',
      'interview.modeCompany': 'By company',
      'interview.modeJd': 'By JD',
      'interview.companyLabel': 'Company',
      'interview.jdText': 'Job Description (JD)',
      'interview.jdPlaceholder': 'Paste JD (at least 200 characters)…',
      'interview.analyzeJd': 'Analyze JD',
      'interview.startJd': 'Interview by this JD',
      'interview.start': 'Start interview',
      'interview.costHint': 'Each session costs 1 AI credit from your daily limit.',
      'interview.speechNotSupported': 'Voice recognition is not supported in this browser — you will type your answers (use Chrome/Edge to speak).',
      'interview.needLogin': 'Sign in to use AI.',
      'interview.jdTooShort': 'JD must have at least 200 characters.',
      'interview.analyzingJd': 'Analyzing JD…',
      'interview.jdChanged': 'JD changed; please analyze again.',
      'interview.muteBtn': '🔇 Muted',
      'interview.unmuteBtn': '🔊 Read question',
      'interview.hideScore': '🙈 Hide scores',
      'interview.showScore': '👁 Show scores',
      'interview.endBtn': 'End & evaluate',
      'interview.answerPlaceholderVoice': 'Press 🎤 to speak, or type your answer…',
      'interview.answerPlaceholderText': 'Type your answer…',
      'interview.answerAria': 'Your answer',
      'interview.sendBtn': 'Done answering',
      'interview.micAria': 'Toggle microphone',
      'interview.handsFreeOn': '✋ Hands-free: on',
      'interview.handsFreeOff': '✋ Hands-free: off',
      'interview.readAgainAria': 'Read again',
      'interview.grading': 'Panel is scoring your interview…',
      'interview.resultTitle': 'Interview evaluation',
      'interview.byQuestion': 'Per question',
      'interview.strengths': 'Strengths',
      'interview.improvements': 'Areas to improve',
      'interview.studyNext': 'Next to study',
      'interview.communication': 'Communication',
      'interview.retryBtn': 'Interview again',
      'interview.reviewTopic': 'Review {topic}',
      'interview.download': 'Download transcript',
      'interview.viewScore': 'View evaluation',
      'interview.retry': 'Retry',
      'interview.newSession': 'New session',
      'interview.confirmEnd': 'End the interview early? The result will still be saved.',
      'interview.confirmLeave': 'You are in the middle of an interview. Leaving will lose this session.',
      'interview.interim': 'Interim response',
      'interview.speakPlaceholder': 'Press 🎤 to speak, or type your answer…',
      'interview.selectTopic': 'Select at least one topic.',
      'interview.noItems': 'No items.',
      'interview.answerEmpty': 'Speak or type your answer first.',
      'interview.mustHave': 'Must have',
      'interview.niceToHave': 'Nice to have',
      'interview.likelyQuestions': 'Likely questions',
      'interview.prepTips': 'Preparation tips',
      'interview.questionsToAsk': 'Questions to ask the employer',
      'interview.minutesOpt': '{n} min',
      'interview.personaFriendly': 'Friendly',
      'interview.personaStrict': 'Tough, drills deep',
      'interview.resumeMeta': '{n} answers, started {date}',
      'interview.signIn': 'sign in',
      'interview.intent.question': 'Question',
      'interview.intent.follow_up': 'Follow-up',
      'interview.intent.clarify': 'Clarify',
      'interview.intent.hint': 'Hint',
      'interview.intent.wrap_up': 'Wrap up',
      'interview.sig.strong_no': 'Clear no',
      'interview.sig.no': 'No',
      'interview.sig.lean_no': 'Lean no',
      'interview.sig.lean_yes': 'Lean yes',
      'interview.sig.yes': 'Yes',
      'interview.sig.strong_yes': 'Strong yes',
      'interview.thinking': 'Interviewer is thinking…',
      'interview.sendHint': 'send',
      'interview.betterAnswer': 'Better answer:',
      'interview.skillCol': 'Skill',
      'interview.weightCol': 'Weight',
      'interview.readyCol': 'Readiness',
      'interview.notInBank': 'Not in the bank yet',
      'interview.defaultRole': 'Role',
      'interview.unknownCompany': 'Company not specified',
      'interview.unknownDomain': 'domain not specified',
      'interview.bankTopic': 'bank',
      'interview.techCompany': 'tech company',
      'interview.transcriptTitle': 'AI interview — ',
      'interview.you': 'You: ',
      'interview.minutesUnit': 'min',
      'interview.continueSession': 'Continue unfinished session?',
      'interview.flagWrong': 'Flag as incorrect?',
      'interview.flagged': 'Flagged',
      'interview.modelChip': 'Model',
      'interview.modelWarning': 'Scores from free model may vary by ±1',
      'interview.flaggedCount': '{n} flagged',
      'interview.retrySend': 'Retry',
      'interview.downloadMd': 'Download transcript (.md)',
      'interview.practiceWeak': 'Practice weak questions',
      'interview.progressTime': 'Time',
      'interview.progressAnswers': 'Answers',
      'interview.shortcutHint': '<kbd>Space</kbd> mic · <kbd>Ctrl</kbd>+<kbd>Enter</kbd> send · <kbd>Esc</kbd> stop TTS',
      'interview.questionCount': 'Questions',
      'interview.maxAnswers': 'Max 24',
    },
  });

  const STORE_KEY = 'sjp.interview.current';
  const JD_KEY = 'sjp.interview.jd';
  const JD_RESULT_KEY = 'sjp.interview.jdResult';
  const SESSION_MS = 90 * 60000;          // server-side session token lifetime
  const SILENCE_MS = 2500;                // hands-free: send after this much silence
  const MAX_ANSWERS = 24;
  const esc = App.esc;
  const INTENT = { question: 'interview.intent.question', follow_up: 'interview.intent.follow_up', clarify: 'interview.intent.clarify', hint: 'interview.intent.hint', wrap_up: 'interview.intent.wrap_up' };
  const SIGNAL = { strong_no: 'bad', no: 'bad', lean_no: 'warn', lean_yes: 'warn', yes: 'ok', strong_yes: 'ok' };

  const load = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } };
  const save = s => { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } };
  const clear = () => { try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ } };

  function saveSession(s) {
    try {
      sessionStorage.setItem('sjp.interview.session', JSON.stringify({
        transcript: s.transcript || [],
        config: s.config || {},
        token: s.token || null,
        startedAt: s.startedAt || Date.now(),
        scores: s.scores || [],
        done: !!s.done,
        topics: s.topics || [],
        companyId: s.companyId || null,
        model: s.model || null,
        savedAt: Date.now()
      }));
    } catch (e) { /* ignore */ }
  }

  function loadSession() {
    try {
      const raw = sessionStorage.getItem('sjp.interview.session');
      if (!raw) return null;
      const st = JSON.parse(raw);
      if (!st || !st.token) return null;
      if (Date.now() - (st.savedAt || st.startedAt || 0) > SESSION_MS) return null;
      return st;
    } catch (e) { return null; }
  }

  function clearSession() {
    try { sessionStorage.removeItem('sjp.interview.session'); } catch (e) { }
  }
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
    get title() { return App.t('interview.title'); },
    render(root) {
      let s = null;               // live session: { config, topics, companyId, transcript, token, startedAt, scores[], done }
      let mic = null, silence = null, ticker = null, busy = false, showScores = false, handsFree = false, resumeSource = 'local', pendingRetry = false, lastResult = null;
      const cleanups = [];

      // ---------- setup ----------
      const pref = { lang: 'vi', level: 'senior', minutes: 20, persona: 'friendly', mode: 'topics', topics: ['core', 'spring', 'db'], company: '' };

      function flagAnswer(obj) {
        if (!App.store) return;
        try {
          if (!Array.isArray(App.store.data.aiFlags)) App.store.data.aiFlags = [];
          const id = 'ivf-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
          App.store.data.aiFlags.push({
            id,
            updatedAt: Date.now(),
            kind: 'interview',
            question: obj.question || '',
            score: obj.score,
            model: obj.model || s.model || null,
            note: obj.note || '',
            token: s && s.token ? String(s.token).slice(0, 12) : null
          });
          App.store.save();
        } catch (e) { /* ignore */ }
      }

      function flaggedCount() {
        try {
          if (!App.store || !Array.isArray(App.store.data.aiFlags)) return 0;
          return App.store.data.aiFlags.filter(f => f.kind === 'interview').length;
        } catch (e) { return 0; }
      }

      function fmtTime(ts) {
        if (!ts) return '';
        try {
          return new Date(ts).toLocaleTimeString(App.lang === 'en' ? 'en-US' : 'vi-VN', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { return ''; }
      }

      function setup() {
        stopAll();
        const prev = load();
        const resumable = prev && prev.token && Date.now() - prev.startedAt < SESSION_MS && !prev.done;
        const sess = loadSession();
const resumableSess = sess && sess.token && Date.now() - (sess.savedAt || sess.startedAt) < SESSION_MS && !sess.done;
        resumeSource = resumableSess ? 'session' : 'local';
const resumableAny = resumable || resumableSess;
        const companies = window.COMPANIES || [];
        const chips = (name, opts, cur) => '<div class="chips" data-pref="' + name + '">' + Object.entries(opts).map(([v, l]) =>
          '<button type="button" class="chip' + (String(cur) === v ? ' active' : '') + '" data-v="' + esc(v) + '">' + esc(l) + '</button>').join('') + '</div>';
        const needLogin = App.auth.enabled && !App.auth.user && !App.ai.getPasscode();
        let jd = ''; let jdResult = null;
        try { jd = localStorage.getItem(JD_KEY) || ''; jdResult = JSON.parse(localStorage.getItem(JD_RESULT_KEY) || 'null'); } catch (e) { /* storage unavailable */ }
        root.innerHTML = `
          <div class="page-head"><h1>${App.t('interview.title')}</h1>
            <p class="muted">${App.t('interview.subtitle')}</p></div>
          ${resumableAny ? `<div class="card iv-resume"><b>${App.t('interview.resume')}</b> (${App.t('interview.resumeMeta', { n: prev.transcript.filter(t => t.role === 'candidate').length, date: esc(App.fmtDate(prev.startedAt)) })}).
            <div class="row"><button class="btn primary" data-act="resume">${App.t('interview.resumeBtn')}</button><button class="btn" data-act="discard">${App.t('interview.discardBtn')}</button></div></div>` : ''}
          <div class="card iv-setup">
            <div class="iv-field"><label>${App.t('interview.langLabel')}</label>${chips('lang', { vi: 'Tiếng Việt', en: 'English' }, pref.lang)}</div>
            <div class="iv-field"><label>${App.t('interview.levelLabel')}</label>${chips('level', App.LEVELS, pref.level)}</div>
            <div class="iv-field"><label>${App.t('interview.durationLabel')}</label>${chips('minutes', { 10: App.t('interview.minutesOpt', { n: 10 }), 20: App.t('interview.minutesOpt', { n: 20 }), 30: App.t('interview.minutesOpt', { n: 30 }), 45: App.t('interview.minutesOpt', { n: 45 }) }, pref.minutes)}</div>
            <div class="iv-field"><label>${App.t('interview.personaLabel')}</label>${chips('persona', { friendly: App.t('interview.personaFriendly'), strict: App.t('interview.personaStrict') }, pref.persona)}</div>
            <div class="iv-field"><label>${App.t('interview.focusLabel')}</label>${chips('mode', { topics: App.t('interview.modeTopics'), company: App.t('interview.modeCompany'), jd: App.t('interview.modeJd') }, pref.mode)}
              ${pref.mode === 'company' && companies.length
                ? `<select class="select iv-company" aria-label="${App.t('interview.companyLabel')}">${companies.map(c => `<option value="${esc(c.id)}"${c.id === pref.company ? ' selected' : ''}>${esc((c.icon || '') + ' ' + c.name)}</option>`).join('')}</select>`
                : pref.mode === 'jd'
                ? `<div class="iv-jd"><label for="iv-jd-text">${App.t('interview.jdText')}</label><textarea id="iv-jd-text" class="textarea" rows="7" placeholder="${App.t('interview.jdPlaceholder')}">${esc(jd)}</textarea><div class="row"><button type="button" class="btn" data-act="analyze-jd">🔎 ${App.t('interview.analyzeJd')}</button><span class="iv-jd-status muted small" aria-live="polite"></span></div>${jdResult ? renderJD(jdResult) : ''}</div>`
                : `<div class="chips iv-topics">${App.topics().filter(t => t.id !== 'english').map(t =>
                    `<button type="button" class="chip${pref.topics.includes(t.id) ? ' active' : ''}" data-topic="${esc(t.id)}">${esc(t.icon + ' ' + t.name)}</button>`).join('')}</div>`}
            </div>
            <div class="row iv-start">
              ${pref.mode === 'jd' ? `<button class="btn primary lg" data-act="start-jd"${needLogin || !jdResult ? ' disabled' : ''}>🎙️ ${App.t('interview.startJd')}</button>` : `<button class="btn primary lg" data-act="start"${needLogin ? ' disabled' : ''}>🎙️ ${App.t('interview.start')}</button>`}
              <span class="muted small">${App.t('interview.costHint')}${App.speech.supported ? '' : ' ' + App.t('interview.speechNotSupported')}</span>
            </div>
            ${needLogin ? '<p class="iv-note">' + App.t('interview.needLogin') + ' <a href="#/account">' + App.t('interview.signIn') + '</a></p>' : ''}
          </div>`;
        if (!pref.company && companies.length) pref.company = companies[0].id;
      }

      function renderJD(r) {
        const skills = x => (x || []).map(i => { const topic = i.topic || ''; const stats = topic ? App.stats(topic) : null; const pct = stats && stats.total ? Math.round(stats.known * 100 / stats.total) : 0; const state = !topic ? App.t('interview.notInBank') : `${pct >= 60 ? '🟢' : pct >= 30 ? '🟡' : '🔴'} ${stats.known}/${stats.total} (${pct}%)`; return `<tr><td>${esc(i.skill)}</td><td>${'●'.repeat(Math.max(1, Math.min(3, Number(i.weight) || 1)))}${'○'.repeat(3 - Math.max(1, Math.min(3, Number(i.weight) || 1)))}</td><td>${topic ? `<a href="#/bank/${esc(topic)}">${state}</a>` : state}</td></tr>`; }).join('');
        const table = (key, items) => `<section class="iv-jd-section"><h3>${App.t(key)}</h3>${items && items.length ? `<div class="iv-jd-table-wrap"><table class="iv-jd-table"><thead><tr><th>${App.t('interview.skillCol')}</th><th>${App.t('interview.weightCol')}</th><th>${App.t('interview.readyCol')}</th></tr></thead><tbody>${skills(items)}</tbody></table></div>` : '<p class="muted">' + App.t('interview.noItems') + '</p>'}</section>`;
        const list = (title, items, why) => items && items.length ? `<section class="iv-jd-section"><h3>${title}</h3><ul>${items.map(x => `<li>${esc(typeof x === 'string' ? x : x.q || x.skill || '')}${why && x.why ? `<small class="muted"> — ${esc(x.why)}</small>` : ''}</li>`).join('')}</ul></section>` : '';
        return `<div class="iv-jd-result"><h3>${esc(r.role || App.t('interview.defaultRole'))} · ${esc(r.company || App.t('interview.unknownCompany'))} · ${esc(App.LEVELS[r.level] || r.level || '')} · ${esc(r.domain || '')}</h3><p>${esc(r.summary || '')}</p>${table('interview.mustHave', r.must_have)}${table('interview.niceToHave', r.nice_to_have)}${list(App.t('interview.likelyQuestions'), r.likely_questions, true)}${list(App.t('interview.prepTips'), r.prep_tips)}${list(App.t('interview.questionsToAsk'), r.questions_to_ask)}</div>`;
      }

      async function analyzeJD() {
        const ta = root.querySelector('#iv-jd-text'), button = root.querySelector('[data-act="analyze-jd"]'), status = root.querySelector('.iv-jd-status');
        const text = ta ? ta.value.trim() : '';
        try { localStorage.setItem(JD_KEY, text); } catch (e) { /* storage unavailable */ }
        if (text.length < 200) { if (status) status.innerHTML = '<span class="ai-error">' + App.t('interview.jdTooShort') + '</span>'; return; }
        button.disabled = true; if (status) status.innerHTML = '<span class="ai-loading">' + App.t('interview.analyzingJd') + '</span>';
        try {
          const r = await App.ai.jd(text);
          if ((ta.value || '').trim() !== text) { if (status) status.textContent = App.t('interview.jdChanged'); return; }
          try { localStorage.setItem(JD_RESULT_KEY, JSON.stringify(r)); } catch (e) { /* storage unavailable */ }
          setup();
        }
        catch (e) { if (status) status.innerHTML = App.ui.error(e); }
        finally { const b = root.querySelector('[data-act="analyze-jd"]'); if (b) b.disabled = false; }
      }

      function startFromJD() {
        let r; try { r = JSON.parse(localStorage.getItem(JD_RESULT_KEY) || 'null'); } catch (e) { r = null; }
        if (!r) return;
        const topics = [...new Set((r.must_have || []).map(x => x.topic).filter(Boolean))];
        const must = (r.must_have || []).map(x => x.skill).filter(Boolean);
        s = { config: { lang: pref.lang, level: App.LEVELS[r.level] ? r.level : 'senior', minutes: Number(pref.minutes), persona: pref.persona,
          focus: (r.company ? r.company + ' — ' : '') + (r.role || App.t('interview.defaultRole')) + ' (' + (r.domain || App.t('interview.unknownDomain')) + '): ' + must.join(', '),
          seeds: [...(r.likely_questions || []).slice(0, 6).map(x => ({ topic: x.topic || '', q: x.q || '', ref: '' })), ...pickSeeds(topics, null, pref.lang)].slice(0, 12) },
          topics, companyId: null, transcript: [], token: null, startedAt: Date.now(), scores: [], done: false };
        save(s); session(); next();
      }

      function startNew() {
        const companies = window.COMPANIES || [];
        const company = pref.mode === 'company' ? companies.find(c => c.id === pref.company) : null;
        const topics = company ? (company.focus || []) : pref.topics;
        if (!topics.length) { alert(App.t('interview.selectTopic')); return; }
        const names = topics.map(t => App.topic(t).name).join(', ');
        s = {
          config: {
            lang: pref.lang, level: pref.level, minutes: Number(pref.minutes), persona: pref.persona,
            focus: company ? company.name + ' (' + (company.type === 'bank' ? App.t('interview.bankTopic') : App.t('interview.techCompany')) + ') — ' + names : names,
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
            <div><b>${esc(App.LEVELS[c.level])} · ${c.lang === 'en' ? 'English' : 'Tiếng Việt'}</b><div class="muted small iv-focus">${esc(c.focus)}</div></div>
            <div class="iv-timer" aria-live="off">00:00</div>
            <div class="iv-progress">
              <div class="progress"><div class="iv-progress-bar" style="width:100%"></div></div>
              <span class="muted small iv-answers">0 / ${MAX_ANSWERS}</span>
            </div>
            <div class="row iv-toggles">
              <button class="btn sm" data-act="mute" aria-pressed="${tts.muted}">${tts.muted ? App.t('interview.muteBtn') : App.t('interview.unmuteBtn')}</button>
              <button class="btn sm" data-act="scores" aria-pressed="${showScores}">${showScores ? App.t('interview.hideScore') : App.t('interview.showScore')}</button>
              ${App.speech.supported ? `<button class="btn sm" data-act="handsfree" aria-pressed="${handsFree}">${handsFree ? App.t('interview.handsFreeOn') : App.t('interview.handsFreeOff')}</button>` : ''}
              <button class="btn sm bad" data-act="end">${App.t('interview.endBtn')}</button>
            </div>
          </div>
          <div class="iv-chat" aria-live="polite"></div>
          <div class="iv-compose card">
            <textarea class="textarea" rows="3" placeholder="${App.speech.supported ? App.t('interview.answerPlaceholderVoice') : App.t('interview.answerPlaceholderText')}" aria-label="${App.t('interview.answerAria')}"></textarea>
            <div class="iv-interim muted small"></div>
            <div class="row">
              ${App.speech.supported ? '<button class="btn mic-btn lg" data-act="mic" aria-label="' + App.t('interview.micAria') + '">🎤</button>' : ''}
              <button class="btn primary" data-act="send">${App.t('interview.sendBtn')}</button>
              <span class="iv-status"></span>
              <span class="muted small iv-keys">${App.t('interview.shortcutHint')}</span>
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
        const bar = root.querySelector('.iv-progress-bar');
        if (bar) {
          const pct = limit > 0 ? Math.max(0, Math.min(100, (limit - sec) / limit * 100)) : 0;
          bar.style.width = pct + '%';
        }
        const ansEl = root.querySelector('.iv-answers');
        if (ansEl) {
          const n = s.transcript.filter(t => t.role === 'candidate').length;
          ansEl.textContent = n + ' / ' + MAX_ANSWERS;
        }
        if (sec > limit + 120 && !busy && !s.done) finish();   // hard stop 2 minutes after the planned length
      }

      function drawChat() {
        const box = root.querySelector('.iv-chat');
        if (!box) return;
        let answer = 0;
        box.innerHTML = s.transcript.map((t, i) => {
          if (t.role === 'interviewer') {
            return `<div class="iv-msg iv-ai"><div class="iv-avatar" aria-hidden="true">AI</div><div class="iv-bubble">
              ${t.intent ? `<span class="badge">${esc(INTENT[t.intent] ? App.t(INTENT[t.intent]) : t.intent)}</span>` : ''}<p>${esc(t.text)}</p>
              ${fmtTime(t.ts) ? `<div class="iv-time">${esc(fmtTime(t.ts))}</div>` : ''}
              ${tts.ok ? `<button class="link-btn" data-say="${i}" aria-label="${App.t('interview.readAgainAria')}">🔊</button>` : ''}</div></div>`;
          }
          const sc = s.scores[answer++];
          const flagBtn = showScores && sc && sc.score ? `<button class="btn sm" data-act="flag-answer" data-idx="${i}">${App.t('interview.flagWrong')}</button>` : '';
          return `<div class="iv-msg iv-me"><div class="iv-bubble"><p>${esc(t.text)}</p>
            ${fmtTime(t.ts) ? `<div class="iv-time">${esc(fmtTime(t.ts))}</div>` : ''}
            ${showScores && sc && sc.score ? `<div class="iv-score">${App.ui.scoreBadge(sc.score)} <span class="muted small">${esc(sc.note || '')}</span> ${sc.model ? `<span class="chip">${App.t('interview.modelChip')}: ${esc(sc.model)}</span>` : ''} ${flagBtn}</div>` : ''}</div></div>`;
        }).join('') + (busy ? '<div class="iv-msg iv-ai"><div class="iv-avatar" aria-hidden="true">AI</div><div class="iv-bubble"><span class="iv-typing" aria-label="' + esc(App.t('interview.thinking')) + '"><span></span><span></span><span></span></span><span class="muted small iv-typing-label">' + esc(App.t('interview.thinking')) + '</span></div></div>' : '');
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
if (r.model) s.model = r.model;
          if (s.transcript.some(t => t.role === 'candidate')) {
            const sc = r.last_answer || {};
            if (r.last_answer && r.last_answer.model) sc.model = r.last_answer.model;
            else if (r.model) sc.model = r.model;
            s.scores.push(sc);
          }
          s.transcript.push({ role: 'interviewer', text: r.say, intent: r.intent, model: r.model || null, ts: Date.now() });
          s.done = !!r.done;
          save(s);
saveSession(s);
          setBusy(false);
          tts.speak(r.say, s.config.lang, () => {
            if (s && s.done) finish();
            else if (handsFree && !mic) listen();
          });
        } catch (e) {
          setBusy(false);
          status(App.ui.error(e) + (e.code === 'bad_session' || e.code === 'session_full' ? ' <button class="btn sm" data-act="end">' + App.t('interview.viewScore') + '</button>' : ''));
          if (!s.token && !s.transcript.length) { clear(); clearSession(); }
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
        if (!text) { status('<span class="muted">' + App.t('interview.answerEmpty') + '</span>'); return; }
        ta.value = '';
        s.transcript.push({ role: 'candidate', text, ts: Date.now() });
        save(s);
        next();
      }

      // ---------- result ----------
      async function finish() {
        stopAll();
        if (!s) return;
        const answers = s.transcript.filter(t => t.role === 'candidate').length;
        if (!answers) { clear(); s = null; setup(); return; }
        root.innerHTML = '<div class="card iv-wait"><span class="ai-loading">' + App.t('interview.grading') + '</span></div>';
        try {
          const r = await App.ai.interview.summary({ session_token: s.token, config: s.config, transcript: s.transcript });
          if (r.model) s.model = r.model;
          const minutes = Math.round((Date.now() - s.startedAt) / 60000);
          App.store.addMockResult({
            kind: 'ai-interview', score: r.overall_score, hire_signal: r.hire_signal, minutes, lang: s.config.lang,
            level: s.config.level, topics: s.topics, company: s.companyId, answers, verdict: r.verdict,
          });
          result(r, minutes);
          clear();
        } catch (e) {
          root.innerHTML = '<div class="card">' + App.ui.error(e) +
            '<div class="row"><button class="btn primary" data-act="retry-summary">' + App.t('interview.retry') + '</button><button class="btn" data-act="download">' + App.t('interview.download') + '</button><button class="btn" data-act="new">' + App.t('interview.newSession') + '</button></div></div>';
        }
      }

      function result(r, minutes) {
        lastResult = r;
        const sigCls = SIGNAL[r.hire_signal] || 'warn';
        const list = (title, items, icon) => items && items.length ? '<div class="card iv-result-card"><h3>' + (icon ? icon + ' ' : '') + title + '</h3><ul>' + items.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
        const model = r.model || s.model;
        const weak = (r.by_question || []).filter(q => (Number(q.score) || 0) <= 3);
        const flagged = flaggedCount();
        root.innerHTML = `
          <div class="page-head"><h1>${App.t('interview.resultTitle')}</h1><p class="muted">${minutes} ${App.t('interview.minutesUnit')} · ${esc(s.config.focus)}</p></div>
          <div class="card iv-verdict">
            <div class="row iv-verdict-row"><div class="iv-score-circle" style="--iv-score:${Math.max(0, Math.min(100, (Number(r.overall_score) || 0) / 5 * 100))}"><span>${esc(String(r.overall_score))}</span><small>/5</small></div><span class="badge ${sigCls} iv-hire">${esc(App.t('interview.sig.' + (r.hire_signal || 'lean_no')))}</span>${model ? ' <span class="chip">' + App.t('interview.modelChip') + ': ' + esc(model) + '</span>' : ''}</div>
            <p>${esc(r.verdict)}</p>
            <p class="muted small">${App.t('interview.modelWarning')}${flagged ? ' · ' + App.t('interview.flaggedCount', { n: flagged }) : ''}</p>
          </div>
          <div class="card"><h3>${App.t('interview.byQuestion')}</h3>
            <div class="iv-chart">${(r.by_question || []).map((q, i) => '<div class="iv-chart-col"><div class="iv-chart-bar" style="height:' + Math.max(4, (Number(q.score) || 0) / 5 * 100) + '%"></div><span>' + (i + 1) + '</span></div>').join('')}</div>
            ${(r.by_question || []).map((q, qi) => '<details class="iv-q"><summary>' + App.ui.scoreBadge(q.score) + ' <span>' + esc(q.question) + '</span> ' + ((q.model || model) ? '<span class="chip">' + App.t('interview.modelChip') + ': ' + esc(q.model || model) + '</span>' : '') + ' <button class="btn sm" data-act="flag-bq" data-qidx="' + qi + '">' + App.t('interview.flagWrong') + '</button></summary><div class="iv-q-bar"><div style="width:' + Math.max(0, Math.min(100, (Number(q.score) || 0) / 5 * 100)) + '%"></div></div><p>' + esc(q.comment) + '</p><p class="iv-better"><b>' + App.t('interview.betterAnswer') + '</b> <span' + (s.config.lang === 'en' ? ' lang="en"' : '') + '>' + esc(q.better_answer) + '</span></p></details>').join('')}
          </div>
          <div class="grid">${list(App.t('interview.strengths'), r.strengths, '💪')}${list(App.t('interview.improvements'), r.improvements, '🛠️')}${list(App.t('interview.studyNext'), r.study_next, '📚')}</div>
          ${r.communication ? '<div class="card"><h3>' + App.t('interview.communication') + '</h3><p>' + esc(r.communication) + '</p></div>' : ''}
          <div class="row iv-actions">
            <button class="btn primary" data-act="new">${App.t('interview.retryBtn')}</button>
            ${weak.length && s.topics[0] ? '<a class="btn" href="#/flash/' + esc(s.topics[0]) + '">' + App.t('interview.practiceWeak') + '</a>' : ''}
            ${s.topics[0] ? '<a class="btn" href="#/bank/' + esc(s.topics[0]) + '">' + App.t('interview.reviewTopic', {topic: App.topic(s.topics[0]).name}) + '</a>' : ''}
            <button class="btn" data-act="download">${App.t('interview.downloadMd')}</button>
          </div>`;
      }

      function download() {
        if (!s) return;
        const locale = App.lang === 'en' ? 'en-US' : 'vi-VN';
        const lines = ['# ' + App.t('interview.transcriptTitle') + new Date(s.startedAt).toLocaleString(locale), '', '**' + s.config.focus + '**', ''];
        s.transcript.forEach(t => {
          lines.push('## ' + (t.role === 'candidate' ? App.t('interview.you') : 'Interviewer'));
          lines.push('');
          lines.push(t.text);
          lines.push('');
        });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' }));
        a.download = 'phong-van-ai-' + App.dayKey(s.startedAt) + '.md';
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
          case 'analyze-jd': analyzeJD(); break;
          case 'start-jd': startFromJD(); break;
          case 'start': startNew(); break;
          case 'resume':
  if (resumeSource === 'session') {
    const st = loadSession();
    if (!st) { setup(); break; }
    s = { config: st.config, topics: st.topics || [], companyId: st.companyId || null, transcript: st.transcript || [], token: st.token, startedAt: st.startedAt || Date.now(), scores: st.scores || [], done: !!st.done, model: st.model || null };
  } else {
    s = load();
  }
  if (!s) { setup(); break; }
  save(s);
  session();
  if (s.transcript.length && s.transcript[s.transcript.length - 1].role === 'candidate') next();
  break;
          case 'discard': clear(); setup(); break;
          case 'mic': if (mic) stopMic(); else listen(); break;
          case 'send': send(); break;
          case 'end': finish(); break;
          case 'retry-summary': finish(); break;
          case 'retry-send':
            if (busy || !s) break;
            const taR = root.querySelector('.iv-compose textarea');
            const txtR = taR ? taR.value.trim() : '';
            if (txtR) { for (let i = s.transcript.length - 1; i >= 0; i--) if (s.transcript[i].role === 'candidate') { s.transcript[i].text = txtR; break; } }
            save(s); next(); break;
case 'download': download(); break;
          case 'flag-bq':
  if (!lastResult || !lastResult.by_question) break;
  const qi = Number(act.dataset.qidx);
  const bq = lastResult.by_question[qi];
  if (!bq) break;
  flagAnswer({ question: bq.question || '', score: bq.score, model: bq.model || (lastResult.model || s && s.model) || null, note: bq.comment || '' });
  act.textContent = App.t('interview.flagged');
  act.disabled = true;
  break;
          case 'new': s = null; setup(); break;
          case 'mute': tts.muted = !tts.muted; if (tts.muted) tts.stop(); session(); break;
          case 'scores': showScores = !showScores; session(); break;
case 'handsfree': handsFree = !handsFree; session(); if (handsFree && !busy) listen(); break;
          case 'flag-answer':
  if (!s) break;
  const idx = Number(act.dataset.idx);
  // find score object
  let scObj = null;
  if (!isNaN(idx)) {
    // count candidate index
    let candCount = -1;
    for (let i = 0; i < s.transcript.length; i++) {
      if (s.transcript[i].role === 'candidate') {
        candCount++;
        if (i === idx) { scObj = s.scores[candCount] || null; break; }
      }
    }
  }
  const qText = (function () {
    // preceding interviewer message
    for (let i = idx - 1; i >= 0; i--) if (s.transcript[i].role === 'interviewer') return s.transcript[i].text;
    return '';
  })();
  flagAnswer({ question: qText, score: scObj ? scObj.score : null, model: scObj && scObj.model ? scObj.model : (s.model || null), note: scObj ? (scObj.note || '') : '' });
  act.textContent = App.t('interview.flagged');
  act.disabled = true;
  break;
        }
      }
      function onInput(e) {
        if (!e.target.matches('#iv-jd-text')) return;
        try { localStorage.setItem(JD_KEY, e.target.value); localStorage.removeItem(JD_RESULT_KEY); } catch (err) { /* storage unavailable */ }
        const result = root.querySelector('.iv-jd-result');
        if (result) result.remove();
        const start = root.querySelector('[data-act="start-jd"]');
        if (start) start.disabled = true;
        const message = root.querySelector('.iv-jd-status');
        if (message) message.textContent = App.t('interview.jdChanged');
      }
      function onChange(e) { if (e.target.matches('.iv-company')) pref.company = e.target.value; }
      function onKeydown(e) {
        if (e.key === 'Escape') { tts.stop(); return; }
        if (e.key === ' ' && !e.target.matches('textarea, input, select')) { e.preventDefault(); const b = root.querySelector('[data-act="mic"]'); if (b) { if (mic) stopMic(); else listen(); } return; }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && e.target.matches('.iv-compose textarea')) { e.preventDefault(); send(); }
      }

      root.addEventListener('click', onClick);
      root.addEventListener('change', onChange);
      root.addEventListener('keydown', onKeydown);
      root.addEventListener('input', onInput);
      cleanups.push(() => { root.removeEventListener('click', onClick); root.removeEventListener('change', onChange); root.removeEventListener('keydown', onKeydown); root.removeEventListener('input', onInput); });
      if (tts.ok) speechSynthesis.getVoices();   // warm up the voice list (loads async in Chrome)

      setup();
      return () => { stopAll(); cleanups.forEach(f => f()); };
    },
  });
})();
