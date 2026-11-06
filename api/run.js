/*
 * POST /api/run — compile & run a Java program on Wandbox (https://wandbox.org, free, no API key).
 * Body: { source: string }  — a complete single-file program whose entry point is `public class Main`.
 * Response: { configured, status, stdout, stderr, compile_output, time, memory }  (same shape as the old Judge0 backend)
 *
 * The browser assembles `source` from the user's code + the problem's test harness (see App.code.assemble).
 * Wandbox saves the code as prog.java, runs `javac prog.java`, then runs the first compiled class that has main(),
 * so `public` is stripped from Main (a public class would have to live in Main.java).
 * Env (optional): WANDBOX_URL (default https://wandbox.org), WANDBOX_COMPILER (default openjdk-jdk-21+35).
 */
'use strict';

const { send, guard, charge, str } = require('./_lib');

const BASE = (process.env.WANDBOX_URL || 'https://wandbox.org').replace(/\/$/, '');
let compiler = process.env.WANDBOX_COMPILER || 'openjdk-jdk-21+35';

// Compiler names change when Wandbox upgrades JDKs: pick the newest OpenJDK it lists.
async function latestJdk() {
  const r = await fetch(BASE + '/api/list.json', { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const jdks = (await r.json()).filter(c => /^openjdk-jdk-\d+/.test(c.name)).map(c => c.name);
  jdks.sort((a, b) => parseInt(b.slice(12), 10) - parseInt(a.slice(12), 10));
  return jdks[0] || null;
}

async function compile(code) {
  return fetch(BASE + '/api/compile.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ compiler, code, save: false }),
    signal: AbortSignal.timeout(25000),
  });
}

module.exports = async function handler(req, res) {
  const ctx = await guard(req, res, { maxPerMinute: 10 });
  if (!ctx) return;
  const source = str(ctx.body.source, 60000);
  if (!/public\s+(final\s+)?class\s+Main\b/.test(source)) return send(res, 400, { error: 'Thiếu public class Main' });
  if (!(await charge(res, ctx.user, 'run'))) return;

  const code = source.replace(/\bpublic\s+((?:final\s+)?)class\s+Main\b/, '$1class Main');
  const busyMsg = 'Máy chạy code (Wandbox, miễn phí) đang quá tải, bấm chạy lại sau vài giây hoặc dùng "AI review code"';
  // Wandbox is a free shared service: it sometimes answers 504 or fails to start its sandbox
  // ("OCI runtime error … Resource temporarily unavailable"). Those are retried, never shown as the user's bug.
  const sandboxDown = d => /OCI runtime|Resource temporarily unavailable/i.test(String(d.compiler_error || '') + String(d.program_error || ''));
  try {
    let r, d;
    const start = Date.now();
    for (let attempt = 0; attempt < 3 && Date.now() - start < 30000; attempt++) {   // keep the whole call under ~60s
      if (attempt) await new Promise(ok => setTimeout(ok, 800 * attempt));
      try { r = await compile(code); } catch (e) { r = null; continue; }           // network error / 25s timeout → retry
      if (!r.ok && r.status !== 429 && r.status < 500 && attempt === 0) {   // unknown compiler name → switch to the newest JDK
        const jdk = await latestJdk().catch(() => null);
        if (jdk && jdk !== compiler) { compiler = jdk; continue; }
      }
      if (r.status === 429) return send(res, 429, { configured: true, error: busyMsg });
      if (!r.ok) continue;
      d = await r.json().catch(() => null);
      if (d && !sandboxDown(d)) break;
      d = null;
    }
    if (!d) return send(res, 503, { configured: true, error: r && !r.ok && r.status < 500 ? `Wandbox lỗi ${r.status}` : busyMsg });
    if (!d.status && d.status !== 0 && !d.compiler_error && !d.program_output) return send(res, 503, { configured: true, error: busyMsg });
    const cerr = String(d.compiler_error || '');
    if (/^\d+ errors?\s*$/m.test(cerr) || /\berror:/.test(cerr)) {
      return send(res, 200, { configured: true, status: 'Compilation Error', stdout: '', stderr: '', compile_output: cerr });
    }
    const exit = String(d.status ?? '');
    const status = d.signal ? `Killed (${d.signal}) — có thể quá thời gian hoặc bộ nhớ`
      : exit === '0' ? 'Accepted' : `Runtime Error (exit ${exit || '?'})`;
    return send(res, 200, {
      configured: true,
      status,
      stdout: String(d.program_output || ''),
      stderr: String(d.program_error || ''),
      compile_output: '',
      time: null,
      memory: null,
    });
  } catch (e) {
    return send(res, 504, { configured: true, error: 'Hết thời gian chờ máy chạy code' });
  }
};
