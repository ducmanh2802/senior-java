/*
 * View "toeic" — TOEIC Speaking & Writing practice (#/toeic), data window.TOEIC (js/data/toeic.js).
 * Modes: free practice per part, mock test (Speaking 11 items / Writing 8 items), summary report.
 * Speaking: preparation countdown → answer countdown (microphone via App.speech, or typing); phases advance
 *   on their own. s3/s4 prompts are read aloud with speechSynthesis (en-US) while the text stays on screen.
 * Writing: textarea + per-part countdown clock + word count.
 * AI grading only on an explicit button press: App.ai.grade({lang:'en', topic:'toeic', reference = sample +
 *   the part criteria}), rendered with App.ui.feedback; waiting state <span class="ai-loading">.
 * Format / timing table and field schema: see the header of js/data/toeic.js.
 */
(function () {
  'use strict';

  /* prep / answer / secs tính bằng giây; last = thời gian trả lời của câu cuối (s3, s4). */
  const PARTS = {
    s1: { name: 'Read a text aloud', qs: 'Q1–Q2', icon: '🔊', skill: 'speaking', prep: 45, answer: 45, scale: '0–3' },
    s2: { name: 'Describe a picture', qs: 'Q3–Q4', icon: '🖼️', skill: 'speaking', prep: 45, answer: 30, scale: '0–3' },
    s3: { name: 'Respond to questions', qs: 'Q5–Q7', icon: '💬', skill: 'speaking', prep: 3, answer: 15, last: 30, scale: '0–3', tts: true },
    s4: { name: 'Respond using information provided', qs: 'Q8–Q10', icon: '📋', skill: 'speaking', prep: 0, read: 45, answer: 15, last: 30, scale: '0–3', tts: true },
    s5: { name: 'Express an opinion', qs: 'Q11', icon: '🎯', skill: 'speaking', prep: 45, answer: 60, scale: '0–5' },
    w1: { name: 'Write a sentence based on a picture', qs: 'Q1–Q5', icon: '✍️', skill: 'writing', secs: 480, scale: '0–3' },
    w2: { name: 'Respond to a written request', qs: 'Q6–Q7', icon: '📧', skill: 'writing', secs: 600, scale: '0–4' },
    w3: { name: 'Write an opinion essay', qs: 'Q8', icon: '📄', skill: 'writing', secs: 1800, scale: '0–5' },
  };
  const SPEAKING = ['s1', 's2', 's3', 's4', 's5'];
  const WRITING = ['w1', 'w2', 'w3'];
  const SHAPE = {
    speaking: { s1: 2, s2: 2, s3: 1, s4: 1, s5: 1 },
    writing: { w1: 5, w2: 2, w3: 1 },
  };
  const MOCK_MINS = { speaking: 20, writing: 60, full: 80 };
  const MOCK_COUNT = { speaking: 11, writing: 8, full: 19 };
  const WORDS_TARGET = { s5: 110, w2: 80, w3: 300 };

  /* Tiêu chí chấm gửi kèm reference (mô tả thang 0–5 của ETS cho từng part). */
  const CRITERIA = {
    s1: 'TOEIC Speaking Q1–2, read a text aloud, scale 0–3. Look for: correct pronunciation of every word, sentence stress and intonation, clear numbers/dates/names, natural pausing, no dropped word endings.',
    s2: 'TOEIC Speaking Q3–4, describe a picture, scale 0–3. Look for: present tenses and prepositions of place, an organised description (foreground to background), a few precise details rather than a list, one reasonable speculation (may/might/seems).',
    s3: 'TOEIC Speaking Q5–7, respond to questions, scale 0–3. Look for: answers that stay on the question, correct grammar and vocabulary, enough development in the 15-second and the 30-second answers, natural delivery.',
    s4: 'TOEIC Speaking Q8–10, respond using information provided, scale 0–3. Look for: information taken only from the document, accurate numbers/times/places, every requested point covered, clear organisation.',
    s5: 'TOEIC Speaking Q11, express an opinion, scale 0–5. Look for: a clear opinion at the start, two reasons supported with examples, a balanced view or a small concession, good range of grammar and vocabulary, strong organisation.',
    w1: 'TOEIC Writing Q1–5, write a sentence based on a picture, scale 0–3. Look for: ONE complete grammatical English sentence, both given words used correctly, the sentence matching the picture, capital letter and full stop.',
    w2: 'TOEIC Writing Q6–7, respond to a written request, scale 0–4. Look for: an e-mail that answers the request, asks the required questions and makes the required request, correct register, grammar, vocabulary and paragraphing.',
    w3: 'TOEIC Writing Q8, write an opinion essay, scale 0–5. Look for: a clear thesis, reasons supported with examples, logical organisation, range of grammar and vocabulary, standard paragraphing, about 300 words.',
  };

  App.i18n.add({
    vi: {
      'toeic.title': 'TOEIC Speaking & Writing',
      'toeic.sub': 'Luyện 11 câu Speaking và 8 câu Writing đúng format ETS/IIBC: giờ chuẩn bị, giờ trả lời, micro hoặc gõ phím, AI chấm theo tiêu chí từng part.',
      'toeic.homeBtn': '← Trang chính',
      'toeic.mockSpeaking': '🎤 Thi thử Speaking',
      'toeic.mockWriting': '✍️ Thi thử Writing',
      'toeic.mockFull': '🎯 Thi thử đầy đủ',
      'toeic.mockSpeakingDesc': '11 câu đúng thứ tự Q1–Q11, mỗi câu có giờ chuẩn bị và giờ trả lời riêng, tự chuyển pha. Khoảng {m} phút.',
      'toeic.mockWritingDesc': '8 câu Q1–Q8, có đồng hồ đếm ngược cho từng phần. Khoảng {m} phút.',
      'toeic.mockFullDesc': 'Speaking 11 câu rồi Writing 8 câu; hết Speaking tự sang Writing. Khoảng {m} phút.',
      'toeic.partSpeaking': 'Speaking',
      'toeic.partWriting': 'Writing',
      'toeic.partSpeakingDesc': '5 part, 11 câu, khoảng 20 phút. Nói vào micro (hoặc gõ) trong đúng thời gian quy định, rồi nhờ AI chấm theo tiêu chí ETS.',
      'toeic.partWritingDesc': '3 part, 8 câu, khoảng 60 phút. Gõ câu trả lời, theo dõi số từ và đồng hồ, rồi nhờ AI chấm.',
      'toeic.items': '{n} bài luyện',
      'toeic.practicePart': 'Luyện part này',
      'toeic.format': 'Format & thời gian',
      'toeic.colPart': 'Part',
      'toeic.colQuestions': 'Câu',
      'toeic.colPrep': 'Chuẩn bị',
      'toeic.colAnswer': 'Trả lời',
      'toeic.colScale': 'Thang',
      'toeic.prepRead': '{s} đọc',
      'toeic.perQuestion': '{a}s / {b}s',
      'toeic.perQuestionPlain': '{a}s mỗi câu',
      'toeic.minutes': '{s} phút',
      'toeic.w1Clock': '{s} cho cả 5 câu',
      'toeic.formatNote': 'Số liệu theo ETS/IIBC. s3: 15 giây cho câu 1–2, 30 giây cho câu 3. s4: 45 giây đọc thông tin trước khi trả lời.',
      'toeic.keys': 'Phím tắt',
      'toeic.keyPractice': '{k} luyện part',
      'toeic.keyMock': '{k} thi thử Speaking',
      'toeic.keyFormat': '{k} bảng format',
      'toeic.step': 'Câu {i}/{n}',
      'toeic.stepMeta': 'Bài {i}/{n} · câu {j}/{m}',
      'toeic.mockBadge': 'Thi thử · {mode}',
      'toeic.modeSpeaking': 'Speaking',
      'toeic.modeWriting': 'Writing',
      'toeic.tipsTitle': '💡 Mẹo cho part này',
      'toeic.sceneTitle': 'Ảnh (mô tả)',
      'toeic.infoTitle': 'Thông tin cho câu hỏi',
      'toeic.readAloud': 'Đọc to đoạn sau',
      'toeic.question': 'Câu hỏi',
      'toeic.task': 'Yêu cầu',
      'toeic.email': 'E-mail nhận được',
      'toeic.prompt': 'Đề bài',
      'toeic.outline': 'Dàn ý gợi ý',
      'toeic.wordsGivenTitle': 'Hai từ cho sẵn',
      'toeic.wordsHint': 'Chỉ viết MỘT câu tiếng Anh, dùng đúng cả hai từ này và đúng với ảnh.',
      'toeic.stressTitle': 'Nhấn và ngắt hơi',
      'toeic.phasePrep': 'Chuẩn bị',
      'toeic.phaseReadInfo': 'Đọc thông tin',
      'toeic.phaseAnswer': 'Trả lời',
      'toeic.phaseWriting': 'Viết',
      'toeic.phaseDone': 'Hết giờ',
      'toeic.timeUpNote': 'Hết giờ — nội dung vẫn được giữ để chấm.',
      'toeic.prepHint': 'Ghi chú nhanh ý chính trong lúc chờ. Micro chỉ bật ở pha trả lời.',
      'toeic.readInfoHint': 'Đọc kỹ thông tin; hết giờ tự chuyển sang câu hỏi đầu tiên.',
      'toeic.answerHint': 'Nói vào micro (hoặc gõ vào ô bên dưới). Hết giờ, phần chấm và bài mẫu mở ra.',
      'toeic.writingHint': 'Gõ câu trả lời. Hết giờ, nội dung vẫn được giữ để bạn chấm và so với bài mẫu.',
      'toeic.startPrep': '▶ Bắt đầu chuẩn bị',
      'toeic.startAnswer': '🎤 Bắt đầu trả lời',
      'toeic.startWriting': '✍️ Bắt đầu viết',
      'toeic.stop': '⏹ Dừng',
      'toeic.skipWait': 'Bỏ qua chờ ⏭',
      'toeic.endPhase': 'Kết thúc pha này ⏭',
      'toeic.listen': '🔊 Nghe câu hỏi',
      'toeic.listenText': '🔊 Nghe đoạn văn',
      'toeic.ttsUnavailable': 'Trình duyệt không đọc được thành tiếng — nội dung vẫn hiện đầy đủ bên dưới.',
      'toeic.noSpeech': 'Trình duyệt không nhận dạng giọng nói — hãy gõ câu trả lời vào ô bên dưới (dùng Chrome/Edge để nói).',
      'toeic.recording': 'Đang ghi âm…',
      'toeic.speakingBox': 'Câu trả lời (nói hoặc gõ)',
      'toeic.speakingPh': 'Nói vào micro, hoặc gõ câu trả lời tiếng Anh ở đây…',
      'toeic.writingPh': 'Gõ câu trả lời tiếng Anh ở đây…',
      'toeic.wordCount': '{n} từ',
      'toeic.wordCountTarget': '{n} từ · nên đạt {t}+',
      'toeic.timeLeft': 'Còn lại',
      'toeic.elapsed': 'Đã dùng',
      'toeic.aiGrade': 'AI chấm',
      'toeic.aiRetry': 'Chấm lại',
      'toeic.aiWait': 'AI đang chấm…',
      'toeic.aiNeedAnswer': 'Hãy nói hoặc viết câu trả lời trước khi chấm.',
      'toeic.aiNote': 'AI chấm theo thang 1–5, đối chiếu bài mẫu và tiêu chí của part. Mỗi lần bấm tốn 1 lượt hạn mức AI.',
      'toeic.showSample': 'Xem bài mẫu',
      'toeic.hideSample': 'Ẩn bài mẫu',
      'toeic.sampleTitle': 'Bài mẫu & mẹo',
      'toeic.sampleAnswer': 'Bài mẫu',
      'toeic.answerLabel': 'Câu trả lời của bạn',
      'toeic.transcript': 'Máy nghe được',
      'toeic.prev': '← Trước',
      'toeic.next': 'Tiếp →',
      'toeic.finish': 'Tổng kết',
      'toeic.done': '✓ Đã luyện',
      'toeic.doneBadge': '✓ Đã luyện',
      'toeic.retry': '↺ Làm lại câu này',
      'toeic.resetWait': 'Bạn đang làm dở. Về trang chính?',
      'toeic.reportTitle': 'Tổng kết bài luyện',
      'toeic.reportSub': 'Điểm AI dự kiến (thang 5) cho từng câu. TOEIC thật quy đổi theo thang riêng của ETS; đây chỉ là ước lượng để theo dõi tiến bộ.',
      'toeic.avgScore': 'Điểm trung bình',
      'toeic.reportCol': 'Câu',
      'toeic.reportScore': 'AI',
      'toeic.reportAns': 'Trả lời',
      'toeic.reportEmpty': 'chưa chấm',
      'toeic.reportNoScore': '—',
      'toeic.reportHint': 'Muốn điểm sát hơn, hãy chấm từng câu trước khi tổng kết. Các câu đã chấm được giữ lại trong lúc bạn làm bài.',
      'toeic.reviewItem': 'Ôn lại câu này',
      'toeic.backHome': '← Trang chính',
      'toeic.practiceAgain': 'Luyện lại',
      'toeic.notFound': 'Không tìm thấy part này.',
    },
    en: {
      'toeic.title': 'TOEIC Speaking & Writing',
      'toeic.sub': 'Practise the 11 Speaking and 8 Writing tasks in the real ETS/IIBC format: prep and answer timers, mic or typing, AI grading per part criteria.',
      'toeic.homeBtn': '← Home',
      'toeic.mockSpeaking': '🎤 Speaking mock',
      'toeic.mockWriting': '✍️ Writing mock',
      'toeic.mockFull': '🎯 Full mock test',
      'toeic.mockSpeakingDesc': '11 items in Q1–Q11 order, each with its own prep and answer timer, phases advance by themselves. About {m} min.',
      'toeic.mockWritingDesc': '8 items Q1–Q8 with a countdown clock for each section. About {m} min.',
      'toeic.mockFullDesc': 'Speaking 11 items, then Writing 8 items; finishing Speaking moves you to Writing. About {m} min.',
      'toeic.partSpeaking': 'Speaking',
      'toeic.partWriting': 'Writing',
      'toeic.partSpeakingDesc': '5 parts, 11 questions, about 20 minutes. Speak into the mic (or type) within the official time, then ask AI to grade against the ETS criteria.',
      'toeic.partWritingDesc': '3 parts, 8 questions, about 60 minutes. Type your answer, watch the word count and the clock, then ask AI to grade.',
      'toeic.items': '{n} drills',
      'toeic.practicePart': 'Practise this part',
      'toeic.format': 'Format & timing',
      'toeic.colPart': 'Part',
      'toeic.colQuestions': 'Questions',
      'toeic.colPrep': 'Prep',
      'toeic.colAnswer': 'Answer',
      'toeic.colScale': 'Scale',
      'toeic.prepRead': '{s} read',
      'toeic.perQuestion': '{a}s / {b}s',
      'toeic.perQuestionPlain': '{a}s each',
      'toeic.minutes': '{s} min',
      'toeic.w1Clock': '{s} for all 5 items',
      'toeic.formatNote': 'Figures follow ETS/IIBC. s3: 15 seconds for Q1–2, 30 seconds for Q3. s4: 45 seconds to read the information before answering.',
      'toeic.keys': 'Shortcuts',
      'toeic.keyPractice': '{k} practise part',
      'toeic.keyMock': '{k} Speaking mock',
      'toeic.keyFormat': '{k} format table',
      'toeic.step': 'Item {i}/{n}',
      'toeic.stepMeta': 'Set {i}/{n} · question {j}/{m}',
      'toeic.mockBadge': 'Mock · {mode}',
      'toeic.modeSpeaking': 'Speaking',
      'toeic.modeWriting': 'Writing',
      'toeic.tipsTitle': '💡 Tips for this part',
      'toeic.sceneTitle': 'Picture (description)',
      'toeic.infoTitle': 'Information for the questions',
      'toeic.readAloud': 'Read the text aloud',
      'toeic.question': 'Question',
      'toeic.task': 'Task',
      'toeic.email': 'E-mail received',
      'toeic.prompt': 'Prompt',
      'toeic.outline': 'Suggested outline',
      'toeic.wordsGivenTitle': 'Two given words',
      'toeic.wordsHint': 'Write ONE English sentence that uses both words and matches the picture.',
      'toeic.stressTitle': 'Stress and pausing',
      'toeic.phasePrep': 'Preparation',
      'toeic.phaseReadInfo': 'Read the information',
      'toeic.phaseAnswer': 'Answer',
      'toeic.phaseWriting': 'Writing',
      'toeic.phaseDone': 'Time is up',
      'toeic.timeUpNote': 'Time is up — your text is kept for grading.',
      'toeic.prepHint': 'Jot down your main points while you wait. The mic only opens in the answer phase.',
      'toeic.readInfoHint': 'Read the information carefully; when the time is up the first question opens automatically.',
      'toeic.answerHint': 'Speak into the mic (or type below). When the timer ends, grading and the sample open.',
      'toeic.writingHint': 'Type your answer. When the timer ends, your text is kept for grading and for the sample comparison.',
      'toeic.startPrep': '▶ Start preparation',
      'toeic.startAnswer': '🎤 Start answering',
      'toeic.startWriting': '✍️ Start writing',
      'toeic.stop': '⏹ Stop',
      'toeic.skipWait': 'Skip the wait ⏭',
      'toeic.endPhase': 'End this phase ⏭',
      'toeic.listen': '🔊 Hear the question',
      'toeic.listenText': '🔊 Hear the text',
      'toeic.ttsUnavailable': 'This browser cannot read text aloud — the content is shown in full below.',
      'toeic.noSpeech': 'This browser does not support speech recognition — type your answer below (use Chrome/Edge to speak).',
      'toeic.recording': 'Recording…',
      'toeic.speakingBox': 'Your answer (speak or type)',
      'toeic.speakingPh': 'Speak into the mic, or type your English answer here…',
      'toeic.writingPh': 'Type your English answer here…',
      'toeic.wordCount': '{n} words',
      'toeic.wordCountTarget': '{n} words · target {t}+',
      'toeic.timeLeft': 'Left',
      'toeic.elapsed': 'Elapsed',
      'toeic.aiGrade': 'AI grade',
      'toeic.aiRetry': 'Grade again',
      'toeic.aiWait': 'AI is grading…',
      'toeic.aiNeedAnswer': 'Speak or write your answer before grading.',
      'toeic.aiNote': 'AI grades on a 1–5 scale against the sample answer and the part criteria. Each press costs one AI quota unit.',
      'toeic.showSample': 'Show sample',
      'toeic.hideSample': 'Hide sample',
      'toeic.sampleTitle': 'Sample answers & tips',
      'toeic.sampleAnswer': 'Sample',
      'toeic.answerLabel': 'Your answer',
      'toeic.transcript': 'Recognised text',
      'toeic.prev': '← Previous',
      'toeic.next': 'Next →',
      'toeic.finish': 'Summary',
      'toeic.done': '✓ Practised',
      'toeic.doneBadge': '✓ Practised',
      'toeic.retry': '↺ Try this item again',
      'toeic.resetWait': 'You have work in progress. Leave for the home page?',
      'toeic.reportTitle': 'Practice summary',
      'toeic.reportSub': 'Estimated AI score (out of 5) per item. The real TOEIC converts raw scores on its own scale; this is only a progress estimate.',
      'toeic.avgScore': 'Average score',
      'toeic.reportCol': 'Item',
      'toeic.reportScore': 'AI',
      'toeic.reportAns': 'Answer',
      'toeic.reportEmpty': 'not graded',
      'toeic.reportNoScore': '—',
      'toeic.reportHint': 'For a more reliable score, grade each item before the summary. Graded items are kept while you work.',
      'toeic.reviewItem': 'Review this item',
      'toeic.backHome': '← Home',
      'toeic.practiceAgain': 'Practise again',
      'toeic.notFound': 'Part not found.',
    },
  });

  const esc = App.esc;
  const t = (k, v) => App.t('toeic.' + k, v);
  const cfg = p => PARTS[p] || PARTS.s1;
  const byPart = p => (window.TOEIC || []).filter(x => x.part === p);
  const speakItems = () => SPEAKING.reduce((n, p) => n + byPart(p).length, 0);
  const writeItems = () => WRITING.reduce((n, p) => n + byPart(p).length, 0);

  function fmt(sec) {
    const n = Math.max(0, Math.round(Number(sec) || 0));
    return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
  }
  function countWords(s) {
    return String(s || '').trim().split(/\s+/).filter(Boolean).length;
  }

  /* ---------- text to speech (en-US) ---------- */
  const hasTTS = () => typeof window !== 'undefined' && 'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined';

  function pickVoice() {
    if (!hasTTS()) return null;
    try {
      const list = (window.speechSynthesis.getVoices() || []).filter(v => /^en/i.test(v.lang || ''));
      const score = v => (/^en[-_]US/i.test(v.lang || '') ? 4 : /^en[-_]GB/i.test(v.lang || '') ? 2 : 1) +
        (/Natural|Neural|Google US English|Samantha|Aria|Jenny|Guy/i.test(v.name || '') ? 8 : 0);
      list.sort((a, b) => score(b) - score(a));
      return list[0] || null;
    } catch (e) { return null; }
  }
  function speak(text) {
    if (!hasTTS()) return false;
    const str = String(text || '').trim();
    if (!str) return false;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(str);
      const v = pickVoice();
      if (v) { u.voice = v; u.lang = v.lang || 'en-US'; } else { u.lang = 'en-US'; }
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { return false; }
  }
  function hush() {
    if (!hasTTS()) return;
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  }

  App.registerView('toeic', {
    get title() { return App.t('toeic.title'); },
    render(root) {
      /* ---------- state ---------- */
      let mode = 'home';           // home | drill | mock | report
      let mockMode = 'speaking';   // speaking | writing | full  (chỉ khi mode = mock)
      let list = [];               // các item của lượt luyện
      let idx = 0;
      let qIdx = 0;                // chỉ số câu đang trả lời trong item s3/s4 (0-based)
      let phase = 'ready';         // speaking: ready | readInfo | prep | answer | done · writing: ready | writing | done
      let remaining = 0;           // giây còn lại của pha đang chạy
      let phaseTotal = 0;          // tổng số giây của pha đang chạy (vẽ thanh)
      let startedAt = 0;           // mốc bắt đầu phần Writing (đồng hồ tính từ đầu part)
      let clockElapsed = 0;        // tổng giây đã trôi qua trong pha hiện tại
      let ticker = null;
      let mic = null;              // handle App.speech.start()
      let micKey = null;           // 'speak' — ô nhập đang được micro ghi vào
      let answers = {};            // id -> câu trả lời
      let metrics = {};            // id -> số liệu lần nói gần nhất
      let grades = {};             // id -> kết quả AI
      let gradeErr = {};           // id -> lỗi AI (message hiển thị)
      let busy = {};               // id -> đang gọi AI
      let samplesOpen = {};        // id -> đang mở bài mẫu
      let gen = 0;                 // generation: chặn callback async sau khi rời view
      let toastTimer = null;

      const item = () => list[idx] || null;
      const part = () => (item() ? item().part : 's1');
      const isSpeak = () => cfg(part()).skill === 'speaking';
      const answerOf = id => answers[id] || '';

      /* ---------- bốc đề ---------- */
      function takeSome(p, n) {
        const pool = App.shuffle(byPart(p));
        return n && n > 1 ? pool.slice(0, Math.min(n, pool.length)) : pool.slice(0, 1);
      }
      function buildSet(which) {
        const shape = SHAPE[which] || SHAPE.speaking;
        const out = [];
        Object.keys(shape).forEach(p => takeSome(p, shape[p]).forEach(x => out.push(x)));
        return out;
      }
      /** Item s3/s4: một item chứa 3 câu trả lời liên tiếp (15s/15s/30s). */
      function isGroupItem(it) {
        const p = cfg(it.part);
        return !!(p.perQuestion || p.last) && (it.questions || []).length > 1;
      }

      /* ---------- đồng hồ ---------- */
      function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }
      function startTicker() { stopTicker(); ticker = setInterval(tick, 1000); }

      function paintClock(sec, totalSec) {
        remaining = Math.max(0, Math.round(sec));
        phaseTotal = Math.max(phaseTotal, totalSec);
        const el = root.querySelector('[data-clock]');
        if (el) {
          el.textContent = fmt(remaining);
          el.classList.toggle('warn', remaining <= 10 && remaining > 5);
          el.classList.toggle('bad', remaining <= 5);
        }
        const bar = root.querySelector('[data-clock-bar]');
        if (bar && phaseTotal) bar.style.width = Math.max(0, Math.min(100, remaining / phaseTotal * 100)) + '%';
      }

      function tick() {
        if (phase === 'prep' || phase === 'readInfo') {
          clockElapsed += 1;
          paintClock(remaining - 1, phaseTotal);
          if (remaining <= 0) enterAnswer();
        } else if (phase === 'answer') {
          clockElapsed += 1;
          paintClock(remaining - 1, phaseTotal);
          if (remaining <= 0) finishSpeaking();
        } else if (phase === 'writing') {
          const left = Math.max(0, Math.round((startedAt + cfg(part()).secs * 1000 - Date.now()) / 1000));
          paintClock(left, cfg(part()).secs);
          const el = root.querySelector('[data-elapsed]');
          if (el) el.textContent = fmt(Math.round((Date.now() - startedAt) / 1000));
          if (left <= 0) endWriting();
        }
      }

      /* ---------- vòng đời item ---------- */
      function clearTimersAndMic() {
        stopTicker();
        stopMic(true);
        hush();
      }

      function resetItem() {
        clearTimersAndMic();
        phase = 'ready';
        qIdx = 0;
        remaining = 0;
        phaseTotal = 0;
        clockElapsed = 0;
      }

      /** Bắt đầu pha chuẩn bị (hoặc đọc thông tin) của item Speaking hiện tại. */
      function enterPrep() {
        const c = cfg(part());
        hush();
        const first = c.read || c.prep;
        if (!first) { enterAnswer(); return; }
        phase = c.read ? 'readInfo' : 'prep';
        clockElapsed = 0;
        paintClock(first, first);
        startTicker();
        const it = item();
        if (c.tts && it) {
          const text = c.read && it.info
            ? it.info + '\n' + (it.questions || []).join('\n')
            : (it.questions || []).join('\n');
          speak(text);
        }
        render();
      }

      /** Bắt đầu pha trả lời của item Speaking hiện tại (bật micro nếu trình duyệt hỗ trợ). */
      function enterAnswer() {
        const it = item();
        if (!it) return;
        const c = cfg(part());
        hush();
        phase = 'answer';
        clockElapsed = 0;
        let secs = c.answer;
        if (isGroupItem(it)) secs = qIdx === (it.questions.length - 1) ? c.last : c.answer;
        paintClock(secs, secs);
        startTicker();
        startMic();
        render();
      }

      function finishSpeaking() {
        if (phase !== 'answer') return;
        stopTicker();
        stopMic(true);
        const it = item();
        if (it && isGroupItem(it) && qIdx < it.questions.length - 1) {
          qIdx += 1;
          enterPrep();
          return;
        }
        phase = 'done';
        if (it) App.store.log('review');
        render();
      }

      function enterWriting() {
        const c = cfg(part());
        hush();
        phase = 'writing';
        clockElapsed = 0;
        startedAt = Date.now();
        paintClock(c.secs, c.secs);
        startTicker();
        render();
      }

      function endWriting() {
        if (phase !== 'writing') return;
        stopTicker();
        phase = 'done';
        const it = item();
        if (it) App.store.log('review');
        toast(t('timeUpNote'));
        render();
      }

      function toast(msg) {
        const el = root.querySelector('[data-toast]');
        if (!el || !msg) return;
        el.textContent = msg;
        el.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.hidden = true; }, 4000);
      }

      /* ---------- micro ---------- */
      function stopMic(quiet) {
        const h = mic;
        mic = null;
        const key = micKey;
        micKey = null;
        if (h) {
          let m = null;
          try { m = h.stop(); } catch (e) { m = null; }
          const it = item();
          if (m && it) {
            metrics[it.id] = m;
            if (m.text) {
              const cur = (answers[it.id] || '').trim();
              answers[it.id] = cur ? (cur + ' ' + m.text).trim() : m.text;
              const ta = root.querySelector('[data-input="' + it.id + '"]');
              if (ta) ta.value = answers[it.id];
              paintCount(it.id);
            }
          }
        }
        if (!quiet) {
          const rec = root.querySelector('[data-rec]');
          if (rec) rec.hidden = true;
          const btn = root.querySelector('.mic-btn');
          if (btn) btn.classList.remove('recording');
        }
        return key;
      }

      function startMic() {
        if (!App.speech.supported || mic) return;
        const it = item();
        if (!it) return;
        micKey = 'speak';
        try {
          mic = App.speech.start({
            lang: 'en',
            onText(finalText, interim) {
              const ta = root.querySelector('[data-input="' + it.id + '"]');
              if (!ta) return;
              const said = (finalText || '') + (interim ? (finalText ? ' ' : '') + interim : '');
              ta.value = (said || '').trim();
              answers[it.id] = ta.value;
              paintCount(it.id);
            },
            onError(msg) {
              mic = null;
              micKey = null;
              const box = root.querySelector('[data-speech-err]');
              if (box) box.innerHTML = '<div class="ai-error">' + esc(msg) + '</div>';
            },
          });
        } catch (e) { mic = null; micKey = null; }
        const btn = root.querySelector('.mic-btn');
        if (btn) btn.classList.add('recording');
        const rec = root.querySelector('[data-rec]');
        if (rec) rec.hidden = false;
      }

      function toggleMic() {
        if (mic) { stopMic(); render(); return; }
        startMic();
      }

      /* ---------- điều hướng ---------- */
      function clearWork() {
        answers = {};
        metrics = {};
        grades = {};
        gradeErr = {};
        busy = {};
      }

      function startDrill(p) {
        mode = 'drill';
        mockMode = null;
        list = byPart(p).slice();
        idx = 0;
        clearWork();
        resetItem();
        if (cfg(p).skill === 'speaking') enterPrep(); else enterWriting();
      }

      function startMock(which) {
        mode = 'mock';
        mockMode = which;
        list = buildSet(which === 'writing' ? 'writing' : 'speaking');
        idx = 0;
        clearWork();
        resetItem();
        enterPrep();
      }

      function startFullMock() {
        mode = 'mock';
        mockMode = 'full';
        list = buildSet('speaking').concat(buildSet('writing'));
        idx = 0;
        clearWork();
        resetItem();
        enterPrep();
      }

      function goHome() {
        if (mode !== 'home' && (Object.keys(answers).length || Object.keys(grades).length) &&
          typeof confirm === 'function' && !confirm(t('resetWait'))) return;
        mode = 'home';
        mockMode = null;
        list = [];
        idx = 0;
        clearWork();
        resetItem();
        render();
      }

      function goto(i) {
        if (i < 0 || i >= list.length) return;
        idx = i;
        resetItem();
        if (cfg(part()).skill === 'speaking') enterPrep(); else enterWriting();
      }

      function nextItem() {
        if (idx + 1 < list.length) { goto(idx + 1); return; }
        showReport();
      }

      function showReport() {
        clearTimersAndMic();
        mode = 'report';
        resetItem();
        render();
      }

      function retryItem() {
        const it = item();
        if (!it) return;
        delete answers[it.id];
        delete metrics[it.id];
        delete grades[it.id];
        delete gradeErr[it.id];
        resetItem();
        if (cfg(it.part).skill === 'speaking') enterPrep(); else enterWriting();
      }

      function markDone() {
        const it = item();
        if (!it) return;
        App.store.setStatus(it.id, 'known');
        render();
      }

      /* ---------- AI ---------- */
      function promptOf(it) {
        switch (it.part) {
          case 's1': return 'Read this text aloud: ' + (it.text || '');
          case 's2': return 'Describe this picture: ' + (it.scene || '');
          case 's3': return (it.context ? it.context + ' ' : '') + (it.questions || []).join(' ');
          case 's4': return (it.info ? it.info + '\n' : '') + (it.questions || []).join(' ');
          case 's5': return it.prompt || '';
          case 'w1': return 'Write ONE sentence using both given words (' + (it.words || []).join(', ') +
            ') that matches this picture: ' + (it.scene || '');
          case 'w2': return (it.email ? it.email + '\n' : '') + 'Task: ' + (it.task || '');
          default: return it.prompt || '';
        }
      }

      function referenceOf(it) {
        const parts = [];
        if (it.part === 's1') parts.push('Text to read aloud: ' + (it.text || ''));
        if (it.part === 's2') parts.push('Picture: ' + (it.scene || '') + '\nSample answer: ' + (it.sample || ''));
        if (it.part === 's3') parts.push('Context: ' + (it.context || '') + '\nQuestions: ' + (it.questions || []).join(' | ') +
          '\nSample answers: ' + (it.samples || []).join(' | '));
        if (it.part === 's4') parts.push('Information: ' + (it.info || '') + '\nQuestions: ' + (it.questions || []).join(' | ') +
          '\nSample answers: ' + (it.samples || []).join(' | '));
        if (it.part === 's5') parts.push('Prompt: ' + (it.prompt || '') + '\nSample answer: ' + (it.sample || ''));
        if (it.part === 'w1') parts.push('Picture: ' + (it.scene || '') + '\nGiven words: ' + (it.words || []).join(', ') +
          '\nSample sentence: ' + (it.sample || ''));
        if (it.part === 'w2') parts.push('E-mail: ' + (it.email || '') + '\nTask: ' + (it.task || '') + '\nSample reply: ' + (it.sample || ''));
        if (it.part === 'w3') parts.push('Prompt: ' + (it.prompt || '') + '\nOutline: ' + (it.outline || []).join(' | ') +
          '\nSample essay: ' + (it.sample || ''));
        parts.push('Grading criteria: ' + (CRITERIA[it.part] || ''));
        return parts.join('\n\n');
      }

      async function gradeCurrent() {
        const it = item();
        if (!it || busy[it.id]) return;
        const ans = answerOf(it.id).trim();
        if (!ans) { gradeErr[it.id] = t('aiNeedAnswer'); render(); return; }
        busy[it.id] = true;
        gradeErr[it.id] = null;
        render();
        const my = gen;
        try {
          const res = await App.ai.grade({
            question: promptOf(it),
            reference: referenceOf(it),
            answer: ans,
            lang: 'en',
            topic: 'toeic',
            level: 'mid',
            speech: metrics[it.id] || undefined,
          });
          if (my !== gen) return;
          grades[it.id] = res;
          delete gradeErr[it.id];
        } catch (e) {
          if (my !== gen) return;
          gradeErr[it.id] = e;
        } finally {
          if (my === gen) { delete busy[it.id]; render(); }
        }
      }

      /* ---------- render helpers ---------- */
      function countLabel(it) {
        const n = countWords(answerOf(it.id));
        const target = WORDS_TARGET[it.part] || 0;
        if (!target) return t('wordCount', { n: n });
        return t('wordCountTarget', { n: n, t: target });
      }
      function countCls(it) {
        const n = countWords(answerOf(it.id));
        const target = WORDS_TARGET[it.part] || 0;
        if (!n) return 'muted';
        if (!target) return '';
        return n >= target ? 'ok' : 'warn';
      }
      function paintCount(id) {
        const it = list.filter(x => x.id === id)[0];
        const el = root.querySelector('[data-count="' + id + '"]');
        if (!it || !el) return;
        const target = WORDS_TARGET[it.part] || 0;
        const n = countWords(answerOf(id));
        el.textContent = countLabel(it);
        el.className = 'tw-count ' + countCls(it);
        el.classList.toggle('tw-ok', !!target && n >= target);
      }

      function tipList(it) {
        const tips = it.tips || [];
        if (!tips.length) return '';
        return '<details class="tw-tips"><summary>' + esc(t('tipsTitle')) + '</summary><ul>' +
          tips.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></details>';
      }

      function sampleBody(it) {
        const qList = (arr, samples) => '<ol class="tw-q-list">' + (arr || []).map((q, i) =>
          '<li><span class="tw-q" lang="en">' + esc(q) + '</span>' +
          (samples && samples[i] ? '<p class="tw-sample-text" lang="en">' + esc(samples[i]) + '</p>' : '') + '</li>').join('') + '</ol>';

        if (it.part === 's1') {
          return '<p class="tw-label">' + esc(t('readAloud')) + '</p>' +
            '<p class="tw-sample-text" lang="en">' + esc(it.text) + '</p>' +
            ((it.stress || []).length
              ? '<p class="tw-label">' + esc(t('stressTitle')) + ':</p><div class="chips">' +
                it.stress.map(s => '<span class="badge accent" lang="en">' + esc(s) + '</span>').join('') + '</div>'
              : '');
        }
        if (it.part === 's2') {
          return '<p class="tw-label">' + esc(t('sampleAnswer')) + '</p><p class="tw-sample-text" lang="en">' + esc(it.sample) + '</p>';
        }
        if (it.part === 's3' || it.part === 's4') {
          return '<p class="tw-label">' + esc(t('sampleAnswer')) + '</p>' + qList(it.questions, it.samples);
        }
        if (it.part === 's5') {
          return '<p class="tw-label">' + esc(t('sampleAnswer')) + '</p><p class="tw-sample-text" lang="en">' + esc(it.sample) + '</p>';
        }
        if (it.part === 'w1') {
          return '<p class="tw-label">' + esc(t('sampleAnswer')) + '</p><p class="tw-sample-text" lang="en">' + esc(it.sample) + '</p>';
        }
        if (it.part === 'w2') {
          return '<p class="tw-label">' + esc(t('sampleAnswer')) + '</p><pre class="tw-pre" lang="en">' + esc(it.sample) + '</pre>';
        }
        return '<p class="tw-label">' + esc(t('sampleAnswer')) + '</p><div class="tw-sample-text tw-essay" lang="en">' + esc(it.sample) + '</div>';
      }

      function sampleCard(it) {
        const open = !!samplesOpen[it.id];
        return '<section class="card tw-sample">' +
          '<div class="row"><h3 class="tw-h">' + esc(t('sampleTitle')) + '</h3><span class="spacer"></span>' +
          '<button type="button" class="btn sm" data-act="sample" aria-expanded="' + open + '">' +
          esc(open ? t('hideSample') : t('showSample')) + ' <kbd>S</kbd></button></div>' +
          (open ? '<div class="tw-sample-body">' + sampleBody(it) + tipList(it) + '</div>' : '') +
          '</section>';
      }

      function gradeCard(it) {
        const res = grades[it.id];
        const err = gradeErr[it.id];
        const isBusy = !!busy[it.id];
        const errHtml = err
          ? (err && err.code ? App.ui.error(err) : '<div class="ai-error">' + esc(String(err)) + '</div>')
          : '';
        return '<section class="card tw-grade">' +
          '<div class="row"><h3 class="tw-h">' + esc(t('aiGrade')) + '</h3><span class="spacer"></span>' +
          '<button type="button" class="btn primary" data-act="grade"' + (isBusy ? ' disabled' : '') + '>' +
          (isBusy ? '<span class="ai-loading">' + esc(t('aiWait')) + '</span>' : esc(res ? t('aiRetry') : t('aiGrade'))) +
          '</button></div>' +
          (res ? App.ui.feedback(res, 'en') : '') +
          errHtml +
          '<p class="muted small">' + esc(t('aiNote')) + '</p>' +
          '</section>';
      }

      /* ---------- trang chính ---------- */
      function formatRows() {
        return Object.keys(PARTS).map(p => {
          const c = cfg(p);
          let prep = '—';
          if (c.read) prep = t('prepRead', { s: fmt(c.read) });
          else if (c.prep) prep = fmt(c.prep);
          let ans = '—';
          if (c.secs) ans = p === 'w1' ? t('w1Clock', { s: fmt(c.secs) }) : fmt(c.secs) + ' / câu';
          else if (c.last) ans = t('perQuestion', { a: c.answer, b: c.last });
          else if (c.perQuestion) ans = t('perQuestionPlain', { a: c.answer });
          else if (c.answer) ans = fmt(c.answer);
          return '<tr><td>' + esc(c.icon + ' ' + p.toUpperCase()) + '</td><td>' + esc(c.qs) + '</td>' +
            '<td>' + esc(prep) + '</td><td>' + esc(ans) + '</td><td>' + esc(c.scale) + '</td></tr>';
        }).join('');
      }

      function partCard(p, i) {
        const c = cfg(p);
        const n = byPart(p).length;
        return '<li><button type="button" class="card tw-part" data-act="part" data-part="' + esc(p) + '">' +
          '<span class="tw-part-top"><span class="tw-part-ico" aria-hidden="true">' + esc(c.icon) + '</span>' +
          '<span class="badge">' + esc(c.qs) + '</span>' +
          '<span class="badge">' + esc(t('colScale')) + ' ' + esc(c.scale) + '</span>' +
          (i < 9 ? '<span class="badge accent"><kbd>' + (i + 1) + '</kbd></span>' : '') + '</span>' +
          '<b class="tw-part-name" lang="en">' + esc(p.toUpperCase() + ' · ' + c.name) + '</b>' +
          '<span class="muted small">' + esc(t('items', { n: n })) + '</span>' +
          '<span class="btn sm tw-part-go">' + esc(t('practicePart')) + '</span>' +
          '</button></li>';
      }

      function homeHtml() {
        const sN = speakItems(), wN = writeItems();
        return '<div class="page-head"><div><h1>📝 ' + esc(t('title')) + '</h1>' +
          '<p>' + esc(t('sub')) + '</p></div>' +
          '<div class="tw-keys muted small">' +
          '<span>' + esc(t('keyPractice', { k: '<kbd>1</kbd>–<kbd>8</kbd>' })) + '</span>' +
          '<span>' + esc(t('keyMock', { k: '<kbd>M</kbd>' })) + '</span>' +
          '<span>' + esc(t('keyFormat', { k: '<kbd>?</kbd>' })) + '</span></div></div>' +

          '<div class="tw-mocks">' +
          '<button type="button" class="card tw-mock" data-act="mock" data-mock="speaking">' +
          '<b>' + esc(t('mockSpeaking')) + '</b><span class="muted small">' +
          esc(t('mockSpeakingDesc', { m: MOCK_MINS.speaking })) + '</span></button>' +
          '<button type="button" class="card tw-mock" data-act="mock" data-mock="writing">' +
          '<b>' + esc(t('mockWriting')) + '</b><span class="muted small">' +
          esc(t('mockWritingDesc', { m: MOCK_MINS.writing })) + '</span></button>' +
          '<button type="button" class="card tw-mock tw-mock-full" data-act="mock" data-mock="full">' +
          '<b>' + esc(t('mockFull')) + '</b><span class="muted small">' +
          esc(t('mockFullDesc', { m: MOCK_MINS.full })) + '</span>' +
          '<span class="badge accent">' + esc(t('step', { i: MOCK_COUNT.speaking + MOCK_COUNT.writing, n: MOCK_COUNT.speaking + MOCK_COUNT.writing })) + '</span></button>' +
          '</div>' +

          '<div class="tw-cols">' +
          '<section class="tw-col"><h2>🎤 ' + esc(t('partSpeaking')) + ' <span class="badge">' + esc(t('items', { n: sN })) + '</span></h2>' +
          '<p class="muted small">' + esc(t('partSpeakingDesc')) + '</p>' +
          '<ul class="tw-part-list">' + SPEAKING.map((p, i) => partCard(p, i)).join('') + '</ul></section>' +
          '<section class="tw-col"><h2>✍️ ' + esc(t('partWriting')) + ' <span class="badge">' + esc(t('items', { n: wN })) + '</span></h2>' +
          '<p class="muted small">' + esc(t('partWritingDesc')) + '</p>' +
          '<ul class="tw-part-list">' + WRITING.map((p, i) => partCard(p, i + 5)).join('') + '</ul></section>' +
          '</div>' +

          '<details class="card tw-format"><summary><b>' + esc(t('format')) + '</b> <kbd>?</kbd></summary>' +
          '<div class="table-wrap"><table class="tw-table"><thead><tr><th>' + esc(t('colPart')) + '</th>' +
          '<th>' + esc(t('colQuestions')) + '</th><th>' + esc(t('colPrep')) + '</th><th>' + esc(t('colAnswer')) + '</th>' +
          '<th>' + esc(t('colScale')) + '</th></tr></thead><tbody>' + formatRows() + '</tbody></table></div>' +
          '<p class="muted small">' + esc(t('formatNote')) + '</p></details>';
      }

      /* ---------- thân item ---------- */
      function promptHtml(it) {
        if (it.part === 's1') {
          return '<div class="tw-prompt"><p class="tw-label">' + esc(t('readAloud')) + '</p>' +
            '<p class="tw-read" lang="en">' + esc(it.text) + '</p>' +
            ((it.stress || []).length
              ? '<p class="tw-label tw-mt">' + esc(t('stressTitle')) + ':</p><div class="chips">' +
                it.stress.map(s => '<span class="badge accent" lang="en">' + esc(s) + '</span>').join('') + '</div>'
              : '') + '</div>';
        }
        if (it.part === 's2') {
          return '<div class="tw-prompt"><p class="tw-label">' + esc(t('sceneTitle')) + '</p>' +
            '<p class="tw-scene">' + esc(it.scene) + '</p></div>';
        }
        if (it.part === 's3' || it.part === 's4') {
          const qs = it.questions || [];
          return (it.info ? '<div class="tw-prompt"><p class="tw-label">' + esc(t('infoTitle')) + '</p>' +
              '<pre class="tw-pre" lang="en">' + esc(it.info) + '</pre></div>' : '') +
            '<div class="tw-prompt"><p class="tw-label">' + esc(t('question')) + '</p><ol class="tw-q-list">' +
            qs.map((q, i) => {
              const current = isGroupItem(it) && (phase === 'answer' || phase === 'done') && qIdx === i;
              return '<li class="' + (current ? 'tw-q-now' : '') + '"><span class="tw-q" lang="en">' + esc(q) + '</span>' +
                (current ? '<span class="badge accent">' + esc(t('phaseAnswer')) + '</span>' : '') + '</li>';
            }).join('') + '</ol></div>';
        }
        if (it.part === 's5') {
          return '<div class="tw-prompt"><p class="tw-label">' + esc(t('prompt')) + '</p><p class="tw-en" lang="en">' + esc(it.prompt) + '</p></div>';
        }
        if (it.part === 'w1') {
          return '<div class="tw-prompt"><p class="tw-label">' + esc(t('sceneTitle')) + '</p>' +
            '<p class="tw-scene">' + esc(it.scene) + '</p>' +
            '<p class="tw-label tw-mt">' + esc(t('wordsGivenTitle')) + ':</p>' +
            '<div class="chips">' + (it.words || []).map(w => '<span class="badge accent" lang="en">' + esc(w) + '</span>').join('') + '</div>' +
            '<p class="muted small">' + esc(t('wordsHint')) + '</p></div>';
        }
        if (it.part === 'w2') {
          return '<div class="tw-prompt"><p class="tw-label">' + esc(t('email')) + '</p>' +
            '<pre class="tw-pre" lang="en">' + esc(it.email) + '</pre>' +
            '<p class="tw-label tw-mt">' + esc(t('task')) + '</p><p class="tw-en" lang="en">' + esc(it.task) + '</p></div>';
        }
        return '<div class="tw-prompt"><p class="tw-label">' + esc(t('prompt')) + '</p><p class="tw-en" lang="en">' + esc(it.prompt) + '</p>' +
          ((it.outline || []).length ? '<p class="tw-label tw-mt">' + esc(t('outline')) + ':</p><ul>' +
            it.outline.map(o => '<li>' + esc(o) + '</li>').join('') + '</ul>' : '') + '</div>';
      }

      function answerHtml(it) {
        const id = it.id;
        if (cfg(it.part).skill === 'speaking') {
          const micSupported = App.speech.supported;
          const m = metrics[id];
          return '<section class="card tw-answer">' +
            '<h3 class="tw-h">' + esc(t('answerLabel')) + '</h3>' +
            (micSupported
              ? '<div class="row tw-actions"><button type="button" class="btn mic-btn" data-act="mic" aria-pressed="' + (!!mic) + '">' +
                (mic ? '⏹ ' + esc(t('stop')) : '🎤 ' + esc(t('startAnswer'))) + '</button>' +
                '<span class="tw-rec muted small" data-rec' + (mic ? '' : ' hidden') + '>' + esc(t('recording')) + '</span></div>'
              : '<p class="muted small">' + esc(t('noSpeech')) + '</p>') +
            '<div data-speech-err></div>' +
            '<label class="field tw-mt"><span class="tw-sr">' + esc(t('speakingBox')) + '</span>' +
            '<textarea class="textarea tw-input" data-input="' + esc(id) + '" lang="en" rows="4" ' +
            'placeholder="' + esc(t('speakingPh')) + '">' + esc(answerOf(id)) + '</textarea></label>' +
            '<div class="row tw-meta"><span class="tw-count ' + countCls(it) + '" data-count="' + esc(id) + '">' +
            esc(countLabel(it)) + '</span><span class="spacer"></span>' +
            (m ? '<span class="muted small">' + esc(fmt(m.seconds)) + ' · ' + esc(String(m.words)) + ' ' +
              esc(App.lang === 'en' ? 'words' : 'từ') + '</span>' : '') + '</div>' +
            '</section>';
        }
        const left = phase === 'writing' ? Math.max(0, Math.round((startedAt + cfg(part()).secs * 1000 - Date.now()) / 1000)) : cfg(part()).secs;
        return '<section class="card tw-answer">' +
          '<h3 class="tw-h">' + esc(t('answerLabel')) + '</h3>' +
          '<label class="field"><span class="tw-sr">' + esc(t('writingPh')) + '</span>' +
          '<textarea class="textarea tw-input tw-write" data-input="' + esc(id) + '" lang="en" rows="10" ' +
          'placeholder="' + esc(t('writingPh')) + '"' + (phase === 'done' ? ' disabled' : '') + '>' + esc(answerOf(id)) + '</textarea></label>' +
          '<div class="row tw-meta"><span class="tw-count ' + countCls(it) + '" data-count="' + esc(id) + '">' +
          esc(countLabel(it)) + '</span><span class="spacer"></span>' +
          '<span class="muted small">' + esc(t('timeLeft')) + ': <b data-clock>' + esc(fmt(left)) + '</b> · ' +
          esc(t('elapsed')) + ': <b data-elapsed>' + esc(fmt(phase === 'writing' ? Math.round((Date.now() - startedAt) / 1000) : 0)) + '</b></span></div>' +
          '</section>';
      }

      function stageHtml(it) {
        const c = cfg(it.part);
        const phaseLabel = phase === 'readInfo' ? t('phaseReadInfo')
          : phase === 'prep' ? t('phasePrep')
            : phase === 'answer' ? t('phaseAnswer')
              : phase === 'writing' ? t('phaseWriting')
                : phase === 'done' ? t('phaseDone') : t('phasePrep');
        const showClock = phase === 'prep' || phase === 'readInfo' || phase === 'answer' || phase === 'writing';
        const clockNow = phase === 'writing'
          ? Math.max(0, Math.round((startedAt + c.secs * 1000 - Date.now()) / 1000))
          : (remaining || phaseTotal);
        const cls = remaining <= 5 && showClock ? ' bad' : remaining <= 10 && showClock ? ' warn' : '';
        const pct = phaseTotal ? Math.max(0, Math.min(100, clockNow / phaseTotal * 100)) : 0;
        return '<section class="card tw-stage">' +
          '<div class="tw-stage-top">' +
          '<span class="badge ' + (isSpeak() ? 'accent' : 'info') + '">' + esc(c.icon + ' ' + part().toUpperCase()) + '</span>' +
          '<span class="badge">' + esc(c.qs) + '</span>' +
          '<span class="badge">' + esc(t('colScale')) + ' ' + esc(c.scale) + '</span>' +
          (mode === 'mock' ? '<span class="badge warn">' + esc(t('mockBadge', { mode: mockMode === 'writing' ? t('modeWriting') : t('modeSpeaking') })) + '</span>' : '') +
          '</div>' +
          '<h2 lang="en">' + esc(c.name) + '</h2>' +
          '<ol class="tw-phases">' +
          '<li class="' + (phase === 'readInfo' || phase === 'prep' ? 'on' : '') + '">' + esc(t('phasePrep')) + '</li>' +
          '<li class="' + (phase === 'answer' || phase === 'writing' ? 'on' : phase === 'done' ? 'past' : '') + '">' +
          esc(c.skill === 'speaking' ? t('phaseAnswer') : t('phaseWriting')) + '</li>' +
          '<li class="' + (phase === 'done' ? 'on' : '') + '">' + esc(t('phaseDone')) + '</li></ol>' +
          (showClock ? '<div class="tw-clock-row"><span class="tw-label">' + esc(phaseLabel) + '</span>' +
            '<span class="tw-clock' + cls + '" data-clock aria-live="off">' + esc(fmt(clockNow)) + '</span>' +
            '<span class="spacer"></span>' +
            '<span class="muted small">' + esc(t('elapsed')) + ': <b data-elapsed>' +
            esc(fmt(phase === 'writing' ? Math.round((Date.now() - startedAt) / 1000) : clockElapsed)) + '</b></span></div>' +
            '<div class="progress"><i class="accent" data-clock-bar style="width:' + pct + '%"></i></div>' : '') +
          '</section>';
      }

      function controlsHtml(it) {
        const speak = cfg(it.part).skill === 'speaking';
        const c = cfg(it.part);
        const btns = [];
        if (phase === 'ready') {
          if (speak) {
            if (c.prep || c.read) btns.push('<button type="button" class="btn primary" data-act="prep">' + esc(t('startPrep')) + ' <kbd>Space</kbd></button>');
            else btns.push('<button type="button" class="btn primary" data-act="answer">' + esc(t('startAnswer')) + ' <kbd>Space</kbd></button>');
          } else {
            btns.push('<button type="button" class="btn primary" data-act="writing">' + esc(t('startWriting')) + ' <kbd>Space</kbd></button>');
          }
        } else if (phase === 'readInfo' || phase === 'prep') {
          btns.push('<button type="button" class="btn" data-act="answer">' + esc(t('startAnswer')) + '</button>');
          btns.push('<button type="button" class="btn" data-act="skip">' + esc(t('skipWait')) + '</button>');
        } else if (phase === 'answer') {
          btns.push('<button type="button" class="btn bad" data-act="end">' + esc(t('endPhase')) + '</button>');
        } else if (phase === 'writing') {
          btns.push('<button type="button" class="btn bad" data-act="end">' + esc(t('endPhase')) + '</button>');
        } else {
          btns.push('<button type="button" class="btn" data-act="retry">' + esc(t('retry')) + '</button>');
        }

        btns.push('<button type="button" class="btn ok" data-act="done"' + (App.store.getStatus(it.id) === 'known' ? ' aria-pressed="true"' : '') + '>' +
          esc(t('done')) + '</button>');

        if (mode === 'mock') {
          btns.push('<span class="spacer"></span>');
          btns.push('<button type="button" class="btn" data-act="prev"' + (idx <= 0 ? ' disabled' : '') + '>← ' + esc(t('prev')) + ' <kbd>P</kbd></button>');
          if (idx + 1 < list.length) btns.push('<button type="button" class="btn primary" data-act="next">' + esc(t('next')) + ' <kbd>N</kbd></button>');
          else btns.push('<button type="button" class="btn primary" data-act="report">' + esc(t('finish')) + '</button>');
        } else if (list.length > 1) {
          btns.push('<span class="spacer"></span>');
          btns.push('<button type="button" class="btn" data-act="next">' + esc(t('next')) + ' →</button>');
        }

        const hint = phase === 'readInfo' ? t('readInfoHint')
          : phase === 'prep' ? t('prepHint')
            : phase === 'answer' ? t('answerHint')
              : phase === 'writing' ? t('writingHint') : '';
        return '<section class="card tw-controls">' +
          (hint ? '<p class="muted small">' + esc(hint) + '</p>' : '') +
          '<div class="row tw-btn-row">' + btns.join('') + '</div>' +
          '<div class="tw-toast" data-toast role="status" aria-live="polite" hidden></div>' +
          '</section>';
      }

      function itemHtml(it) {
        const grp = isGroupItem(it);
        const step = grp
          ? t('stepMeta', { i: idx + 1, n: list.length, j: qIdx + 1, m: it.questions.length })
          : t('step', { i: idx + 1, n: list.length });
        const pct = Math.round(((idx + (phase === 'done' ? 1 : 0)) / Math.max(1, list.length)) * 100);
        return '<div class="page-head tw-head"><div>' +
          '<button type="button" class="link-btn" data-act="home">' + esc(t('homeBtn')) + '</button>' +
          '<h1>' + esc(cfg(part()).icon + ' ' + part().toUpperCase() + ' · ' + cfg(part()).name) + '</h1>' +
          '<p class="muted small">' + esc(step) + (mode === 'mock' ? ' · ' + esc(t('mockBadge', { mode: mockMode === 'writing' ? t('modeWriting') : t('modeSpeaking') })) : '') + '</p>' +
          '</div><div class="tw-progress"><div class="progress"><i class="accent" style="width:' + pct + '%"></i></div>' +
          '<span class="muted small">' + esc(t('step', { i: idx + 1, n: list.length })) + '</span></div></div>' +
          stageHtml(it) +
          promptHtml(it) +
          (cfg(part()).tts ? '<div class="row tw-actions">' +
            '<button type="button" class="btn" data-act="listen"' + (hasTTS() ? '' : ' disabled') + '>' + esc(t('listen')) + '</button>' +
            (hasTTS() ? '' : '<span class="muted small">' + esc(t('ttsUnavailable')) + '</span>') + '</div>' : '') +
          answerHtml(it) +
          controlsHtml(it) +
          sampleCard(it) +
          gradeCard(it);
      }

      function reportHtml() {
        const rows = list.map((it, i) => {
          const g = grades[it.id];
          const has = !!answerOf(it.id).trim();
          const badge = g ? '<span class="badge ' + (g.score >= 4 ? 'ok' : g.score === 3 ? 'warn' : 'bad') + '">' + esc(g.score) + '/5</span>' : '<span class="muted">' + esc(t('reportEmpty')) + '</span>';
          const cell = has
            ? '<button type="button" class="link-btn" data-act="open" data-idx="' + i + '">' + esc(t('reviewItem')) + '</button>'
            : '<span class="muted small">' + esc(t('reportNoScore')) + '</span>';
          return '<tr><td>' + esc(cfg(it.part).icon + ' ' + it.part.toUpperCase()) + '</td><td>' + badge + '</td><td>' + cell + '</td></tr>';
        }).join('');
        const scored = list.map(x => grades[x.id]).filter(Boolean);
        const avg = scored.length ? (scored.reduce((s, x) => s + (Number(x.score) || 0), 0) / scored.length).toFixed(1) : '—';
        const perSkill = k => {
          const arr = list.filter(x => cfg(x.part).skill === k).map(x => grades[x.id]).filter(Boolean);
          if (!arr.length) return '';
          const v = (arr.reduce((s, x) => s + (Number(x.score) || 0), 0) / arr.length).toFixed(1);
          return '<span class="badge">' + esc(k === 'speaking' ? t('modeSpeaking') : t('modeWriting')) + ': ' + esc(v) + '/5</span>';
        };
        return '<div class="page-head"><div><h1>📊 ' + esc(t('reportTitle')) + '</h1>' +
          '<p>' + esc(t('reportSub')) + '</p></div>' +
          '<div class="tw-avg"><span class="muted small">' + esc(t('avgScore')) + '</span>' +
          '<b>' + esc(avg) + '</b><span class="muted small">/5</span>' +
          '<div class="chips">' + perSkill('speaking') + perSkill('writing') + '</div></div></div>' +
          '<div class="table-wrap"><table class="tw-table"><thead><tr><th>' + esc(t('reportCol')) + '</th>' +
          '<th>' + esc(t('reportScore')) + '</th><th>' + esc(t('reportAns')) + '</th></tr></thead>' +
          '<tbody>' + rows + '</tbody></table></div>' +
          '<p class="muted small">' + esc(t('reportHint')) + '</p>' +
          '<div class="row tw-btn-row">' +
          '<button type="button" class="btn" data-act="home">' + esc(t('backHome')) + '</button>' +
          '<button type="button" class="btn primary" data-act="again">' + esc(t('practiceAgain')) + '</button></div>';
      }

      function render() {
        if (mode === 'home') { root.innerHTML = homeHtml(); return; }
        if (mode === 'report') { root.innerHTML = reportHtml(); return; }
        const it = item();
        if (!it) { root.innerHTML = '<div class="empty"><p>' + esc(t('notFound')) + '</p>' + '<a class="btn" href="#/toeic">' + esc(t('backHome')) + '</a></div>'; return; }
        root.innerHTML = itemHtml(it);
      }

      /* ---------- events ---------- */
      function onClick(e) {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const act = btn.dataset.act;
        if (act === 'part') { startDrill(btn.dataset.part); return; }
        if (act === 'mock') {
          const which = btn.dataset.mock;
          if (which === 'full') startFullMock(); else startMock(which);
          return;
        }
        if (act === 'home') { goHome(); return; }
        if (act === 'prep') { enterPrep(); return; }
        if (act === 'answer') { enterAnswer(); return; }
        if (act === 'writing') { enterWriting(); return; }
        if (act === 'skip') { if (isSpeak()) enterAnswer(); else endWriting(); return; }
        if (act === 'end') { if (isSpeak()) finishSpeaking(); else endWriting(); return; }
        if (act === 'mic') { toggleMic(); return; }
        if (act === 'listen') { const it = item(); if (it) speak(it.text || (it.questions || []).join(' ') || it.info || ''); return; }
        if (act === 'sample') { const it = item(); if (it) { samplesOpen[it.id] = !samplesOpen[it.id]; render(); } return; }
        if (act === 'grade') { gradeCurrent(); return; }
        if (act === 'done') { markDone(); return; }
        if (act === 'retry') { retryItem(); return; }
        if (act === 'prev') {
          if (idx > 0) {
            if (isSpeak()) { goto(idx - 1); } else {
              const prev = list[idx - 1];
              if (cfg(prev.part).skill === 'writing') goto(idx - 1); else showReport();
            }
          }
          return;
        }
        if (act === 'next') {
          if (idx + 1 < list.length) {
            const nxt = list[idx + 1];
            if (cfg(nxt.part).skill === cfg(part()).skill || mockMode === 'full') goto(idx + 1);
            else showReport();
          } else showReport();
          return;
        }
        if (act === 'report') { showReport(); return; }
        if (act === 'again') {
          if (mockMode === 'writing') startMock('writing');
          else if (mockMode === 'full') startFullMock();
          else startMock('speaking');
          return;
        }
        if (act === 'open') { goto(Number(btn.dataset.idx) || 0); return; }
      }

      function onInput(e) {
        const ta = e.target;
        if (!ta.matches('[data-input]')) return;
        const id = ta.dataset.input;
        answers[id] = ta.value;
        const it = list.filter(x => x.id === id)[0];
        if (it) paintCount(id);
      }

      function onKey(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const tgt = e.target;
        const typing = tgt && (tgt.tagName === 'TEXTAREA' || tgt.tagName === 'INPUT' || tgt.tagName === 'SELECT' || tgt.isContentEditable);
        const k = e.key;
        if (k === 'Escape') { if (mode === 'home') return; hush(); stopMic(true); goHome(); return; }
        if (mode === 'home') {
          if (typing) return;
          if (k >= '1' && k <= '8') { e.preventDefault(); startDrill((SPEAKING.concat(WRITING))[Number(k) - 1]); }
          else if (k === 'm' || k === 'M') { e.preventDefault(); startFullMock(); }
          else if (k === '?') { e.preventDefault(); const d = root.querySelector('.tw-format'); if (d) d.open = !d.open; }
          return;
        }
        if (mode !== 'drill' && mode !== 'mock') return;
        if (typing) return;
        if (k === ' ' || k === 'Spacebar') {
          if (isSpeak()) {
            e.preventDefault();
            if (phase === 'ready' || phase === 'prep' || phase === 'readInfo') enterAnswer();
            else if (phase === 'answer') toggleMic();
          } else if (phase === 'ready') { e.preventDefault(); enterWriting(); }
        } else if (k === 'n' || k === 'N' || k === 'ArrowRight') { e.preventDefault(); if (mode === 'mock') nextItem(); else goto(Math.min(list.length - 1, idx + 1)); }
        else if (k === 'p' || k === 'P' || k === 'ArrowLeft') { e.preventDefault(); if (idx > 0) goto(idx - 1); }
        else if (k === 's' || k === 'S') { e.preventDefault(); const it = item(); if (it) { samplesOpen[it.id] = !samplesOpen[it.id]; render(); } }
        else if (k === 'l' || k === 'L') { e.preventDefault(); const it = item(); if (it) speak(it.text || (it.questions || []).join(' ') || it.info || ''); }
        else if (k === 'g' || k === 'G') { e.preventDefault(); gradeCurrent(); }
      }

      root.addEventListener('click', onClick);
      root.addEventListener('input', onInput);
      const offKey = App.onKey(onKey);
      if (hasTTS()) { try { window.speechSynthesis.getVoices(); } catch (e) { /* warm up */ } }

      render();

      return () => {
        gen += 1;
        stopTicker();
        if (mic) { try { mic.stop(); } catch (e) { /* ignore */ } mic = null; }
        hush();
        clearTimeout(toastTimer);
        root.removeEventListener('click', onClick);
        root.removeEventListener('input', onInput);
        offKey();
      };
    },
  });
})();