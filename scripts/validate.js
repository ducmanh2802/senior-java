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
  (sandbox.window.LABS || []).forEach(q => { q.__file = q.__file || f; });
  (sandbox.window.LESSONS || []).forEach(q => { q.__file = q.__file || f; });
}

const TOPICS = sandbox.window.TOPICS || [];
const topicIds = new Set(TOPICS.map(t => t.id));
const LEVELS = new Set(['mid', 'senior', 'lead']);
const REF_TYPES = new Set(['video', 'doc', 'article', 'book', 'course']);

function checkMarkup(file, id, field, s) {
  if (typeof s !== 'string') return;
  const prose = s.replace(/~~~[\s\S]*?~~~/g, '');   // App.md does not parse {{…}} inside code fences
  const opens = (prose.match(/\{\{/g) || []).length, closes = (prose.match(/\}\}/g) || []).length;
  if (opens !== closes) err(file, `${id}.${field}: số {{ và }} không khớp (${opens}/${closes})`);
  for (const m of s.replace(/~~~[\s\S]*?~~~/g, '').matchAll(/\{\{([\s\S]+?)\}\}/g)) {
    if (/[{}]/.test(m[1])) err(file, `${id}.${field}: inline code {{${m[1].slice(0, 30)}…}} chứa dấu { } lồng nhau — sẽ hiển thị sai; đưa vào code block ~~~ hoặc viết lại`);
  }
  const fences = s.split('\n').filter(l => l.startsWith('~~~')).length;
  if (fences % 2) err(file, `${id}.${field}: code fence ~~~ chưa đóng`);
  if (/```/.test(s)) err(file, `${id}.${field}: dùng ~~~ thay cho \`\`\``);
  if (/<\/?(div|span|br|b|i|p|code|pre)\b/i.test(s.replace(/~~~[\s\S]*?~~~/g, ''))) warn(file, `${id}.${field}: có thẻ HTML thô — sẽ hiển thị nguyên văn`);
  if (/\\?`/.test(prose)) err(file, `${id}.${field}: có dấu backtick — inline code phải viết {{code}}`);
  if (/^[ \t]+### /m.test(prose)) err(file, `${id}.${field}: tiêu đề ### bị thụt đầu dòng — sẽ không hiển thị thành tiêu đề`);
  // free models sometimes leak Chinese / Japanese / Cyrillic words into Vietnamese or English text
  const foreign = s.match(/[぀-ヿ㐀-鿿가-힯Ѐ-ӿ]+/);
  if (foreign) err(file, `${id}.${field}: có ký tự lạ "${foreign[0].slice(0, 12)}" (Trung/Nhật/Hàn/Nga) — model viết lẫn ngôn ngữ, hãy viết lại câu đó`);
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
  const allowed = new Set(['id', 'topic', 'level', 'q', 'a', 'follow', 'tags', 'lang', 'refs', '__file']);
  Object.keys(q).forEach(k => { if (!allowed.has(k)) err(f, `${id}: field lạ "${k}"`); });
  if (q.refs !== undefined) {   // learn-more links; existence is checked by scripts/check-links.mjs
    if (!Array.isArray(q.refs) || q.refs.length > 5) err(f, `${id}: refs phải là mảng ≤ 5 mục`);
    else q.refs.forEach((r, i) => {
      if (!r || !REF_TYPES.has(r.type)) err(f, `${id}.refs[${i}]: type phải là ${[...REF_TYPES].join('|')}`);
      if (!r || typeof r.title !== 'string' || r.title.length < 3 || /[[\]]/.test(r.title)) err(f, `${id}.refs[${i}]: title thiếu hoặc chứa [ ]`);
      if (!r || !/^https:\/\/[^\s()]+$/.test(r.url || '')) err(f, `${id}.refs[${i}]: url phải là https và không chứa khoảng trắng/ngoặc`);
      Object.keys(r || {}).forEach(k => { if (!['type', 'title', 'url', 'note'].includes(k)) err(f, `${id}.refs[${i}]: field lạ "${k}"`); });
    });
  }
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
  if (z.tests != null) {
    if (typeof z.tests !== 'string' || !/public\s+class\s+Main\b/.test(z.tests)) err(f, `${id}: tests phải là chuỗi Java chứa public class Main`);
    else if (!/RESULT/.test(z.tests)) err(f, `${id}: tests phải in dòng "RESULT passed/total"`);
  }
  const allowed = new Set(['id', 'title', 'difficulty', 'pattern', 'tags', 'prompt', 'hints', 'solution', 'complexity', 'follow', 'tests', 'starter', '__file']);
  Object.keys(z).forEach(k => { if (!allowed.has(k)) err(f, `${id}: field lạ "${k}"`); });
  ['prompt', 'solution'].forEach(k => checkMarkup(f, id, k, z[k]));
  (z.hints || []).forEach((x, i) => checkMarkup(f, id, `hints[${i}]`, x));
}

// ---- debug labs ----
const LAB_CATS = new Set(['thread', 'gc', 'sql', 'incident']);
const seenLab = new Set();
for (const z of sandbox.window.LABS || []) {
  const f = z.__file || 'labs', id = z.id || '(no id)';
  if (!/^lab-(thread|gc|sql|incident)-\d{3}$/.test(z.id || '') || seenLab.has(z.id)) err(f, `lab id thiếu/trùng/sai dạng lab-<category>-NNN: ${id}`);
  seenLab.add(z.id);
  if (!LAB_CATS.has(z.category) || !String(z.id).startsWith('lab-' + z.category + '-')) err(f, `${id}: category phải khớp id (thread|gc|sql|incident)`);
  if (!LEVELS.has(z.level)) err(f, `${id}: level phải là mid|senior|lead`);
  ['title', 'scenario', 'answer'].forEach(k => { if (!z[k] || typeof z[k] !== 'string') err(f, `${id}: thiếu ${k}`); });
  if (!Array.isArray(z.artifacts) || !z.artifacts.length) err(f, `${id}: cần ≥ 1 artifact`);
  else z.artifacts.forEach((a, i) => {
    if (!a || !a.name || typeof a.content !== 'string' || a.content.length < 200) err(f, `${id}.artifacts[${i}]: cần name và content ≥ 200 ký tự`);
  });
  if (!Array.isArray(z.questions) || !z.questions.length) err(f, `${id}: cần ≥ 1 câu hỏi (questions)`);
  if (!Array.isArray(z.hints) || z.hints.length < 2) err(f, `${id}: cần ≥ 2 hints`);
  if (!Array.isArray(z.rubric) || z.rubric.length < 3) err(f, `${id}: cần ≥ 3 ý trong rubric`);
  const allowed = new Set(['id', 'category', 'title', 'level', 'scenario', 'artifacts', 'questions', 'hints', 'answer', 'rubric', 'tags', '__file']);
  Object.keys(z).forEach(k => { if (!allowed.has(k)) err(f, `${id}: field lạ "${k}"`); });
  ['scenario', 'answer'].forEach(k => checkMarkup(f, id, k, z[k]));
}

// ---- lessons (AGENTS.md section 12) ----
const seenLesson = new Set();
const questionIds = new Set((sandbox.window.QUESTIONS || []).map(q => q.id));
for (const z of sandbox.window.LESSONS || []) {
  const f = z.__file || 'lessons', id = z.id || '(no id)';
  if (!/^lesson-[a-z]+-\d{3}$/.test(z.id || '') || seenLesson.has(z.id)) err(f, `lesson id thiếu/trùng/sai dạng lesson-<track>-NNN: ${id}`);
  seenLesson.add(z.id);
  if (!topicIds.has(z.track) || !String(z.id).startsWith('lesson-' + z.track + '-')) err(f, `${id}: track phải là topic id có trong topics.js và khớp với id`);
  if (f !== 'lessons-' + z.track + '.js') err(f, `${id}: bài của track "${z.track}" phải nằm trong lessons-${z.track}.js`);
  if (!LEVELS.has(z.level)) err(f, `${id}: level phải là mid|senior|lead`);
  if (!Number.isInteger(z.order) || z.order < 1) err(f, `${id}: order phải là số nguyên ≥ 1`);
  if (!Number.isInteger(z.minutes) || z.minutes < 5 || z.minutes > 90) err(f, `${id}: minutes phải trong 5..90`);
  if (!z.title || typeof z.title !== 'string') err(f, `${id}: thiếu title`);
  if (!Array.isArray(z.goals) || z.goals.length < 2 || z.goals.length > 5) err(f, `${id}: goals cần 2–5 mục`);
  if (typeof z.body !== 'string' || z.body.length < 2500) err(f, `${id}: body cần ≥ 2500 ký tự (hiện ${String(z.body || '').length})`);
  if (!Array.isArray(z.exercises) || z.exercises.length < 1 || z.exercises.length > 3) err(f, `${id}: exercises cần 1–3 bài`);
  else z.exercises.forEach((x, i) => {
    const xid = `${id}.exercises[${i}]`;
    ['title', 'prompt', 'starter', 'tests', 'reference', 'explain'].forEach(k => { if (!x || typeof x[k] !== 'string' || !x[k].trim()) err(f, `${xid}: thiếu ${k}`); });
    if (x && !/public\s+class\s+Main\b/.test(x.tests || '')) err(f, `${xid}: tests phải chứa public class Main`);
    if (x && !/RESULT/.test(x.tests || '')) err(f, `${xid}: tests phải in dòng RESULT passed/total`);
    if (x && (!Array.isArray(x.hints) || !x.hints.length)) err(f, `${xid}: cần ≥ 1 hint`);
    const ok = new Set(['title', 'prompt', 'starter', 'tests', 'reference', 'hints', 'explain']);
    Object.keys(x || {}).forEach(k => { if (!ok.has(k)) err(f, `${xid}: field lạ "${k}"`); });
    ['prompt', 'explain'].forEach(k => checkMarkup(f, xid, k, x && x[k]));
    (x && x.hints || []).forEach((h, j) => checkMarkup(f, xid, `hints[${j}]`, h));
  });
  if (!Array.isArray(z.check) || z.check.length < 2 || z.check.length > 4) err(f, `${id}: check cần 2–4 câu hỏi nhanh`);
  else z.check.forEach((c, i) => {
    const cid = `${id}.check[${i}]`;
    if (!c || !c.q || !Array.isArray(c.options) || c.options.length !== 4 || new Set(c.options).size !== 4) err(f, `${cid}: cần q và đúng 4 options khác nhau`);
    if (!c || !Number.isInteger(c.answer) || c.answer < 0 || c.answer > 3) err(f, `${cid}: answer phải là 0..3`);
    if (!c || !c.explain) err(f, `${cid}: thiếu explain`);
    checkMarkup(f, cid, 'q', c && c.q); checkMarkup(f, cid, 'explain', c && c.explain);
  });
  (z.related || []).forEach(r => { if (!questionIds.has(r)) err(f, `${id}: related "${r}" không phải id câu hỏi có thật`); });
  const allowed = new Set(['id', 'track', 'order', 'title', 'level', 'minutes', 'goals', 'body', 'exercises', 'check', 'related', 'tags', '__file']);
  Object.keys(z).forEach(k => { if (!allowed.has(k)) err(f, `${id}: field lạ "${k}"`); });
  checkMarkup(f, id, 'body', z.body);
  (z.goals || []).forEach((g, i) => checkMarkup(f, id, `goals[${i}]`, g));
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
const L = sandbox.window.LABS || [];
console.log(`Debug lab: ${L.length} bài (` + [...LAB_CATS].map(c => c + ' ' + L.filter(l => l.category === c).length).join(', ') + ')');
const LS = sandbox.window.LESSONS || [];
if (LS.length) console.log(`Bài học: ${LS.length} bài, ${LS.reduce((n, l) => n + (l.exercises || []).length, 0)} bài tập (` +
  [...new Set(LS.map(l => l.track))].map(t => t + ' ' + LS.filter(l => l.track === t).length).join(', ') + ')');
if (warns.length) console.log('\nCảnh báo:\n  ' + warns.join('\n  '));
if (errors.length) { console.error('\nLỖI:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('\nOK — không có lỗi.');
