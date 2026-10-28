#!/usr/bin/env node
/*
 * Acceptance gate for algorithm test harnesses (ALGOS[].tests):
 * assembles each problem's reference solution (first ~~~java block of `solution`) with its harness,
 * compiles with the local JDK and runs it. Every harness must report RESULT n/n for the reference.
 *
 *   node scripts/test-algos.js              # all problems that have `tests`
 *   node scripts/test-algos.js algo-012     # one problem (prints the full output)
 *
 * Needs `javac`/`java` on PATH. Uses --release 17 (the reference solutions target Java 17).
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const App = require('./browser-shim.js');
global.window.ALGOS = [];
App.loadData(['algos']);   // file list: js/core/data-manifest.js
const only = process.argv[2];
const algos = window.ALGOS.filter(a => (!only || a.id === only));

const { compileAndRun, pool, openCache, tempRoot, cleanup } = require('./java-runner.js');

(async () => {
  const tmpRoot = tempRoot('algo-');
  const cache = openCache('algos');
  let ok = 0, failed = 0, skipped = 0, cached = 0;
  const failures = [];

  await pool(algos, async a => {
    if (!App.code.hasTests(a)) { skipped++; return; }
    const m = (a.solution || '').match(/~~~java\n([\s\S]*?)~~~/);
    if (!m) { failed++; return failures.push(`${a.id}: solution không có block ~~~java`); }
    const src = App.code.assemble(m[1], a.tests);
    const key = cache.key(src);
    if (!only && cache.has(key)) { ok++; cached++; return; }
    const res = await compileAndRun(tmpRoot, a.id, src);
    if (res.compileError) { failed++; return failures.push(`${a.id}: COMPILE ERROR\n${res.compileError}`); }
    const r = App.code.parse(res.out);
    if (only) console.log(res.out);
    if (r.allPassed && r.total >= 4) { ok++; cache.add(key); }
    else {
      failed++;
      failures.push(`${a.id}: ${r.passed}/${r.total} pass` + (r.total < 4 ? ' (cần ≥ 4 test)' : '') + '\n' +
        r.cases.filter(c => !c.ok).map(c => '  FAIL ' + c.name + ': ' + c.detail).join('\n') +
        (r.total === 0 ? '\n' + res.out.split('\n').slice(0, 6).join('\n') : ''));
    }
  });

  cache.save();
  cleanup(tmpRoot);
  console.log(`Harness OK: ${ok}  ·  lỗi: ${failed}  ·  chưa có tests: ${skipped}  (tổng ${algos.length}${cached ? `, ${cached} từ cache` : ''})`);
  if (failures.length) { console.log('\n' + failures.join('\n\n')); process.exit(1); }
})();
