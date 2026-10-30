#!/usr/bin/env node
/*
 * Check the AWS Pro track data (docs/AWS-TRACK.md): js/data/aws-plan.js (window.AWS_PLAN) and the exam-style
 * question pools js/data/aws-*.js (window.AWS_QUESTIONS). Used by scripts/validate.js and runnable alone:
 *   node scripts/check-aws.js            -> prints counts per exam/domain, exits 1 on errors
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA = path.join(__dirname, '..', 'js', 'data');

function check() {
  const errors = [];
  const ctx = { window: {} };
  vm.createContext(ctx);
  const files = fs.readdirSync(DATA).filter(f => /^aws-.*\.js$/.test(f)).sort((a, b) => (a === 'aws-plan.js' ? -1 : b === 'aws-plan.js' ? 1 : a.localeCompare(b)));
  for (const f of files) {
    try { vm.runInContext(fs.readFileSync(path.join(DATA, f), 'utf8'), ctx, { filename: f }); }
    catch (e) { errors.push(`${f}: không chạy được — ${e.message}`); }
  }
  const plan = ctx.window.AWS_PLAN, qs = ctx.window.AWS_QUESTIONS || [];
  const domains = {};
  if (!plan) { if (files.length) errors.push('aws-plan.js: thiếu window.AWS_PLAN'); return { errors, counts: {} }; }
  for (const ex of plan.exams || []) for (const d of ex.domains || []) domains[d.id] = ex.id;
  if ((plan.exams || []).length !== 2) errors.push('AWS_PLAN.exams phải có đúng 2 exam (sap-c02, dop-c02)');
  for (const ex of plan.exams || []) {
    const w = (ex.domains || []).reduce((s, d) => s + d.weight, 0);
    if (w !== 100) errors.push(`AWS_PLAN ${ex.id}: tổng weight domain = ${w}, phải là 100`);
  }
  (plan.weeks || []).forEach((wk, i) => {
    if (wk.n !== i + 1) errors.push(`AWS_PLAN.weeks[${i}]: n phải là ${i + 1}`);
    if (!plan.exams.some(e => e.id === wk.exam)) errors.push(`tuần ${wk.n}: exam lạ ${wk.exam}`);
    for (const d of wk.domains || []) if (!domains[d]) errors.push(`tuần ${wk.n}: domain lạ ${d}`);
    if (!Array.isArray(wk.goals) || wk.goals.length < 2) errors.push(`tuần ${wk.n}: cần ≥ 2 goals`);
    for (const s of wk.study || []) if (!/^https:\/\//.test(s.url || '')) errors.push(`tuần ${wk.n}: link study không phải https`);
  });
  if ((plan.weeks || []).length !== 26) errors.push(`AWS_PLAN.weeks có ${(plan.weeks || []).length} tuần, cần 26`);

  const KEYS = new Set(['id', 'exam', 'domain', 'q', 'options', 'answer', 'multi', 'explain', 'services', 'refs']);
  const seen = new Set(), counts = {};
  for (const q of qs) {
    const at = q.id || '(không id)';
    for (const k of Object.keys(q)) if (!KEYS.has(k)) errors.push(`${at}: field lạ ${k}`);
    if (!/^(sap|dop)-\d{3}$/.test(q.id || '')) errors.push(`${at}: id phải dạng sap-NNN / dop-NNN`);
    if (seen.has(q.id)) errors.push(`${at}: id trùng`); seen.add(q.id);
    if (!['sap-c02', 'dop-c02'].includes(q.exam)) errors.push(`${at}: exam lạ ${q.exam}`);
    if (q.id && q.exam && q.id.slice(0, 3) !== q.exam.slice(0, 3)) errors.push(`${at}: id không khớp exam`);
    if (domains[q.domain] !== q.exam) errors.push(`${at}: domain ${q.domain} không thuộc ${q.exam}`);
    if (typeof q.q !== 'string' || q.q.length < 120) errors.push(`${at}: q quá ngắn (đề thật là tình huống)`);
    if (typeof q.explain !== 'string' || q.explain.length < 400) errors.push(`${at}: explain quá ngắn`);
    const o = q.options || [];
    if (new Set(o).size !== o.length) errors.push(`${at}: options trùng`);
    if (q.multi !== undefined && q.multi !== true) errors.push(`${at}: multi chỉ được là true`);
    if (q.multi) {
      const a = q.answer, n = Array.isArray(a) ? a.length : 0;
      if (o.length < 5 || o.length > 6) errors.push(`${at}: multi cần 5–6 options`);
      if (n < 2 || n > 3 || a.some((x, i) => !Number.isInteger(x) || x < 0 || x >= o.length || (i && x <= a[i - 1])))
        errors.push(`${at}: answer phải là 2–3 index tăng dần trong phạm vi`);
      const want = ['', '', 'two', 'three'][n];
      if (want && !new RegExp(`\\(Choose ${want}\\.\\)`).test(q.q)) errors.push(`${at}: q phải ghi "(Choose ${want}.)"`);
    } else {
      if (o.length !== 4) errors.push(`${at}: cần đúng 4 options`);
      if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`${at}: answer phải là 0..3`);
    }
    if (!Array.isArray(q.services) || !q.services.length || q.services.length > 6) errors.push(`${at}: services cần 1–6 mục`);
    for (const r of q.refs || []) if (!/^https:\/\//.test(r.url || '')) errors.push(`${at}: ref không phải https`);
    if ((q.refs || []).length > 3) errors.push(`${at}: tối đa 3 refs`);
    const key = q.exam + ' ' + q.domain;
    counts[key] = (counts[key] || 0) + 1;
  }
  return { errors, counts, total: qs.length };
}

module.exports = check;
if (require.main === module) {
  const { errors, counts, total } = check();
  for (const k of Object.keys(counts).sort()) console.log(`${k.padEnd(16)} ${counts[k]}`);
  if (errors.length) { console.log('LỖI:\n  ' + errors.join('\n  ')); process.exit(1); }
  console.log(`OK — ${total || 0} câu AWS.`);
}
