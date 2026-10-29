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

// file list + order come from js/core/data-manifest.js (single source of truth; topics.js first)
const MANIFEST = require(path.join(__dirname, '..', 'js', 'core', 'data-manifest.js'));
const files = MANIFEST.allFiles();
for (const f of fs.readdirSync(DATA)) if (!files.includes(f)) err(f, 'file không được khai báo trong js/core/data-manifest.js');
for (const f of files) if (!fs.existsSync(path.join(DATA, f))) err(f, 'có trong js/core/data-manifest.js nhưng không tồn tại');
if (new Set(files).size !== files.length) err('data-manifest.js', 'một file nằm trong nhiều group');
// index.html must load exactly the manifest's eager files (the rest is lazy via App.need)
{
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const tags = [...html.matchAll(/src="js\/data\/([^"]+)"/g)].map(m => m[1]);
  if (tags.join() !== MANIFEST.eager.join()) err('index.html', `<script src="js/data/…"> phải đúng bằng DATA_MANIFEST.eager (${MANIFEST.eager.join(', ')}), đang là: ${tags.join(', ')}`);
  if (!/src="js\/core\/data-manifest\.js"[\s\S]*src="js\/core\/app\.js"/.test(html)) err('index.html', 'phải nạp js/core/data-manifest.js trước js/core/app.js');
  for (const [r, gs] of Object.entries(MANIFEST.routes)) for (const g of gs) if (!MANIFEST.groups[g]) err('data-manifest.js', `route ${r}: group lạ ${g}`);
}

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
  const multi = z.multi;
  if (multi !== undefined && multi !== true) err(f, `${id}: multi chỉ được là true hoặc không có`);
  if (multi === true) {
    if (!Array.isArray(z.options) || z.options.length < 4 || z.options.length > 6) err(f, `${id}: multi cần 4–6 options`);
    else if (new Set(z.options).size !== z.options.length) err(f, `${id}: options bị trùng`);
    if (!Array.isArray(z.answer) || z.answer.length < 2 || z.answer.length > 3) err(f, `${id}: multi answer phải là mảng 2–3 index`);
    else {
      const opts = Array.isArray(z.options) ? z.options.length : 0;
      const sorted = z.answer.slice().sort((a, b) => a - b);
      const distinct = new Set(z.answer).size === z.answer.length;
      if (!distinct) err(f, `${id}: answer index phải khác nhau`);
      if (JSON.stringify(z.answer) !== JSON.stringify(sorted)) err(f, `${id}: answer phải tăng dần`);
      if (z.answer.some(x => !Number.isInteger(x) || x < 0 || x >= opts)) err(f, `${id}: answer index nằm ngoài phạm vi options`);
      // q must state count
      const m = String(z.q || '').match(/\((?:Chọn|Choose)\s+(\d+)\)/);
      if (!m) err(f, `${id}: multi q phải ghi rõ (Chọn N) hoặc (Choose N)`);
      else if (Number(m[1]) !== z.answer.length) err(f, `${id}: số trong (Chọn N) phải khớp answer.length`);
    }
  } else {
    if (!Array.isArray(z.options) || z.options.length !== 4) err(f, `${id}: cần đúng 4 options`);
    else if (new Set(z.options).size !== 4) err(f, `${id}: options bị trùng`);
    if (!Number.isInteger(z.answer) || z.answer < 0 || z.answer > 3) err(f, `${id}: answer phải là 0..3`);
  }
  if (!z.explain) err(f, `${id}: thiếu explain`);
  checkMarkup(f, id, 'q', z.q); checkMarkup(f, id, 'explain', z.explain);
  const allowed = new Set(['id', 'topic', 'q', 'options', 'answer', 'explain', 'multi', '__file']);
  Object.keys(z).forEach(k => { if (!allowed.has(k)) err(f, `${id}: field lạ "${k}"`); });
}

// ---- exams (js/data/exams.js → window.EXAMS) ----
{
  const f = 'exams.js', EX = sandbox.window.EXAMS;
  const ALLOWED = new Set(['id', 'title', 'icon', 'desc', 'lang', 'topics', 'domains', 'count', 'minutes', 'passPct', 'passScore']);
  const posNum = v => typeof v === 'number' && isFinite(v) && v > 0;
  if (!Array.isArray(EX) || !EX.length) err(f, 'window.EXAMS phải là mảng không rỗng');
  const seenEx = new Set();
  for (const e of Array.isArray(EX) ? EX : []) {
    const id = (e && e.id) || '(no id)';
    if (!/^[a-z][a-z0-9-]*$/.test(e.id || '') || seenEx.has(e.id)) err(f, `${id}: id thiếu, trùng hoặc không phải dạng kebab-case`);
    seenEx.add(e.id);
    Object.keys(e).forEach(k => { if (!ALLOWED.has(k)) err(f, `${id}: field lạ "${k}"`); });
    if (typeof e.title !== 'string' || !e.title.trim()) err(f, `${id}: thiếu title`);
    if (e.lang !== undefined && e.lang !== 'en') err(f, `${id}: lang chỉ được là 'en' hoặc không có`);
    const tids = e.topics && typeof e.topics === 'object' ? Object.keys(e.topics) : [];
    if (!tids.length) err(f, `${id}: topics phải là object { topicId: trọng số } không rỗng`);
    tids.forEach(t => {
      if (!topicIds.has(t)) err(f, `${id}: topic "${t}" không có trong topics.js`);
      if (!posNum(e.topics[t])) err(f, `${id}: trọng số topic "${t}" phải là số > 0`);
    });
    if (e.domains !== undefined) {
      if (tids.length !== 1) err(f, `${id}: domains (theo tag) chỉ dùng cho đề 1 topic`);
      const ds = e.domains && typeof e.domains === 'object' ? Object.keys(e.domains) : [];
      if (!ds.length) err(f, `${id}: domains phải là object { Tag: trọng số } không rỗng`);
      ds.forEach(d => { if (!posNum(e.domains[d])) err(f, `${id}: trọng số domain "${d}" phải là số > 0`); });
    }
    if (!Number.isInteger(e.count) || e.count < 5 || e.count > 100) err(f, `${id}: count phải là số nguyên 5..100`);
    if (!Number.isInteger(e.minutes) || e.minutes < 5 || e.minutes > 240) err(f, `${id}: minutes phải là số nguyên 5..240`);
    const hasPct = e.passPct !== undefined, hasScore = e.passScore !== undefined;
    if (hasPct === hasScore) err(f, `${id}: cần đúng một trong passPct hoặc passScore`);
    if (hasPct && !(Number.isInteger(e.passPct) && e.passPct >= 1 && e.passPct <= 100)) err(f, `${id}: passPct phải là số nguyên 1..100`);
    if (hasScore && !(Number.isInteger(e.passScore) && e.passScore >= 100 && e.passScore <= 1000)) err(f, `${id}: passScore phải là số nguyên 100..1000`);
    const poolN = (sandbox.window.QUIZ || []).filter(q => tids.includes(q.topic)).length;
    if (poolN < e.count) warn(f, `${id}: ngân hàng chỉ có ${poolN} câu trắc nghiệm < count ${e.count} (đề sẽ ngắn hơn)`);
    else if (poolN < e.count * 2) warn(f, `${id}: ngân hàng ${poolN} câu, chưa gấp đôi count ${e.count} — các lần thi sẽ lặp câu nhiều`);
  }
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
const lessonIds = new Set((sandbox.window.LESSONS || []).map(l => l.id));
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

// ---- pet projects ----
const projects = sandbox.window.PROJECTS || [];
const seenProject = new Set();
for (const p of projects) {
  const f = 'projects.js', id = p.id || '(no id)';
  if (!/^proj-[a-z0-9-]+$/.test(p.id || '') || seenProject.has(p.id)) err(f, `id dự án thiếu/trùng/sai dạng: ${id}`);
  seenProject.add(p.id);
  if (!p.title || !LEVELS.has(p.level) || !Number.isInteger(p.weeks) || p.weeks < 1) err(f, `${id}: thiếu title/level/weeks hợp lệ`);
  if (!Array.isArray(p.skills) || !p.skills.length) err(f, `${id}: cần skills`);
  ['pitch', 'requirements', 'architecture', 'readme'].forEach(k => {
    if (typeof p[k] !== 'string' || !p[k].trim()) err(f, `${id}: thiếu ${k}`);
    checkMarkup(f, id, k, p[k]);
  });
  if (!Array.isArray(p.milestones) || p.milestones.length < 4 || p.milestones.length > 7) err(f, `${id}: milestones cần 4–7 mục`);
  else p.milestones.forEach((m, i) => {
    if (!m || !m.title || typeof m.tasks !== 'string' || typeof m.done !== 'string') err(f, `${id}.milestones[${i}]: thiếu title/tasks/done`);
    ['tasks', 'done'].forEach(k => checkMarkup(f, id, `milestones[${i}].${k}`, m && m[k]));
    Object.keys(m || {}).forEach(k => { if (!['title', 'tasks', 'done'].includes(k)) err(f, `${id}.milestones[${i}]: field lạ "${k}"`); });
  });
  if (!Array.isArray(p.challenges) || p.challenges.length < 3) err(f, `${id}: challenges cần ít nhất 3 mục`);
  (Array.isArray(p.challenges) ? p.challenges : []).forEach((x, i) => checkMarkup(f, id, `challenges[${i}]`, x));
  if (!p.interview || typeof p.interview.story !== 'string' || !Array.isArray(p.interview.questions) || p.interview.questions.length < 5) err(f, `${id}: interview cần story và ít nhất 5 questions`);
  if (p.interview) {
    checkMarkup(f, id, 'interview.story', p.interview.story);
    (Array.isArray(p.interview.questions) ? p.interview.questions : []).forEach((x, i) => checkMarkup(f, id, `interview.questions[${i}]`, x));
    if (p.interview.answers != null) {
      if (!Array.isArray(p.interview.answers)) err(f, `${id}.interview.answers: phải là mảng`);
      else {
        if (p.interview.answers.length !== p.interview.questions.length) err(f, `${id}.interview.answers: độ dài phải bằng questions (${p.interview.answers.length} vs ${p.interview.questions.length})`);
        p.interview.answers.forEach((x, i) => {
          if (typeof x !== 'string') err(f, `${id}.interview.answers[${i}]: phải là chuỗi`);
          else if (x.length < 300) err(f, `${id}.interview.answers[${i}]: quá ngắn (${x.length} ký tự) — cần ≥ 300`);
          else checkMarkup(f, id, `interview.answers[${i}]`, x);
        });
      }
    }
    Object.keys(p.interview).forEach(k => { if (!['story', 'questions', 'answers'].includes(k)) err(f, `${id}.interview: field lạ "${k}"`); });
  }
  if (p.design != null) {
    if (typeof p.design !== 'string') err(f, `${id}: design phải là chuỗi`);
    else if (p.design.length < 1500) err(f, `${id}: design quá ngắn (${p.design.length} ký tự) — cần ≥ 1500`);
    else checkMarkup(f, id, 'design', p.design);
  }
  if (p.related != null && !Array.isArray(p.related)) err(f, `${id}: related phải là mảng`);
  (Array.isArray(p.related) ? p.related : []).forEach(r => { if (!questionIds.has(r) && !lessonIds.has(r)) err(f, `${id}: related "${r}" không phải question/lesson có thật`); });
  const allowed = new Set(['id', 'title', 'level', 'weeks', 'skills', 'pitch', 'requirements', 'architecture', 'milestones', 'challenges', 'readme', 'design', 'interview', 'related']);
  Object.keys(p).forEach(k => { if (!allowed.has(k)) err(f, `${id}: field lạ "${k}"`); });
}

// ---- path (window.PATH) ----
const PATH_FILE = 'path.js';
const validPhases = new Set(['Nền tảng', 'Vững vàng', 'Senior']);
const pathStages = (sandbox.window.PATH || []);
const seenPathId = new Set();
let pathOrders = [];
for (const s of pathStages) {
  const f = PATH_FILE;
  const sid = s.id || '(no id)';
  if (!s.id || !/^path-\d{2}$/.test(s.id)) err(f, `${sid}: id phải có dạng path-NN`);
  else if (seenPathId.has(s.id)) err(f, `${sid}: trùng id ${s.id}`);
  else seenPathId.add(s.id);
  if (!Number.isInteger(s.order) || s.order < 1) err(f, `${sid}: order phải là số nguyên >= 1`);
  else pathOrders.push(s.order);
  if (!validPhases.has(s.phase)) err(f, `${sid}: phase phải là Nền tảng | Vững vàng | Senior`);
  if (typeof s.title !== 'string' || !s.title.trim()) err(f, `${sid}: thiếu title`);
  if (typeof s.weeks !== 'string' || !s.weeks.trim()) err(f, `${sid}: thiếu weeks`);
  if (typeof s.goal !== 'string' || !s.goal.trim()) err(f, `${sid}: thiếu goal`);
  if (!Array.isArray(s.lessons) || !s.lessons.length) err(f, `${sid}: lessons phải là mảng có ít nhất 1 bài`);
  else s.lessons.forEach(lid => {
    if (!lessonIds.has(lid)) err(f, `${sid}: lesson "${lid}" không tồn tại trong window.LESSONS`);
  });
  if (Array.isArray(s.questions)) {
    if (s.questions.length < 4 || s.questions.length > 8) warn(f, `${sid}: questions nên có 4-8 câu (hiện ${s.questions.length})`);
    s.questions.forEach(qid => {
      if (!questionIds.has(qid)) err(f, `${sid}: question "${qid}" không tồn tại trong window.QUESTIONS`);
    });
  } else err(f, `${sid}: questions phải là mảng`);
  if (!Array.isArray(s.quizTopics) || !s.quizTopics.length) err(f, `${sid}: quizTopics phải là mảng có ít nhất 1 topic`);
  else s.quizTopics.forEach(tid => {
    if (!topicIds.has(tid)) err(f, `${sid}: quizTopics "${tid}" không tồn tại trong topics.js`);
  });
  if (!Array.isArray(s.requires)) err(f, `${sid}: requires phải là mảng`);
  else s.requires.forEach(r => {
    const exists = pathStages.some(st => st.id === r);
    if (!exists) err(f, `${sid}: requires "${r}" không tồn tại trong window.PATH`);
  });
  const allowed = new Set(['id', 'order', 'phase', 'title', 'weeks', 'goal', 'lessons', 'questions', 'quizTopics', 'requires']);
  Object.keys(s || {}).forEach(k => { if (!allowed.has(k)) err(f, `${sid}: field lạ "${k}"`); });
}
// order increasing
for (let i = 1; i < pathOrders.length; i++) {
  if (pathOrders[i] <= pathOrders[i - 1]) err('path.js', `path-${String(pathOrders[i]).padStart(2, '0')}: order phải tăng dần (không nhỏ hơn hoặc bằng chặng trước)`);
}
// requires must not point to a stage that comes after
for (const s of pathStages) {
  const sid = s.id || '';
  (s.requires || []).forEach(r => {
    const reqStage = pathStages.find(st => st.id === r);
    if (reqStage && reqStage.order >= s.order) err('path.js', `${sid}: requires "${r}" trỏ tới chặng có order >= chặng này`);
  });
}
// no repeated lessons across all stages
const allLessonIds = new Set();
const repeatedLessons = new Set();
for (const s of pathStages) {
  (s.lessons || []).forEach(lid => {
    if (allLessonIds.has(lid)) repeatedLessons.add(lid);
    else allLessonIds.add(lid);
  });
}
repeatedLessons.forEach(lid => err('path.js', `lesson "${lid}" xuất hiện nhiều lần trong PATH`));
// warning: lessons not in any path stage
const pathLessonIds = new Set(allLessonIds);
const missingInPath = [];
for (const lid of lessonIds) {
  if (!pathLessonIds.has(lid)) missingInPath.push(lid);
}
if (missingInPath.length) warn('path.js', `có ${missingInPath.length} bài học không nằm trong PATH: ${missingInPath.slice(0, 10).join(', ')}${missingInPath.length > 10 ? ' ...' : ''}`);

// ---- drills (window.DRILLS) ----
const DRILL_KINDS = new Set(['shadow', 'qa', 'term']);
const DRILL_THEMES = new Set(['intro', 'tech', 'behavioral', 'design', 'project', 'negotiation', 'smalltalk']);
const seenDrillId = new Set();
for (const d of sandbox.window.DRILLS || []) {
  const f = d.__file || 'drills-shadow.js', id = d.id || '(no id)';
  if (!d.id || typeof d.id !== 'string') err(f, 'drill thiếu id');
  else {
    if (seenDrillId.has(d.id)) err(f, `trùng id drill ${d.id}`);
    seenDrillId.add(d.id);
  }
  if (!DRILL_KINDS.has(d.kind)) err(f, `${id}: kind phải là shadow|qa|term`);
  if (d.kind && !new RegExp(`^drill-${d.kind}-\\d{3}$`).test(id)) err(f, `${id}: id phải có dạng drill-${d.kind}-NNN`);
  if (!DRILL_THEMES.has(d.theme)) err(f, `${id}: theme không hợp lệ`);
  if (!LEVELS.has(d.level)) err(f, `${id}: level phải là mid|senior|lead`);

  if (d.kind === 'shadow') {
    ['en', 'vi'].forEach(k => {
      if (!d[k] || typeof d[k] !== 'string') err(f, `${id}: thiếu ${k}`);
      if (d[k] && /[`$]/.test(d[k])) err(f, `${id}: ${k} không được chứa backtick hoặc $`);
    });
  } else if (d.kind === 'qa') {
    if (!d.q || typeof d.q !== 'string') err(f, `${id}: thiếu q`);
    if (![60, 90, 120].includes(d.seconds)) err(f, `${id}: seconds phải là 60|90|120`);
    if (!d.sample || typeof d.sample !== 'string') err(f, `${id}: thiếu sample`);
    else {
      const words = d.sample.split(/\s+/).filter(Boolean).length;
      if (words < 80 || words > 200) err(f, `${id}: sample phải có 80-200 từ (hiện ${words})`);
    }
    if (!Array.isArray(d.phrases) || d.phrases.length < 3 || d.phrases.length > 6) err(f, `${id}: phrases phải có 3-6 mục`);
    [d.q, d.sample, ...(d.phrases || [])].forEach(s => {
      if (typeof s === 'string' && /[`$]/.test(s)) err(f, `${id}: chứa backtick hoặc $`);
    });
  } else if (d.kind === 'term') {
    ['term', 'say', 'wrong', 'example'].forEach(k => {
      if (!d[k] || typeof d[k] !== 'string') err(f, `${id}: thiếu ${k}`);
      if (d[k] && /[`$]/.test(d[k])) err(f, `${id}: ${k} không được chứa backtick hoặc $`);
    });
  }
}

// ---- glossary (window.GLOSSARY) ----
const seenGlossaryId = new Set();
const allGlossaryAliases = new Set();
const glossaryIds = new Set((sandbox.window.GLOSSARY || []).map(g => g.id));
for (const g of sandbox.window.GLOSSARY || []) {
  const f = g.__file || 'glossary-dist.js', id = g.id || '(no id)';
  if (!g.id || typeof g.id !== 'string') err(f, 'glossary thiếu id');
  else {
    if (seenGlossaryId.has(g.id)) err(f, `trùng id glossary ${g.id}`);
    seenGlossaryId.add(g.id);
    if (!/^[a-z0-9-]+$/.test(id)) err(f, `${id}: id phải là kebab-case`);
  }
  ['term', 'short', 'body'].forEach(k => {
    if (!g[k] || typeof g[k] !== 'string') err(f, `${id}: thiếu ${k}`);
    if (g[k] && /[`$]/.test(g[k])) err(f, `${id}: ${k} không được chứa backtick hoặc $`);
  });
  if (g.body && g.body.length < 600) err(f, `${id}: body phải ≥ 600 ký tự (hiện ${g.body.length})`);
  if (g.aliases) {
    if (!Array.isArray(g.aliases)) err(f, `${id}: aliases phải là mảng`);
    else g.aliases.forEach(a => {
      if (typeof a !== 'string' || a !== a.toLowerCase()) err(f, `${id}: alias "${a}" phải là lowercase string`);
      if (allGlossaryAliases.has(a)) err(f, `${id}: trùng alias "${a}"`);
      allGlossaryAliases.add(a);
    });
  }
  if (g.related) {
    if (!Array.isArray(g.related)) err(f, `${id}: related phải là mảng`);
    else g.related.forEach(r => {
      if (!glossaryIds.has(r)) err(f, `${id}: related "${r}" không tồn tại`);
    });
  }
  if (g.refs) {
    if (!Array.isArray(g.refs) || g.refs.length > 5) err(f, `${id}: refs phải là mảng ≤ 5 mục`);
    else g.refs.forEach((r, i) => {
      if (!r || !REF_TYPES.has(r.type)) err(f, `${id}.refs[${i}]: type phải là ${[...REF_TYPES].join('|')}`);
      if (!r || typeof r.title !== 'string' || r.title.length < 3 || /[[\]]/.test(r.title)) err(f, `${id}.refs[${i}]: title thiếu hoặc chứa [ ]`);
      if (!r || !/^https:\/\/[^\s()]+$/.test(r.url || '')) err(f, `${id}.refs[${i}]: url phải là https và không chứa khoảng trắng/ngoặc`);
      Object.keys(r || {}).forEach(k => { if (!['type', 'title', 'url', 'note'].includes(k)) err(f, `${id}.refs[${i}]: field lạ "${k}"`); });
    });
  }
  checkMarkup(f, id, 'body', g.body);
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
console.log(`Pet project: ${projects.length} dự án`);
if (warns.length) console.log('\nCảnh báo:\n  ' + warns.join('\n  '));
// ---- generated light index (js/data/index-light.js) must match the content (always reported, even with a file arg) ----
{
  const LI = require('./build-light-index.js');
  if (LI.current() !== LI.build(sandbox.window)) {
    errors.push(`${LI.OUT_NAME}: đã cũ so với dữ liệu (thêm/sửa câu hỏi, bài học, algo, sd, drill, công ty). Chạy: ${LI.CMD}`);
  }
}

if (errors.length) { console.error('\nLỖI:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log('\nOK — không có lỗi.');
