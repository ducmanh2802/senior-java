#!/usr/bin/env node
/*
 * Validates every data file against the schema in AGENTS.md.
 * Usage: node scripts/validate.js            (all files)
 *        node scripts/validate.js q-aws.js   (only report errors for that file)
 * Exit code 1 if any error.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA = path.join(__dirname, '..', 'js', 'data');
const only = process.argv[2];
const errors = [];
const warns = [];
const sandbox = { window: {} };
vm.createContext(sandbox);

const err = (file, msg) => { if (!only || file === only) errors.push(`${file}: ${msg}`); };
const warn = (file, msg) => { if (!only || file === only) warns.push(`${file}: ${msg}`); };

// topics.js first, then the rest in the same order as index.html
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const files = [...html.matchAll(/src="js\/data\/([^"]+)"/g)].map(m => m[1]);
for (const f of fs.readdirSync(DATA)) if (!files.includes(f)) err(f, 'file không được khai báo trong index.html');

const owner = {}; // question id -> file
for (const f of files) {
  const src = fs.readFileSync(path.join(DATA, f), 'utf8');
  const qBefore = (sandbox.window.QUESTIONS || []).length;
  const zBefore = (sandbox.window.QUIZ || []).length;
  try { vm.runInContext(src, sandbox, { filename: f }); }
  catch (e) { err(f, 'lỗi cú pháp/chạy: ' + e.message); continue; }
  (sandbox.window.QUESTIONS || []).slice(qBefore).forEach(q => { owner[q.id] = f; q.__file = f; });
  (sandbox.window.QUIZ || []).slice(zBefore).forEach(q => { q.__file = f; });
  (sandbox.window.ALGOS || []).forEach(q => { q.__file = q.__file || f; });
}

const TOPICS = sandbox.window.TOPICS || [];
const topicIds = new Set(TOPICS.map(t => t.id));
const LEVELS = new Set(['mid', 'senior', 'lead']);

function checkMarkup(file, id, field, s) {
  if (typeof s !== 'string') return;
  const opens = (s.match(/\{\{/g) || []).length, closes = (s.match(/\}\}/g) || []).length;
  if (opens !== closes) err(file, `${id}.${field}: số {{ và }} không khớp (${opens}/${closes})`);
  for (const m of s.replace(/~~~[\s\S]*?~~~/g, '').matchAll(/\{\{([\s\S]+?)\}\}/g)) {
    if (/[{}]/.test(m[1])) err(file, `${id}.${field}: inline code {{${m[1].slice(0, 30)}…}} chứa dấu { } lồng nhau — sẽ hiển thị sai; đưa vào code block ~~~ hoặc viết lại`);
  }
  const fences = s.split('\n').filter(l => l.startsWith('~~~')).length;
  if (fences % 2) err(file, `${id}.${field}: code fence ~~~ chưa đóng`);
  if (/```/.test(s)) err(file, `${id}.${field}: dùng ~~~ thay cho \`\`\``);
  if (/<\/?(div|span|br|b|i|p|code|pre)\b/i.test(s.replace(/~~~[\s\S]*?~~~/g, ''))) warn(file, `${id}.${field}: có thẻ HTML thô — sẽ hiển thị nguyên văn`);
}

// ---- questions ----
const seen = new Set();
for (const q of sandbox.window.QUESTIONS || []) {
  const f = q.__file, id = q.id || '(no id)';
  if (!q.id || typeof q.id !== 'string') err(f, 'câu hỏi thiếu id');
  else {
    if (seen.has(q.id)) err(f, `trùng id ${q.id}`);
    seen.add(q.id);
    if (!new RegExp('^' + q.topic + '-\\d{3}$').test(q.id)) err(f, `${id}: id phải có dạng <topic>-NNN`);
  }
  if (!topicIds.has(q.topic)) err(f, `${id}: topic "${q.topic}" không có trong topics.js`);
  else {
    const t = TOPICS.find(t => t.id === q.topic);
    if (t.file !== f) err(f, `${id}: topic "${q.topic}" thuộc file ${t.file}`);
  }
  if (!LEVELS.has(q.level)) err(f, `${id}: level phải là mid|senior|lead`);
  if (!q.q || typeof q.q !== 'string') err(f, `${id}: thiếu q`);
  if (!q.a || typeof q.a !== 'string') err(f, `${id}: thiếu a`);
  else if (q.a.length < 1000) warn(f, `${id}: đáp án ngắn (${q.a.length} ký tự) — cần giải thích chi tiết hơn (≥ 1500)`);
  if (q.follow && !Array.isArray(q.follow)) err(f, `${id}: follow phải là mảng`);
  if (q.tags && !Array.isArray(q.tags)) err(f, `${id}: tags phải là mảng`);
  if (q.lang && q.lang !== 'en') err(f, `${id}: lang chỉ nhận 'en'`);
  const allowed = new Set(['id', 'topic', 'level', 'q', 'a', 'follow', 'tags', 'lang', '__file']);
  Object.keys(q).forEach(k => { if (!allowed.has(k)) err(f, `${id}: field lạ "${k}"`); });
  checkMarkup(f, id, 'q', q.q);
  checkMarkup(f, id, 'a', q.a);
  (q.follow || []).forEach((x, i) => checkMarkup(f, id, `follow[${i}]`, x));
}

// ---- quiz ----
const seenQz = new Set();
for (const z of sandbox.window.QUIZ || []) {
  const f = z.__file, id = z.id || '(no id)';
  if (!z.id || seenQz.has(z.id)) err(f, `quiz id thiếu hoặc trùng: ${id}`);
  seenQz.add(z.id);
  if (!/^qz-[a-z]+-\d{3}$/.test(z.id || '')) err(f, `${id}: quiz id phải có dạng qz-<topic>-NNN`);
  if (!topicIds.has(z.topic)) err(f, `${id}: topic "${z.topic}" không hợp lệ`);
  if (!Array.isArray(z.options) || z.options.length !== 4) err(f, `${id}: cần đúng 4 options`);
  else if (new Set(z.options).size !== 4) err(f, `${id}: options bị trùng`);
  if (!Number.isInteger(z.answer) || z.answer < 0 || z.answer > 3) err(f, `${id}: answer phải là 0..3`);
  if (!z.explain) err(f, `${id}: thiếu explain`);
  checkMarkup(f, id, 'q', z.q); checkMarkup(f, id, 'explain', z.explain);
}

// ---- algorithms ----
const seenAl = new Set();
const DIFFS = new Set(['easy', 'medium', 'hard']);
for (const z of sandbox.window.ALGOS || []) {
  const f = z.__file || 'algo.js', id = z.id || '(no id)';
  if (!/^algo-\d{3}$/.test(z.id || '') || seenAl.has(z.id)) err(f, `algo id thiếu/trùng/sai dạng algo-NNN: ${id}`);
  seenAl.add(z.id);
  if (!z.title) err(f, `${id}: thiếu title`);
  if (!DIFFS.has(z.difficulty)) err(f, `${id}: difficulty phải là easy|medium|hard`);
  if (!z.pattern) err(f, `${id}: thiếu pattern`);
  if (!z.prompt) err(f, `${id}: thiếu prompt`);
  if (!Array.isArray(z.hints) || z.hints.length < 2) err(f, `${id}: cần ≥ 2 hints`);
  if (!z.solution || !/~~~java/.test(z.solution)) err(f, `${id}: solution phải có code ~~~java`);
  if (!z.complexity) err(f, `${id}: thiếu complexity`);
  const allowed = new Set(['id', 'title', 'difficulty', 'pattern', 'tags', 'prompt', 'hints', 'solution', 'complexity', 'follow', '__file']);
  Object.keys(z).forEach(k => { if (!allowed.has(k)) err(f, `${id}: field lạ "${k}"`); });
  ['prompt', 'solution'].forEach(k => checkMarkup(f, id, k, z[k]));
  (z.hints || []).forEach((x, i) => checkMarkup(f, id, `hints[${i}]`, x));
}

// ---- summary ----
const Q = sandbox.window.QUESTIONS || [], Z = sandbox.window.QUIZ || [];
console.log('Questions per topic:');
for (const t of TOPICS) {
  const n = Q.filter(q => q.topic === t.id).length, m = Z.filter(q => q.topic === t.id).length;
  console.log(`  ${t.id.padEnd(14)} ${String(n).padStart(3)} câu hỏi  ${String(m).padStart(3)} trắc nghiệm`);
}
const A = sandbox.window.ALGOS || [];
console.log(`Tổng: ${Q.length} câu hỏi, ${Z.length} trắc nghiệm, ${A.length} bài thuật toán (` +
  ['easy', 'medium', 'hard'].map(d => d + ' ' + A.filter(a => a.difficulty === d).length).join(', ') + ')');
if (warns.length) console.log('\nCảnh báo:\n  ' + warns.join('\n  '));
if (errors.length) { console.error('\nLỖI:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('\nOK — không có lỗi.');
