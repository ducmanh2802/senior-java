/* Sequence diagrams drawn as inline SVG from data — shared by App.md (~~~seq blocks), the projects view
 * (business.diagrams) and scripts/validate.js. Colours come from CSS classes (.sq-*) in css/base.css, so
 * light/dark mode just work. Classic script (no modules): exposes window.Diagram; module.exports in Node.
 *
 * ~~~seq text syntax (one statement per line):
 *   title: Chuyển tiền nội bộ            optional
 *   actors: App | Wallet API | DB         optional; otherwise actors appear in order of first use
 *   App -> Wallet API: POST /transfers    request (solid arrow)
 *   Wallet API --> App: 201 Created       reply (dashed arrow)
 *   DB -> DB: kiểm tra số dư              self call
 *   note Wallet API..DB: BEGIN … COMMIT   note spanning actors (or "note DB: …" for one actor)
 */
(function (root) {
  'use strict';
  const escX = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // text → {title, actors[], steps[]}; throws Error with a readable message on bad lines
  function parseSeq(text) {
    const d = { title: '', actors: [], steps: [] };
    const idx = name => {
      name = name.trim();
      if (!name) throw new Error('thiếu tên actor');
      let i = d.actors.indexOf(name);
      if (i < 0) { d.actors.push(name); i = d.actors.length - 1; }
      return i;
    };
    String(text).replace(/\r/g, '').split('\n').forEach((raw, n) => {
      const l = raw.trim();
      if (!l || l.startsWith('#')) return;
      let m;
      if ((m = l.match(/^title:\s*(.+)$/i))) d.title = m[1].trim();
      else if ((m = l.match(/^actors:\s*(.+)$/i))) m[1].split('|').forEach(idx);
      else if ((m = l.match(/^note\s+([^:]+?)(?:\.\.([^:]+?))?\s*:\s*(.+)$/i))) {
        const a = idx(m[1]), b = m[2] ? idx(m[2]) : a;
        d.steps.push({ note: m[3].trim(), over: [a, b] });
      } else if ((m = l.match(/^(.+?)\s*(-->|->)\s*(.+?)\s*:\s*(.+)$/))) {
        d.steps.push({ from: idx(m[1]), to: idx(m[3]), text: m[4].trim(), reply: m[2] === '-->' });
      } else throw new Error('dòng ' + (n + 1) + ' không hiểu được: "' + l.slice(0, 40) + '" (dùng A -> B: text, A --> B: text, note A..B: text)');
    });
    if (d.actors.length < 2 || d.actors.length > 6) throw new Error('cần 2–6 actors (đang có ' + d.actors.length + ')');
    if (d.steps.length < 2) throw new Error('cần ít nhất 2 bước');
    return d;
  }

  function wrap(text, max) {
    const lines = []; let cur = '';
    String(text).split(/\s+/).forEach(w => {
      if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  let uid = 0;
  // {title, actors[], steps[]} → '<svg …>'; step numbers are prefixed to messages
  function seqSvg(d) {
    const id = 'sqa' + (++uid);   // unique marker id: markers inside a hidden SVG would not render elsewhere
    const n = d.actors.length, COL = 180, HEAD = 46, W = n * COL;
    const cx = i => COL / 2 + i * COL;
    let y = HEAD + 26, body = '', num = 0;
    d.steps.forEach((s, k) => {
      const g = (label, inner) => '<g class="sq-step" data-i="' + k + '" data-label="' + escX(label) + '">' + inner + '</g>';
      if (s.note != null) {
        const over = (s.over && s.over.length ? s.over : [0]).map(Number);
        const a = Math.min(...over), b = Math.max(...over);
        const x1 = cx(a) - COL / 2 + 12, x2 = cx(b) + COL / 2 - 12;
        const lines = wrap(s.note, Math.max(18, Math.floor((x2 - x1) / 7)));
        const h = lines.length * 16 + 12;
        body += g('📝 ' + s.note, '<rect class="sq-note" x="' + x1 + '" y="' + y + '" width="' + (x2 - x1) + '" height="' + h + '" rx="6"/>' +
          lines.map((l, i) => '<text class="sq-note-t" x="' + (x1 + x2) / 2 + '" y="' + (y + 20 + i * 16) + '" text-anchor="middle">' + escX(l) + '</text>').join(''));
        y += h + 16; return;
      }
      num++;
      const f = Number(s.from), t = Number(s.to), x1 = cx(f), x2 = cx(t), label = num + '. ' + s.text;
      if (f === t) {
        const lines = wrap(label, 24);
        const top = y + (lines.length - 1) * 15 + 6;
        body += g(d.actors[f] + ': ' + s.text, lines.map((l, i) => '<text class="sq-label" x="' + (x1 + 8) + '" y="' + (y + i * 15) + '">' + escX(l) + '</text>').join('') + '<path class="sq-line" d="M' + x1 + ' ' + top + ' h34 v18 h-34" marker-end="url(#' + id + ')"/>');
        y = top + 36; return;
      }
      const lines = wrap(label, Math.max(16, Math.floor(Math.abs(x2 - x1) / 7)));
      const ly = y + (lines.length - 1) * 15 + 8;
      body += g(d.actors[f] + ' → ' + d.actors[t] + ': ' + s.text, lines.map((l, i) => '<text class="sq-label" x="' + (x1 + x2) / 2 + '" y="' + (y + i * 15) + '" text-anchor="middle">' + escX(l) + '</text>').join('') + '<line class="sq-line' + (s.reply ? ' sq-reply' : '') + '" x1="' + x1 + '" y1="' + ly + '" x2="' + (x2 + (x2 > x1 ? -4 : 4)) + '" y2="' + ly + '" marker-end="url(#' + id + ')"/>');
      y = ly + 30;
    });
    const H = y + 6;
    const heads = d.actors.map((a, i) => {
      const lines = wrap(a, 20).slice(0, 2);
      return '<line class="sq-life" x1="' + cx(i) + '" y1="' + HEAD + '" x2="' + cx(i) + '" y2="' + H + '"/>' +
        '<rect class="sq-actor" x="' + (cx(i) - COL / 2 + 14) + '" y="4" width="' + (COL - 28) + '" height="' + (HEAD - 8) + '" rx="8"/>' +
        lines.map((l, k) => '<text class="sq-actor-t" x="' + cx(i) + '" y="' + ((lines.length === 1 ? 30 : 22) + k * 15) + '" text-anchor="middle">' + escX(l) + '</text>').join('');
    }).join('');
    return '<svg class="sq" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" role="img" aria-label="' + escX(d.title || d.actors.join(', ')) + '">' +
      '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="sq-head"/></marker></defs>' +
      heads + body + '</svg>';
  }

  // <figure> with ◀ ▶ controls that walk through the steps (captionHtml must already be safe HTML)
  function seqFigure(d, captionHtml) {
    const cap = captionHtml != null ? captionHtml : (d.title ? escX(d.title) : '');
    return '<figure class="diagram" data-at="-1">' + (cap ? '<figcaption>' + cap + '</figcaption>' : '') +
      '<div class="diagram-ctl"><button type="button" class="btn sm" data-sq="prev" aria-label="Bước trước">◀</button>' +
      '<button type="button" class="btn sm" data-sq="next" aria-label="Bước tiếp">▶ Đi từng bước</button>' +
      '<button type="button" class="btn sm" data-sq="all">Xem hết</button><span class="diagram-now" aria-live="polite"></span></div>' +
      '<div class="diagram-scroll">' + seqSvg(d) + '</div></figure>';
  }
  // one delegated listener for every diagram on the page (classic script, loaded once)
  function onStepClick(e) {
    const b = e.target.closest && e.target.closest('[data-sq]');
    if (!b) return;
    const fig = b.closest('.diagram'), steps = fig.querySelectorAll('.sq-step'), n = steps.length;
    let at = Number(fig.dataset.at);
    if (b.dataset.sq === 'next') at = at < 0 ? 0 : Math.min(at + 1, n - 1);
    else if (b.dataset.sq === 'prev') at = at < 0 ? n - 1 : Math.max(at - 1, 0);
    else at = -1;
    fig.dataset.at = at;
    steps.forEach((g, i) => { g.classList.toggle('sq-dim', at >= 0 && i > at); g.classList.toggle('sq-cur', i === at); });
    fig.querySelector('[data-sq="next"]').textContent = at < 0 ? '▶ Đi từng bước' : '▶';
    fig.querySelector('.diagram-now').textContent = at < 0 ? '' : 'Bước ' + (at + 1) + '/' + n + ': ' + steps[at].getAttribute('data-label');
  }
  if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('click', onStepClick);

  // figure HTML for a ~~~seq block; a bad block shows its error instead of breaking the page
  function seqBlock(text) {
    try {
      return seqFigure(parseSeq(text));
    } catch (e) {
      return '<pre class="code" data-lang="seq"><code>' + escX(text) + '\n\n⚠ ' + escX(e.message) + '</code></pre>';
    }
  }

  const api = { parseSeq, seqSvg, seqFigure, seqBlock };
  root.Diagram = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
