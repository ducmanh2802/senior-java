/*
 * Shared Java runner for scripts/test-lessons.js and scripts/test-algos.js.
 * Speed: jobs run in parallel (one per CPU core, max 8), the JVM uses fast-startup flags, and a job whose
 * source already passed is skipped via logs/test-cache.json (keyed by a hash of the Java source + JDK path).
 * Set NO_TEST_CACHE=1 to force a full run.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile, spawnSync } = require('child_process');

// The Oracle javapath shim on Windows starts the real java.exe as a child; a timeout kills only the shim and the
// JVM (e.g. a starter whose worker threads never finish) lives on holding the temp dir. Run the real binaries.
const JDK_BIN = (() => {
  if (process.env.JAVA_HOME) return path.join(process.env.JAVA_HOME, 'bin');
  try {
    const props = spawnSync('java', ['-XshowSettings:properties', '-version'], { encoding: 'utf8' }).stderr || '';
    const home = (props.match(/java\.home = (.+)/) || [])[1];
    if (home) return path.join(home.trim(), 'bin');
  } catch (e) { /* fall back to PATH */ }
  return '';
})();
const JAVA = JDK_BIN ? path.join(JDK_BIN, 'java') : 'java';
const JAVAC = JDK_BIN ? path.join(JDK_BIN, 'javac') : 'javac';
// short programs: C1 only + class-data sharing start noticeably faster
const FAST = ['-XX:+UseSerialGC', '-XX:TieredStopAtLevel=1', '-Xshare:auto'];

function run(cmd, args, opts) {
  return new Promise(resolve => {
    execFile(cmd, args, Object.assign({ maxBuffer: 16 << 20, windowsHide: true }, opts), (err, stdout, stderr) =>
      resolve({ err, stdout: String(stdout || ''), stderr: String(stderr || '') }));
  });
}

/** Compile Main.java (source) in a fresh dir and run it. → { compileError?, out } */
async function compileAndRun(root, name, source) {
  const dir = fs.mkdtempSync(path.join(root, name.replace(/[^\w-]/g, '_') + '-'));
  fs.writeFileSync(path.join(dir, 'Main.java'), source);
  const c = await run(JAVAC, ['-J-XX:TieredStopAtLevel=1', '-J-Xshare:auto', '--release', '17', '-encoding', 'UTF-8', '-nowarn', 'Main.java'], { cwd: dir });
  if (c.err) return { compileError: (c.stderr || c.err.message).split('\n').slice(0, 8).join('\n') };
  const r = await run(JAVA, ['-Xss16m', ...FAST, 'Main'], { cwd: dir, timeout: 15000 });
  return { out: r.err ? r.stdout + '\n' + (r.stderr || r.err.message) : r.stdout };
}

/** Run fn over items with at most n in flight; results keep input order. */
async function pool(items, fn, n = Math.min(8, Math.max(2, os.cpus().length))) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; results[i] = await fn(items[i], i); }
  }));
  return results;
}

const CACHE_FILE = path.join(__dirname, '..', 'logs', 'test-cache.json');
function openCache(kind) {
  let all = {};
  if (!process.env.NO_TEST_CACHE) { try { all = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch (e) { /* first run */ } }
  const passed = all[kind] || {};
  const key = (...parts) => crypto.createHash('sha1').update(JAVA + '\0' + parts.join('\0')).digest('hex');
  return {
    key,
    has: k => !!passed[k],
    add: k => { passed[k] = Date.now(); },
    save() {
      all[kind] = passed;
      try { fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true }); fs.writeFileSync(CACHE_FILE, JSON.stringify(all)); } catch (e) { /* cache is optional */ }
    },
  };
}

function tempRoot(prefix) { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }
function cleanup(root) {
  // a JVM that just exited can still hold its files on Windows: retry, and never fail the run over cleanup
  try { fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch (e) { console.warn('cleanup skipped: ' + e.code); }
}

module.exports = { JAVA, JAVAC, compileAndRun, pool, openCache, tempRoot, cleanup };
