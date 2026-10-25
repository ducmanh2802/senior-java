/*
 * T146 — Glossary: auto-link hard terms inside every .md block and open a shared explanation modal.
 * Data: window.GLOSSARY (js/data/glossary-*.js). Works with 0..n entries; no-op when empty.
 * Public API: App.glossary = { find(id), open(id), entries() }.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const SKIP = 'code, pre, a, button, kbd, h1, h2, input, textarea, .gl-term';
  // A "word" character for boundary checks: a match must not touch letters/digits on either side.
  const WORD = /[\p{L}\p{N}]/u;

  const byId = Object.create(null);
  let index = null;          // { re, map }
  let observer = null;
  let timer = 0;
  let dlg = null;
  let currentId = null;      // entry shown in the modal
  let stack = [];            // history for the ← back button
  let lastFocus = null;      // term clicked on the page, focused again on close

  function entries() {
    return Array.isArray(window.GLOSSARY) ? window.GLOSSARY : [];
  }

  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function buildIndex() {
    const list = entries();
    const map = Object.create(null);
    const aliases = [];
    Object.keys(byId).forEach(k => { delete byId[k]; });
    list.forEach(e => {
      if (!e || !e.id) return;
      if (!byId[e.id]) byId[e.id] = e;
      const al = (Array.isArray(e.aliases) && e.aliases.length) ? e.aliases : [e.term || e.id];
      al.forEach(a => {
        const key = String(a || '').trim().toLowerCase();
        if (key.length < 2 || map[key]) return;
        map[key] = e;
        aliases.push(key);
      });
    });
    if (!aliases.length) return null;
    aliases.sort((a, b) => b.length - a.length);   // longest phrase wins
    const src = '(?:' + aliases.map(reEsc).join('|') + ')';
    let re;
    try { re = new RegExp(src, 'giu'); }
    catch (e) { re = new RegExp(src, 'gi'); }      // very old engines: no unicode flag
    return { re, map };
  }

  function ensureIndex() {
    if (!index) index = buildIndex();
    return index;
  }

  // Wrap the first occurrence of every glossary entry inside one .md block.
  function linkNode(node, used, opts) {
    const text = node.nodeValue;
    if (!text) return;
    const re = index.re;
    re.lastIndex = 0;
    let frag = null;
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      const start = m.index;
      const end = start + m[0].length;
      if (start > 0 && WORD.test(text.charAt(start - 1))) continue;
      if (end < text.length && WORD.test(text.charAt(end))) continue;
      const entry = index.map[m[0].toLowerCase()];
      if (!entry || entry.id === opts.exclude || used[entry.id]) continue;
      used[entry.id] = true;
      if (!frag) frag = document.createDocumentFragment();
      if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gl-term';
      btn.setAttribute('data-gl-id', entry.id);
      btn.title = entry.short || entry.term || entry.id;
      btn.textContent = m[0];
      frag.appendChild(btn);
      last = end;
    }
    if (!frag) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function linkBlock(block, opts) {
    if (!block || block.nodeType !== 1 || !ensureIndex()) return;
    const used = Object.create(null);
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(node => {
      if (!node.nodeValue || !node.nodeValue.trim()) return;
      const parent = node.parentElement;
      if (!parent) return;
      if (parent.closest(SKIP)) return;
      // nested .md blocks are handled on their own, with their own first-occurrence budget
      if (parent.closest('.md') !== block) return;
      linkNode(node, used, opts || {});
    });
    block.setAttribute('data-gl', '1');
  }

  function scanAll() {
    if (!ensureIndex()) return;
    const blocks = document.querySelectorAll('.md:not([data-gl])');
    for (let i = 0; i < blocks.length; i++) linkBlock(blocks[i], {});
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(() => { timer = 0; scanAll(); }, 100);
  }

  function start() {
    scanAll();
    if (!index || observer || !document.body) return;
    observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ---------- modal ----------
  function ensureModal() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'gl-modal';
    dlg.setAttribute('aria-label', 'Giải thích thuật ngữ');
    dlg.innerHTML =
      '<div class="gl-head">' +
        '<button type="button" class="gl-back" aria-label="Quay lại" hidden>←</button>' +
        '<h3 class="gl-title"></h3>' +
        '<button type="button" class="gl-close" aria-label="Đóng">✕</button>' +
      '</div>' +
      '<div class="gl-body"></div>';
    document.body.appendChild(dlg);

    dlg.addEventListener('click', e => {
      if (e.target === dlg) { close(); return; }
      if (e.target.closest('.gl-close')) { close(); return; }
      if (e.target.closest('.gl-back')) { back(); return; }
      const rel = e.target.closest('[data-gl-open]');
      if (rel) open(rel.getAttribute('data-gl-open'), true);
    });
    dlg.addEventListener('close', restoreFocus);
    return dlg;
  }

  function render(e) {
    const body = dlg.querySelector('.gl-body');
    dlg.querySelector('.gl-title').textContent = e.term || e.id;
    dlg.querySelector('.gl-back').hidden = !stack.length;

    let html = '';
    if (e.short) html += '<p class="gl-short">' + App.esc(e.short) + '</p>';
    html += '<div class="md gl-body-md">' + App.md(e.body || e.short || '') + '</div>';

    const refs = Array.isArray(e.refs) ? e.refs : [];
    if (refs.length) {
      const items = refs.map(r => {
        const url = String((r && r.url) || '');
        if (!/^https:\/\//i.test(url)) return '';
        const icon = r.type === 'video' ? '🎬' : r.type === 'book' ? '📕'
          : r.type === 'course' ? '🎓' : r.type === 'article' ? '📝' : '📘';
        return '<li><a class="btn sm" href="' + App.esc(url) + '" target="_blank" rel="noopener noreferrer">' +
          icon + ' ' + App.esc(r.title || url) + '</a>' +
          (r.note ? ' <span class="muted small">' + App.esc(r.note) + '</span>' : '') + '</li>';
      }).join('');
      if (items) html += '<div class="gl-refs"><b>📚 Tìm hiểu thêm</b><ul>' + items + '</ul></div>';
    }

    const related = (Array.isArray(e.related) ? e.related : [])
      .filter(id => byId[id] && id !== e.id);
    if (related.length) {
      html += '<div class="gl-related"><b>Liên quan</b><div class="gl-related-row">' +
        related.map(id => '<button type="button" class="chip" data-gl-open="' + App.esc(id) + '">' +
          App.esc(byId[id].term || id) + '</button>').join('') + '</div></div>';
    }

    body.innerHTML = html;
    // explain the explanation too, but never link the entry to itself
    const mdEl = body.querySelector('.gl-body-md');
    if (mdEl) linkBlock(mdEl, { exclude: e.id });
    body.scrollTop = 0;
  }

  function open(id, push) {
    ensureIndex();
    const e = byId[id];
    if (!e) return;
    ensureModal();
    if (push && currentId && currentId !== id) stack.push(currentId);
    if (!push) stack = [];
    currentId = id;
    render(e);
    dlg.querySelector('.gl-back').hidden = !stack.length;
    if (!dlg.open) {
      try { dlg.showModal(); }
      catch (err) { dlg.setAttribute('open', ''); dlg.classList.add('gl-fallback'); }
    }
  }

  function back() {
    const prev = stack.pop();
    if (!prev || !byId[prev]) return;
    currentId = prev;
    render(byId[prev]);
  }

  function restoreFocus() {
    currentId = null;
    stack = [];
    const f = lastFocus;
    lastFocus = null;
    if (f && f.isConnected && typeof f.focus === 'function') {
      try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
    }
  }

  function close() {
    if (dlg && dlg.open && typeof dlg.close === 'function') dlg.close();
    else restoreFocus();
  }

  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target.closest('.gl-term') : null;
    if (!t) return;
    const id = t.getAttribute('data-gl-id');
    if (!id || !byId[id]) return;
    e.preventDefault();
    if (dlg && dlg.contains(t)) { open(id, true); return; }
    lastFocus = t;
    open(id, false);
  });

  // ---------- public API ----------
  function expose() {
    if (!window.App) return false;
    window.App.glossary = {
      find(id) { return (ensureIndex(), byId[id] || null); },
      open(id) { open(id, false); },
      entries() { return entries().slice(); },
    };
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { start(); expose(); });
  } else {
    start();
    expose();
  }
})();
