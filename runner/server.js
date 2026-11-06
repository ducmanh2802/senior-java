/*
 * Java runner for /api/run — a tiny self-hosted replacement for Judge0/Wandbox (see runner/README.md).
 * POST /run  { source }  with header  Authorization: Bearer <RUNNER_TOKEN>
 *   → { status, stdout, stderr, compile_output, time, memory }   (the shape api/run.js returns to the browser)
 * GET /health → ok
 *
 * Every program runs in a throwaway Docker container: no network, read-only filesystem, non-root user,
 * 512 MB RAM, 1 CPU, 128 processes, 10 s wall time. Node ≥ 18, no npm dependencies.
 */
'use strict';
const http = require('http'), fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const { spawn, execFile } = require('child_process');

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '127.0.0.1';                 // Caddy in front terminates HTTPS
const TOKEN = process.env.RUNNER_TOKEN || '';
const IMAGE = process.env.RUNNER_IMAGE || 'eclipse-temurin:21-jdk';
const PARALLEL = Number(process.env.RUNNER_PARALLEL) || 2;    // containers at once; the rest wait in a queue
const TIME_LIMIT_MS = 10000, OUT_LIMIT = 64 * 1024, BODY_LIMIT = 200 * 1024;
const COMPILE_FAILED = 213;                                    // exit code the script uses for "javac failed"
if (TOKEN.length < 16) { console.error('RUNNER_TOKEN (>= 16 characters) is required'); process.exit(1); }

// javac and java in one container (one start-up); javac errors go to stderr with a special exit code.
// UTF-8 everywhere: the container locale is POSIX, Vietnamese text would otherwise print as '?'.
const SCRIPT = `javac -encoding UTF-8 -d /tmp/o Main.java 2>/tmp/cerr || { cat /tmp/cerr >&2; exit ${COMPILE_FAILED}; }; ` +
  'exec java -Xmx256m -Xss8m -XX:+UseSerialGC -XX:TieredStopAtLevel=1 ' +
  '-Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dstderr.encoding=UTF-8 -cp /tmp/o Main';

let running = 0; const waiting = [];
const acquire = () => new Promise(ok => { if (running < PARALLEL) { running++; ok(); } else waiting.push(ok); });
const release = () => { const next = waiting.shift(); if (next) next(); else running--; };

function runJava(source) {
  return new Promise(resolve => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'run-'));
    fs.writeFileSync(path.join(dir, 'Main.java'), source);
    fs.chmodSync(dir, 0o755); fs.chmodSync(path.join(dir, 'Main.java'), 0o644);
    const name = 'run-' + crypto.randomBytes(6).toString('hex');
    const args = ['run', '--rm', '--name', name, '--network', 'none', '--memory', '512m', '--memory-swap', '512m',
      '--cpus', '1', '--pids-limit', '128', '--read-only', '--tmpfs', '/tmp:rw,exec,size=64m,mode=1777',
      '--user', '65534:65534', '--security-opt', 'no-new-privileges', '-v', dir + ':/code:ro', '-w', '/code',
      IMAGE, 'sh', '-c', SCRIPT];
    const started = Date.now();
    const child = spawn('docker', args);
    let out = '', err = '', timedOut = false;
    const cap = (buf, chunk) => (buf.length < OUT_LIMIT ? buf + chunk.toString('utf8') : buf);
    child.stdout.on('data', c => { out = cap(out, c); });
    child.stderr.on('data', c => { err = cap(err, c); });
    const timer = setTimeout(() => { timedOut = true; execFile('docker', ['kill', name], () => {}); }, TIME_LIMIT_MS);
    // Safety net if `docker kill` did not stop it: kill the client too, and finish even if its pipes stay open.
    const hardTimer = setTimeout(() => { execFile('docker', ['kill', name], () => {}); child.kill('SIGKILL'); }, TIME_LIMIT_MS + 5000);
    let done = false;
    child.on('exit', code => setTimeout(() => finish(code), 1000));
    child.on('close', code => finish(code));
    function finish(code) {
      if (done) return; done = true;
      clearTimeout(timer); clearTimeout(hardTimer);
      try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* still in use: leave it to /tmp cleanup */ }
      const time = ((Date.now() - started) / 1000).toFixed(2);
      out = out.slice(0, OUT_LIMIT); err = err.slice(0, OUT_LIMIT);
      if (code === COMPILE_FAILED) return resolve({ status: 'Compilation Error', stdout: '', stderr: '', compile_output: err, time, memory: null });
      const status = timedOut ? 'Time Limit Exceeded (10s)'
        : code === 137 ? 'Killed — vượt giới hạn bộ nhớ (512 MB)'
        : code === 0 ? 'Accepted' : `Runtime Error (exit ${code})`;
      resolve({ status, stdout: out, stderr: err, compile_output: '', time, memory: null });
    }
  });
}

function authorized(req) {
  const got = Buffer.from(String(req.headers.authorization || ''));
  const want = Buffer.from('Bearer ' + TOKEN);
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };

http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') return json(res, 200, { ok: true, running, waiting: waiting.length });
  if (req.method !== 'POST' || req.url !== '/run') return json(res, 404, { error: 'not found' });
  if (!authorized(req)) return json(res, 401, { error: 'bad token' });
  let body = '';
  req.on('data', c => { body += c; if (body.length > BODY_LIMIT) req.destroy(); });
  req.on('end', async () => {
    let source;
    try { source = String(JSON.parse(body).source || ''); } catch (e) { return json(res, 400, { error: 'bad json' }); }
    if (!/public\s+(final\s+)?class\s+Main\b/.test(source)) return json(res, 400, { error: 'Thiếu public class Main' });
    if (waiting.length > 20) return json(res, 429, { error: 'busy' });
    await acquire();
    try { json(res, 200, await runJava(source)); } catch (e) { json(res, 500, { error: String(e.message || e) }); } finally { release(); }
  });
}).listen(PORT, HOST, () => console.log(`java runner on ${HOST}:${PORT}, image ${IMAGE}, ${PARALLEL} parallel`));
