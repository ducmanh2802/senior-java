#!/usr/bin/env node
/*
 * Acceptance gate for bug-hunt exercises (window.BUGS, js/data/bugs*.js): for each bug, the `reference`
 * fix + `tests` must compile and pass every case (RESULT n/n, n >= 3), and the buggy `starter` + `tests`
 * must compile and must NOT pass (otherwise the tests do not reproduce the bug).
 *
 *   node scripts/test-bugs.js            # every bug
 *   node scripts/test-bugs.js bug-003    # one bug, prints the reference output
 *
 * Needs javac/java on PATH (JDK 17, --release 17).
 */
'use strict';
const App = require('./browser-shim.js');
global.window.BUGS = [];
App.loadData(['bugs']);   // file list: js/core/data-manifest.js
const only = process.argv[2];
const bugs = window.BUGS.filter(b => !only || b.id === only);
const { compileAndRun, pool, openCache, tempRoot, cleanup } = require('./java-runner.js');

(async () => {
  const tmpRoot = tempRoot('bug-');
  const cache = openCache('bugs');
  let ok = 0, cached = 0;
  const failures = [];
  let fail = msg => retry.push(msg);
  const retry = [];

  const check = async b => {
    const ref = App.code.assemble(b.reference, b.tests), start = App.code.assemble(b.starter, b.tests);
    const key = cache.key(ref, start);
    if (!only && cache.has(key)) { ok++; cached++; return; }
    const [r1, r2] = await Promise.all([compileAndRun(tmpRoot, b.id, ref), compileAndRun(tmpRoot, b.id + '-starter', start)]);
    if (r1.compileError) return fail(`${b.id}: reference + tests COMPILE ERROR\n${r1.compileError}`);
    if (r2.compileError) return fail(`${b.id}: starter + tests COMPILE ERROR\n${r2.compileError}`);
    const r = App.code.parse(r1.out), s = App.code.parse(r2.out);
    if (only) console.log('--- reference ---\n' + r1.out + '\n--- starter ---\n' + r2.out);
    if (s.allPassed) return fail(`${b.id}: starter đã pass hết test — test không tái hiện được bug`);
    if (r.allPassed && r.total >= 3) { ok++; cache.add(key); }
    else fail(`${b.id}: reference ${r.passed}/${r.total} pass` + (r.total < 3 ? ' (cần ≥ 3 test)' : '') + '\n' +
      r.cases.filter(c => !c.ok).map(c => '  FAIL ' + c.name + ': ' + c.detail).join('\n') +
      (r.total === 0 ? '\n' + r1.out.split('\n').slice(0, 8).join('\n') : ''));
  };
  const firstFailed = [];
  await pool(bugs, async b => { const before = retry.length; await check(b); if (retry.length > before) firstFailed.push(b); });
  fail = msg => failures.push(msg);
  await pool(firstFailed, check, 1);   // timing-sensitive concurrency tests get one quiet re-run

  cache.save();
  cleanup(tmpRoot);
  console.log(`Bug exercises OK: ${ok}/${bugs.length}${cached ? ` (${cached} từ cache)` : ''}`);
  if (failures.length) { console.log('\n' + failures.join('\n\n')); process.exit(1); }
})();
