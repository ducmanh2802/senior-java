#!/usr/bin/env node
/*
 * Queue that keeps all free agents busy so pending tasks finish fast.
 *   node scripts/speed-cron.js            -> one tick
 *   node scripts/speed-cron.js --watch=60 -> loop every 60s
 *
 * Logic per tick:
 *   1. Gather every tasks/T*.md. DONE -> skip. "After: Tx" dependency not DONE -> skip.
 *   2. Already running (logs/parallel/<id>.out has start without end) -> skip.
 *   3. File ownership conflict: skip when another running task owns a file this task owns.
 *   4. Rotate across the free models, respecting per-model concurrency cap so we never hammer
 *      one provider with 6 sessions. Launch through scripts/agent-cli.sh like we do by hand.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const TASKS = path.join(ROOT, 'tasks');
const LOGS = path.join(ROOT, 'logs');
const PAR = path.join(LOGS, 'parallel');
const MAX = Number(process.env.MAX || 12);
const PER_MODEL = Number(process.env.PER_MODEL || 2);
const MODELS = [
  'opencode/deepseek-v4.1-flash-free',
  'opencode/glm-5.3-flash-free',
  'opencode/mimo-v2.6-flash-free',
  'opencode/beam-free',
  'opencode/flint-40b-free',
  'openrouter/xingchen-agi/xing4.0-29b-a4b:free',
];
const MODEL_USE = new Map();

const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
const nowMs = () => Date.now();

function statusOf(id) {
  const f = fs.readdirSync(TASKS).find(x => x.startsWith(id + '-'));
  if (!f) return { status: '?', after: '', owns: '' };
  const md = read(path.join(TASKS, f));
  const status = (md.match(/^Status:\s*(\S+)/m) || [])[1] || '?';
  const after = (md.match(/^After:\s*(\S+)/m) || [])[1] || '';
  const owns = ((md.match(/^Owns:\s*(.+)$/m) || [])[1] || '').match(/`[^`]+`/g) || [];
  return { status, after, owns: owns.map(s => s.slice(1, -1)), file: f };
}

function isRunning(id) {
  const f = path.join(PAR, id + '.out');
  if (!fs.existsSync(f)) return false;
  const lines = read(f).split('\n');
  const start = lines.some(x => /\bstart\b/.test(x) && x.includes(' ' + id + ' '));
  const end = lines.some(x => /\bend\b/.test(x) && x.includes(' ' + id + ' '));
  const stale = (nowMs() - fs.statSync(f).mtimeMs) > 20 * 60 * 1000;  // no output in 20 min = stalled
  return start && !end && !stale;
}

function tick() {
  const running = fs.existsSync(PAR) ? fs.readdirSync(PAR).filter(f => f.endsWith('.out')).map(f => f.slice(0, -4)).filter(isRunning) : [];
  const runningOwns = new Set();
  for (const id of running) for (const o of statusOf(id).owns) runningOwns.add(o);
  const done = new Set();
  const todo = [];
  for (const f of fs.readdirSync(TASKS)) {
    if (!/^T\d+-/.test(f)) continue;
    const id = f.slice(0, f.indexOf('-'));
    const st = statusOf(id);
    if (st.status === 'DONE') { done.add(id); continue; }
    if (st.after && done.has(st.after) === false) { todo.push({ id, st, blocked: st.after }); continue; }
    if (running.includes(id)) continue;
    if (st.owns.some(o => runningOwns.has(o))) continue;
    todo.push({ id, st, blocked: '' });
  }
  const models = [...MODELS].filter(() => true);
  const capacity = MAX - running.length;
  let launched = 0;
  for (const t of todo) {
    if (launched >= capacity) break;
    const pick = models.find(m => (MODEL_USE.get(m) || 0) < PER_MODEL);
    if (!pick) break;
    MODEL_USE.set(pick, (MODEL_USE.get(pick) || 0) + 1);
    launched++;
    console.log(`[${new Date().toLocaleTimeString('vi-VN')}] launching ${t.id} ${pick} ${t.blocked ? '(waiting ' + t.blocked + ')' : ''}`);
    try {
      const out = path.join(PAR, t.id + '.out');
      cp.spawn('bash', ['scripts/agent-cli.sh', t.id, 'opencode'], {
        cwd: ROOT, detached: true, stdio: ['ignore', fs.openSync(out, 'a'), fs.openSync(out, 'a')],
        env: { ...process.env, OPENCODE_MODEL: pick }, windowsHide: true,
      }).unref();
    } catch (e) {
      console.log('  launch error ' + t.id + ': ' + e.message);
    }
  }
  return { running: running.length, launched, capacity, todo: todo.length };
}

if (process.argv.includes('--watch')) {
  const sec = Math.max(30, Number(process.argv.find(x => x.startsWith('--watch=')).split('=')[1] || 60));
  const tickLoop = () => { const r = tick(); console.log('tick: running=' + r.running + ' launched=' + r.launched + ' capacity=' + r.capacity + ' pending=' + r.todo); };
  tickLoop();
  setInterval(tickLoop, sec * 1000);
} else {
  process.stdout.write(JSON.stringify(tick(), null, 2));
}
