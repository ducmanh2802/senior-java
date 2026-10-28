#!/usr/bin/env node
/*
 * Payload budget: bytes index.html loads eagerly (local <script src> + <link rel=stylesheet>), and per route
 * the eager bytes + the data groups that route awaits (js/core/data-manifest.js). Fails if over budget.
 *   node scripts/check-budget.js
 * Raise a budget only on purpose (and say why in the commit); see docs/PERFORMANCE.md.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const M = require(path.join(ROOT, 'js', 'core', 'data-manifest.js'));

// Budgets in bytes (uncompressed). Eager = parser-blocking shell (core + views + css + tiny data); ~810 KB
// when this script was added (was ~8.5 MB when index.html loaded every data file).
const BUDGET_EAGER = 900 * 1024;
// Routes that must stay light (no question bank): data awaited before render. Other routes are reported only,
// since they legitimately need the bank (which grows with content) — the win there is the parallel, non-blocking load.
const BUDGET_ROUTE_DATA = { quiz: 1500 * 1024, exam: 1500 * 1024, algo: 1500 * 1024, speak: 300 * 1024, news: 0,
  'legal/privacy': 0, 'legal/terms': 0 };

const size = f => { try { return fs.statSync(path.join(ROOT, f)).size; } catch (e) { return 0; } };
const kb = n => (n / 1024).toFixed(0).padStart(6) + ' KB';

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const local = u => !/^(https?:)?\/\//.test(u);
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(local);
const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map(m => m[1]).filter(local);
const missing = scripts.concat(css).filter(f => !fs.existsSync(path.join(ROOT, f)));

const cat = f => f.startsWith('js/data/') ? 'data (eager)' : f.startsWith('js/views/') ? 'views'
  : f.startsWith('js/') ? 'core' : f.endsWith('.css') ? 'css' : 'other';
const byCat = {};
let eager = size('index.html');
byCat.html = eager;
for (const f of scripts.concat(css)) { const n = size(f); eager += n; byCat[cat(f)] = (byCat[cat(f)] || 0) + n; }

console.log('Eager (index.html + local scripts + css):');
for (const [k, v] of Object.entries(byCat)) console.log('  ' + k.padEnd(14) + kb(v));
console.log('  ' + 'TOTAL'.padEnd(14) + kb(eager) + '   budget' + kb(BUDGET_EAGER));

const groupBytes = {};
for (const [g, files] of Object.entries(M.groups)) groupBytes[g] = files.reduce((s, f) => s + size('js/data/' + f), 0);
const allData = Object.values(groupBytes).reduce((a, b) => a + b, 0);
console.log('\nLazy data groups (App.need):');
for (const [g, n] of Object.entries(groupBytes)) console.log('  ' + g.padEnd(14) + kb(n));
console.log('  ' + 'TOTAL'.padEnd(14) + kb(allData));

const problems = [];
if (missing.length) problems.push('index.html references missing files: ' + missing.join(', '));
if (eager > BUDGET_EAGER) problems.push(`eager payload ${kb(eager).trim()} > budget ${kb(BUDGET_EAGER).trim()}`);
console.log('\nPer route: data awaited before render (eager shell not included):');
for (const [r, gs] of Object.entries(M.routes)) {
  const n = gs.reduce((s, g) => s + (groupBytes[g] || 0), 0);
  const b = BUDGET_ROUTE_DATA[r];
  const over = b != null && n > b;
  console.log('  ' + r.padEnd(14) + kb(n) + (b != null ? ' (budget' + kb(b) + ')' : '                  ') + '  [' + gs.join(', ') + ']' + (over ? '  OVER' : ''));
  if (over) problems.push(`route ${r}: ${kb(n).trim()} > budget ${kb(b).trim()}`);
}

if (problems.length) { console.error('\nLỖI:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('\nOK — không có lỗi.');
