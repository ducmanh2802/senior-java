#!/usr/bin/env node
/*
 * Check the CKA hands-on mock exams (docs/CKA-MOCK.md): js/data/cka-mock-N.js -> window.CKA_EXAMS.
 * Runnable alone or from scripts/validate.js:
 *   node scripts/check-cka.js   -> prints counts, exits 1 on errors
 * Also runs `bash -n` on every setup/verify script when bash is available.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const DATA = path.join(__dirname, '..', 'js', 'data');
const Diagram = require(path.join(__dirname, '..', 'js', 'core', 'diagram.js'));
const DOMAINS = { 'Troubleshooting': 30, 'Cluster Architecture': 25, 'Services & Networking': 20, 'Workloads & Scheduling': 15, 'Storage': 10 };
const EXAM_KEYS = new Set(['id', 'title', 'minutes', 'passPct', 'intro', 'tasks']);
const TASK_KEYS = new Set(['id', 'no', 'domain', 'weight', 'env', 'minutes', 'title', 'task', 'setup', 'verify', 'solution', 'refs', 'tags']);
const LAB_KEYS = new Set(['id', 'order', 'title', 'summary', 'concepts', 'tasks']);
const LAB_TASK_KEYS = new Set([...TASK_KEYS].filter(k => k !== 'weight').concat(['level', 'hints']));
const LEVELS = new Set(['easy', 'medium', 'hard']);
// cka-labs-N.js holds modules: 1 -> 1..5, 2 -> 6..10, 3 -> 11..15, 4 -> 16..20
const LAB_RANGE = { 1: [1, 5], 2: [6, 10], 3: [11, 15], 4: [16, 20] };
const VN = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi;

function files() {
  return fs.readdirSync(DATA).filter(f => /^cka-(mock|labs)-\d+\.js$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
}

function bashOk() {
  const r = spawnSync('bash', ['-c', 'exit 0'], { encoding: 'utf8' });
  return r.status === 0;
}

function check() {
  const errors = [];
  const ctx = { window: {} };
  vm.createContext(ctx);
  const src = {};
  for (const f of files()) {
    src[f] = fs.readFileSync(path.join(DATA, f), 'utf8');
    const before = (ctx.window.CKA_EXAMS || []).length;
    const labsBefore = (ctx.window.CKA_LABS || []).length;
    try { vm.runInContext(src[f], ctx, { filename: f }); }
    catch (e) { errors.push(`${f}: lỗi cú pháp/chạy: ${e.message}`); continue; }
    const added = (ctx.window.CKA_EXAMS || []).slice(before);
    const n = parseInt(f.match(/\d+/)[0], 10);
    if (f.startsWith('cka-labs-')) {
      if (added.length) errors.push(`${f}: file lab không được push CKA_EXAMS`);
      const r = LAB_RANGE[n];
      if (!r) errors.push(`${f}: chỉ có cka-labs-1..4.js`);
      else (ctx.window.CKA_LABS || []).slice(labsBefore).forEach(l => {
        if (l && (l.order < r[0] || l.order > r[1])) errors.push(`${f}: ${l.id} (module ${l.order}) phải nằm trong module ${r[0]}–${r[1]}`);
      });
      continue;
    }
    if (added.length > 1) errors.push(`${f}: mỗi file chỉ push 1 đề`);
    added.forEach(x => { if (x && x.id !== `cka-${n}`) errors.push(`${f}: id đề phải là cka-${n}`); });
  }
  const exams = Array.isArray(ctx.window.CKA_EXAMS) ? ctx.window.CKA_EXAMS : [];
  const str = (v, min) => typeof v === 'string' && v.trim().length >= min;
  function markup(where, s) {
    if (typeof s !== 'string') return;
    for (const m of s.matchAll(/^~~~seq[^\n]*\n([\s\S]*?)^~~~/gm)) {
      try { Diagram.parseSeq(m[1]); } catch (e) { errors.push(`${where}: sơ đồ ~~~seq lỗi: ${e.message}`); }
    }
    if (s.split('\n').filter(l => l.startsWith('~~~')).length % 2) errors.push(`${where}: code fence ~~~ chưa đóng`);
    const prose = s.replace(/~~~[\s\S]*?~~~/g, '');
    if ((prose.match(/\{\{/g) || []).length !== (prose.match(/\}\}/g) || []).length) errors.push(`${where}: số {{ và }} không khớp`);
    if (/<\/?(div|span|br|b|i|p|code|pre)\b/i.test(prose)) errors.push(`${where}: có thẻ HTML thô`);
  }
  function vietnamese(where, s) {
    const prose = typeof s === 'string' ? s.replace(/~~~[\s\S]*?~~~/g, '').replace(/\{\{[\s\S]*?\}\}/g, '') : '';
    if (prose.length < 150) return;
    if ((prose.match(VN) || []).length / prose.length < 0.025) errors.push(`${where}: có vẻ viết tiếng Việt KHÔNG dấu`);
  }

  const scripts = [];
  const ids = new Set();
  function checkTask(t, j, prefix, lab) {
    const id = t && t.id || `${prefix}.tasks[${j}]`;
    if (!t || typeof t !== 'object') { errors.push(`${id}: không phải object`); return false; }
    const num = String(j + 1).padStart(2, '0');
    if (t.id !== `${prefix}-${num}`) errors.push(`${id}: id phải là ${prefix}-${num}`);
    if (ids.has(t.id)) errors.push(`${id}: id trùng`); ids.add(t.id);
    if (t.no !== j + 1) errors.push(`${id}: no phải là ${j + 1}`);
    if (!(t.domain in DOMAINS)) errors.push(`${id}: domain phải là một trong ${Object.keys(DOMAINS).join(' | ')}`);
    if (!lab && (!Number.isInteger(t.weight) || t.weight < 2 || t.weight > 13)) errors.push(`${id}: weight là số nguyên 2–13`);
    if (lab) {
      if (t.weight != null) errors.push(`${id}: bài lab không có weight`);
      if (!LEVELS.has(t.level)) errors.push(`${id}: level phải là easy|medium|hard`);
      if (!Array.isArray(t.hints) || t.hints.length < 1 || t.hints.length > 3 || t.hints.some(h => !str(h, 10))) errors.push(`${id}: hints 1–3 chuỗi ≥ 10 ký tự`);
    } else if (t.level != null || t.hints != null) errors.push(`${id}: bài thi không có level/hints`);
    if (t.env !== 'kind' && t.env !== 'kubeadm') errors.push(`${id}: env phải là kind|kubeadm`);
    if (!Number.isInteger(t.minutes) || t.minutes < 2 || t.minutes > 15) errors.push(`${id}: minutes là số nguyên 2–15`);
    if (!str(t.title, 5) || t.title.length > 90) errors.push(`${id}: title 5–90 ký tự`);
    if (!str(t.task, 200)) errors.push(`${id}: task ≥ 200 ký tự`);
    else if (!/use-context/.test(t.task)) errors.push(`${id}: task phải mở đầu bằng dòng Context: kubectl config use-context …`);
    if (typeof t.setup !== 'string' || (t.env === 'kind' && !str(t.setup, 20))) errors.push(`${id}: setup là script bash (bắt buộc với env kind)`);
    if (!str(t.verify, 40)) errors.push(`${id}: thiếu verify`);
    else {
      if (!/PASS /.test(t.verify) || !/FAIL /.test(t.verify)) errors.push(`${id}: verify phải in PASS <tên> / FAIL <tên>: …`);
      if (!/RESULT /.test(t.verify)) errors.push(`${id}: verify phải in dòng cuối RESULT <passed>/<total>`);
    }
    if (!str(t.solution, 300)) errors.push(`${id}: solution ≥ 300 ký tự`);
    for (const k of ['task', 'solution']) { markup(`${id}.${k}`, t[k]); vietnamese(`${id}.${k}`, t[k]); }
    if (t.refs != null) {
      if (!Array.isArray(t.refs) || t.refs.length > 3) errors.push(`${id}: refs tối đa 3`);
      else t.refs.forEach((r, k) => {
        if (!r || !/^https:\/\/kubernetes\.io\//.test(r.url || '') || !str(r.title, 3)) errors.push(`${id}.refs[${k}]: cần {type, title, url https://kubernetes.io/…}`);
      });
    }
    if (t.tags != null && (!Array.isArray(t.tags) || t.tags.some(x => typeof x !== 'string'))) errors.push(`${id}: tags là mảng chuỗi`);
    Object.keys(t).forEach(k => { if (!(lab ? LAB_TASK_KEYS : TASK_KEYS).has(k)) errors.push(`${id}: field lạ "${k}"`); });
    for (const k of ['setup', 'verify']) if (typeof t[k] === 'string' && t[k].trim()) {
      if (/\$\{/.test(t[k])) errors.push(`${id}.${k}: không dùng \${…} (viết $VAR)`);
      if (/(^|[\s;&|])(rm\s+-rf\s+\/(\s|$)|mkfs|shutdown|reboot)\b/.test(t[k])) errors.push(`${id}.${k}: lệnh nguy hiểm`);
      scripts.push({ where: `${id}.${k}`, code: t[k] });
    }
    return true;
  }
  exams.forEach((ex, i) => {
    const eid = ex && ex.id || `CKA_EXAMS[${i}]`;
    if (!ex || typeof ex !== 'object') { errors.push(`${eid}: không phải object`); return; }
    if (!/^cka-\d+$/.test(ex.id || '')) errors.push(`${eid}: id phải dạng cka-N`);
    if (ids.has(ex.id)) errors.push(`${eid}: id trùng`); ids.add(ex.id);
    if (!str(ex.title, 5)) errors.push(`${eid}: thiếu title`);
    if (ex.minutes !== 120) errors.push(`${eid}: minutes phải là 120`);
    if (ex.passPct !== 66) errors.push(`${eid}: passPct phải là 66`);
    if (!str(ex.intro, 300)) errors.push(`${eid}: intro ≥ 300 ký tự`);
    markup(`${eid}.intro`, ex.intro); vietnamese(`${eid}.intro`, ex.intro);
    Object.keys(ex).forEach(k => { if (!EXAM_KEYS.has(k)) errors.push(`${eid}: field lạ "${k}"`); });
    const tasks = Array.isArray(ex.tasks) ? ex.tasks : [];
    if (tasks.length < 15 || tasks.length > 20) errors.push(`${eid}: cần 15–20 bài (đang ${tasks.length})`);
    let wsum = 0, msum = 0, kubeadm = 0;
    const byDomain = {};
    tasks.forEach((t, j) => {
      if (!checkTask(t, j, ex.id, false)) return;
      if (Number.isInteger(t.weight)) { wsum += t.weight; byDomain[t.domain] = (byDomain[t.domain] || 0) + t.weight; }
      if (Number.isInteger(t.minutes)) msum += t.minutes;
      if (t.env === 'kubeadm') kubeadm++;
    });
    if (tasks.length) {
      if (wsum !== 100) errors.push(`${eid}: tổng weight phải = 100 (đang ${wsum})`);
      if (msum > 120) errors.push(`${eid}: tổng minutes ≤ 120 (đang ${msum})`);
      if (kubeadm > 4) errors.push(`${eid}: tối đa 4 bài env kubeadm (đang ${kubeadm})`);
      for (const [d, w] of Object.entries(DOMAINS)) {
        const got = byDomain[d] || 0;
        if (Math.abs(got - w) > 7) errors.push(`${eid}: domain ${d} chiếm ${got}%, cần ${w} ± 7`);
      }
    }
  });

  const labs = Array.isArray(ctx.window.CKA_LABS) ? ctx.window.CKA_LABS : [];
  labs.forEach((l, i) => {
    const lid = l && l.id || `CKA_LABS[${i}]`;
    if (!l || typeof l !== 'object') { errors.push(`${lid}: không phải object`); return; }
    const nn = String(l.order).padStart(2, '0');
    if (!Number.isInteger(l.order) || l.order < 1 || l.order > 20) errors.push(`${lid}: order là số module 1–20`);
    else if (l.id !== `cka-lab-${nn}`) errors.push(`${lid}: id phải là cka-lab-${nn}`);
    if (ids.has(l.id)) errors.push(`${lid}: id trùng`); ids.add(l.id);
    if (!str(l.title, 5) || l.title.length > 90) errors.push(`${lid}: title 5–90 ký tự`);
    if (!str(l.summary, 40) || l.summary.length > 300) errors.push(`${lid}: summary 40–300 ký tự`);
    if (!str(l.concepts, 800)) errors.push(`${lid}: concepts ≥ 800 ký tự`);
    markup(`${lid}.concepts`, l.concepts); vietnamese(`${lid}.concepts`, l.concepts);
    Object.keys(l).forEach(k => { if (!LAB_KEYS.has(k)) errors.push(`${lid}: field lạ "${k}"`); });
    const tasks = Array.isArray(l.tasks) ? l.tasks : [];
    if (tasks.length < 4 || tasks.length > 8) errors.push(`${lid}: cần 4–8 bài (đang ${tasks.length})`);
    tasks.forEach((t, j) => checkTask(t, j, l.id, true));
  });

  // bash -n on every script (skip silently when bash is missing)
  if (scripts.length && bashOk()) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cka-'));
    scripts.forEach((s, i) => {
      const f = path.join(dir, `s${i}.sh`);
      fs.writeFileSync(f, s.code);
      const r = spawnSync('bash', ['-n', f], { encoding: 'utf8' });
      if (r.status !== 0) errors.push(`${s.where}: bash -n lỗi: ${(r.stderr || '').trim().split('\n')[0]}`);
    });
    fs.rmSync(dir, { recursive: true, force: true });
  }
  for (const [f, s] of Object.entries(src)) if (/\$\{/.test(s)) errors.push(`${f}: có \${ trong template literal`);
  return { errors, labs: labs.length, labTasks: labs.reduce((n, l) => n + (Array.isArray(l && l.tasks) ? l.tasks.length : 0), 0), exams: exams.length, tasks: exams.reduce((n, e) => n + (Array.isArray(e && e.tasks) ? e.tasks.length : 0), 0) };
}

module.exports = check;
if (require.main === module) {
  const { errors, exams, tasks, labs, labTasks } = check();
  console.log(`CKA mock: ${exams} đề, ${tasks} bài; lab: ${labs} module, ${labTasks} bài.`);
  if (errors.length) { console.log('LỖI:\n  ' + errors.join('\n  ')); process.exit(1); }
  console.log('OK — đề CKA hợp lệ.');
}
