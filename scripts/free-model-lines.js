#!/usr/bin/env node
// Which data lines were last written by a free-model commit ("auto-committed after <kilo|opencode|codex|gemini|cline> review")
// and never rewritten since? Prints per file: total lines, free-model lines, share — to prioritise a Claude fact-check.
//   node scripts/free-model-lines.js            -> js/data/*.js, sorted by free-model lines
//   node scripts/free-model-lines.js q-soft.js  -> one file, plus the question/lesson ids those lines touch
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FREE = /auto-committed after (kilo|opencode|codex|gemini|cline|agy) review/;
const git = (cmd) => execSync('git ' + cmd, { cwd: ROOT, maxBuffer: 1 << 28 }).toString();

// autopilot also committed tasks written by Claude subagents: those task files say "Reviewed-by: claude"
const claudeTask = {};
function reviewedByClaude(id) {
  if (!(id in claudeTask)) {
    const f = fs.readdirSync(path.join(ROOT, 'tasks')).find(n => n.startsWith(id + '-'));
    claudeTask[id] = !!f && /^Reviewed-by: claude/m.test(fs.readFileSync(path.join(ROOT, 'tasks', f), 'utf8'));
  }
  return claudeTask[id];
}
const freeSha = {};
function isFree(sha) {
  if (!(sha in freeSha)) {
    const s = git(`log -1 --format=%s ${sha}`).trim();
    const id = (s.match(/^Content: (T\d+)/) || [])[1];
    freeSha[sha] = FREE.test(s) && !(id && reviewedByClaude(id));
  }
  return freeSha[sha];
}

function blame(file) {
  const out = git(`blame --line-porcelain -- "${file}"`).split('\n');
  const lines = [];
  let sha = null;
  for (const l of out) {
    if (/^[0-9a-f]{40} /.test(l)) sha = l.slice(0, 40);
    else if (l.startsWith('\t')) lines.push({ sha, text: l.slice(1) });
  }
  return lines;
}

const only = process.argv[2];
const files = only ? [path.join('js/data', only)]
  : fs.readdirSync(path.join(ROOT, 'js/data')).filter(f => f.endsWith('.js')).map(f => path.join('js/data', f));

const rows = [];
for (const f of files) {
  const lines = blame(f.replace(/\\/g, '/'));
  const free = lines.filter(l => isFree(l.sha));
  rows.push({ f, total: lines.length, free: free.length });
  if (only) {
    // ids whose block contains free-model lines
    const ids = new Set();
    let cur = null;
    for (const l of lines) {
      const m = l.text.match(/^\s*id:\s*'([^']+)'/);
      if (m) cur = m[1];
      if (cur && isFree(l.sha)) ids.add(cur);
    }
    console.log(`${f}: ${free.length}/${lines.length} free-model lines; ids touched (${ids.size}):`);
    console.log([...ids].join(' '));
  }
}
if (!only) {
  rows.sort((a, b) => b.free - a.free);
  for (const r of rows) if (r.free) console.log(`${String(r.free).padStart(6)} / ${String(r.total).padStart(6)}  ${String(Math.round(100 * r.free / r.total)).padStart(3)}%  ${r.f}`);
}
