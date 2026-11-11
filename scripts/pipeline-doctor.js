#!/usr/bin/env node
// Pipeline health check (2026-11-10). Detects the ways the worker/autopilot pipeline silently stalls:
//   - autopilot / workers not running (e.g. after a reboot)
//   - stale claims (logs/claim/<id>) left by a dead worker, so nobody picks the task up again
//   - DONE tasks that stay uncommitted because another "open" task owns the same file (open_owner deadlock)
//   - ready tasks but no worker has started anything for a long time
//   - unknown Status values, CRLF Status lines, Verify-failed tasks
// Usage: node scripts/pipeline-doctor.js [--fix] [--quiet]
//   --fix    moves stale claims to logs/backup/stale-claims-<date>/ and normalises CRLF Status lines
//   --quiet  print only problems (used by autopilot every ~30 min); exit code 1 when a problem is found
const fs = require('fs'), path = require('path'), cp = require('child_process');
const FIX = process.argv.includes('--fix'), QUIET = process.argv.includes('--quiet');
const now = Date.now(), MIN = 60000;
const sh = (cmd) => { try { return cp.execSync(cmd, { encoding: 'utf8', maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return e.stdout || ''; } };
const problems = [], info = [];
const warn = (m) => problems.push(m);

// ---- tasks
const tasks = {};
for (const f of fs.readdirSync('tasks').filter((f) => /^T\d+R?-.*\.md$/.test(f))) {
  const p = 'tasks/' + f, s = fs.readFileSync(p, 'utf8');
  const id = f.split('-')[0];
  const st = (s.match(/^Status:\s*([A-Z_]+)/m) || [])[1] || '?';
  const owns = ((s.match(/^Owns:(.*)$/m) || [])[1] || '').match(/`[^`]+`/g) || [];
  tasks[id] = { id, f: p, st, owns: owns.map((o) => o.slice(1, -1)), after: (s.match(/^After:\s*(\S+)/m) || [])[1],
    vf: /^Verify-failed:/m.test(s), rev: /^Reviewed-by:/m.test(s), crlf: /^Status:[^\n]*\r$/m.test(s),
    mtime: fs.statSync(p).mtimeMs };
}
const committedDone = new Set(sh('git grep -l "^Status: DONE" HEAD -- tasks/').split('\n').filter(Boolean).map((l) => l.replace(/^HEAD:/, '')));
const dirtyTasks = new Set(sh('git status --porcelain -- tasks/').split('\n').filter(Boolean).map((l) => l.slice(3).trim()));
const isCommittedDone = (t) => t && t.st === 'DONE' && committedDone.has(t.f) && !dirtyTasks.has(t.f);

// unknown statuses / CRLF
for (const t of Object.values(tasks)) {
  if (!['TODO', 'DONE', 'CANCELLED'].includes(t.st)) warn(`${t.id}: Status lạ "${t.st}" (autopilot chỉ hiểu TODO/DONE/CANCELLED)`);
  if (t.crlf) {
    if (FIX) { fs.writeFileSync(t.f, fs.readFileSync(t.f, 'utf8').replace(/\r\n/g, '\n')); info.push(`fixed CRLF in ${t.f}`); }
    else warn(`${t.id}: dòng Status có CRLF (chạy --fix để chuẩn hoá)`);
  }
}

// ---- processes and claims
const ps = sh('bash -c "ps -ef"');
const workerLines = ps.split('\n').filter((l) => /worker\.sh/.test(l)).length;
const autopilot = /autopilot\.sh/.test(ps);
if (!autopilot) warn('autopilot KHÔNG chạy (máy khởi động lại?) → bash scripts/pipeline-start.sh');
if (!workerLines) warn('không có worker nào chạy → bash scripts/pipeline-start.sh');
info.push(`autopilot=${autopilot ? 'on' : 'OFF'} worker-processes=${workerLines}`);

const claimDir = 'logs/claim', claims = fs.existsSync(claimDir) ? fs.readdirSync(claimDir) : [];
const staleDir = `logs/backup/stale-claims-${new Date().toISOString().slice(0, 10)}`;
for (const c of claims) {
  const age = (now - fs.statSync(path.join(claimDir, c)).mtimeMs) / MIN;
  const log = `logs/${c}.log`, logAge = fs.existsSync(log) ? (now - fs.statSync(log).mtimeMs) / MIN : Infinity;
  const t = tasks[c];
  const stale = !workerLines || (t && t.st === 'DONE' && logAge > 30) || (age > 180 && logAge > 60);
  if (!stale) continue;
  if (FIX) { fs.mkdirSync(staleDir, { recursive: true }); fs.renameSync(path.join(claimDir, c), path.join(staleDir, c + '-' + now)); info.push(`moved stale claim ${c}`); }
  else warn(`claim ${c} có vẻ chết (claim ${Math.round(age)} phút, log im ${Math.round(logAge)} phút) → --fix`);
}

// ---- stale review tasks: <id>R still TODO long after its parent was committed / failed verify / vanished.
// They count as open owners of the parent's files and block every later commit to those files.
const locks = fs.readdirSync('logs').filter((f) => /^review-\d+\.lock$/.test(f)).map((f) => fs.readFileSync('logs/' + f, 'utf8').trim());
for (const t of Object.values(tasks)) {
  if (!t.id.endsWith('R') || t.st !== 'TODO') continue;
  const parent = tasks[t.id.slice(0, -1)], ageMin = (now - t.mtime) / MIN;
  if (locks.includes(t.id.slice(0, -1)) || ageMin < 360) continue;
  if (parent && !isCommittedDone(parent) && !parent.vf && parent.st === 'DONE') continue; // still waiting for its review
  if (FIX) {
    const body = fs.readFileSync(t.f, 'utf8').replace(/^Status: TODO$/m, 'Status: CANCELLED') + '\n- ' + new Date().toISOString().slice(0, 16) + ' pipeline-doctor: huỷ review treo (task gốc đã commit / Verify-failed / không còn), vì nó chặn commit của các task khác cùng file.\n';
    fs.writeFileSync(t.f, body); t.st = 'CANCELLED'; info.push('cancelled stale review ' + t.id);
  } else warn(t.id + ': review treo ' + Math.round(ageMin / 60) + ' giờ, chặn file ' + t.owns.join(', ') + ' (--fix để huỷ)');
}

// ---- open owners exactly as autopilot computes them
const open = {};
for (const t of Object.values(tasks)) {
  if (t.st === 'DONE' || t.st === 'CANCELLED') continue;
  if (t.after && t.st === 'TODO' && !claims.includes(t.id) && !isCommittedDone(tasks[t.after])) continue;
  for (const o of t.owns) (open[o] = open[o] || []).push(t.id);
}

// ---- DONE but never committed
const dirtyFiles = new Set(sh('git status --porcelain -- js css index.html api scripts').split('\n').filter(Boolean).map((l) => l.slice(3).trim()));
let stuck = 0;
for (const t of Object.values(tasks)) {
  if (t.st !== 'DONE' || isCommittedDone(t) || t.id.endsWith('R')) continue;
  if (now - t.mtime > 3 * 24 * 60 * MIN) continue; // old tasks (legacy, already handled by hand) are noise
  if (/^Verify-failed:.*legacy/m.test(fs.readFileSync(t.f, 'utf8'))) continue;
  if (!t.owns.some((o) => dirtyFiles.has(o))) continue; // nothing to commit (already committed elsewhere)
  const ageMin = (now - t.mtime) / MIN;
  if (t.vf) { warn(`${t.id}: Verify-failed, autopilot bỏ qua (sửa lỗi rồi xoá dòng Verify-failed)`); continue; }
  if (ageMin < 120) continue;
  const blockers = [...new Set(t.owns.flatMap((o) => (open[o] || []).filter((b) => b !== t.id && b !== t.id + 'R')))];
  stuck++;
  warn(`${t.id}: DONE từ ${Math.round(ageMin)} phút mà chưa commit${t.rev ? ' (đã review)' : ''}` +
    (blockers.length ? `; bị chặn bởi task mở cùng file: ${blockers.join(', ')}` : '; không thấy task chặn — xem log autopilot'));
}

// ---- ready tasks but nobody working
const ready = Object.values(tasks).filter((t) => t.st === 'TODO' && !t.id.endsWith('R') && (!t.after || isCommittedDone(tasks[t.after])));
const lastStart = (() => { try { const s = sh('bash -c "grep -h \' start T\' logs-runner.txt | tail -1"'); const m = s.match(/^\[(\d\d):(\d\d):(\d\d)\]/); if (!m) return null; const d = new Date(); d.setHours(+m[1], +m[2], +m[3], 0); if (d.getTime() > now) d.setDate(d.getDate() - 1); return d.getTime(); } catch (e) { return null; } })();
const idleMin = lastStart ? Math.round((now - lastStart) / MIN) : null;
info.push(`TODO=${Object.values(tasks).filter((t) => t.st === 'TODO' && !t.id.endsWith('R')).length} ready=${ready.length} claims=${claims.length} stuck-DONE=${stuck} last-start=${idleMin === null ? '?' : idleMin + ' phút trước'}`);
if (ready.length && !claims.length && idleMin !== null && idleMin > 60)
  warn(`${ready.length} task sẵn sàng nhưng không worker nào bắt đầu việc trong ${idleMin} phút (worker hết hạn mức? ONLY range cũ? xem logs-runner.txt)`);
if (!ready.length && !claims.length && Object.values(tasks).some((t) => t.st === 'TODO' && !t.id.endsWith('R')) && !stuck)
  warn('còn task TODO nhưng không task nào sẵn sàng và không có claim: kiểm tra dòng After: (chuỗi phụ thuộc gãy?)');

const stamp = new Date().toTimeString().slice(0, 8);
if (!QUIET) info.forEach((m) => console.log(`[${stamp}] doctor: ${m}`));
problems.forEach((m) => console.log(`[${stamp}] DOCTOR: ${m}`));
if (!problems.length && !QUIET) console.log(`[${stamp}] doctor: OK`);
process.exitCode = problems.length ? 1 : 0;
