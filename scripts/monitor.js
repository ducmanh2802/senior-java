#!/usr/bin/env node
/*
 * Live progress dashboard for the agent tasks (no dependencies).
 *   node scripts/monitor.js          -> http://localhost:4321
 * Progress per task:
 *   content tasks: items written / target (counted by loading the data files in a sandbox)
 *   view tasks:    stub replaced + code size vs. expected size, 100% when task file says DONE
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 4321;
const rel = p => path.join(ROOT, p);

// target counts mirror tasks/*.md
const CONTENT = {
  T01: { files: ['q-java.js'], topics: { core: 10, collections: 8, modern: 8 } },
  T02: { files: ['q-concurrency-jvm.js'], topics: { concurrency: 12, jvm: 10 } },
  T03: { files: ['q-spring-data.js'], topics: { spring: 12, jpa: 8, db: 10 } },
  T04: { files: ['q-microservices.js'], topics: { microservices: 16 } },
  T05: { files: ['q-system-design.js'], topics: { design: 12, architecture: 8 } },
  T06: { files: ['q-aws.js', 'q-ai.js'], topics: { aws: 14, ai: 12 } },
  T07: { files: ['q-soft.js'], topics: { testing: 8, behavioral: 10 } },
  T08: { files: ['q-english.js'], topics: { english: 18 } },
  T16: { files: ['q-scenario.js'], topics: { scenario: 24 } },
  T12: { files: ['quiz.js'], quiz: 80 },
  T14: { files: ['algo.js'], algo: 40 },
};
const VIEWS = {
  T09: ['dashboard', 'bank'], T10: ['flash', 'quiz'], T11: ['mock'], T15: ['algo'], T17: ['roadmap'],
};
const EXPECTED_VIEW_LINES = 300; // rough size of a finished view (js + css)

const stripAnsi = s => s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r/g, '');
const read = p => { try { return fs.readFileSync(rel(p), 'utf8'); } catch (e) { return null; } };
const mtime = p => { try { return fs.statSync(rel(p)).mtimeMs; } catch (e) { return 0; } };

function loadFile(file) {
  const sb = { window: {} };
  try { vm.runInNewContext(read('js/data/' + file) || '', sb, { timeout: 2000 }); return { ok: true, w: sb.window }; }
  catch (e) { return { ok: false, err: e.message }; }
}

// validator output, cached by data-file mtime
const valCache = {};
function validate(file) {
  const key = file + ':' + mtime('js/data/' + file);
  if (valCache[key]) return valCache[key];
  valCache[key] = { pending: true };
  execFile(process.execPath, [rel('scripts/validate.js'), file], { cwd: ROOT, timeout: 20000 }, (err, stdout, stderr) => {
    const out = stripAnsi(stdout + stderr);
    const errors = (out.split('LỖI:')[1] || '').split('\n').map(s => s.trim()).filter(Boolean);
    const warns = ((out.split('Cảnh báo:')[1] || '').split(/\n\s*\n|LỖI:/)[0] || '').split('\n').map(s => s.trim()).filter(Boolean);
    valCache[key] = { errors, warns: warns.length };
  });
  return valCache[key];
}

function taskMeta(id) {
  const f = fs.readdirSync(rel('tasks')).find(n => n.startsWith(id + '-'));
  const md = f ? read('tasks/' + f) : '';
  return {
    file: f,
    title: (md.match(/^# \S+ — (.+)$/m) || [])[1] || id,
    agent: (md.match(/^Agent:\s*(\S+)/m) || [])[1] || '?',
    status: (md.match(/^Status:\s*(\S+)/m) || [])[1] || '?',
    notes: ((md.split('## Notes')[1] || '').replace('(agent ghi chú ở đây)', '').trim()).slice(0, 600),
  };
}

function runnerState() {
  const txt = read('logs-runner.txt') || '';
  const st = {};
  for (const m of txt.matchAll(/\[(\d\d:\d\d:\d\d)\] start (T\d+) \(([^)]*)\)/g)) st[m[2]] = { started: m[1], model: m[3].split(' ').slice(1).join(' ') };
  for (const m of txt.matchAll(/\[(\d\d:\d\d:\d\d)\] end\s+(T\d+) exit=(\d+)/g)) Object.assign(st[m[2]] = st[m[2]] || {}, { ended: m[1], exit: Number(m[3]) });
  return { st, allDone: /All agents finished/.test(txt) };
}

function logInfo(id) {
  const p = 'logs/' + id + '.log';
  const raw = read(p);
  if (raw == null) return { exists: false };
  const lines = stripAnsi(raw).split('\n').map(s => s.trimEnd()).filter(s => s.trim());
  return { exists: true, size: raw.length, mtime: mtime(p), tail: lines.slice(-6) };
}

function status() {
  const { st, allDone } = runnerState();
  const tasks = [];

  for (const [id, spec] of Object.entries(CONTENT)) {
    const meta = taskMeta(id);
    const counts = {};
    let done = 0, target = 0, syntax = null;
    for (const f of spec.files) {
      const r = loadFile(f);
      if (!r.ok) { syntax = f + ': ' + r.err; continue; }
      (r.w.QUESTIONS || []).forEach(q => { counts[q.topic] = (counts[q.topic] || 0) + 1; });
      counts.__quiz = (counts.__quiz || 0) + (r.w.QUIZ || []).length;
      counts.__algo = (counts.__algo || 0) + (r.w.ALGOS || []).length;
    }
    const list = Object.entries(spec.topics || {}).map(([t, n]) => ({ label: t, done: counts[t] || 0, target: n }));
    if (spec.quiz) list.push({ label: 'trắc nghiệm', done: counts.__quiz || 0, target: spec.quiz });
    if (spec.algo) list.push({ label: 'bài thuật toán', done: counts.__algo || 0, target: spec.algo });
    list.forEach(p => { done += Math.min(p.done, p.target); target += p.target; });
    const val = spec.files.map(validate);
    const errors = val.flatMap(v => v.errors || []);
    let pct = target ? Math.round(done / target * 100) : 0;
    if (meta.status === 'DONE' && !errors.length && !syntax) pct = Math.max(pct, 100);
    tasks.push({ id, kind: 'content', ...meta, pct: Math.min(100, pct), parts: list, errors, warns: val.reduce((a, v) => a + (v.warns || 0), 0), syntax, run: st[id] || null, log: logInfo(id) });
  }

  for (const [id, views] of Object.entries(VIEWS)) {
    const meta = taskMeta(id);
    const parts = views.map(v => {
      const js = read('js/views/' + v + '.js') || '', css = read('css/views/' + v + '.css') || '';
      const stub = /Đang xây dựng \(T\d+\)/.test(js);
      const lines = js.split('\n').length + css.split('\n').length;
      let syntaxErr = null;
      try { new vm.Script(js); } catch (e) { syntaxErr = e.message; }
      return { label: v, stub, lines, syntaxErr, done: stub ? 0 : Math.min(lines, EXPECTED_VIEW_LINES), target: EXPECTED_VIEW_LINES };
    });
    let pct = Math.round(parts.reduce((a, p) => a + p.done, 0) / parts.reduce((a, p) => a + p.target, 0) * 95);
    if (meta.status === 'DONE') pct = 100;
    const syntax = parts.filter(p => p.syntaxErr).map(p => p.label + ': ' + p.syntaxErr).join('; ') || null;
    tasks.push({ id, kind: 'view', ...meta, pct, parts, errors: [], warns: 0, syntax, run: st[id] || null, log: logInfo(id) });
  }

  tasks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  tasks.forEach(t => {
    const r = t.run;
    t.state = !r ? 'queued'
      : r.ended != null ? (t.status === 'DONE' || t.pct >= 100 ? 'done' : (r.exit ? 'failed' : 'stopped'))
      : 'running';
    if (t.state === 'running' && t.log.mtime && Date.now() - t.log.mtime > 10 * 60000) t.state = 'stalled';
  });
  const overall = Math.round(tasks.reduce((a, t) => a + t.pct, 0) / tasks.length);
  return { at: Date.now(), overall, allDone, tasks };
}

const PAGE = fs.readFileSync(path.join(__dirname, 'monitor.html'), 'utf8');
http.createServer((req, res) => {
  if (req.url.startsWith('/api/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(status()));
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
}).listen(PORT, '127.0.0.1', () => console.log(`Agent monitor: http://localhost:${PORT}`));
