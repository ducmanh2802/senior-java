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
const { execFileSync } = require('child_process');

const App = require('./browser-shim.js');
global.window.ALGOS = [];
require(path.join(__dirname, '..', 'js', 'data', 'algo.js'));
const only = process.argv[2];
const algos = window.ALGOS.filter(a => (!only || a.id === only));

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'algo-'));
let ok = 0, failed = 0, skipped = 0;
const failures = [];

for (const a of algos) {
  if (!App.code.hasTests(a)) { skipped++; continue; }
  const m = (a.solution || '').match(/~~~java\n([\s\S]*?)~~~/);
  if (!m) { failed++; failures.push(`${a.id}: solution không có block ~~~java`); continue; }
  const dir = path.join(tmpRoot, a.id);
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'Main.java'), App.code.assemble(m[1], a.tests));
  try {
    execFileSync('javac', ['--release', '17', '-encoding', 'UTF-8', '-nowarn', 'Main.java'], { cwd: dir, stdio: 'pipe' });
  } catch (e) {
    failed++;
    failures.push(`${a.id}: COMPILE ERROR\n${String(e.stderr || e.message).split('\n').slice(0, 8).join('\n')}`);
    continue;
  }
  let out = '';
  try {
    out = execFileSync('java', ['-Xss16m', 'Main'], { cwd: dir, stdio: 'pipe', timeout: 15000 }).toString();
  } catch (e) {
    out = String(e.stdout || '') + '\n' + String(e.stderr || e.message);
  }
  const r = App.code.parse(out);
  if (only) console.log(out);
  if (r.allPassed && r.total >= 4) ok++;
  else {
    failed++;
    failures.push(`${a.id}: ${r.passed}/${r.total} pass` + (r.total < 4 ? ' (cần ≥ 4 test)' : '') + '\n' +
      r.cases.filter(c => !c.ok).map(c => '  FAIL ' + c.name + ': ' + c.detail).join('\n') +
      (r.total === 0 ? '\n' + out.split('\n').slice(0, 6).join('\n') : ''));
  }
}

fs.rmSync(tmpRoot, { recursive: true, force: true });
console.log(`Harness OK: ${ok}  ·  lỗi: ${failed}  ·  chưa có tests: ${skipped}  (tổng ${algos.length})`);
if (failures.length) { console.log('\n' + failures.join('\n\n')); process.exit(1); }
