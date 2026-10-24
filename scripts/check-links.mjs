#!/usr/bin/env node
/*
 * Verify every learn-more link (QUESTIONS[].refs) really exists — AI-written links are often invented.
 *   node scripts/check-links.mjs              all files
 *   node scripts/check-links.mjs q-java.js    one file
 * YouTube: checked through the oEmbed endpoint (404 = no such video) and the real title is printed,
 * so a mismatching title can be fixed. Other URLs: GET following redirects; 404/410/DNS errors fail.
 * 401/403/429 (bot blocking) only warn. Exit 1 when any link is broken.
 */
import fs from 'fs';
import path from 'path';
import vm from 'vm';

const DATA = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'js', 'data');
const only = process.argv.slice(2).find(a => !a.startsWith('--'));
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of fs.readdirSync(DATA).filter(f => /^q-.*\.js$/.test(f) && (!only || f === only))) {
  const before = (sandbox.window.QUESTIONS || []).length;
  vm.runInContext(fs.readFileSync(path.join(DATA, f), 'utf8'), sandbox, { filename: f });
  (sandbox.window.QUESTIONS || []).slice(before).forEach(q => { q.__file = f; });
}
const refs = [];
for (const q of sandbox.window.QUESTIONS || []) (q.refs || []).forEach(r => refs.push({ id: q.id, file: q.__file, ...r }));

const yt = u => /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(u);
async function check(r) {
  try {
    if (yt(r.url)) {
      const res = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(r.url), { signal: AbortSignal.timeout(15000) });
      if (res.status !== 200) return { ...r, bad: true, why: 'YouTube: video không tồn tại / bị ẩn (oEmbed ' + res.status + ')' };
      const j = await res.json();
      return { ...r, real: j.title + ' — ' + j.author_name };
    }
    const res = await fetch(r.url, { redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'Mozilla/5.0 (link-check; senior-java-prep)' } });
    if ([404, 410].includes(res.status) || res.status >= 500) return { ...r, bad: true, why: 'HTTP ' + res.status };
    if (res.status >= 400) return { ...r, warn: 'HTTP ' + res.status + ' (có thể chặn bot)' };
    return r;
  } catch (e) {
    const why = (e.cause && e.cause.code) || e.name || String(e);
    // flaky network (timeout, reset) says nothing about the link; only a missing domain does
    if (why !== 'ENOTFOUND') return { ...r, warn: why + ' (lỗi mạng, chưa kiểm tra được)' };
    return { ...r, bad: true, why };
  }
}

const results = [];
for (let i = 0; i < refs.length; i += 6) results.push(...await Promise.all(refs.slice(i, i + 6).map(check)));
const bad = results.filter(r => r.bad), warn = results.filter(r => r.warn);
for (const r of results.filter(r => r.real)) console.log(`🎬 ${r.id}: "${r.title}"\n     thật: "${r.real}"`);
for (const r of warn) console.log(`⚠️  ${r.id}: ${r.url} — ${r.warn}`);
for (const r of bad) console.log(`❌ ${r.file} ${r.id}: ${r.url} — ${r.why}`);
console.log(`\nLinks: ${results.length} · hỏng ${bad.length} · cảnh báo ${warn.length}`);
// --fix: drop the broken ref entries (one-line `{ type: …, url: '<broken>' … },` objects) instead of failing
if (process.argv.includes('--fix') && bad.length) {
  const byFile = {};
  bad.forEach(r => { (byFile[r.file] = byFile[r.file] || new Set()).add(r.url); });
  for (const [file, urls] of Object.entries(byFile)) {
    const p = path.join(DATA, file);
    const lines = fs.readFileSync(p, 'utf8').split('\n');
    const kept = lines.filter(l => !([...urls].some(u => l.includes("'" + u + "'") || l.includes('"' + u + '"')) && /\{\s*type:/.test(l)));
    fs.writeFileSync(p, kept.join('\n'));
    console.log(`fixed ${file}: removed ${lines.length - kept.length} broken ref line(s)`);
  }
  process.exit(0);
}
process.exit(bad.length ? 1 : 0);
