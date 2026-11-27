#!/usr/bin/env node
/*
 * Check the Freelance & Upwork guide (docs/UPWORK-GUIDE.md): js/data/upwork-guide.js (window.UPWORK_GUIDE)
 * and js/data/upwork-cases-*.js (window.UPWORK_CASES). Runnable alone or from scripts/validate.js:
 *   node scripts/check-upwork.js   -> prints counts, exits 1 on errors
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA = path.join(__dirname, '..', 'js', 'data');
const Diagram = require(path.join(__dirname, '..', 'js', 'core', 'diagram.js'));
const CATS = new Set(['account', 'proposal', 'contract', 'payment', 'client', 'scam', 'review']);
const LEVELS = new Set(['mid', 'senior', 'lead']);
const SEV = new Set(['high', 'medium', 'low']);
const CH_KEYS = new Set(['id', 'order', 'title', 'icon', 'summary', 'body', 'checklist', 'related']);
const CASE_KEYS = new Set(['id', 'category', 'level', 'severity', 'title', 'situation', 'signals', 'steps', 'templates',
  'mistakes', 'prevention', 'related', 'tags']);

function files() {
  return ['upwork-guide.js'].concat(fs.readdirSync(DATA).filter(f => /^upwork-cases-\d+\.js$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10)));
}

function questionIds() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of fs.readdirSync(DATA).filter(f => /^q-.*\.js$/.test(f))) {
    try { vm.runInContext(fs.readFileSync(path.join(DATA, f), 'utf8'), ctx, { filename: f }); } catch (e) { /* validate.js reports it */ }
  }
  return new Set((ctx.window.QUESTIONS || []).map(q => q.id));
}

function check() {
  const errors = [];
  const ctx = { window: {} };
  vm.createContext(ctx);
  const src = {};
  for (const f of files()) {
    src[f] = fs.readFileSync(path.join(DATA, f), 'utf8');
    const before = (ctx.window.UPWORK_CASES || []).length;
    try { vm.runInContext(src[f], ctx, { filename: f }); }
    catch (e) { errors.push(`${f}: lỗi cú pháp/chạy: ${e.message}`); continue; }
    (ctx.window.UPWORK_CASES || []).slice(before).forEach(c => { if (c) Object.defineProperty(c, '__file', { value: f }); });
  }
  const chapters = Array.isArray(ctx.window.UPWORK_GUIDE) ? ctx.window.UPWORK_GUIDE : [];
  const cases = Array.isArray(ctx.window.UPWORK_CASES) ? ctx.window.UPWORK_CASES : [];
  if (!chapters.length) errors.push('UPWORK_GUIDE rỗng hoặc không phải mảng');

  const str = (v, min) => typeof v === 'string' && v.trim().length >= min;
  function markup(where, s) {
    if (typeof s !== 'string') return;
    for (const m of s.matchAll(/^~~~seq[^\n]*\n([\s\S]*?)^~~~/gm)) {
      try { Diagram.parseSeq(m[1]); } catch (e) { errors.push(`${where}: sơ đồ ~~~seq lỗi: ${e.message}`); }
    }
    const prose = s.replace(/~~~[\s\S]*?~~~/g, '');
    if (s.split('\n').filter(l => l.startsWith('~~~')).length % 2) errors.push(`${where}: code fence ~~~ chưa đóng`);
    if (/`/.test(s)) errors.push(`${where}: có dấu backtick — inline code phải viết {{code}}`);
    if ((prose.match(/\{\{/g) || []).length !== (prose.match(/\}\}/g) || []).length) errors.push(`${where}: số {{ và }} không khớp`);
    if (/^[ \t]+### /m.test(prose)) errors.push(`${where}: tiêu đề ### bị thụt đầu dòng`);
    if (/<\/?(div|span|br|b|i|p|code|pre)\b/i.test(prose)) errors.push(`${where}: có thẻ HTML thô`);
  }
  function list(where, v, min, max, minLen) {
    if (!Array.isArray(v) || v.length < min || v.length > max) { errors.push(`${where}: cần mảng ${min}–${max} mục`); return; }
    v.forEach((x, i) => { if (!str(x, minLen)) errors.push(`${where}[${i}]: chuỗi ≥ ${minLen} ký tự`); });
  }
  // Vietnamese without diacritics is the most common free-model failure: require diacritics in long prose
  const VN = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi;
  function vietnamese(where, s) {
    if (typeof s !== 'string' || s.length < 300) return;
    const n = (s.match(VN) || []).length;
    if (n / s.length < 0.03) errors.push(`${where}: có vẻ viết tiếng Việt KHÔNG dấu — phải viết có dấu đầy đủ`);
  }

  const ids = new Set();
  const qids = questionIds();
  const orders = new Set();
  chapters.forEach((c, i) => {
    const id = c && c.id || `UPWORK_GUIDE[${i}]`;
    if (!c || typeof c !== 'object') { errors.push(`${id}: không phải object`); return; }
    if (!/^uw-ch-\d{2}$/.test(c.id || '')) errors.push(`${id}: id phải dạng uw-ch-NN`);
    if (ids.has(c.id)) errors.push(`${id}: id trùng`); ids.add(c.id);
    if (!Number.isInteger(c.order) || c.order < 1) errors.push(`${id}: order phải là số nguyên ≥ 1`);
    else if (orders.has(c.order)) errors.push(`${id}: order ${c.order} trùng`); else orders.add(c.order);
    if (!str(c.title, 5) || c.title.length > 90) errors.push(`${id}: title 5–90 ký tự`);
    if (!str(c.icon, 1) || c.icon.length > 4) errors.push(`${id}: icon là 1 emoji`);
    if (!str(c.summary, 40) || c.summary.length > 300) errors.push(`${id}: summary 40–300 ký tự`);
    if (!str(c.body, 3000)) errors.push(`${id}: body phải ≥ 3000 ký tự (đang ${(c.body || '').length})`);
    else {
      if (!/^\*\*Tóm tắt:\*\*/.test(c.body.trim())) errors.push(`${id}: body phải mở đầu bằng **Tóm tắt:**`);
      if (!/> Senior tip:/.test(c.body)) errors.push(`${id}: body phải có > Senior tip:`);
    }
    markup(`${id}.body`, c.body); vietnamese(`${id}.body`, c.body);
    list(`${id}.checklist`, c.checklist, 3, 8, 15);
    if (c.related != null && !Array.isArray(c.related)) errors.push(`${id}: related phải là mảng`);
    Object.keys(c).forEach(k => { if (!CH_KEYS.has(k)) errors.push(`${id}: field lạ "${k}"`); });
  });

  cases.forEach((c, i) => {
    const id = c && c.id || `UPWORK_CASES[${i}]`;
    if (!c || typeof c !== 'object') { errors.push(`${id}: không phải object`); return; }
    const at = `${c.__file}: ${id}`;
    if (!/^uw-case-\d{3}$/.test(c.id || '')) errors.push(`${at}: id phải dạng uw-case-NNN`);
    if (ids.has(c.id)) errors.push(`${at}: id trùng`); ids.add(c.id);
    if (!CATS.has(c.category)) errors.push(`${at}: category phải là ${[...CATS].join('|')}`);
    if (!LEVELS.has(c.level)) errors.push(`${at}: level phải là mid|senior|lead`);
    if (!SEV.has(c.severity)) errors.push(`${at}: severity phải là high|medium|low`);
    if (!str(c.title, 10) || c.title.length > 110) errors.push(`${at}: title 10–110 ký tự`);
    if (!str(c.situation, 300)) errors.push(`${at}: situation ≥ 300 ký tự`);
    if (!str(c.steps, 1200)) errors.push(`${at}: steps ≥ 1200 ký tự (đang ${(c.steps || '').length})`);
    if (!str(c.prevention, 300)) errors.push(`${at}: prevention ≥ 300 ký tự`);
    else if (!/> Senior tip:/.test(c.prevention)) errors.push(`${at}: prevention phải kết bằng > Senior tip:`);
    for (const k of ['situation', 'steps', 'prevention']) { markup(`${at}.${k}`, c[k]); vietnamese(`${at}.${k}`, c[k]); }
    list(`${at}.signals`, c.signals, 2, 6, 15);
    list(`${at}.mistakes`, c.mistakes, 2, 6, 15);
    if (!Array.isArray(c.templates) || c.templates.length < 1 || c.templates.length > 4) errors.push(`${at}: templates cần 1–4 mẫu`);
    else c.templates.forEach((t, j) => {
      if (!t || !str(t.name, 3)) errors.push(`${at}.templates[${j}]: thiếu name`);
      if (!t || !str(t.text, 120)) errors.push(`${at}.templates[${j}]: text ≥ 120 ký tự`);
      if (t && Object.keys(t).some(k => k !== 'name' && k !== 'text')) errors.push(`${at}.templates[${j}]: chỉ có name, text`);
    });
    if (c.tags != null && (!Array.isArray(c.tags) || c.tags.some(x => typeof x !== 'string'))) errors.push(`${at}: tags phải là mảng chuỗi`);
    if (c.related != null && !Array.isArray(c.related)) errors.push(`${at}: related phải là mảng`);
    Object.keys(c).forEach(k => { if (!CASE_KEYS.has(k)) errors.push(`${at}: field lạ "${k}"`); });
  });

  // related: question ids from the bank, or chapter/case ids of this guide
  for (const x of chapters.concat(cases)) {
    for (const r of (x && Array.isArray(x.related) ? x.related : [])) {
      if (!ids.has(r) && !qids.has(r)) errors.push(`${x.id}: related "${r}" không tồn tại (id câu hỏi, uw-ch-NN hoặc uw-case-NNN)`);
    }
  }
  for (const [f, s] of Object.entries(src)) if (/\$\{/.test(s)) errors.push(`${f}: có \${ trong template literal`);
  return { errors, chapters: chapters.length, cases: cases.length };
}

module.exports = check;
if (require.main === module) {
  const { errors, chapters, cases } = check();
  console.log(`Upwork guide: ${chapters} chương, ${cases} case.`);
  if (errors.length) { console.log('LỖI:\n  ' + errors.join('\n  ')); process.exit(1); }
  console.log('OK — dữ liệu Upwork hợp lệ.');
}
