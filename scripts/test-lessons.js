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
const { execFileSync } = require('child_process');

const App = require('./browser-shim.js');
global.window.LESSONS = [];
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
for (const m of html.matchAll(/src="js\/data\/(lessons-[a-z]+\.js)"/g)) require(path.join(__dirname, '..', 'js', 'data', m[1]));
const only = process.argv[2];
const lessons = window.LESSONS.filter(l => !only || l.id === only);

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lesson-'));
let ok = 0;
const failures = [];

for (const l of lessons) {
  (l.exercises || []).forEach((x, i) => {
    const name = `${l.id}#${i + 1}`;
    const dir = path.join(tmpRoot, `${l.id}-${i}`);
    fs.mkdirSync(dir);
    fs.writeFileSync(path.join(dir, 'Main.java'), App.code.assemble(x.reference, x.tests));
    // the starter must compile too, so learners start from code that builds
    const sdir = path.join(tmpRoot, `${l.id}-${i}-starter`);
    fs.mkdirSync(sdir);
    fs.writeFileSync(path.join(sdir, 'Main.java'), App.code.assemble(x.starter, x.tests));
    for (const [d, what] of [[dir, 'reference'], [sdir, 'starter']]) {
      try { execFileSync('javac', ['--release', '17', '-encoding', 'UTF-8', '-nowarn', 'Main.java'], { cwd: d, stdio: 'pipe' }); }
      catch (e) {
        failures.push(`${name}: ${what} + tests COMPILE ERROR\n${String(e.stderr || e.message).split('\n').slice(0, 8).join('\n')}`);
        return;
      }
    }
    let out = '';
    try { out = execFileSync('java', ['-Xss16m', 'Main'], { cwd: dir, stdio: 'pipe', timeout: 15000 }).toString(); }
    catch (e) { out = String(e.stdout || '') + '\n' + String(e.stderr || e.message); }
    const r = App.code.parse(out);
    if (only) console.log(out);
    // the untouched starter must NOT pass — otherwise the tests check nothing
    let sout = '';
    try { sout = execFileSync('java', ['-Xss16m', 'Main'], { cwd: sdir, stdio: 'pipe', timeout: 15000 }).toString(); }
    catch (e) { sout = String(e.stdout || ''); }
    if (App.code.parse(sout).allPassed) { failures.push(`${name}: starter đã pass hết test — test không kiểm tra gì`); return; }
    if (r.allPassed && r.total >= 3) ok++;
    else failures.push(`${name}: reference ${r.passed}/${r.total} pass` + (r.total < 3 ? ' (cần ≥ 3 test)' : '') + '\n' +
      r.cases.filter(c => !c.ok).map(c => '  FAIL ' + c.name + ': ' + c.detail).join('\n') +
      (r.total === 0 ? '\n' + out.split('\n').slice(0, 6).join('\n') : ''));
  });
}

fs.rmSync(tmpRoot, { recursive: true, force: true });
const total = lessons.reduce((n, l) => n + (l.exercises || []).length, 0);
console.log(`Lesson exercises OK: ${ok}/${total}  (${lessons.length} bài học)`);
if (failures.length) { console.log('\n' + failures.join('\n\n')); process.exit(1); }
