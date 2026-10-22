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
  T18: { files: ['algo.js'], algoTests: 48 },
  T41: { files: ['labs-thread.js'], labs: 5 }, T42: { files: ['labs-gc.js'], labs: 5 },
  T43: { files: ['labs-sql.js'], labs: 5 }, T44: { files: ['labs-incident.js'], labs: 5 },
  // đợt 2 câu hỏi: target = tổng số câu của topic sau khi thêm
  T46: { files: ['q-java.js'], topics: { core: 19, collections: 14, modern: 14 } },
  T47: { files: ['q-concurrency-jvm.js'], topics: { concurrency: 20, jvm: 18 } },
  T48: { files: ['q-spring-data.js'], topics: { spring: 21, jpa: 17, db: 19 } },
  T49: { files: ['q-microservices.js'], topics: { microservices: 28 } },
  T50: { files: ['q-system-design.js'], topics: { design: 21, architecture: 14 } },
  T51: { files: ['q-aws.js', 'q-ai.js'], topics: { aws: 22, ai: 20 } },
  T52: { files: ['q-soft.js'], topics: { testing: 16, behavioral: 20 } },
  T53: { files: ['q-english.js'], topics: { english: 31 } },
  T54: { files: ['q-scenario.js'], topics: { scenario: 41 } },
  // đợt 3: câu hay gặp; T59–T62 tự chạy sau khi task đợt 2 cùng file xong
  T55: { files: ['q-api.js'], topics: { api: 14 } }, T56: { files: ['q-security.js'], topics: { security: 14 } },
  T57: { files: ['q-sql.js'], topics: { sql: 14 } }, T58: { files: ['q-devops.js'], topics: { devops: 14 } },
  T59: { files: ['q-java.js'], topics: { core: 26, collections: 18, modern: 17 } },
  T60: { files: ['q-concurrency-jvm.js'], topics: { concurrency: 27, jvm: 22 } },
  T61: { files: ['q-spring-data.js'], topics: { spring: 27, jpa: 21, db: 25 } },
  T62: { files: ['q-system-design.js'], topics: { architecture: 22 } },
};
const VIEWS = {
  T09: ['dashboard', 'bank'], T10: ['flash', 'quiz'], T11: ['mock'], T15: ['algo'], T17: ['roadmap'],
  T19: ['mock'], T20: ['algo', 'bank'], T21: ['companies'],
  T33: ['account'], T34: ['legal'], T45: ['labs'],
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
  // events in file order, so a re-run (new "start" after an "end") resets that task
  for (const m of txt.matchAll(/\[(\d\d:\d\d:\d\d)\] (start|end)\s+(T\d+) (?:\(([^)]*)\)|exit=(\d+))/g)) {
    if (m[2] === 'start') st[m[3]] = { started: m[1], model: (m[4] || '').split(' ').slice(1).join(' ') };
    else Object.assign(st[m[3]] = st[m[3]] || {}, { ended: m[1], exit: Number(m[5]) });
  }
  const running = Object.values(st).some(r => r.started && r.ended == null);
  return { st, allDone: !running && /All agents finished/.test(txt) };
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
      if (!r.ok) {
        // file is mid-write: count ids textually so progress still shows
        syntax = f + ': ' + r.err;
        const src = read('js/data/' + f) || '';
        for (const m of src.matchAll(/id:\s*'([a-z]+)-\d{3}'/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;
        counts.__quiz = (counts.__quiz || 0) + (src.match(/id:\s*'qz-[a-z]+-\d{3}'/g) || []).length;
        counts.__algo = (counts.__algo || 0) + (src.match(/id:\s*'algo-\d{3}'/g) || []).length;
        continue;
      }
      (r.w.QUESTIONS || []).forEach(q => { counts[q.topic] = (counts[q.topic] || 0) + 1; });
      counts.__quiz = (counts.__quiz || 0) + (r.w.QUIZ || []).length;
      counts.__algo = (counts.__algo || 0) + (r.w.ALGOS || []).length;
      counts.__labs = (counts.__labs || 0) + (r.w.LABS || []).length;
      counts.__algoTests = (counts.__algoTests || 0) + (r.w.ALGOS || []).filter(a => typeof a.tests === 'string' && /class Main/.test(a.tests)).length;
    }
    const list = Object.entries(spec.topics || {}).map(([t, n]) => ({ label: t, done: counts[t] || 0, target: n }));
    if (spec.quiz) list.push({ label: 'trắc nghiệm', done: counts.__quiz || 0, target: spec.quiz });
    if (spec.algo) list.push({ label: 'bài thuật toán', done: counts.__algo || 0, target: spec.algo });
    if (spec.labs) list.push({ label: 'lab', done: counts.__labs || 0, target: spec.labs });
    if (spec.algoTests) list.push({ label: 'bài có test', done: counts.__algoTests || 0, target: spec.algoTests });
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
    if (t.state === 'running' && t.log.mtime && Date.now() - t.log.mtime > 20 * 60000) t.state = 'stalled';
  });
  const overall = Math.round(tasks.reduce((a, t) => a + t.pct, 0) / tasks.length);
  return { at: Date.now(), overall, allDone, tasks };
}

http.createServer((req, res) => {
  const PAGE = fs.readFileSync(path.join(__dirname, 'monitor.html'), 'utf8'); // re-read so UI edits apply live
  if (req.url.startsWith('/api/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(status()));
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(PAGE);
}).listen(PORT, '127.0.0.1', () => console.log(`Agent monitor: http://localhost:${PORT}`));
