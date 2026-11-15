/*
 * Visual model answer (2026-11-15): turns the HTML of App.md(answer) into a learner-friendly layout.
 *   App.ui.answer(html, { lang })  → string
 * - the opening "**Tóm tắt:**" paragraph becomes a highlighted summary card (💡) with a 🔊 read-aloud button
 * - every "### heading" becomes a foldable section card with an icon picked from the heading
 *   (⚙️ cơ chế, 🧪 ví dụ, 🏭 ví dụ đời thực, ⚖️ so sánh, 🧭 khi nào dùng, ⚠️ pitfall, 🎤 trả lời mẫu…)
 * - "📖 Học từng bước" shows one section at a time (Trước / Tiếp, phím ← →), ending with a "say it aloud" prompt
 * - 🔊 uses speechSynthesis (vi-VN / en-US); hidden when the browser has none
 * Event handling is one delegated document listener, so views only insert the returned HTML.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  const App = window.App;
  if (!App) return;
  App.ui = App.ui || {};

  App.i18n && App.i18n.add({
    vi: {
      'ans.summary': 'Tóm tắt', 'ans.read': 'Đọc to', 'ans.stop': 'Dừng đọc',
      'ans.step': '📖 Học từng bước', 'ans.all': '📄 Xem toàn bộ', 'ans.prev': '← Trước', 'ans.next': 'Tiếp →',
      'ans.progress': 'Phần {i}/{n}', 'ans.foldAll': 'Thu gọn các mục', 'ans.openAll': 'Mở các mục',
      'ans.recall': '🎤 Giờ gập đáp án lại và tự nói câu trả lời trong 60–90 giây. Nói được trôi chảy mới chấm "Đã thuộc".',
    },
    en: {
      'ans.summary': 'Summary', 'ans.read': 'Read aloud', 'ans.stop': 'Stop reading',
      'ans.step': '📖 Step by step', 'ans.all': '📄 Show everything', 'ans.prev': '← Back', 'ans.next': 'Next →',
      'ans.progress': 'Part {i}/{n}', 'ans.foldAll': 'Fold sections', 'ans.openAll': 'Open sections',
      'ans.recall': '🎤 Now hide the answer and say it aloud in 60–90 seconds. Only mark "Known" when it flows.',
    },
  });
  const t = (k, v) => (App.t ? App.t('ans.' + k, v) : k);

  // heading text → icon + kind (first match wins; Vietnamese + English headings)
  const KINDS = [
    [/trả lời mẫu|sample answer|interview answer|khi phỏng vấn/i, '🎤', 'say'],
    [/pitfall|bẫy|lỗi hay gặp|sai lầm|anti-?pattern|cạm bẫy|gotcha|lưu ý/i, '⚠️', 'warn'],
    [/đời thực|production|real[- ]world|case study|sự cố/i, '🏭', 'real'],
    [/so sánh|trade-?off|compare|vs\b|khác nhau|ưu.*nhược/i, '⚖️', 'cmp'],
    [/khi nào|when to|chọn|lựa chọn|nên dùng/i, '🧭', 'when'],
    [/cơ chế|bên trong|hoạt động|internals?|how it works|vì sao|tại sao|nguyên lý|why/i, '⚙️', 'how'],
    [/ví dụ|example|code|minh hoạ|minh họa|demo/i, '🧪', 'ex'],
    [/sơ đồ|diagram|luồng|flow|kiến trúc|architecture/i, '🗺️', 'flow'],
    [/tuning|cấu hình|config|đo|metric|monitor|giám sát/i, '📈', 'ops'],
  ];
  function kindOf(title) {
    for (const [re, icon, kind] of KINDS) if (re.test(title)) return { icon, kind };
    return { icon: '📌', kind: 'other' };
  }
  const strip = h => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
  const tts = () => typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';

  /** @param {string} html output of App.md(answer) (headings are <h4>, may carry id attributes) */
  App.ui.answer = function (html, opts) {
    opts = opts || {};
    html = String(html || '');
    const parts = html.split(/(?=<h4[\s>])/);
    let intro = parts[0].startsWith('<h4') ? '' : parts.shift();
    if (!parts.length) return '<div class="md">' + html + '</div>';   // short answer without sections: unchanged
    const read = tts() ? (label) => '<button type="button" class="btn ghost sm ans-read" data-ans-read aria-label="' + App.esc(label) + '" title="' + App.esc(label) + '">🔊</button>' : () => '';
    // summary card: the "Tóm tắt:" paragraph (anything else before the first heading stays as plain intro)
    let summary = '';
    const m = /^\s*<p><strong>(Tóm tắt|Summary|TL;DR)\s*:?\s*<\/strong>\s*:?\s*([\s\S]*?)<\/p>/i.exec(intro);
    if (m) {
      summary = '<div class="ans-summary" data-ans-say><div class="ans-summary-head"><b>💡 ' + App.esc(t('summary')) + '</b>' + read(t('read')) + '</div>' +
        '<div class="md ans-say-text">' + m[2] + '</div></div>';
      intro = intro.slice(m[0].length);
    }
    const secs = parts.map((p, i) => {
      const hm = /^<h4([^>]*)>([\s\S]*?)<\/h4>/.exec(p);
      const title = hm ? strip(hm[2]) : '';
      const body = hm ? p.slice(hm[0].length) : p;
      const k = kindOf(title);
      return '<details class="ans-sec ans-k-' + k.kind + '" open data-ans-sec="' + i + '"' + (k.kind === 'say' ? ' data-ans-say' : '') + '>' +
        '<summary><span class="ans-ico" aria-hidden="true">' + k.icon + '</span><h4' + (hm ? hm[1] : '') + '>' + (hm ? hm[2] : '') + '</h4>' +
          (k.kind === 'say' ? read(t('read')) : '') + '</summary>' +
        '<div class="md ans-body ans-say-text">' + body + '</div></details>';
    });
    const lang = opts.lang === 'en' ? 'en' : 'vi';
    return '<div class="ans" data-ans data-lang="' + lang + '" data-n="' + secs.length + '">' +
      '<div class="ans-bar">' +
        '<button type="button" class="btn sm" data-ans-mode>' + App.esc(t('step')) + '</button>' +
        '<button type="button" class="btn ghost sm" data-ans-fold>' + App.esc(t('foldAll')) + '</button>' +
        '<span class="ans-progress small muted" data-ans-progress hidden></span>' +
      '</div>' +
      summary + (strip(intro) ? '<div class="md ans-intro">' + intro + '</div>' : '') +
      secs.join('') +
      '<div class="ans-steps" hidden><button type="button" class="btn sm" data-ans-prev>' + App.esc(t('prev')) + '</button>' +
        '<button type="button" class="btn primary sm" data-ans-next>' + App.esc(t('next')) + '</button></div>' +
      '<p class="ans-recall" hidden>' + App.esc(t('recall')) + '</p>' +
    '</div>';
  };

  // ---------- behaviour (one delegated listener for every answer on the page) ----------
  if (typeof document === 'undefined' || !document.addEventListener) return;
  let speaking = null;   // button currently reading
  function stopSpeech() {
    if (tts()) window.speechSynthesis.cancel();
    if (speaking) { speaking.textContent = '🔊'; speaking.setAttribute('aria-label', t('read')); speaking = null; }
  }
  function speak(btn) {
    if (speaking === btn) { stopSpeech(); return; }
    stopSpeech();
    const box = btn.closest('[data-ans-say]'), wrap = btn.closest('[data-ans]');
    const textEl = box && box.querySelector('.ans-say-text');
    if (!textEl) return;
    const lang = wrap && wrap.dataset.lang === 'en' ? 'en' : 'vi';
    const u = new window.SpeechSynthesisUtterance(textEl.textContent.replace(/\s+/g, ' ').trim());
    u.lang = lang === 'en' ? 'en-US' : 'vi-VN';
    const v = window.speechSynthesis.getVoices().find(x => x.lang && x.lang.toLowerCase().startsWith(lang));
    if (v) u.voice = v;
    u.onend = u.onerror = () => { if (speaking === btn) stopSpeech(); };
    speaking = btn; btn.textContent = '⏹'; btn.setAttribute('aria-label', t('stop'));
    window.speechSynthesis.speak(u);
  }
  function show(wrap, i) {
    const secs = wrap.querySelectorAll('[data-ans-sec]'), n = secs.length;
    i = Math.max(0, Math.min(n - 1, i));
    wrap.dataset.step = String(i);
    secs.forEach((s, j) => { s.hidden = j !== i; if (j === i) s.open = true; });
    const pr = wrap.querySelector('[data-ans-progress]');
    if (pr) { pr.hidden = false; pr.textContent = t('progress', { i: i + 1, n }); }
    const prev = wrap.querySelector('[data-ans-prev]'), next = wrap.querySelector('[data-ans-next]');
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === n - 1;
    const recall = wrap.querySelector('.ans-recall');
    if (recall) recall.hidden = i !== n - 1;
  }
  function setStepMode(wrap, on) {
    wrap.classList.toggle('is-step', on);
    const btn = wrap.querySelector('[data-ans-mode]');
    if (btn) btn.textContent = on ? t('all') : t('step');
    const steps = wrap.querySelector('.ans-steps');
    if (steps) steps.hidden = !on;
    if (on) show(wrap, 0);
    else {
      wrap.querySelectorAll('[data-ans-sec]').forEach(s => { s.hidden = false; });
      const pr = wrap.querySelector('[data-ans-progress]'); if (pr) pr.hidden = true;
      const recall = wrap.querySelector('.ans-recall'); if (recall) recall.hidden = true;
    }
  }
  document.addEventListener('click', e => {
    const tgt = e.target;
    if (!tgt || !tgt.closest) return;
    const wrap = tgt.closest('[data-ans]');
    if (!wrap) return;
    const read = tgt.closest('[data-ans-read]');
    if (read) { e.preventDefault(); e.stopPropagation(); speak(read); return; }   // inside <summary>: do not fold
    if (tgt.closest('[data-ans-mode]')) { setStepMode(wrap, !wrap.classList.contains('is-step')); return; }
    if (tgt.closest('[data-ans-next]')) { show(wrap, Number(wrap.dataset.step || 0) + 1); return; }
    if (tgt.closest('[data-ans-prev]')) { show(wrap, Number(wrap.dataset.step || 0) - 1); return; }
    const fold = tgt.closest('[data-ans-fold]');
    if (fold) {
      const secs = wrap.querySelectorAll('[data-ans-sec]');
      const anyOpen = Array.prototype.some.call(secs, s => s.open);
      secs.forEach(s => { s.open = !anyOpen; });
      fold.textContent = anyOpen ? t('openAll') : t('foldAll');
    }
  });
  // ← → move between steps of the answer that is in step mode and on screen (ignored while typing)
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const el = e.target;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
    const wrap = document.querySelector('.ans.is-step');
    if (!wrap) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    show(wrap, Number(wrap.dataset.step || 0) + (e.key === 'ArrowRight' ? 1 : -1));
  }, true);
  window.addEventListener && window.addEventListener('hashchange', stopSpeech);
})();
