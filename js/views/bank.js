/* View "bank" — owner: task T09. Contract: see AGENTS.md "Views". */
(function () {
  'use strict';

  const PAGE_SIZE = 150;
  const DEBOUNCE_MS = 150;

  const STATUS_CHIPS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'due', label: 'Đến hạn ôn' },
    { id: 'unseen', label: 'Chưa học' },
    { id: 'unknown', label: 'Chưa biết' },
    { id: 'review', label: 'Cần ôn' },
    { id: 'known', label: 'Đã thuộc' },
    { id: 'bookmarked', label: 'Đã đánh dấu' },
  ];
  const GRADES = [
    { id: 'known', label: 'Đã thuộc', cls: 'ok' },
    { id: 'review', label: 'Cần ôn', cls: 'warn' },
    { id: 'unknown', label: 'Chưa biết', cls: 'bad' },
  ];

  /** Trạng thái filter giữ giữa các lần render. */
  const S = {
    topic: 'all',
    level: 'all',
    status: 'all',
    q: '',
    shown: PAGE_SIZE,
    expanded: {},     // id -> true (đã mở)
    loaded: {},       // id -> true (đáp án đã render)
    answers: {},      // id -> câu trả lời đang gõ (giữ khi đổi bộ lọc)
    practiceOpen: {}, // id -> true (khối luyện trả lời đang mở)
    revealed: {},     // id -> true (đã bấm xem đáp án khi bật chế độ ẩn)
    aiResult: {},     // id -> kết quả App.ai.grade
    speech: {},       // id -> metrics của lần đọc gần nhất
  };

  const HIDE_KEY = 'sjp.bank.hideAnswer';
  let rootEl = null;
  let searchTimer = null;
  let mic = null;   // { id, handle } — chỉ một phiên ghi âm tại một thời điểm

  function esc(s) { return App.esc(s); }

  function hideAnswer() {
    try { return localStorage.getItem(HIDE_KEY) === '1'; } catch (e) { return false; }
  }
  function setHideAnswer(on) {
    try { localStorage.setItem(HIDE_KEY, on ? '1' : '0'); } catch (e) { /* private mode */ }
  }

  /** Câu hỏi sau khi áp dụng filter. */
  function filtered() {
    return App.filterQuestions({ topic: S.topic, level: S.level, status: S.status, q: S.q });
  }

  /** Ngày đến hạn ôn (dd/mm) hoặc null. */
  function dueText(id) {
    const d = App.store.getDue(id);
    if (d == null) return null;
    const dt = new Date(d);
    return String(dt.getDate()).padStart(2, '0') + '/' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  function statusDot(id) {
    const s = App.store.getStatus(id);
    const cls = s && App.STATUS[s] ? App.STATUS[s].cls : '';
    const label = s && App.STATUS[s] ? App.STATUS[s].label : 'Chưa học';
    return '<span class="bank-dot-wrap" title="' + esc(label) + '"><span class="dot ' + cls + '"></span></span>';
  }

  function levelBadge(q) {
    const label = App.LEVELS[q.level] || q.level;
    return '<span class="badge bank-level level-' + esc(q.level) + '">' + esc(label) + '</span>';
  }

  function topicBadge(q) {
    const t = App.topic(q.topic);
    return '<span class="badge">' + esc((t.icon ? t.icon + ' ' : '') + t.name) + '</span>';
  }

  /** Nút bookmark ★/☆. */
  function bookmarkBtn(id) {
    const on = App.store.isBookmarked(id);
    return '<button type="button" class="bank-star" data-bookmark="' + esc(id) + '" aria-label="' +
      (on ? 'Bỏ đánh dấu câu hỏi' : 'Đánh dấu câu hỏi') + '" aria-pressed="' + (on ? 'true' : 'false') +
      '" title="' + (on ? 'Bỏ đánh dấu' : 'Đánh dấu') + '">' + (on ? '★' : '☆') + '</button>';
  }

  /** Thân câu hỏi khi đang đóng (collapsed). */
  function headHtml(q, idx) {
    const due = dueText(q.id);
    return '<div class="bank-head">' +
      '<span class="bank-idx">' + idx + '</span>' +
      '<span class="bank-q"' + (q.lang === 'en' ? ' lang="en"' : '') + '>' + App.md(q.q) + '</span>' +
      '<span class="bank-meta">' + topicBadge(q) + levelBadge(q) + statusDot(q.id) +
        (due ? '<span class="small muted bank-due">ôn lại: ' + due + '</span>' : '') +
      '</span>' +
      bookmarkBtn(q.id) +
      '<span class="bank-caret" aria-hidden="true">▾</span>' +
    '</div>';
  }

  /** Khối "✍️ Luyện trả lời" (mặc định thu gọn). */
  function practiceHtml(q) {
    const openAttr = S.practiceOpen[q.id] ? ' open' : '';
    const enAttr = q.lang === 'en' ? ' lang="en"' : '';
    const value = S.answers[q.id] || '';
    const micBtn = App.speech.supported
      ? '<button type="button" class="btn sm mic-btn" data-mic="' + esc(q.id) +
        '" aria-label="Đọc câu trả lời bằng giọng nói">🎤 Nói</button>'
      : '';
    const stats = S.speech[q.id] ? App.ui.speechStats(S.speech[q.id]) : '';
    const result = S.aiResult[q.id] ? App.ui.feedback(S.aiResult[q.id], q.lang) : '';
    return '<section class="bank-practice">' +
      '<details class="bank-practice-box" data-practice="' + esc(q.id) + '"' + openAttr + '>' +
        '<summary>✍️ Luyện trả lời</summary>' +
        '<div class="bank-practice-body">' +
          '<label class="field"><span>Câu trả lời của bạn</span>' +
            '<textarea class="textarea bank-answer" data-answer="' + esc(q.id) + '"' + enAttr +
              ' rows="4" placeholder="Trả lời bằng lời của bạn rồi nhờ AI chấm…">' + esc(value) + '</textarea></label>' +
          '<div class="row bank-practice-actions">' +
            '<button type="button" class="btn sm primary" data-grade-ai="' + esc(q.id) + '">🤖 Chấm bằng AI</button>' +
            micBtn +
            '<span class="spacer"></span>' +
            '<span class="small muted">Điểm ≥ 4 → Đã thuộc · 3 → Cần ôn · ≤ 2 → Chưa biết</span>' +
          '</div>' +
          '<div class="bank-speech" data-speech="' + esc(q.id) + '">' + stats + '</div>' +
          '<div class="bank-ai-result" data-feedback="' + esc(q.id) + '">' + result + '</div>' +
        '</div>' +
      '</details>' +
    '</section>';
  }

  /** Đáp án mẫu, có thể bị che khi bật "Ẩn đáp án cho tới khi tự trả lời". */
  function answerHtml(q) {
    if (hideAnswer() && !S.revealed[q.id]) {
      return '<div class="bank-answer-hidden">' +
        '<p class="small muted">Đang bật chế độ ẩn đáp án — hãy tự trả lời trước khi xem.</p>' +
        '<button type="button" class="btn sm" data-reveal="' + esc(q.id) + '">Xem đáp án mẫu</button>' +
      '</div>';
    }
    return '<div class="md">' + App.md(q.a) + '</div>';
  }

  /** Mức tự đánh giá mà AI gợi ý (chỉ để highlight, người dùng tự bấm). */
  function suggestedMark(q) {
    const r = S.aiResult[q.id];
    if (!r || typeof r.score !== 'number') return '';
    return r.score >= 4 ? 'known' : r.score === 3 ? 'review' : 'unknown';
  }

  /** Thân câu hỏi khi đang mở (expanded). */
  function bodyHtml(q) {
    const follow = (q.follow || []).map(f => '<li>' + App.md(f) + '</li>').join('');
    const suggest = suggestedMark(q);
    return '<div class="bank-body">' +
      practiceHtml(q) +
      answerHtml(q) +
      (follow ? '<div class="bank-follow"><h4>Interviewer có thể hỏi tiếp</h4><ul>' + follow + '</ul></div>' : '') +
      '<div class="bank-grade">' +
        '<span class="small muted">Tự đánh giá:</span>' +
        GRADES.map(g => '<button type="button" class="btn ' + g.cls + ' sm' +
          (suggest === g.id ? ' is-suggest' : '') + '" data-grade="' + g.id + '" data-id="' +
          esc(q.id) + '">' + g.label + '</button>').join('') +
      '</div>' +
    '</div>';
  }

  /** Một card câu hỏi. */
  function cardHtml(q, idx) {
    const open = !!S.expanded[q.id];
    return '<article class="card bank-card' + (open ? ' is-open' : '') + '" data-id="' + esc(q.id) + '">' +
      headHtml(q, idx) +
      (open ? bodyHtml(q) : '') +
    '</article>';
  }

  /** Chips chọn topic. */
  function topicChips() {
    const items = [{ id: 'all', name: 'Tất cả', icon: '📚' }].concat(App.topics());
    return '<div class="chips bank-topic-chips" role="group" aria-label="Lọc theo chủ đề">' +
      items.map(t => '<button type="button" class="chip' + (S.topic === t.id ? ' active' : '') +
        '" data-topic="' + esc(t.id) + '" aria-pressed="' + (S.topic === t.id ? 'true' : 'false') + '">' +
        esc((t.icon ? t.icon + ' ' : '') + t.name) + '</button>').join('') +
      '</div>';
  }

  /** Chips trạng thái. */
  function statusChips() {
    return '<div class="chips bank-status-chips" role="group" aria-label="Lọc theo trạng thái">' +
      STATUS_CHIPS.map(s => '<button type="button" class="chip' + (S.status === s.id ? ' active' : '') +
        '" data-status="' + s.id + '" aria-pressed="' + (S.status === s.id ? 'true' : 'false') + '">' +
        esc(s.label) + '</button>').join('') +
      '</div>';
  }

  /** Select level. */
  function levelSelect() {
    const opts = ['<option value="all"' + (S.level === 'all' ? ' selected' : '') + '>Mọi level</option>'];
    Object.keys(App.LEVELS).forEach(k => {
      opts.push('<option value="' + esc(k) + '"' + (S.level === k ? ' selected' : '') + '>' +
        esc(App.LEVELS[k]) + '</option>');
    });
    return '<label class="field bank-field"><span>Level</span><select class="select" id="bankLevel">' +
      opts.join('') + '</select></label>';
  }

  /** Thanh lọc: tìm kiếm + topic + level + trạng thái. */
  function filterBar() {
    return '<section class="card bank-filters">' +
      '<div class="bank-search-row">' +
        '<label class="field bank-search"><span>Tìm kiếm</span>' +
          '<input class="input" id="bankSearch" type="search" placeholder="Từ khoá trong câu hỏi, đáp án, tag…" value="' +
          esc(S.q) + '" autocomplete="off"></label>' +
        levelSelect() +
      '</div>' +
      '<label class="bank-toggle"><input type="checkbox" id="bankHideAnswer"' +
        (hideAnswer() ? ' checked' : '') + '> <span>Ẩn đáp án cho tới khi tự trả lời</span></label>' +
      topicChips() +
      statusChips() +
    '</section>';
  }

  /** Render danh sách câu hỏi + nút "Xem thêm" (phân trang). */
  function listHtml() {
    const all = filtered();
    if (!all.length) {
      return '<div class="empty"><p>Không có câu hỏi nào khớp bộ lọc hiện tại.</p>' +
        '<p class="small">Thử bỏ bớt điều kiện lọc hoặc xem tất cả chủ đề.</p></div>';
    }
    const slice = all.slice(0, S.shown);
    const cards = slice.map((q, i) => cardHtml(q, i + 1)).join('');
    const more = all.length > S.shown
      ? '<div class="bank-more"><button type="button" class="btn" id="bankMore">Xem thêm (' +
        (all.length - S.shown) + ' câu còn lại)</button></div>'
      : '';
    return '<div class="bank-list" id="bankList">' + cards + '</div>' + more;
  }

  /** Render lại phần tiêu đề + danh sách (giữ nguyên focus ô tìm kiếm). */
  function renderList() {
    const listWrap = document.getElementById('bankListWrap');
    if (!listWrap) return;
    const all = filtered();
    const count = document.getElementById('bankCount');
    if (count) count.textContent = all.length + ' câu hỏi đang hiển thị';
    // Dừng ghi âm trước khi thay DOM, tránh ghi vào textarea đã bị gỡ.
    if (mic) stopMic();
    listWrap.innerHTML = listHtml();
    syncExpandButtons(all);
  }

  /** Cập nhật trạng thái nút "Mở/Thu gọn tất cả". */
  function syncExpandButtons(list) {
    const btn = document.getElementById('bankExpandAll');
    if (!btn) return;
    const arr = list || filtered();
    const anyClosed = arr.some(q => !S.expanded[q.id]);
    btn.textContent = anyClosed ? 'Mở tất cả' : 'Thu gọn tất cả';
    btn.dataset.mode = anyClosed ? 'open' : 'close';
  }

  /** Mở/thu gọn tất cả các câu đang hiển thị. */
  function toggleAll(mode) {
    const arr = filtered().slice(0, S.shown);
    arr.forEach(q => { S.expanded[q.id] = (mode === 'open'); });
    renderList();
  }

  /** Cập nhật URL (topic) mà không reload trang. */
  function syncUrl() {
    if (!window.history || !window.history.replaceState) return;
    const hash = S.topic === 'all' ? '#/bank' : '#/bank/' + encodeURIComponent(S.topic);
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  /** Gắn event cho toàn bộ view (delegation trên root). */
  function bindEvents() {
    if (!rootEl) return;

    // Listener trên #main chỉ gắn 1 lần (root tồn tại xuyên suốt các route).
    if (rootEl.dataset.bankBound !== '1') {
      rootEl.dataset.bankBound = '1';
      rootEl.addEventListener('click', onRootClick);
      rootEl.addEventListener('input', onRootInput);
      rootEl.addEventListener('toggle', onRootToggle, true);
    }

    // Ô tìm kiếm / select được tạo lại mỗi lần render -> gắn lại listener.
    const search = document.getElementById('bankSearch');
    if (search) {
      search.addEventListener('input', () => {
        const v = search.value;
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          S.q = v;
          S.shown = PAGE_SIZE;
          renderList();
        }, DEBOUNCE_MS);
      });
    }

    const level = document.getElementById('bankLevel');
    if (level) level.addEventListener('change', () => {
      S.level = level.value;
      S.shown = PAGE_SIZE;
      renderList();
    });

    const hide = document.getElementById('bankHideAnswer');
    if (hide) hide.addEventListener('change', () => {
      setHideAnswer(hide.checked);
      renderList();
    });
  }

  /** Lưu câu trả lời đang gõ vào bộ nhớ (không lưu bền vững). */
  function onRootInput(e) {
    const ta = e.target.closest('[data-answer]');
    if (ta) S.answers[ta.dataset.answer] = ta.value;
  }

  /** Ghi nhớ khối "Luyện trả lời" đang mở hay đóng. */
  function onRootToggle(e) {
    const det = e.target && e.target.closest ? e.target.closest('[data-practice]') : null;
    if (det) S.practiceOpen[det.dataset.practice] = det.open;
  }

  /** Xử lý click trong view bank (event delegation). */
  function onRootClick(e) {
    const topicChip = e.target.closest('[data-topic]');
      if (topicChip) {
        S.topic = topicChip.dataset.topic;
        S.shown = PAGE_SIZE;
        rootEl.querySelectorAll('[data-topic]').forEach(b => {
          const on = b.dataset.topic === S.topic;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        syncUrl();
        renderList();
        return;
      }

      const statusChip = e.target.closest('[data-status]');
      if (statusChip) {
        S.status = statusChip.dataset.status;
        S.shown = PAGE_SIZE;
        rootEl.querySelectorAll('[data-status]').forEach(b => {
          const on = b.dataset.status === S.status;
          b.classList.toggle('active', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        renderList();
        return;
      }

      const star = e.target.closest('[data-bookmark]');
      if (star) {
        e.stopPropagation();
        const on = App.store.toggleBookmark(star.dataset.bookmark);
        star.textContent = on ? '★' : '☆';
        star.setAttribute('aria-pressed', on ? 'true' : 'false');
        star.setAttribute('aria-label', on ? 'Bỏ đánh dấu câu hỏi' : 'Đánh dấu câu hỏi');
        star.title = on ? 'Bỏ đánh dấu' : 'Đánh dấu';
        return;
      }

      const reveal = e.target.closest('[data-reveal]');
      if (reveal) {
        e.stopPropagation();
        S.revealed[reveal.dataset.reveal] = true;
        refreshCard(reveal.dataset.reveal);
        return;
      }

      const micBtn = e.target.closest('[data-mic]');
      if (micBtn) {
        e.stopPropagation();
        toggleMic(micBtn.dataset.mic);
        return;
      }

      const aiBtn = e.target.closest('[data-grade-ai]');
      if (aiBtn) {
        e.stopPropagation();
        gradeAnswer(aiBtn.dataset.gradeAi, aiBtn);
        return;
      }

      const grade = e.target.closest('[data-grade]');
      if (grade) {
        e.stopPropagation();
        App.store.setStatus(grade.dataset.id, grade.dataset.grade);
        updateStatusDot(grade.dataset.id);
        return;
      }

      if (e.target.closest('#bankMore')) {
        S.shown += PAGE_SIZE;
        renderList();
        return;
      }

      const expandAll = e.target.closest('#bankExpandAll');
      if (expandAll) {
        toggleAll(expandAll.dataset.mode === 'close' ? 'close' : 'open');
        return;
      }

    const head = e.target.closest('.bank-head');
    if (head) {
      const card = head.closest('.bank-card');
      if (card) toggleCard(card.dataset.id);
    }
  }

  /** Mở/thu gọn một câu hỏi (render lại card đó). */
  function toggleCard(id) {
    S.expanded[id] = !S.expanded[id];
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    const q = App.questions().find(x => x.id === id);
    if (!q) return;
    const open = !!S.expanded[id];
    card.classList.toggle('is-open', open);
    card.innerHTML = headHtml(q, card.querySelector('.bank-idx') ? Number(card.querySelector('.bank-idx').textContent) : 0) +
      (open ? bodyHtml(q) : '');
  }

  /** Render lại thân một card đang mở (giữ nguyên câu trả lời đang gõ). */
  function refreshCard(id) {
    if (!rootEl || !S.expanded[id]) return;
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    const q = App.questions().find(x => x.id === id);
    if (!q) return;
    const idx = card.querySelector('.bank-idx') ? Number(card.querySelector('.bank-idx').textContent) : 0;
    card.innerHTML = headHtml(q, idx) + bodyHtml(q);
  }

  /** Chấm câu trả lời tự luận bằng AI; chỉ highlight mức tự đánh giá gợi ý. */
  async function gradeAnswer(id, btn) {
    const q = App.questions().find(x => x.id === id);
    if (!q || !rootEl) return;
    const viewRoot = rootEl;
    const ta = rootEl.querySelector('textarea[data-answer="' + CSS.escape(id) + '"]');
    const answer = (ta ? ta.value : S.answers[id] || '').trim();
    const box = rootEl.querySelector('[data-feedback="' + CSS.escape(id) + '"]');
    if (!box) return;
    if (!answer) {
      box.innerHTML = '<div class="ai-error">⚠️ Hãy viết câu trả lời (hoặc dùng micro) trước khi nhờ AI chấm.</div>';
      return;
    }
    const buttons = rootEl.querySelectorAll('[data-grade-ai="' + CSS.escape(id) + '"]');
    buttons.forEach(b => { b.disabled = true; });
    box.innerHTML = '<span class="ai-loading">AI đang chấm…</span>';
    try {
      const r = await App.ai.grade({
        question: q.q,
        reference: q.a,
        answer: answer,
        lang: q.lang === 'en' ? 'en' : 'vi',
        topic: q.topic,
        level: q.level,
        speech: S.speech[id] || undefined,
      });
      S.aiResult[id] = r;
      if (rootEl !== viewRoot) return;
      const currentBox = viewRoot.querySelector('[data-feedback="' + CSS.escape(id) + '"]');
      if (currentBox) currentBox.innerHTML = App.ui.feedback(r, q.lang);
      const suggest = r.score >= 4 ? 'known' : r.score === 3 ? 'review' : 'unknown';
      const card = viewRoot.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
      if (card) card.querySelectorAll('[data-grade]').forEach(b => {
        b.classList.toggle('is-suggest', b.dataset.grade === suggest);
      });
    } catch (e) {
      if (rootEl === viewRoot) {
        const currentBox = viewRoot.querySelector('[data-feedback="' + CSS.escape(id) + '"]');
        if (currentBox) currentBox.innerHTML = App.ui.error(e);
      }
    } finally {
      buttons.forEach(b => { b.disabled = false; });
    }
  }

  function setMicBtn(id, recording) {
    if (!rootEl) return;
    const btn = rootEl.querySelector('[data-mic="' + CSS.escape(id) + '"]');
    if (!btn) return;
    btn.classList.toggle('recording', recording);
    btn.textContent = recording ? '⏹ Dừng' : '🎤 Nói';
    btn.setAttribute('aria-label', recording ? 'Dừng ghi âm' : 'Đọc câu trả lời bằng giọng nói');
  }

  function micError(id, msg) {
    if (!rootEl) return;
    const box = rootEl.querySelector('[data-feedback="' + CSS.escape(id) + '"]');
    if (box) box.innerHTML = '<div class="ai-error">⚠️ ' + esc(msg) + '</div>';
  }

  function stopMic() {
    if (!mic) return;
    const id = mic.id;
    const handle = mic.handle;
    mic = null;
    let metrics = null;
    try { metrics = handle.stop(); } catch (e) { /* ignore */ }
    setMicBtn(id, false);
    if (!metrics) return;
    S.speech[id] = metrics;
    if (!rootEl) return;
    const ta = rootEl.querySelector('textarea[data-answer="' + CSS.escape(id) + '"]');
    if (ta) S.answers[id] = ta.value;
    const stats = rootEl.querySelector('[data-speech="' + CSS.escape(id) + '"]');
    if (stats) stats.innerHTML = App.ui.speechStats(metrics);
  }

  function toggleMic(id) {
    if (mic && mic.id === id) { stopMic(); return; }
    if (mic) stopMic();
    const q = App.questions().find(x => x.id === id);
    if (!q || !rootEl) return;
    const ta = rootEl.querySelector('textarea[data-answer="' + CSS.escape(id) + '"]');
    if (!ta) return;
    try {
      const handle = App.speech.start({
        lang: q.lang === 'en' ? 'en' : 'vi',
        onText(finalText, interim) {
          const v = finalText + (interim ? (finalText ? ' ' : '') + interim : '');
          ta.value = v;
          S.answers[id] = v;
        },
        onError(msg) {
          mic = null;
          setMicBtn(id, false);
          micError(id, msg);
        },
      });
      mic = { id: id, handle: handle };
      setMicBtn(id, true);
    } catch (e) {
      micError(id, e && e.message ? e.message : 'Không mở được micro.');
    }
  }

  /** Cập nhật chấm trạng thái sau khi tự đánh giá. */
  function updateStatusDot(id) {
    const card = rootEl.querySelector('.bank-card[data-id="' + CSS.escape(id) + '"]');
    if (!card) return;
    const dotWrap = card.querySelector('.bank-dot-wrap');
    if (!dotWrap) return;
    const s = App.store.getStatus(id);
    const info = s && App.STATUS[s] ? App.STATUS[s] : { label: 'Chưa học', cls: '' };
    dotWrap.innerHTML = '<span class="dot ' + info.cls + '"></span>';
    dotWrap.title = info.label;
  }

  App.registerView('bank', {
    title: 'Ngân hàng câu hỏi',
    render(root, params) {
      // Topic lấy từ route (#/bank/core), mặc định "all".
      const topicParam = (params && params[0]) || 'all';
      S.topic = topicParam === 'all' ? 'all' : topicParam;
      if (S.topic !== 'all' && !App.topics().some(t => t.id === S.topic)) S.topic = 'all';
      S.shown = PAGE_SIZE;

      const all = filtered();
      const head =
        '<div class="page-head">' +
          '<div><h1>Ngân hàng câu hỏi</h1>' +
          '<p class="muted">Lọc theo chủ đề, level, trạng thái; mở đáp án mẫu và tự đánh giá để lên lịch ôn SRS.</p></div>' +
          '<div class="row bank-head-actions">' +
            '<span class="small muted" id="bankCount">' + all.length + ' câu hỏi đang hiển thị</span>' +
            '<button type="button" class="btn sm" id="bankExpandAll">Mở tất cả</button>' +
          '</div>' +
        '</div>';

      root.innerHTML = '<div id="bankRoot">' + head + filterBar() +
        '<div id="bankListWrap">' + listHtml() + '</div></div>';

      rootEl = document.getElementById('bankRoot');
      bindEvents();
      syncExpandButtons(all);

      return () => {
        clearTimeout(searchTimer);
        if (mic) stopMic();
        rootEl = null;
      };
    },
  });
})();
