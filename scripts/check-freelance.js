#!/usr/bin/env node
/*
 * Check the Freelance track data (docs/FREELANCE-TRACK.md): js/data/freelance-plan.js (window.FREELANCE_PLAN)
 * and js/data/freelance-english.js (window.FREELANCE_EN). Runnable alone or from scripts/validate.js:
 *   node scripts/check-freelance.js   -> prints counts, exits 1 on errors
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA = path.join(__dirname, '..', 'js', 'data');

function load(file, ctx) {
  vm.runInContext(fs.readFileSync(path.join(DATA, file), 'utf8'), ctx, { filename: file });
}

function collectLessonIds() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  const files = fs.readdirSync(DATA).filter(f => /^lessons-.*\.js$/.test(f));
  for (const f of files) {
    try { load(f, ctx); } catch (e) { /* lesson file lỗi: validate.js lo, ở đây chỉ cần id */ }
  }
  const ids = new Set();
  for (const l of ctx.window.LESSONS || []) if (l && l.id) ids.add(l.id);
  return ids;
}

function check() {
  const errors = [];
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ['freelance-plan.js', 'freelance-english.js']) {
    try { load(f, ctx); }
    catch (e) { errors.push(`${f}: không chạy được — ${e.message}`); }
  }
  const plan = ctx.window.FREELANCE_PLAN;
  const en = ctx.window.FREELANCE_EN;
  if (!plan) { if (errors.length === 0) errors.push('freelance-plan.js: thiếu window.FREELANCE_PLAN'); return { errors, weeks: 0, tasks: 0 }; }
  if (!en) errors.push('freelance-english.js: thiếu window.FREELANCE_EN');

  // ---- top-level ----
  if (typeof plan.goal !== 'string' || plan.goal.length < 40) errors.push('FREELANCE_PLAN.goal quá ngắn');
  if (typeof plan.timezoneNote !== 'string' || plan.timezoneNote.length < 20) errors.push('FREELANCE_PLAN.timezoneNote quá ngắn');

  const job = plan.job || {};
  if (typeof job.title !== 'string' || !job.title) errors.push('job.title thiếu');
  if (typeof job.rate !== 'string' || !job.rate) errors.push('job.rate thiếu');
  if (typeof job.trial !== 'string' || !job.trial) errors.push('job.trial thiếu');
  for (const k of ['mustHaves', 'niceToHaves']) {
    if (!Array.isArray(job[k]) || job[k].length < 1) errors.push(`job.${k} cần ≥ 1 mục`);
  }
  if (!Array.isArray(job.screening) || job.screening.length !== 5) errors.push('job.screening phải có đúng 5 câu');

  const proj = plan.project || {};
  if (typeof proj.name !== 'string' || !proj.name) errors.push('project.name thiếu');
  if (typeof proj.prRule !== 'string' || !proj.prRule) errors.push('project.prRule thiếu');
  if (!Array.isArray(proj.stack) || proj.stack.length < 1) errors.push('project.stack cần ≥ 1 mục');

  // ---- months ----
  const months = plan.months || [];
  if (months.length !== 3) errors.push(`months có ${months.length} mục, cần 3`);
  const monthIds = new Set();
  for (const m of months) {
    if (!m.id || monthIds.has(m.id)) errors.push(`month id trùng/thiếu: ${m.id}`);
    monthIds.add(m.id);
    if (typeof m.title !== 'string' || !m.title) errors.push(`month ${m.id}: title thiếu`);
    if (typeof m.focus !== 'string' || !m.focus) errors.push(`month ${m.id}: focus thiếu`);
  }

  // ---- weeks ----
  const weeks = plan.weeks || [];
  if (weeks.length !== 12) errors.push(`weeks có ${weeks.length} tuần, cần 12`);
  const lessonIds = collectLessonIds();
  const weekIds = new Set();
  const taskIds = new Set();
  let taskTotal = 0;
  weeks.forEach((w, i) => {
    const at = w.id || `weeks[${i}]`;
    if (!/^fw\d{1,2}$/.test(w.id || '')) errors.push(`${at}: id phải dạng fw1..fw12`);
    if (weekIds.has(w.id)) errors.push(`${at}: id tuần trùng`); weekIds.add(w.id);
    if (i < 12 && w.id !== `fw${i + 1}`) errors.push(`${at}: thứ tự tuần sai (mong fw${i + 1})`);
    if (!monthIds.has(w.month)) errors.push(`${at}: month lạ ${w.month}`);
    if (typeof w.title !== 'string' || w.title.length < 10) errors.push(`${at}: title quá ngắn`);
    if (!Array.isArray(w.goals) || w.goals.length < 2) errors.push(`${at}: cần ≥ 2 goals`);
    if (typeof w.deliverable !== 'string' || w.deliverable.length < 20) errors.push(`${at}: deliverable quá ngắn`);
    if (!Array.isArray(w.english) || w.english.length < 1) errors.push(`${at}: english cần ≥ 1 mục`);
    if (!Array.isArray(w.lessonIds)) errors.push(`${at}: lessonIds phải là mảng`);
    else for (const lid of w.lessonIds) if (!lessonIds.has(lid)) errors.push(`${at}: lessonIds trỏ tới bài không tồn tại ${lid}`);
    for (const l of w.links || []) {
      if (typeof l.title !== 'string' || !l.title) errors.push(`${at}: link thiếu title`);
      if (!/^https:\/\//.test(l.url || '')) errors.push(`${at}: link không phải https: ${l.url}`);
    }
    const tasks = w.tasks || [];
    if (tasks.length < 4 || tasks.length > 7) errors.push(`${at}: cần 4–7 task (đang ${tasks.length})`);
    for (const t of tasks) {
      taskTotal++;
      if (!t.id || taskIds.has(t.id)) errors.push(`${at}: task id trùng/thiếu ${t.id}`);
      taskIds.add(t.id);
      if (t.id && w.id && !String(t.id).startsWith(w.id + '-')) errors.push(`${at}: task ${t.id} không bắt đầu bằng ${w.id}-`);
      if (typeof t.text !== 'string' || t.text.length < 30) errors.push(`${at}: task ${t.id} text quá ngắn`);
      if (!Number.isInteger(t.minutes) || t.minutes <= 0) errors.push(`${at}: task ${t.id} minutes phải là số nguyên dương`);
    }
  });

  // ---- english stub schema ----
  if (en) {
    for (const k of ['screening', 'standup', 'phrases']) if (!Array.isArray(en[k])) errors.push(`FREELANCE_EN.${k} phải là mảng`);
    if (en.videoScript !== null && typeof en.videoScript !== 'string') errors.push('FREELANCE_EN.videoScript phải là null hoặc chuỗi');
    const KEYS = new Set(['screening', 'standup', 'phrases', 'videoScript']);
    for (const k of Object.keys(en)) if (!KEYS.has(k)) errors.push(`FREELANCE_EN: field lạ ${k}`);
  }

  // ---- no secret-like strings anywhere in the source ----
  const SRC = ['freelance-plan.js', 'freelance-english.js'].map(f => fs.readFileSync(path.join(DATA, f), 'utf8')).join('\n');
  for (const bad of ['sk_live_', 'rk_live_', 'whsec_']) {
    // whsec_ được phép ở dạng placeholder whsec_... trong văn bản; chỉ chặn key có vẻ thật (20+ ký tự sau tiền tố)
    const re = bad === 'whsec_' ? /whsec_[A-Za-z0-9]{20,}/ : new RegExp(bad + '[A-Za-z0-9]{10,}');
    if (re.test(SRC)) errors.push(`phát hiện chuỗi giống secret thật: ${bad}...`);
  }

  return { errors, weeks: weeks.length, tasks: taskTotal };
}

module.exports = check;
if (require.main === module) {
  const { errors, weeks, tasks } = check();
  console.log(`Freelance track: ${weeks} tuần, ${tasks} task.`);
  if (errors.length) { console.log('LỖI:\n  ' + errors.join('\n  ')); process.exit(1); }
  console.log('OK — dữ liệu freelance hợp lệ.');
}