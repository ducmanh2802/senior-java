/* View "quiz" — owner: task T10. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

App.i18n.add({
  vi: {
    'quiz.title': 'Trắc nghiệm',
    'quiz.subtitle': 'Chọn chủ đề và số câu, trả lời 4 lựa chọn rồi xem giải thích ngay.',
    'quiz.topicTitle': 'Chủ đề',
    'quiz.topicHint': 'Bỏ chọn tất cả = làm toàn bộ câu trắc nghiệm.',
    'quiz.topicNone': 'Chưa có câu trắc nghiệm nào được thêm.',
    'quiz.topicAll': 'Tất cả',
    'quiz.countTitle': 'Số câu',
    'quiz.countNone': 'Không có câu nào khớp chủ đề đã chọn.',
    'quiz.startBtn': 'Bắt đầu',
    'quiz.startDisabled': 'Bắt đầu',
    'quiz.available': 'câu khả dụng',
    'quiz.countLabel10': '10',
    'quiz.countLabel20': '20',
    'quiz.countLabel30': '30',
    'quiz.countLabelAll': 'Tất cả ({n})',
    'quiz.bestScore': 'Điểm cao nhất',
    'quiz.noHistory': 'Chưa có phiên trắc nghiệm nào. Hãy làm bài đầu tiên!',
    'quiz.historyTitle': 'Lịch sử gần đây',
    'quiz.resultTitle': 'Kết quả',
    'quiz.resultSubtitle': 'Bạn trả lời đúng {correct}/{total} câu trong {time}.',
    'quiz.resultScore': '{pct}%',
    'quiz.resultCorrect': '{correct}/{total} câu đúng · {time}',
    'quiz.resultActionsRetry': 'Làm lại câu sai ({n})',
    'quiz.resultActionsNew': 'Bài mới',
    'quiz.resultActionsBank': 'Ngân hàng câu hỏi',
    'quiz.resultByTopic': 'Điểm theo chủ đề',
    'quiz.resultByTopicNone': 'Không có dữ liệu.',
    'quiz.resultWrongTitle': 'Các câu sai ({n})',
    'quiz.resultCorrectText': 'Chính xác!',
    'quiz.resultWrongText': 'Chưa đúng',
    'quiz.resultCorrectAnswer': 'Đáp án đúng:',
    'quiz.resultWrongAnswer': 'Đáp án đúng:',
    'quiz.resultReportBtn': '🚩 Báo sai',
    'quiz.quizNavNext': 'Câu tiếp theo',
    'quiz.quizNavResult': 'Xem kết quả',
    'quiz.quizNavHint': 'Nhấn 1–4 để chọn đáp án.',
    'quiz.quizWrongItem': '{i}. {q}',
    'quiz.quizScoreLabel': 'Điểm: <strong>{n}</strong>',
    'quiz.timerLabel': '{m}:{s}',
  },
  en: {
    'quiz.title': 'Quiz',
    'quiz.subtitle': 'Select topics and number of questions, pick from 4 choices, then see explanations.',
    'quiz.topicTitle': 'Topics',
    'quiz.topicHint': 'Deselect all = take the full quiz.',
    'quiz.topicNone': 'No quiz questions added yet.',
    'quiz.topicAll': 'All',
    'quiz.countTitle': 'Questions',
    'quiz.countNone': 'No questions match the selected topics.',
    'quiz.startBtn': 'Start',
    'quiz.startDisabled': 'Start',
    'quiz.available': 'available',
    'quiz.countLabel10': '10',
    'quiz.countLabel20': '20',
    'quiz.countLabel30': '30',
    'quiz.countLabelAll': 'All ({n})',
    'quiz.bestScore': 'Best score',
    'quiz.noHistory': 'No quiz sessions yet. Take your first quiz!',
    'quiz.historyTitle': 'Recent history',
    'quiz.resultTitle': 'Results',
    'quiz.resultSubtitle': 'You answered {correct}/{total} correctly in {time}.',
    'quiz.resultScore': '{pct}%',
    'quiz.resultCorrect': '{correct}/{total} correct · {time}',
    'quiz.resultActionsRetry': 'Retry wrong ({n})',
    'quiz.resultActionsNew': 'New quiz',
    'quiz.resultActionsBank': 'Question bank',
    'quiz.resultByTopic': 'Score by topic',
    'quiz.resultByTopicNone': 'No data.',
    'quiz.resultWrongTitle': 'Wrong answers ({n})',
    'quiz.resultCorrectText': 'Correct!',
    'quiz.resultWrongText': 'Not correct',
    'quiz.resultCorrectAnswer': 'Correct answer:',
    'quiz.resultWrongAnswer': 'Correct answer:',
    'quiz.resultReportBtn': '🚩 Report error',
    'quiz.quizNavNext': 'Next question',
    'quiz.quizNavResult': 'Show results',
    'quiz.quizNavHint': 'Press 1–4 to select.',
    'quiz.quizWrongItem': '{i}. {q}',
    'quiz.quizScoreLabel': 'Score: <strong>{n}</strong>',
    'quiz.timerLabel': '{m}:{s}',
    'quiz.examTitle': '📝 Timed mock exams',
    'quiz.examText': 'Topic exams (Java Core, Spring, System Design, DevOps & Cloud, Claude certification): weighted questions, timer, pass/fail.',
    'quiz.examAll': 'Choose an exam',
    'quiz.examClaude': 'Claude certification (CCDV-F)',
  },
});

  const COUNTS = [10, 20, 30];

  // State của phiên trắc nghiệm.
  const Q = {
    phase: 'setup',        // setup | quiz | result
    topics: [],            // topic đã chọn (rỗng = tất cả)
    count: 10,
    list: [],              // câu hỏi của phiên (options đã xáo trộn)
    idx: 0,
    answers: [],           // { q, picked, correct }
    correct: 0,
    seconds: 0,
    timer: null,
    startedAt: 0,
  };

  let rootEl = null;

  /** Render inline (bỏ <p> bao ngoài) cho các lựa chọn. */
  function mdInline(src) {
    return App.md(src).replace(/^<p>/, '').replace(/<\/p>$/, '');
  }

  /** mm:ss */
  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  /** Các topic có ít nhất 1 câu trắc nghiệm. */
  function topicsWithQuiz() {
    const counts = {};
    App.quiz().forEach(q => { counts[q.topic] = (counts[q.topic] || 0) + 1; });
    return App.topics().filter(t => counts[t.id]).map(t => ({ id: t.id, name: t.name, icon: t.icon, n: counts[t.id] }));
  }

  /** Danh sách câu hỏi theo lựa chọn topic hiện tại. */
  function pool() {
    const all = App.quiz();
    if (!Q.topics.length) return all;
    return all.filter(q => Q.topics.indexOf(q.topic) >= 0);
  }

  /** Chuẩn bị câu hỏi: xáo trộn options và nhớ index đáp án đúng (multi: mảng index, tăng dần). */
  function prepare(q) {
    const ans = Array.isArray(q.answer) ? q.answer : [q.answer];
    const opts = q.options.map((text, i) => ({ text: text, correct: ans.indexOf(i) >= 0 }));
    const shuffled = App.shuffle(opts);
    const idx = shuffled.map((o, i) => (o.correct ? i : -1)).filter(i => i >= 0);
    return {
      q: q,
      options: shuffled.map(o => o.text),
      multi: q.multi === true,
      answers: idx,
      answer: idx[0],
    };
  }

  /** Câu multi: các lựa chọn đang tick (chưa xác nhận). */
  let pending = [];
  const isRight = (item, i) => item.answers.indexOf(i) >= 0;

  /** Điểm cao nhất gần đây. */
  function bestScore() {
    const hist = App.store.data.quizHistory || [];
    if (!hist.length) return null;
    return hist.reduce((best, h) => {
      const pct = h.total ? Math.round((h.correct / h.total) * 100) : 0;
      return pct > best.pct ? { pct: pct, at: h.at, total: h.total, correct: h.correct } : best;
    }, { pct: -1, at: 0 });
  }

  /** Lịch sử 5 phiên gần nhất. */
  function recentHistory() {
    return (App.store.data.quizHistory || []).slice(0, 5);
  }

  /** Chips chọn topic (bỏ chọn hết = tất cả topic có câu). */
  function topicChips() {
    const topics = topicsWithQuiz();
    if (!topics.length) return '<p class="muted small">' + App.t('quiz.topicNone') + '</p>';
    const chips = topics.map(t =>
      '<button type="button" class="chip' + (Q.topics.indexOf(t.id) >= 0 ? ' active' : '') + '" data-topic="' + App.esc(t.id) + '">' +
      App.esc((t.icon ? t.icon + ' ' : '') + t.name) + ' <span class="badge">' + t.n + '</span></button>').join('');
    return '<div class="chips">' + chips + '</div>';
  }

  /** Chips chọn số câu (giới hạn theo số câu hiện có). */
  function countChips(available) {
    const opts = COUNTS.filter(n => n < available);
    opts.push(available);
    const uniq = opts.filter((v, i, a) => a.indexOf(v) === i);
    const chips = uniq.map(n =>
      '<button type="button" class="chip' + (Q.count === n ? ' active' : '') + '" data-count="' + n + '">' +
      (n === available ? 'Tất cả (' + n + ')' : String(n)) + '</button>').join('');
    return '<div class="chips">' + chips + '</div>';
  }

  /** Màn thiết lập. */
  function setupHtml() {
    const available = pool().length;
    const best = bestScore();
    const hist = recentHistory();
    const histRows = hist.map(h => {
      const pct = h.total ? Math.round((h.correct / h.total) * 100) : 0;
      return '<li><span class="badge ' + (pct >= 70 ? 'ok' : pct >= 40 ? 'warn' : 'bad') + '">' +
        h.correct + '/' + h.total + '</span> <span class="small muted">' + App.esc(App.fmtDate(h.at)) +
        ' · ' + h.seconds + 's</span></li>';
    }).join('');

    return '<div class="page-head"><div><h1>Trắc nghiệm</h1>' +
      '<p>Chọn chủ đề và số câu, trả lời 4 lựa chọn rồi xem giải thích ngay.</p></div></div>' +
      '<section class="card quiz-setup">' +
        '<h3>' + App.t('quiz.topicTitle') + '</h3>' +
        '<p class="small muted">' + App.t('quiz.topicHint') + '</p>' +
        topicChips() +
        '<h3 class="quiz-h3">' + App.t('quiz.countTitle') + '</h3>' +
        (available ? countChips(available) : '<p class="muted small">' + App.t('quiz.countNone') + '</p>') +
        '<div class="quiz-actions">' +
          '<button type="button" class="btn primary lg" id="quizStart"' + (available ? '' : ' disabled') + '>Bắt đầu</button>' +
          '<span class="small muted">' + available + ' ' + App.t('quiz.available') + '</span>' +
        '</div>' +
      '</section>' +
      '<section class="card quiz-exam-cta"><h3>' + App.t('quiz.examTitle') + '</h3>' +
        '<p class="small muted">' + App.t('quiz.examText') + '</p>' +
        '<div class="row"><a class="btn primary" href="#/exam">' + App.t('quiz.examAll') + '</a> ' +
        (App.quiz().some(q => q.topic === 'claude') ? '<a class="btn" href="#/exam/claude">' + App.t('quiz.examClaude') + '</a>' : '') + '</div></section>' +
      '<section class="card quiz-history">' +
        '<h3>' + App.t('quiz.bestScore') + (best && best.pct >= 0 ? ': ' + best.pct + '% (' + best.correct + '/' + best.total + ')' : '') + '</h3>' +
        (histRows ? '<ul class="quiz-hist">' + histRows + '</ul>' : '<p class="muted small">' + App.t('quiz.noHistory') + '</p>') +
      '</section>';
  }

  /** Header của phiên: tiến độ, điểm, đồng hồ. */
  function quizHeader() {
    const total = Q.list.length || 1;
    const pct = Math.round((Q.idx / total) * 100);
    return '<div class="card quiz-head">' +
      '<div class="quiz-head-top">' +
        '<span class="quiz-count">' + (Q.idx + 1) + ' / ' + Q.list.length + '</span>' +
        '<span class="quiz-score">Điểm: <strong>' + Q.correct + '</strong></span>' +
        '<span class="quiz-timer" id="quizTimer">' + fmtTime(Q.seconds) + '</span>' +
      '</div>' +
      '<div class="progress"><i class="accent" style="width:' + pct + '%"></i></div>' +
    '</div>';
  }

  /** Màn hình làm bài: một câu mỗi lần. */
  function questionHtml() {
    const item = Q.list[Q.idx];
    if (!item) return '';
    const answered = Q.answers[Q.idx];
    const picked = answered ? answered.picks : pending;
    const opts = item.options.map((text, i) => {
      let cls = '';
      if (answered) {
        if (isRight(item, i)) cls = ' correct';
        else if (picked.indexOf(i) >= 0) cls = ' wrong';
      } else if (item.multi && picked.indexOf(i) >= 0) cls = ' picked';
      return '<li><button type="button" class="quiz-opt' + cls + '" data-opt="' + i + '"' +
        (answered ? ' disabled' : '') + (item.multi ? ' aria-pressed="' + (picked.indexOf(i) >= 0) + '"' : '') + '>' +
        '<span class="quiz-opt-key">' + (item.multi ? (picked.indexOf(i) >= 0 ? '☑' : '☐') : 'ABCDEF'[i]) + '</span>' +
        '<span class="quiz-opt-text">' + mdInline(text) + '</span>' +
        (answered && isRight(item, i) ? '<span class="badge ok">Đúng</span>' : '') +
        (answered && picked.indexOf(i) >= 0 && !isRight(item, i) ? '<span class="badge bad">Sai</span>' : '') +
        '</button></li>';
    }).join('');

    return quizHeader() +
      '<section class="card quiz-q">' +
        '<div class="md quiz-q-text"' + (item.q.lang === 'en' ? ' lang="en"' : '') + '>' + App.md(item.q.q) + '</div>' +
        (item.multi && !answered ? '<p class="small"><span class="badge warn">Chọn ' + item.answers.length + ' đáp án</span></p>' : '') +
        '<ul class="quiz-opts">' + opts + '</ul>' +
        (item.multi && !answered ? '<button type="button" class="btn" id="quizConfirm"' + (pending.length === item.answers.length ? '' : ' disabled') + '>Xác nhận <kbd>Enter</kbd></button>' : '') +
        (answered ? '<div class="quiz-explain">' +
          '<h4>' + (answered.correct ? 'Chính xác!' : 'Chưa đúng') + '</h4>' +
          '<div class="md">' + App.md(item.q.explain) + '</div>' +
          '<div class="quiz-report"><a class="btn sm" target="_blank" rel="noopener noreferrer" href="' +
          App.esc('https://github.com/ducmanh2802/senior-java/issues/new?title=' + encodeURIComponent('Sai nội dung: ' + item.q.id) + '&body=' + encodeURIComponent('ID: ' + item.q.id + '\nTrang: ' + location.href + '\n\nSai ở đâu / nên sửa thế nào:\n') + '&labels=content') +
          '">🚩 Báo sai</a></div>' +
          '<div class="row quiz-nav">' +
            '<button type="button" class="btn primary" id="quizNext">' +
              (Q.idx + 1 >= Q.list.length ? 'Xem kết quả' : 'Câu tiếp theo') + ' <kbd>Enter</kbd></button>' +
          '</div>' +
        '</div>' : '<div class="quiz-nav"><span class="small muted">Nhấn <kbd>1</kbd>–<kbd>4</kbd> để chọn đáp án.</span></div>') +
      '</section>';
  }

  /** Bảng điểm theo topic. */
  function topicScores() {
    const map = {};
    Q.answers.forEach(a => {
      const t = a.q.topic;
      if (!map[t]) map[t] = { total: 0, correct: 0 };
      map[t].total += 1;
      if (a.correct) map[t].correct += 1;
    });
    return Object.keys(map).map(id => {
      const m = map[id];
      const t = App.topic(id);
      return { id: id, name: (t.icon ? t.icon + ' ' : '') + t.name, correct: m.correct, total: m.total };
    }).sort((a, b) => (b.correct / b.total) - (a.correct / a.total));
  }

  /** Màn kết quả. */
  function resultHtml() {
    const total = Q.list.length;
    const pct = total ? Math.round((Q.correct / total) * 100) : 0;
    const wrong = Q.answers.filter(a => !a.correct);
    const rows = topicScores().map(t => {
      const p = t.total ? Math.round((t.correct / t.total) * 100) : 0;
      const cls = p >= 70 ? 'ok' : p >= 40 ? 'warn' : 'bad';
      return '<div class="quiz-bar-row">' +
        '<span class="quiz-bar-label">' + App.esc(t.name) + '</span>' +
        '<span class="progress"><i class="' + cls + '" style="width:' + p + '%"></i></span>' +
        '<span class="quiz-bar-val">' + t.correct + '/' + t.total + '</span>' +
      '</div>';
    }).join('');

    const wrongHtml = wrong.map((a, i) => {
      const item = Q.list.filter(x => x.q.id === a.q.id)[0] || null;
      const ansText = item ? item.answers.map(i => item.options[i]).join(' · ') : '';
      return '<details class="card quiz-wrong-item">' +
        '<summary><span class="quiz-wrong-q">' + (i + 1) + '. ' + App.esc(a.q.q) + '</span></summary>' +
          '<div class="quiz-wrong-body">' +
            '<p class="small"><strong>Đáp án đúng:</strong> ' + App.esc(ansText) + '</p>' +
            '<div class="md">' + App.md(a.q.explain) + '</div>' +
            '<div class="quiz-report"><a class="btn sm" target="_blank" rel="noopener noreferrer" href="' +
            App.esc('https://github.com/ducmanh2802/senior-java/issues/new?title=' + encodeURIComponent('Sai nội dung: ' + a.q.id) + '&body=' + encodeURIComponent('ID: ' + a.q.id + '\nTrang: ' + location.href + '\n\nSai ở đâu / nên sửa thế nào:\n') + '&labels=content') +
            '">🚩 Báo sai</a></div>' +
          '</div>' +
      '</details>';
    }).join('');

    return '<div class="page-head"><div><h1>Kết quả</h1>' +
      '<p>Bạn trả lời đúng ' + Q.correct + '/' + total + ' câu trong ' + fmtTime(Q.seconds) + '.</p></div></div>' +
      '<section class="card quiz-result-head">' +
        '<div class="quiz-result-score"><div class="num ' + (pct >= 70 ? 'ok' : pct >= 40 ? 'warn' : 'bad') + '">' + pct + '%</div>' +
        '<div class="lbl">' + Q.correct + '/' + total + ' câu đúng · ' + fmtTime(Q.seconds) + '</div></div>' +
        '<div class="quiz-result-actions">' +
          '<button type="button" class="btn primary" id="quizRetryWrong"' + (wrong.length ? '' : ' disabled') + '>Làm lại câu sai (' + wrong.length + ')</button>' +
          '<button type="button" class="btn" id="quizNew">Bài mới</button>' +
          '<a class="btn ghost" href="#/bank">Ngân hàng câu hỏi</a>' +
        '</div>' +
      '</section>' +
      '<section class="card quiz-by-topic"><h3>Điểm theo chủ đề</h3>' + (rows || '<p class="muted small">' + App.t('quiz.resultByTopicNone') + '</p>') + '</section>' +
      (wrongHtml ? '<section class="quiz-wrong"><h3>Các câu sai (' + wrong.length + ')</h3>' + wrongHtml + '</section>' :
        '<section class="card"><div class="empty"><p>Không có câu nào sai. Tuyệt vời!</p></div></section>');
  }

  /** Bắt đầu phiên mới theo lựa chọn hiện tại. */
  function startQuiz(root) {
    const poolList = pool();
    if (!poolList.length) return;
    const list = App.shuffle(poolList).slice(0, Q.count).map(prepare);
    Q.list = list;
    Q.idx = 0;
    Q.answers = []; pending = [];
    Q.correct = 0;
    Q.seconds = 0;
    Q.startedAt = Date.now();
    Q.phase = 'quiz';
    startTimer();
    render(root);
  }

  /** Bắt đầu lại chỉ với các câu sai. */
  function retryWrong(root) {
    const wrongIds = Q.answers.filter(a => !a.correct).map(a => a.q.id);
    const list = App.quiz().filter(q => wrongIds.indexOf(q.id) >= 0).map(prepare);
    if (!list.length) return;
    Q.list = list;
    Q.idx = 0;
    Q.answers = []; pending = [];
    Q.correct = 0;
    Q.seconds = 0;
    Q.startedAt = Date.now();
    Q.phase = 'quiz';
    startTimer();
    render(root);
  }

  /** Đồng hồ đếm lên. */
  function startTimer() {
    stopTimer();
    Q.timer = setInterval(() => {
      Q.seconds = Math.floor((Date.now() - Q.startedAt) / 1000);
      const el = document.getElementById('quizTimer');
      if (el) el.textContent = fmtTime(Q.seconds);
    }, 1000);
  }

  /** Dừng đồng hồ. */
  function stopTimer() {
    if (Q.timer) { clearInterval(Q.timer); Q.timer = null; }
  }

  /** Chọn đáp án. */
  function pick(optIndex) {
    if (Q.phase !== 'quiz' || Q.answers[Q.idx]) return;
    const item = Q.list[Q.idx];
    if (!item || optIndex < 0 || optIndex >= item.options.length) return;
    if (item.multi) {                       // tick/bỏ tick, xác nhận khi đủ số đáp án
      const p = pending.indexOf(optIndex);
      if (p >= 0) pending.splice(p, 1); else if (pending.length < item.answers.length) pending.push(optIndex);
      render(rootEl);
      return;
    }
    record(item, [optIndex]);
  }

  /** Ghi nhận câu trả lời (mảng lựa chọn); chỉ đúng khi khớp toàn bộ đáp án. */
  function record(item, picks) {
    const sorted = picks.slice().sort((a, b) => a - b);
    const correct = sorted.length === item.answers.length && sorted.every((v, i) => v === item.answers[i]);
    Q.answers[Q.idx] = { q: item.q, picked: picks[0], picks: picks, correct: correct };
    if (correct) Q.correct += 1;
    pending = [];
    render(rootEl);
  }

  function confirmMulti() {
    const item = Q.list[Q.idx];
    if (item && item.multi && !Q.answers[Q.idx] && pending.length === item.answers.length) record(item, pending.slice());
  }

  /** Sang câu tiếp / xem kết quả. */
  function next() {
    if (Q.phase !== 'quiz') return;
    if (!Q.answers[Q.idx]) return;
    if (Q.idx + 1 >= Q.list.length) { finish(); return; }
    Q.idx += 1;
    render(rootEl);
  }

  /** Kết thúc phiên và lưu kết quả. */
  function finish() {
    stopTimer();
    Q.seconds = Math.floor((Date.now() - Q.startedAt) / 1000);
    const topics = {};
    Q.answers.forEach(a => { topics[a.q.topic] = (topics[a.q.topic] || 0) + 1; });
    App.store.addQuizResult({
      total: Q.list.length,
      correct: Q.correct,
      topics: topics,
      seconds: Q.seconds,
    });
    App.store.save();
    Q.phase = 'result';
    render(rootEl);
  }

  /** Render theo phase hiện tại. */
  function render(root) {
    rootEl = root;
    if (Q.phase === 'setup') root.innerHTML = setupHtml();
    else if (Q.phase === 'result') root.innerHTML = resultHtml();
    else root.innerHTML = questionHtml();
    bindEvents(root);
  }

  /** Gắn event theo phase. */
  function bindEvents(root) {
    if (Q.phase === 'setup') {
      root.querySelectorAll('[data-topic]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.topic;
        const i = Q.topics.indexOf(id);
        if (i >= 0) Q.topics.splice(i, 1); else Q.topics.push(id);
        const avail = pool().length;
        Q.count = Math.min(Q.count, avail || 1);
        render(root);
      }));
      root.querySelectorAll('[data-count]').forEach(b => b.addEventListener('click', () => {
        Q.count = Number(b.dataset.count);
        render(root);
      }));
      const start = document.getElementById('quizStart');
      if (start) start.addEventListener('click', () => startQuiz(root));
      return;
    }

    if (Q.phase === 'result') {
      const retry = document.getElementById('quizRetryWrong');
      if (retry) retry.addEventListener('click', () => retryWrong(root));
      const fresh = document.getElementById('quizNew');
      if (fresh) fresh.addEventListener('click', () => {
        Q.phase = 'setup';
        Q.list = [];
        Q.answers = []; pending = [];
        Q.correct = 0;
        Q.seconds = 0;
        render(root);
      });
      return;
    }

    root.querySelectorAll('[data-opt]').forEach(b => b.addEventListener('click', () => {
      pick(Number(b.dataset.opt));
    }));
    const nxt = document.getElementById('quizNext');
    if (nxt) nxt.addEventListener('click', next);
    const conf = document.getElementById('quizConfirm');
    if (conf) conf.addEventListener('click', confirmMulti);
  }

  /** Phím tắt: 1–6 chọn đáp án, Enter xác nhận (multi) / sang câu tiếp. */
  function onKeyDown(e) {
    if (Q.phase !== 'quiz') return;
    if (e.key >= '1' && e.key <= '6') {
      e.preventDefault();
      pick(Number(e.key) - 1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!Q.answers[Q.idx]) confirmMulti(); else next();
    }
  }

  App.registerView('quiz', {
    get title() { return App.t('quiz.title'); },
    render(root, params) {
      stopTimer();
      Q.phase = 'setup';
      Q.list = [];
      Q.answers = []; pending = [];
      Q.correct = 0;
      Q.seconds = 0;
      Q.topics = [];
      const available = App.quiz().length;
      Q.count = Math.min(10, available || 10);
      render(root);
      const off = App.onKey(onKeyDown);
      return () => {
        off();
        stopTimer();
      };
    },
  });
})();
