#!/usr/bin/env node
/*
 * Acceptance gate for lesson exercises (LESSONS[].exercises[]): assembles each exercise's `reference`
 * solution with its `tests` harness, compiles with the local JDK and runs it. The reference must pass
 * every case (RESULT n/n, n ≥ 3) — otherwise the exercise would grade learners against a broken key.
 *
 *   node scripts/test-lessons.js                      # every lesson file declared in index.html
 *   node scripts/test-lessons.js lesson-collections-001
 *
 * Needs `javac`/`java` on PATH. Uses --release 17.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

const App = require('./browser-shim.js');
global.window.LESSONS = [];
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
for (const m of html.matchAll(/src="js\/data\/(lessons-[a-z]+\.js)"/g)) require(path.join(__dirname, '..', 'js', 'data', m[1]));
const only = process.argv[2];
const lessons = window.LESSONS.filter(l => !only || l.id === only);

const { compileAndRun, pool, openCache, tempRoot, cleanup } = require('./java-runner.js');

(async () => {
  const tmpRoot = tempRoot('lesson-');
  const cache = openCache('lessons');
  const jobs = [];
  for (const l of lessons) (l.exercises || []).forEach((x, i) => jobs.push({ name: `${l.id}#${i + 1}`, x }));
  let ok = 0, cached = 0;
  const failures = [];

  const check = async ({ name, x }) => {
    const ref = App.code.assemble(x.reference, x.tests), start = App.code.assemble(x.starter, x.tests);
    const key = cache.key(ref, start);
    if (!only && cache.has(key)) { ok++; cached++; return; }
    // the starter must compile too (learners start from code that builds) and must NOT pass, or the tests check nothing
    const [r1, r2] = await Promise.all([compileAndRun(tmpRoot, name, ref), compileAndRun(tmpRoot, name + '-starter', start)]);
    if (r1.compileError) return fail(`${name}: reference + tests COMPILE ERROR\n${r1.compileError}`);
    if (r2.compileError) return fail(`${name}: starter + tests COMPILE ERROR\n${r2.compileError}`);
    const r = App.code.parse(r1.out);
    if (only) console.log(r1.out);
    if (App.code.parse(r2.out).allPassed) return fail(`${name}: starter đã pass hết test — test không kiểm tra gì`);
    if (r.allPassed && r.total >= 3) { ok++; cache.add(key); }
    else fail(`${name}: reference ${r.passed}/${r.total} pass` + (r.total < 3 ? ' (cần ≥ 3 test)' : '') + '\n' +
      r.cases.filter(c => !c.ok).map(c => '  FAIL ' + c.name + ': ' + c.detail).join('\n') +
      (r.total === 0 ? '\n' + r1.out.split('\n').slice(0, 6).join('\n') : ''));
  };
  // parallel first; a failure is re-run once on its own, since timing-sensitive concurrency tests can lose under load
  let fail = msg => { retry.push(msg); };
  const retry = [];
  const firstFailed = [];
  await pool(jobs, async job => { const before = retry.length; await check(job); if (retry.length > before) firstFailed.push(job); });
  fail = msg => failures.push(msg);
  await pool(firstFailed, check, 1);

  cache.save();
  cleanup(tmpRoot);
  console.log(`Lesson exercises OK: ${ok}/${jobs.length}  (${lessons.length} bài học${cached ? `, ${cached} từ cache` : ''})`);
  if (failures.length) { console.log('\n' + failures.join('\n\n')); process.exit(1); }
})();
