/*
 * Shared helpers for the serverless functions in api/ (files starting with "_" are not routes on Vercel).
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   APP_PASSCODE       required — shared secret the browser sends in x-app-passcode, so strangers
 *                      who find the URL cannot spend your API credits
 *   ANTHROPIC_API_KEY  required for /api/grade
 *   CLAUDE_MODEL       optional, default claude-opus-5-5
 *   JUDGE0_KEY         optional — RapidAPI key for Judge0 CE; enables /api/run
 *   JUDGE0_URL         optional, default https://judge0-ce.p.rapidapi.com (or a self-hosted Judge0 URL)
 *   JUDGE0_JAVA_ID     optional, default 62 (Java on Judge0 CE)
 */
'use strict';

const crypto = require('crypto');

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Best-effort per-instance limiter: serverless instances are short-lived, the passcode is the real guard.
const hits = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}

/** Common request gate. Returns the parsed body, or null after sending an error response. */
function guard(req, res, { maxPerMinute = 20 } = {}) {
  if (req.method !== 'POST') { send(res, 405, { error: 'Chỉ hỗ trợ POST' }); return null; }
  if (!process.env.APP_PASSCODE) { send(res, 503, { error: 'Server chưa cấu hình APP_PASSCODE', code: 'not_configured' }); return null; }
  if (!safeEqual(req.headers['x-app-passcode'], process.env.APP_PASSCODE)) {
    send(res, 401, { error: 'Sai mật mã truy cập', code: 'bad_passcode' }); return null;
  }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip, maxPerMinute, 60000)) { send(res, 429, { error: 'Gửi quá nhanh, thử lại sau ít phút' }); return null; }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  if (!body || typeof body !== 'object') { send(res, 400, { error: 'Body JSON không hợp lệ' }); return null; }
  return body;
}

function str(v, max) {
  if (v == null) return '';
  return String(v).slice(0, max);
}

module.exports = { send, guard, str };
