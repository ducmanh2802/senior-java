/*
 * View "speak" — free English speaking practice (T144).
 * Three modes: shadowing (listen & repeat with word-level diff), quick Q&A (timed answer
 * compared with a sample), technical terms (pronunciation check). Browser TTS/STT only —
 * this screen never calls the AI endpoints, so it costs no AI quota.
 */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'speak.title': 'Luyện nói tiếng Anh',
      'speak.subtitle': 'Nghe và nhắc lại, trả lời nhanh có bấm giờ, luyện phát âm thuật ngữ — miễn phí, không giới hạn, không tốn lượt AI.',
      'speak.tabsAria': 'Chế độ luyện nói',
      'speak.shortcuts': 'Phím tắt',
      'speak.tab.shadow': 'Shadowing',
      'speak.tab.qa': 'Hỏi nhanh',
      'speak.tab.term': 'Thuật ngữ',
      'speak.filter.theme': 'Chủ đề',
      'speak.filter.level': 'Trình độ',
      'speak.filter.all': 'Tất cả',
      'speak.stat.today': 'Câu đã luyện hôm nay',
      'speak.stat.streak': 'Chuỗi ngày',
      'speak.stat.known': 'Đã thuộc',
      'speak.progress': 'Câu {i}/{n}',
      'speak.listen': 'Nghe',
      'speak.listenQuestion': 'Nghe câu hỏi',
      'speak.listenTerm': 'Nghe từ',
      'speak.listenExample': 'Nghe ví dụ',
       'speak.voice': 'Giọng đọc',
       'speak.previewVoice': 'Nghe thử',
       'speak.voiceHint': 'Giọng tự nhiên nhất: mở bằng Microsoft Edge (giọng Natural) hoặc Chrome (Google US English).',
       'speak.loadingAudio': 'Đang tải audio…',
       'speak.audioSource': 'Wiktionary audio (CC BY-SA)',
      'speak.showVi': 'Hiện nghĩa',
      'speak.hideVi': 'Ẩn nghĩa',
      'speak.showText': 'Hiện chữ',
      'speak.hideText': 'Ẩn chữ',
      'speak.record': 'Nói lại',
      'speak.try': 'Đọc thử',
      'speak.stopRecord': 'Dừng',
      'speak.speed': 'Tốc độ',
      'speak.auto': 'Tự động',
      'speak.autoTitle': 'Tự động: nghe → nói → chấm → câu tiếp',
      'speak.prev': 'Câu trước',
      'speak.next': 'Câu tiếp',
      'speak.empty': 'Chưa có nội dung cho lựa chọn này',
      'speak.emptyHint': 'Dữ liệu luyện nói đang được bổ sung. Thử chọn tab khác hoặc bỏ bộ lọc.',
      'speak.clearFilter': 'Bỏ bộ lọc',
      'speak.noSpeech': 'Trình duyệt này không nhận dạng giọng nói — bạn vẫn có thể nghe và tự đánh giá (dùng Chrome/Edge để nói).',
      'speak.recording': 'Đang ghi âm…',
      'speak.transcript': 'Máy nghe được',
      'speak.saved': 'Đã lưu vào lịch ôn',
      'speak.assessHint': 'Đánh giá này đưa câu vào lịch ôn lặp lại (SRS).',
      'speak.key.listen': 'nghe',
      'speak.key.record': 'ghi âm',
      'speak.key.next': 'câu tiếp',
      'speak.shadow.hint': 'Nghe câu mẫu rồi bấm micro để nhắc lại. Từ đúng tô xanh, từ còn thiếu tô đỏ.',
      'speak.shadow.match': 'Khớp {hit}/{total} từ',
      'speak.shadow.noVoice': 'Không nhận được giọng nói — thử lại gần micro hơn.',
      'speak.qa.hint': 'Nghe câu hỏi (chữ bị ẩn), trả lời trong thời gian quy định rồi so với đáp án mẫu.',
      'speak.qa.hidden': 'Câu hỏi đang ẩn — bấm Nghe hoặc Hiện chữ',
      'speak.qa.start': 'Bắt đầu trả lời',
      'speak.qa.retry': 'Làm lại',
      'speak.qa.finish': 'Trả lời xong',
      'speak.qa.sample': 'Đáp án mẫu',
      'speak.qa.phrases': 'Cụm từ nên dùng',
      'speak.qa.used': 'đã dùng',
      'speak.qa.notUsed': 'chưa dùng',
      'speak.qa.assess': 'Tự đánh giá',
      'speak.qa.good': 'Tốt',
      'speak.qa.fair': 'Tạm',
      'speak.qa.poor': 'Chưa',
      'speak.term.say': 'Cách đọc',
      'speak.term.wrong': 'Hay đọc sai',
      'speak.term.example': 'Ví dụ',
      'speak.term.hint': 'Bấm ▶ để nghe, rồi bấm micro và đọc to từ khoá cùng câu ví dụ.',
      'speak.term.correct': 'Đã nghe ra từ khoá',
      'speak.term.incorrect': 'Chưa nghe ra từ khoá',
      'speak.term.expected': 'Cần đọc được: {term}',
      'speak.term.assess': 'Đánh dấu thuật ngữ',
      'speak.term.known': 'Đã thuộc',
      'speak.term.review': 'Cần ôn',
      'speak.theme.intro': 'Giới thiệu',
      'speak.theme.tech': 'Kỹ thuật',
      'speak.theme.behavioral': 'Hành vi',
      'speak.theme.design': 'System design',
      'speak.theme.project': 'Dự án',
      'speak.theme.negotiation': 'Đàm phán',
      'speak.theme.smalltalk': 'Small talk',
    },
    en: {
      'speak.title': 'English speaking practice',
      'speak.subtitle': 'Listen and repeat, answer timed questions, practise technical terms — free, unlimited, no AI quota used.',
      'speak.tabsAria': 'Speaking practice modes',
      'speak.shortcuts': 'Keyboard shortcuts',
      'speak.tab.shadow': 'Shadowing',
      'speak.tab.qa': 'Quick Q&A',
      'speak.tab.term': 'Terminology',
      'speak.filter.theme': 'Theme',
      'speak.filter.level': 'Level',
      'speak.filter.all': 'All',
      'speak.stat.today': 'Practised today',
      'speak.stat.streak': 'Day streak',
      'speak.stat.known': 'Marked known',
      'speak.progress': 'Item {i}/{n}',
      'speak.listen': 'Listen',
      'speak.listenQuestion': 'Listen to the question',
      'speak.listenTerm': 'Hear the word',
      'speak.listenExample': 'Hear the example',
       'speak.voice': 'Voice',
       'speak.previewVoice': 'Preview',
       'speak.voiceHint': 'Most natural voices: open in Microsoft Edge (Natural voices) or Chrome (Google US English).',
       'speak.loadingAudio': 'Loading audio…',
       'speak.audioSource': 'Wiktionary audio (CC BY-SA)',
      'speak.showVi': 'Show meaning',
      'speak.hideVi': 'Hide meaning',
      'speak.showText': 'Show text',
      'speak.hideText': 'Hide text',
      'speak.record': 'Repeat',
      'speak.try': 'Say it',
      'speak.stopRecord': 'Stop',
      'speak.speed': 'Speed',
      'speak.auto': 'Auto',
      'speak.autoTitle': 'Auto: listen → speak → score → next',
      'speak.prev': 'Previous',
      'speak.next': 'Next',
      'speak.empty': 'No drills for this selection yet',
      'speak.emptyHint': 'The speaking drills are still being added. Try another tab or clear the filters.',
      'speak.clearFilter': 'Clear filters',
      'speak.noSpeech': 'This browser does not support speech recognition — you can still listen and self-assess (use Chrome or Edge to speak).',
      'speak.recording': 'Recording…',
      'speak.transcript': 'Transcript',
      'speak.saved': 'Saved to your review schedule',
      'speak.assessHint': 'This self-assessment feeds spaced repetition (SRS).',
      'speak.key.listen': 'listen',
      'speak.key.record': 'record',
      'speak.key.next': 'next',
      'speak.shadow.hint': 'Listen to the model sentence, then hit the mic and repeat it. Correct words turn green, missing words red.',
      'speak.shadow.match': '{hit}/{total} words matched',
      'speak.shadow.noVoice': 'No speech detected — try again closer to the microphone.',
      'speak.qa.hint': 'Listen to the question (text hidden), answer within the time limit, then compare with the sample answer.',
      'speak.qa.hidden': 'Question hidden — press Listen or Show text',
      'speak.qa.start': 'Start answering',
      'speak.qa.retry': 'Try again',
      'speak.qa.finish': 'Finish answer',
      'speak.qa.sample': 'Sample answer',
      'speak.qa.phrases': 'Useful phrases',
      'speak.qa.used': 'used',
      'speak.qa.notUsed': 'not used',
      'speak.qa.assess': 'Self-assessment',
      'speak.qa.good': 'Good',
      'speak.qa.fair': 'So-so',
      'speak.qa.poor': 'Not yet',
      'speak.term.say': 'How to say it',
      'speak.term.wrong': 'Common mistake',
      'speak.term.example': 'Example',
      'speak.term.hint': 'Press ▶ to listen, then hit the mic and say the term and example out loud.',
      'speak.term.correct': 'Term recognised',
      'speak.term.incorrect': 'Term not recognised',
      'speak.term.expected': 'Target word: {term}',
      'speak.term.assess': 'Mark this term',
      'speak.term.known': 'Known',
      'speak.term.review': 'Review',
      'speak.theme.intro': 'Introduction',
      'speak.theme.tech': 'Technology',
      'speak.theme.behavioral': 'Behavioural',
      'speak.theme.design': 'System design',
      'speak.theme.project': 'Project',
      'speak.theme.negotiation': 'Negotiation',
      'speak.theme.smalltalk': 'Small talk',
    },
  });

  const esc = App.esc;
  const tr = (key, vars) => App.t('speak.' + key, vars);
  const TABS = ['shadow', 'qa', 'term'];
  const RATES = [0.75, 0.95, 1, 1.15];
  const RATE_KEY = 'sjp.speak.rate';
  const VOICE_KEY = 'sjp.speak.voice';
  const AUDIO_CACHE_KEY = 'sjp.speak.audio';
  const THEME_ORDER = ['intro', 'tech', 'behavioral', 'design', 'project', 'negotiation', 'smalltalk'];

  // ---------- text helpers ----------
  function tokenize(text) {
    const str = String(text == null ? '' : text);
    const re = /[A-Za-z0-9']+/g;
    const out = [];
    let m;
    while ((m = re.exec(str))) {
      const norm = m[0].toLowerCase().replace(/^'+|'+$/g, '');
      if (norm) out.push({ raw: m[0], index: m.index, norm: norm });
    }
    return out;
  }
  const wordsOf = text => tokenize(text).map(x => x.norm);

  /** Longest-common-subsequence mask over the target words (order matters). */
  function lcsHits(a, b) {
    const hits = new Array(a.length).fill(false);
    const m = a.length, n = b.length;
    if (!m || !n) return hits;
    const dp = [];
    for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) { hits[i - 1] = true; i--; j--; }
      else if (dp[i - 1][j] >= dp[i][j - 1]) i--;
      else j--;
    }
    return hits;
  }

  /** Original sentence with each word wrapped in a green/red span. */
  function markWords(text, hits) {
    const str = String(text == null ? '' : text);
    const toks = tokenize(str);
    let out = '', last = 0;
    toks.forEach((tk, i) => {
      out += esc(str.slice(last, tk.index));
      out += '<span class="sp-word ' + (hits && hits[i] ? 'ok' : 'bad') + '">' + esc(tk.raw) + '</span>';
      last = tk.index + tk.raw.length;
    });
    out += esc(str.slice(last));
    return out;
  }

  function containsTerm(transcript, term) {
    const want = wordsOf(term).join(' ');
    if (!want) return false;
    const said = ' ' + wordsOf(transcript).join(' ') + ' ';
    if (said.includes(' ' + want + ' ')) return true;
    const raw = String(term || '').toLowerCase();
    const alts = [];
    if (raw.indexOf('c++') >= 0) alts.push('c plus plus');
    if (raw.indexOf('c#') >= 0) alts.push('c sharp');
    return alts.some(x => said.includes(' ' + wordsOf(x).join(' ') + ' '));
  }

  function fmtTime(seconds) {
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  App.registerView('speak', {
    get title() { return App.t('speak.title'); },
    render(root) {
      const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
      const supported = !!(App.speech && App.speech.supported);

      let tab = 'shadow';
      let theme = 'all';
      let level = 'all';
      let rate = 0.95;
      try {
        const r = parseFloat(localStorage.getItem(RATE_KEY));
        if (RATES.indexOf(r) >= 0) rate = r;
      } catch (e) { /* storage unavailable */ }

      const idx = { shadow: 0, qa: 0, term: 0 };
      const shadow = { result: null, showVi: false, auto: false, recording: false };
      const qa = { phase: 'idle', showQ: false, remaining: 0, metrics: null };
      const term = { phase: 'idle', metrics: null, correct: null };

      let mic = null, micKind = null;
      let qTimer = null, silenceTimer = null, maxTimer = null, nextTimer = null;
      let speakSeq = 0;
      let voiceChoice = null;
      try { voiceChoice = localStorage.getItem(VOICE_KEY); } catch (e) { voiceChoice = null; }
      const audioCache = (function () { try { return JSON.parse(localStorage.getItem(AUDIO_CACHE_KEY) || '{}') || {}; } catch (e) { return {}; } })();
      let currentAudio = null;
      const termAudio = { term: null, info: null, loading: false };

      // ---------- data ----------
      const all = kind => (window.DRILLS || []).filter(d => d && d.kind === kind);
      function themesFor(kind) {
        const present = new Set(all(kind).map(d => d.theme).filter(Boolean));
        const out = THEME_ORDER.filter(x => present.has(x));
        present.forEach(x => { if (out.indexOf(x) < 0) out.push(x); });
        return out;
      }
      function listFor(kind) {
        let arr = all(kind);
        if (theme !== 'all') arr = arr.filter(d => d.theme === theme);
        if (level !== 'all') arr = arr.filter(d => d.level === level);
        return arr;
      }
      function current(kind) {
        const arr = listFor(kind);
        if (!arr.length) { idx[kind] = 0; return null; }
        if (idx[kind] >= arr.length) idx[kind] = arr.length - 1;
        if (idx[kind] < 0) idx[kind] = 0;
        return arr[idx[kind]];
      }
      function themeLabel(x) {
        const key = 'speak.theme.' + x;
        const v = App.t(key);
        return v === key ? x : v;
      }
      function stats() {
        const drills = (window.DRILLS || []).filter(d => d && d.id);
        return {
          today: (App.store.day().review || 0),
          streak: App.store.streak(),
          known: drills.filter(d => App.store.getStatus(d.id) === 'known').length,
          total: drills.length,
        };
      }

      // ---------- text to speech ----------
      function stopSpeak() {
        speakSeq++;
         if (currentAudio) { try { currentAudio.pause(); } catch (e) { /* ignore */ } currentAudio = null; }
        if (!hasTTS) return;
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      }

      function speak(text, onEnd) {
        const str = String(text == null ? '' : text).trim();
        if (!hasTTS || !str) { if (onEnd) onEnd(); return; }
        speakSeq++;
        const mine = speakSeq;
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
        const u = new SpeechSynthesisUtterance(str);
        u.rate = rate;
        try {
          const v = resolveVoice();
          if (v) { u.voice = v; u.lang = v.lang || 'en-US'; }
          else { u.lang = 'en-US'; }
        } catch (e) { /* voice list may be unavailable */ }
        u.onend = u.onerror = () => { if (mine === speakSeq && onEnd) onEnd(); };
        try { window.speechSynthesis.speak(u); } catch (e) { if (mine === speakSeq && onEnd) onEnd(); }
      }

       function voiceScore(v) {
         const name = (v && v.name) ? v.name : '';
         const lang = (v && v.lang) ? v.lang : '';
         let score = 0;
         if (/^en[-_]US/i.test(lang)) score += 3;
         else if (/^en[-_]GB/i.test(lang)) score += 2;
         else if (/^en/i.test(lang)) score += 1;
         if (/Natural|Neural|Online|Google US English|Google UK English|Aria|Jenny|Guy|Ava|Andrew|Emma|Samantha|Daniel/i.test(name)) score += 10;
         if (/David|Zira|Mark|eSpeak/i.test(name)) score -= 6;
         return score;
       }
       function englishVoices() {
         if (!hasTTS) return [];
         try {
           const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
           return voices.filter(function (v) { return /^en/i.test(v.lang || ''); })
             .slice().sort(function (a, b) { return voiceScore(b) - voiceScore(a) || String(a.name || '').localeCompare(String(b.name || '')); });
         } catch (e) { return []; }
       }
       function resolveVoice() {
         const list = englishVoices();
         if (!list.length) return null;
         if (voiceChoice) {
           const found = list.find(function (v) { return v.name === voiceChoice; });
           if (found) return found;
         }
         return list[0];
       }
       function saveAudioCache() {
         try { localStorage.setItem(AUDIO_CACHE_KEY, JSON.stringify(audioCache)); } catch (e) { /* storage unavailable */ }
       }
       function wordCount(s) { return String(s == null ? '' : s).trim().split(/\s+/).filter(Boolean).length; }
       async function fetchWordAudio(term) {
         const key = String(term == null ? '' : term).trim().toLowerCase();
         if (!key) return { none: true };
         if (Object.prototype.hasOwnProperty.call(audioCache, key)) return audioCache[key];
         if (wordCount(key) > 3) {
           audioCache[key] = { none: true };
           saveAudioCache();
           return audioCache[key];
         }
         let result = { none: true };
         try {
           const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
           let timer = null;
           if (ctrl) timer = setTimeout(function () { try { ctrl.abort(); } catch (e) { /* ignore */ } }, 4000);
           const res = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(key), ctrl ? { signal: ctrl.signal } : undefined);
           if (timer) clearTimeout(timer);
           if (res && res.ok) {
             const data = await res.json();
             const urls = [];
             let ipa = '';
             (Array.isArray(data) ? data : []).forEach(function (entry) {
               (entry && entry.phonetics ? entry.phonetics : []).forEach(function (ph) {
                 if (ph && ph.audio) urls.push(ph.audio);
                 if (!ipa && ph && ph.text) ipa = ph.text;
               });
             });
             let url = '';
             const us = urls.find(function (u) { return /-us\.mp3$/i.test(u); });
             const uk = urls.find(function (u) { return /-uk\.mp3$/i.test(u); });
             if (us) url = us; else if (uk) url = uk; else if (urls.length) url = urls[0];
             if (url) result = { url: url, ipa: ipa };
           }
         } catch (e) { result = { none: true }; }
         audioCache[key] = result;
         saveAudioCache();
         return result;
       }
       function playTermAudio(term) {
         const t = String(term == null ? '' : term).trim();
         if (!t) { speak('', function () {}); return; }
         termAudio.term = t;
         termAudio.info = null;
         termAudio.loading = true;
         renderBody();
         fetchWordAudio(t).then(function (info) {
           termAudio.loading = false;
           termAudio.info = info;
           renderBody();
           if (info && info.url) {
             try { if (currentAudio) currentAudio.pause(); } catch (e) { /* ignore */ }
             const a = new Audio(info.url);
             currentAudio = a;
             const seq = speakSeq;
             a.onended = a.onerror = function () { if (seq === speakSeq) currentAudio = null; };
             try {
               const p = a.play();
               if (p && typeof p.catch === 'function') p.catch(function () { currentAudio = null; speak(t); });
             } catch (e) { currentAudio = null; speak(t); }
           } else {
             speak(t);
           }
         });
       }
       function refreshVoiceSelect() {
         const sel = root.querySelector('[data-voice]');
         if (!sel) return;
         const voices = englishVoices();
         const cur = voiceChoice || (voices.length ? voices[0].name : '');
         sel.innerHTML = voices.map(function (v) {
           return '<option value="' + esc(v.name) + '"' + (v.name === cur ? ' selected' : '') + '>' + esc(v.name) + ' (' + esc(v.lang) + ')</option>';
         }).join('');
         if (cur) sel.value = cur;
       }
       
      // ---------- microphone ----------
      function takeMic() {
        const h = mic;
        mic = null;
        micKind = null;
        if (!h) return null;
        try { return h.stop(); } catch (e) { return null; }
      }

      function stopMic() {
        const h = mic;
        mic = null;
        micKind = null;
        if (h) { try { h.stop(); } catch (e) { /* ignore */ } }
      }

      function clearTimers() {
        clearInterval(qTimer); qTimer = null;
        clearTimeout(silenceTimer); silenceTimer = null;
        clearTimeout(maxTimer); maxTimer = null;
        clearTimeout(nextTimer); nextTimer = null;
      }

      function cancelAudio() {
        clearTimers();
        stopMic();
        stopSpeak();
        shadow.recording = false;
        if (qa.phase === 'recording') qa.phase = 'idle';
        if (term.phase === 'recording') term.phase = 'idle';
      }

      function stopEverything() {
        cancelAudio();
        shadow.auto = false;
      }

      function resetItemState(kind) {
        if (kind === 'shadow') {
          shadow.result = null;
          shadow.showVi = false;
          shadow.recording = false;
        } else if (kind === 'qa') {
          qa.phase = 'idle';
          qa.showQ = false;
          qa.metrics = null;
          const d = current('qa');
          qa.remaining = d ? (Number(d.seconds) || 60) : 0;
        } else {
          term.phase = 'idle';
          term.metrics = null;
          term.correct = null;
        }
      }

      // ---------- shadowing ----------
      function startShadow(auto) {
        if (mic || !supported) return;
        const d = current('shadow');
        if (!d) return;
        clearTimeout(nextTimer); nextTimer = null;
        stopSpeak();
        shadow.result = null;
        shadow.recording = true;
        renderBody();
        micKind = 'shadow';
        try {
          mic = App.speech.start({
            lang: 'en',
            onText(finalText, interim) {
              const el = root.querySelector('.sp-interim');
              if (el) el.textContent = interim || finalText;
              if (auto && shadow.auto) {
                clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => finishShadow(true), 1600);
              }
            },
            onError(msg) {
              mic = null; micKind = null;
              shadow.recording = false;
              shadow.auto = false;
              renderBody();
              const el = root.querySelector('.sp-interim');
              if (el) el.innerHTML = '<span class="ai-error">' + esc(msg) + '</span>';
            },
          });
        } catch (e) {
          mic = null; micKind = null; shadow.recording = false;
          renderBody();
          return;
        }
        if (auto) {
          clearTimeout(maxTimer);
          maxTimer = setTimeout(() => finishShadow(true), 15000);
        }
      }

      function finishShadow(auto) {
        if (!shadow.recording) return;
        clearTimeout(silenceTimer); silenceTimer = null;
        clearTimeout(maxTimer); maxTimer = null;
        const m = takeMic();
        shadow.recording = false;
        const d = current('shadow');
        if (!d) { renderBody(); return; }
        const target = tokenize(d.en);
        const said = tokenize(m && m.text);
        const hits = lcsHits(target.map(x => x.norm), said.map(x => x.norm));
        const matched = hits.filter(Boolean).length;
        shadow.result = {
          metrics: m,
          transcript: (m && m.text) || '',
          hits: hits,
          matched: matched,
          total: target.length,
          score: target.length ? Math.round(matched * 100 / target.length) : 0,
          error: false,
        };
        App.store.log('review');
        renderBody();
        renderStats();
        if (auto && shadow.auto) {
          if (!shadow.result.transcript.trim()) {
            shadow.auto = false;
            shadow.result.error = true;
            renderBody();
          } else {
            nextTimer = setTimeout(() => {
              nextTimer = null;
              if (shadow.auto && tab === 'shadow') go(1);
            }, 2200);
          }
        }
      }

      function startAuto() {
        if (!shadow.auto || tab !== 'shadow' || mic || !supported) return;
        const d = current('shadow');
        if (!d) return;
        clearTimeout(nextTimer); nextTimer = null;
        stopSpeak();
        speak(d.en, () => {
          if (shadow.auto && tab === 'shadow' && !mic) startShadow(true);
        });
      }

      function toggleAuto() {
        if (!supported) return;
        if (shadow.auto) {
          shadow.auto = false;
          clearTimeout(silenceTimer); silenceTimer = null;
          clearTimeout(maxTimer); maxTimer = null;
          clearTimeout(nextTimer); nextTimer = null;
          if (micKind === 'shadow') { takeMic(); shadow.recording = false; }
          stopSpeak();
          renderBody();
        } else {
          shadow.auto = true;
          shadow.result = null;
          renderBody();
          startAuto();
        }
      }

      function listenShadow() {
        if (shadow.auto) { startAuto(); return; }
        if (mic) return;
        const d = current('shadow');
        if (!d) return;
        stopSpeak();
        speak(d.en);
      }

      // ---------- quick Q&A ----------
      function startQA() {
        const d = current('qa');
        if (!d) return;
        stopSpeak();
        qa.phase = 'recording';
        qa.metrics = null;
        qa.remaining = Number(d.seconds) || 60;
        renderBody();
        if (supported) {
          micKind = 'qa';
          try {
            mic = App.speech.start({
              lang: 'en',
              onText(finalText, interim) {
                const el = root.querySelector('.sp-interim');
                if (el) el.textContent = interim || finalText;
              },
              onError(msg) {
                mic = null; micKind = null;
                const el = root.querySelector('.sp-interim');
                if (el) el.innerHTML = '<span class="ai-error">' + esc(msg) + '</span>';
              },
            });
          } catch (e) { mic = null; micKind = null; }
        }
        clearInterval(qTimer);
        qTimer = setInterval(tickQA, 1000);
      }

      function tickQA() {
        if (qa.phase !== 'recording') { clearInterval(qTimer); qTimer = null; return; }
        qa.remaining = Math.max(0, qa.remaining - 1);
        const el = root.querySelector('[data-timer]');
        if (el) {
          el.textContent = fmtTime(qa.remaining);
          el.classList.toggle('warn', qa.remaining <= 10 && qa.remaining > 5);
          el.classList.toggle('bad', qa.remaining <= 5);
        }
        if (qa.remaining <= 0) finishQA();
      }

      function finishQA() {
        if (qa.phase !== 'recording') return;
        clearInterval(qTimer); qTimer = null;
        qa.metrics = takeMic();
        qa.phase = 'done';
        renderBody();
      }

      function listenQA() {
        if (mic) return;
        const d = current('qa');
        if (!d) return;
        stopSpeak();
        speak(d.q);
      }

      // ---------- terminology ----------
      function startTerm() {
        if (mic || !supported) return;
        const d = current('term');
        if (!d) return;
        stopSpeak();
        term.phase = 'recording';
        term.metrics = null;
        term.correct = null;
        renderBody();
        micKind = 'term';
        try {
          mic = App.speech.start({
            lang: 'en',
            onText(finalText, interim) {
              const el = root.querySelector('.sp-interim');
              if (el) el.textContent = interim || finalText;
            },
            onError(msg) {
              mic = null; micKind = null;
              term.phase = 'idle';
              renderBody();
              const el = root.querySelector('.sp-interim');
              if (el) el.innerHTML = '<span class="ai-error">' + esc(msg) + '</span>';
            },
          });
        } catch (e) {
          mic = null; micKind = null; term.phase = 'idle';
          renderBody();
          return;
        }
        clearTimeout(maxTimer);
        maxTimer = setTimeout(() => finishTerm(), 20000);
      }

      function finishTerm() {
        clearTimeout(maxTimer); maxTimer = null;
        if (term.phase !== 'recording') return;
        const d = current('term');
        if (!d) return;
        const m = takeMic();
        term.metrics = m;
        term.correct = containsTerm(m && m.text, d.term);
        term.phase = 'done';
        renderBody();
      }

      function speakTerm(example) {
        if (mic) return;
        const d = current('term');
        if (!d) return;
        stopSpeak();
        if (example) {
          if (d.example) speak(d.example);
        } else if (d.term) {
          playTermAudio(d.term);
        }
      }

      // ---------- shared actions ----------
      function listenCurrent() {
        if (tab === 'shadow') listenShadow();
        else if (tab === 'qa') { if (qa.phase !== 'recording') listenQA(); }
        else speakTerm(false);
      }

      function toggleRecord() {
        if (!supported) return;
        if (tab === 'shadow') {
          if (shadow.recording) finishShadow(false);
          else startShadow(false);
        } else if (tab === 'qa') {
          if (qa.phase === 'recording') finishQA();
          else {
            if (qa.phase === 'done') { qa.phase = 'idle'; qa.metrics = null; }
            startQA();
          }
        } else {
          if (term.phase === 'recording') finishTerm();
          else {
            if (term.phase === 'done') { term.phase = 'idle'; term.metrics = null; term.correct = null; }
            startTerm();
          }
        }
      }

      function go(delta) {
        const arr = listFor(tab);
        if (!arr.length) return;
        cancelAudio();
        idx[tab] = (idx[tab] + delta + arr.length) % arr.length;
        resetItemState(tab);
        renderBody();
        if (tab === 'shadow' && shadow.auto) startAuto();
      }

      function assess(status) {
        const d = current(tab);
        if (!d || ['known', 'review', 'unknown'].indexOf(status) < 0) return;
        App.store.setStatus(d.id, status);
        renderStats();
        renderBody();
      }

      function switchTab(nextTab) {
        if (nextTab === tab || TABS.indexOf(nextTab) < 0) return;
        stopEverything();
        tab = nextTab;
        if (theme !== 'all' && themesFor(tab).indexOf(theme) < 0) theme = 'all';
        resetItemState(tab);
        renderAll();
      }

      function applyFilter(name, value) {
        stopEverything();
        if (name === 'theme') theme = value; else level = value;
        idx[tab] = 0;
        resetItemState(tab);
        renderBody();
      }

      function clearFilters() {
        stopEverything();
        theme = 'all';
        level = 'all';
        idx[tab] = 0;
        resetItemState(tab);
        renderAll();
      }

      // ---------- rendering ----------
      function optionsHTML(items, cur) {
        return items.map(it => '<option value="' + esc(it.v) + '"' + (it.v === cur ? ' selected' : '') + '>' + esc(it.label) + '</option>').join('');
      }

      function statsHTML() {
        const s = stats();
        return '<div class="sp-stats">' +
          '<div class="stat"><span class="num" data-stat="today">' + s.today + '</span><span class="lbl">' + esc(tr('stat.today')) + '</span></div>' +
          '<div class="stat"><span class="num" data-stat="streak">' + s.streak + '</span><span class="lbl">' + esc(tr('stat.streak')) + '</span></div>' +
          '<div class="stat"><span class="num" data-stat="known">' + s.known + '/' + s.total + '</span><span class="lbl">' + esc(tr('stat.known')) + '</span></div>' +
          '</div>';
      }

      function renderStats() {
        const s = stats();
        const set = (key, value) => {
          const el = root.querySelector('[data-stat="' + key + '"]');
          if (el) el.textContent = value;
        };
        set('today', s.today);
        set('streak', s.streak);
        set('known', s.known + '/' + s.total);
      }

      function filtersHTML() {
        const themeItems = [{ v: 'all', label: tr('filter.all') }].concat(themesFor(tab).map(x => ({ v: x, label: themeLabel(x) })));
        const levelItems = [{ v: 'all', label: tr('filter.all') }].concat(['mid', 'senior', 'lead'].map(x => ({ v: x, label: App.LEVELS[x] || x })));
        return '<div class="sp-filters">' +
          '<label class="sp-filter"><span>' + esc(tr('filter.theme')) + '</span><select class="select" data-filter="theme">' + optionsHTML(themeItems, theme) + '</select></label>' +
          '<label class="sp-filter"><span>' + esc(tr('filter.level')) + '</span><select class="select" data-filter="level">' + optionsHTML(levelItems, level) + '</select></label>' +
          '</div>';
      }

      function metaHTML(d) {
        const arr = listFor(tab);
        return '<div class="sp-meta">' +
          (d.theme ? '<span class="badge accent">' + esc(themeLabel(d.theme)) + '</span>' : '') +
          (d.level ? '<span class="badge">' + esc(App.LEVELS[d.level] || d.level) + '</span>' : '') +
          '<span class="sp-pos">' + esc(tr('progress', { i: idx[tab] + 1, n: arr.length })) + '</span>' +
          '</div>';
      }

      function navHTML() {
        const n = listFor(tab).length;
        return '<div class="sp-nav">' +
          '<button type="button" class="btn" data-act="prev"' + (idx[tab] <= 0 ? ' disabled' : '') + '>← ' + esc(tr('prev')) + '</button>' +
          '<button type="button" class="btn primary" data-act="next"' + (n <= 1 ? ' disabled' : '') + '>' + esc(tr('next')) + ' →</button>' +
          '</div>';
      }

      function assessHTML(d, kind) {
        const saved = App.store.getStatus(d.id);
        const opts = kind === 'term'
          ? [['known', tr('term.known'), 'ok'], ['review', tr('term.review'), 'warn']]
          : [['known', tr('qa.good'), 'ok'], ['review', tr('qa.fair'), 'warn'], ['unknown', tr('qa.poor'), 'bad']];
        return '<div class="sp-assess"><h4>' + esc(kind === 'term' ? tr('term.assess') : tr('qa.assess')) + '</h4>' +
          '<div class="row">' + opts.map(o =>
            '<button type="button" class="btn ' + o[2] + (saved === o[0] ? ' is-selected' : '') + '" data-assess="' + o[0] + '"' +
            (saved === o[0] ? ' aria-pressed="true"' : '') + '>' + esc(o[1]) + '</button>').join('') +
          (saved ? '<span class="badge ' + ((App.STATUS[saved] && App.STATUS[saved].cls) || '') + '">' + esc(tr('saved')) + '</span>' : '') +
          '</div><p class="muted small">' + esc(tr('assessHint')) + '</p></div>';
      }

      function shadowDoneHTML(r) {
        const cls = r.score >= 80 ? 'ok' : r.score >= 50 ? 'warn' : 'bad';
        return '<div class="sp-result">' +
          '<div class="row"><span class="sp-score ' + cls + '">' + r.score + '%</span><span>' + esc(tr('shadow.match', { hit: r.matched, total: r.total })) + '</span></div>' +
          (r.metrics ? App.ui.speechStats(r.metrics) : '') +
          '<div class="sp-transcript"><b>' + esc(tr('transcript')) + '</b><p lang="en">' +
          (r.transcript ? esc(r.transcript) : '<span class="muted">—</span>') + '</p></div>' +
          (r.error ? '<p class="muted small">' + esc(tr('shadow.noVoice')) + '</p>' : '') +
          '</div>';
      }

      function shadowHTML(d) {
        const r = shadow.result;
        return '<section class="card sp-stage">' +
          metaHTML(d) +
          '<p class="sp-hint muted small">' + esc(tr('shadow.hint')) + '</p>' +
          '<div class="sp-en" lang="en">' + (r ? markWords(d.en, r.hits) : esc(d.en)) + '</div>' +
          '<div class="sp-meaning"><button type="button" class="link-btn" data-act="toggle-vi" aria-expanded="' + shadow.showVi + '">' +
          esc(shadow.showVi ? tr('hideVi') : tr('showVi')) + '</button>' +
          (shadow.showVi && d.vi ? '<p class="sp-vi" lang="vi">' + esc(d.vi) + '</p>' : '') + '</div>' +
          '<div class="sp-controls">' +
          '<button type="button" class="btn" data-act="listen"' + (hasTTS ? '' : ' disabled') + '>▶ ' + esc(tr('listen')) + '</button>' +
           (hasTTS ? '<label class="sp-rate"><span>' + esc(tr('speed')) + '</span><select class="select" data-rate aria-label="' + esc(tr('speed')) + '">' +
           RATES.map(v => '<option value="' + v + '"' + (v === rate ? ' selected' : '') + '>' + v + '×' + '</option>').join('') + '</select></label>' : '') +
          (supported ? '<button type="button" class="btn mic-btn' + (shadow.recording ? ' recording' : '') + '" data-act="record" aria-label="' +
            esc(shadow.recording ? tr('stopRecord') : tr('record')) + '">' + (shadow.recording ? '⏹ ' + esc(tr('stopRecord')) : '🎤 ' + esc(tr('record'))) + '</button>' : '') +
          (supported ? '<button type="button" class="chip' + (shadow.auto ? ' active' : '') + '" data-act="auto" aria-pressed="' + shadow.auto +
            '" title="' + esc(tr('autoTitle')) + '">🤖 ' + esc(tr('auto')) + '</button>' : '') +
          '</div>' +
          (!supported ? '<p class="muted small">' + esc(tr('noSpeech')) + '</p>' : '') +
          (shadow.recording ? '<p class="sp-rec">' + esc(tr('recording')) + '</p>' : '') +
          '<div class="sp-interim" aria-live="polite"></div>' +
          (r ? shadowDoneHTML(r) : '') +
          assessHTML(d, 'shadow') +
          navHTML() +
          '</section>';
      }

      function phrasesHTML(d, m) {
        const list = Array.isArray(d.phrases) ? d.phrases : [];
        if (!list.length) return '';
        const said = ' ' + wordsOf(m && m.text).join(' ') + ' ';
        return '<div class="sp-phrases"><h4>' + esc(tr('qa.phrases')) + '</h4><div class="chips">' +
          list.map(p => {
            const want = wordsOf(p).join(' ');
            const used = !!want && said.indexOf(' ' + want + ' ') >= 0;
            return '<span class="badge' + (used ? ' ok' : '') + '" title="' + esc(used ? tr('qa.used') : tr('qa.notUsed')) + '">' +
              (used ? '✓' : '○') + ' <span lang="en">' + esc(p) + '</span></span>';
          }).join('') + '</div></div>';
      }

      function qaDoneHTML(d) {
        const m = qa.metrics;
        return '<div class="sp-result">' +
          (m ? App.ui.speechStats(m) : '') +
          '<div class="sp-transcript"><b>' + esc(tr('transcript')) + '</b><p lang="en">' +
          (m && m.text ? esc(m.text) : '<span class="muted">—</span>') + '</p></div>' +
          '<div><h4>' + esc(tr('qa.sample')) + '</h4><p class="sp-sample" lang="en">' + esc(d.sample || '') + '</p></div>' +
          phrasesHTML(d, m) +
          '</div>';
      }

      function qaHTML(d) {
        const done = qa.phase === 'done';
        const recording = qa.phase === 'recording';
        const showText = qa.showQ || done;
        const remaining = qa.remaining || Number(d.seconds) || 60;
        const timerCls = remaining <= 5 ? ' bad' : remaining <= 10 ? ' warn' : '';
        return '<section class="card sp-stage">' +
          metaHTML(d) +
          '<p class="sp-hint muted small">' + esc(tr('qa.hint')) + '</p>' +
          '<div class="sp-qa-question" lang="en">' +
          (showText ? esc(d.q) : '<span class="muted sp-hidden-q">🔊 ' + esc(tr('qa.hidden')) + '</span>') + '</div>' +
          '<div class="sp-controls">' +
          (done ? '' : '<button type="button" class="link-btn" data-act="toggle-q" aria-expanded="' + showText + '">' +
            esc(showText ? tr('hideText') : tr('showText')) + '</button>') +
          '<button type="button" class="btn" data-act="listen"' + (hasTTS ? '' : ' disabled') + '>▶ ' + esc(tr('listenQuestion')) + '</button>' +
          '</div>' +
          '<div class="sp-timer-row"><span class="sp-timer' + timerCls + '" data-timer>' + fmtTime(remaining) + '</span>' +
          (recording
            ? '<button type="button" class="btn bad" data-act="finish-qa">⏹ ' + esc(tr('qa.finish')) + '</button>'
            : '<button type="button" class="btn primary" data-act="start-qa">' + (supported ? '🎤 ' : '') +
              esc(done ? tr('qa.retry') : tr('qa.start')) + '</button>') +
          (!supported ? '<span class="muted small">' + esc(tr('noSpeech')) + '</span>' : '') +
          '</div>' +
          (recording ? '<p class="sp-rec">' + esc(tr('recording')) + '</p>' : '') +
          '<div class="sp-interim" aria-live="polite"></div>' +
          (done ? qaDoneHTML(d) : '') +
          assessHTML(d, 'qa') +
          navHTML() +
          '</section>';
      }

      function termDoneHTML(d) {
        const m = term.metrics;
        return '<div class="sp-result">' +
          '<div class="row">' +
          (term.correct
            ? '<span class="badge ok">✓ ' + esc(tr('term.correct')) + '</span>'
            : '<span class="badge bad">✗ ' + esc(tr('term.incorrect')) + '</span>') +
          '<span class="muted small">' + esc(tr('term.expected', { term: d.term || '' })) + '</span></div>' +
          (m ? App.ui.speechStats(m) : '') +
          '<div class="sp-transcript"><b>' + esc(tr('transcript')) + '</b><p lang="en">' +
          (m && m.text ? esc(m.text) : '<span class="muted">—</span>') + '</p></div>' +
          '</div>';
      }

      function termHTML(d) {
        const recording = term.phase === 'recording';
        const done = term.phase === 'done';
        return '<section class="card sp-stage">' +
          metaHTML(d) +
          '<p class="sp-hint muted small">' + esc(tr('term.hint')) + '</p>' +
          '<div class="sp-term" lang="en">' + esc(d.term || '') + '</div>' +
           (termAudio.term === String(d.term || '').trim() && termAudio.loading ? '<p class="muted small">' + esc(tr('loadingAudio')) + '</p>' : '') +
           (termAudio.term === String(d.term || '').trim() && termAudio.info && termAudio.info.ipa ? '<p class="sp-ipa muted small"><span lang="en">/' + esc(String(termAudio.info.ipa).replace(/^\/+|\/+$/g, '')) + '/</span> <span class="sp-audio-src">' + esc(tr('audioSource')) + '</span></p>' : '') +
          '<dl class="sp-term-info">' +
          '<dt>' + esc(tr('term.say')) + '</dt><dd>' + esc(d.say || '') + '</dd>' +
          '<dt>' + esc(tr('term.wrong')) + '</dt><dd>' + esc(d.wrong || '') + '</dd>' +
          '<dt>' + esc(tr('term.example')) + '</dt><dd lang="en">' + esc(d.example || '') + '</dd>' +
          '</dl>' +
          '<div class="sp-controls">' +
          '<button type="button" class="btn" data-act="listen-term"' + (hasTTS ? '' : ' disabled') + '>▶ ' + esc(tr('listenTerm')) + '</button>' +
          '<button type="button" class="btn" data-act="listen-example"' + (hasTTS ? '' : ' disabled') + '>▶ ' + esc(tr('listenExample')) + '</button>' +
          (supported ? '<button type="button" class="btn mic-btn' + (recording ? ' recording' : '') + '" data-act="record" aria-label="' +
            esc(recording ? tr('stopRecord') : tr('try')) + '">' + (recording ? '⏹ ' + esc(tr('stopRecord')) : '🎤 ' + esc(tr('try'))) + '</button>' : '') +
          '</div>' +
          (!supported ? '<p class="muted small">' + esc(tr('noSpeech')) + '</p>' : '') +
          (recording ? '<p class="sp-rec">' + esc(tr('recording')) + '</p>' : '') +
          '<div class="sp-interim" aria-live="polite"></div>' +
          (done ? termDoneHTML(d) : '') +
          assessHTML(d, 'term') +
          navHTML() +
          '</section>';
      }

      function emptyHTML() {
        return '<div class="card empty sp-empty"><p>' + esc(tr('empty')) + '</p><p class="muted small">' + esc(tr('emptyHint')) + '</p>' +
          (theme !== 'all' || level !== 'all' ? '<div><button type="button" class="btn sm" data-act="clear-filter">' + esc(tr('clearFilter')) + '</button></div>' : '') +
          '</div>';
      }

      function renderBody() {
        const host = root.querySelector('.sp-body');
        if (!host) return;
        const d = current(tab);
        if (!d) { host.innerHTML = emptyHTML(); return; }
        if (tab === 'shadow') host.innerHTML = shadowHTML(d);
        else if (tab === 'qa') host.innerHTML = qaHTML(d);
        else host.innerHTML = termHTML(d);
      }

      function renderAll() {
        root.innerHTML =
          '<div class="page-head">' +
          '<div><h1>' + esc(tr('title')) + '</h1><p>' + esc(tr('subtitle')) + '</p></div>' +
          '<div class="sp-keys muted small" aria-label="' + esc(tr('shortcuts')) + '">' +
          '<span><kbd>Space</kbd> ' + esc(tr('key.listen')) + '</span>' +
          (supported ? '<span><kbd>R</kbd> ' + esc(tr('key.record')) + '</span>' : '') +
          '<span><kbd>N</kbd> ' + esc(tr('key.next')) + '</span>' +
          '</div></div>' +
          statsHTML() +
          '<div class="chips sp-tabs" role="tablist" aria-label="' + esc(tr('tabsAria')) + '">' +
          TABS.map(x => '<button type="button" class="chip' + (tab === x ? ' active' : '') + '" role="tab" aria-selected="' + (tab === x) +
            '" data-tab="' + x + '">' + esc(tr('tab.' + x)) + '</button>').join('') +
          '</div>' +
          filtersHTML() +
          (hasTTS ? '<div class="sp-voice card" style="display:grid;gap:8px;margin-bottom:16px">' +
            '<label class="sp-rate"><span>' + esc(tr('voice')) + '</span><select class="select" data-voice aria-label="' + esc(tr('voice')) + '">' +
            englishVoices().map(function (v) { return '<option value="' + esc(v.name) + '"' + (v.name === (voiceChoice || (englishVoices()[0] && englishVoices()[0].name)) ? ' selected' : '') + '>' + esc(v.name) + ' (' + esc(v.lang) + ')</option>'; }).join('') +
            '</select></label>' +
            '<div><button type="button" class="btn sm" data-act="preview-voice">' + esc(tr('previewVoice')) + '</button></div>' +
            '<p class="muted small">' + esc(tr('voiceHint')) + '</p>' +
            '</div>' : '') +
          '<div class="sp-body"></div>';
        renderBody();
      }

      // ---------- events ----------
      function onClick(e) {
        const tabBtn = e.target.closest('[data-tab]');
        if (tabBtn) { switchTab(tabBtn.dataset.tab); return; }
        const assessBtn = e.target.closest('[data-assess]');
        if (assessBtn) { assess(assessBtn.dataset.assess); return; }
        const actBtn = e.target.closest('[data-act]');
        if (!actBtn) return;
        const act = actBtn.dataset.act;
        if (act === 'listen') listenCurrent();
        else if (act === 'record') toggleRecord();
        else if (act === 'next') go(1);
        else if (act === 'prev') go(-1);
        else if (act === 'toggle-vi') { shadow.showVi = !shadow.showVi; renderBody(); }
        else if (act === 'toggle-q') { qa.showQ = !qa.showQ; renderBody(); }
        else if (act === 'auto') toggleAuto();
        else if (act === 'start-qa') startQA();
        else if (act === 'finish-qa') finishQA();
        else if (act === 'listen-term') speakTerm(false);
        else if (act === 'listen-example') speakTerm(true);
        else if (act === 'clear-filter') clearFilters();
         else if (act === 'preview-voice') speak('Hello, this is a preview of the selected voice.');
      }

      function onChange(e) {
         if (e.target.matches('[data-voice]')) { voiceChoice = e.target.value; try { localStorage.setItem(VOICE_KEY, voiceChoice); } catch (err) { /* storage unavailable */ } return; }
        if (e.target.matches('[data-filter="theme"]')) { applyFilter('theme', e.target.value); return; }
        if (e.target.matches('[data-filter="level"]')) { applyFilter('level', e.target.value); return; }
        if (e.target.matches('[data-rate]')) {
          const v = Number(e.target.value);
          rate = RATES.indexOf(v) >= 0 ? v : 1;
          try { localStorage.setItem(RATE_KEY, String(rate)); } catch (err) { /* storage unavailable */ }
        }
      }

      function onKey(e) {
        if (e.key === 'Escape') {
          if (mic || qa.phase === 'recording' || term.phase === 'recording' || shadow.recording) {
            stopEverything();
            renderBody();
          }
          return;
        }
        const target = e.target;
        if (target && target.closest && target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return;
        if (e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); listenCurrent(); }
        else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); toggleRecord(); }
        else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); go(1); }
      }

      root.addEventListener('click', onClick);
      root.addEventListener('change', onChange);
      const removeKeys = App.onKey(onKey);
      if (hasTTS) { try { window.speechSynthesis.getVoices(); } catch (e) { /* warm up voice list */ } }
       if (hasTTS) {
         const vcHandler = function () { refreshVoiceSelect(); };
         try { window.speechSynthesis.addEventListener('voiceschanged', vcHandler); } catch (e) { /* ignore */ }
         root.__vcHandler = vcHandler;
       }

      renderAll();

      return () => {
        stopEverything();
        root.removeEventListener('click', onClick);
         if (hasTTS && root.__vcHandler) { try { window.speechSynthesis.removeEventListener('voiceschanged', root.__vcHandler); } catch (e) { /* ignore */ } }
        root.removeEventListener('change', onChange);
        removeKeys();
      };
    },
  });
})();
