/*
 * POST /api/run — compile & run a Java program on Judge0 (CE via RapidAPI, or self-hosted).
 * Body: { source: string }  — a complete single-file program whose entry point is `public class Main`.
 * Response: { configured, status, stdout, stderr, compile_output, time, memory }
 *
 * The browser assembles `source` from the user's code + the problem's test harness (see App.code.assemble).
 */
'use strict';

const { send, guard, charge, str } = require('./_lib');

const URL_BASE = (process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com').replace(/\/$/, '');
const JAVA_ID = Number(process.env.JUDGE0_JAVA_ID) || 62;

const b64 = s => Buffer.from(String(s || ''), 'utf8').toString('base64');
const unb64 = s => (s ? Buffer.from(s, 'base64').toString('utf8') : '');

module.exports = async function handler(req, res) {
  if (!process.env.JUDGE0_KEY && !process.env.JUDGE0_URL) {
    return send(res, 200, { configured: false, error: 'Chưa cấu hình máy chạy code (JUDGE0_KEY)' });
  }
  const ctx = await guard(req, res, { maxPerMinute: 10 });
  if (!ctx) return;
  const source = str(ctx.body.source, 60000);
  if (!/public\s+class\s+Main\b/.test(source)) return send(res, 400, { error: 'Thiếu public class Main' });
  if (!(await charge(res, ctx.user, 'run'))) return;

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.JUDGE0_KEY) {
    headers['X-RapidAPI-Key'] = process.env.JUDGE0_KEY;
    headers['X-RapidAPI-Host'] = new URL(URL_BASE).host;
  }
  try {
    const r = await fetch(`${URL_BASE}/submissions?base64_encoded=true&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        language_id: JAVA_ID,
        source_code: b64(source),
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 256000,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (r.status === 429) return send(res, 429, { configured: true, error: 'Hết lượt chạy code (Judge0 quota), dùng "AI review code" thay thế' });
    if (!r.ok) return send(res, 502, { configured: true, error: `Judge0 lỗi ${r.status}` });
    const d = await r.json();
    return send(res, 200, {
      configured: true,
      status: d.status ? d.status.description : 'Unknown',
      stdout: unb64(d.stdout),
      stderr: unb64(d.stderr),
      compile_output: unb64(d.compile_output),
      time: d.time,
      memory: d.memory,
    });
  } catch (e) {
    return send(res, 504, { configured: true, error: 'Hết thời gian chờ máy chạy code' });
  }
};
