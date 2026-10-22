/*
 * Shared helpers for the serverless functions in api/ (files starting with "_" are not routes on Vercel).
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   SUPABASE_URL         accounts: project URL, e.g. https://xxxx.supabase.co
 *   SUPABASE_SECRET_KEY  accounts: secret (service_role) key — server only, never in js/config.js.
 *                        With both set, signed-in users call the API with their session token and each
 *                        call consumes one unit of their daily quota (profiles.ai_daily_limit).
 *   APP_PASSCODE         owner/admin fallback — shared secret sent in x-app-passcode, no quota.
 *                        At least one of (Supabase, APP_PASSCODE) must be configured.
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

// Best-effort per-instance limiter: serverless instances are short-lived; auth + quota are the real guard.
const hits = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter(t => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}

function supabaseConfigured() {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

/** fetch against Supabase with the server key (new sb_secret_ keys go in apikey only; legacy JWT keys also as Bearer). */
function supabase(path, init) {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = Object.assign({ apikey: key, 'Content-Type': 'application/json' }, init && init.headers);
  if (key.startsWith('eyJ') && !headers.Authorization) headers.Authorization = 'Bearer ' + key;
  return fetch(process.env.SUPABASE_URL.replace(/\/+$/, '') + path, Object.assign({}, init, { headers, signal: AbortSignal.timeout(10000) }));
}

/** Resolve the Supabase user from "Authorization: Bearer <access token>". Returns {id, email} or null. */
async function userFromToken(req) {
  const m = /^Bearer\s+(\S+)$/.exec(String(req.headers.authorization || ''));
  if (!m || !supabaseConfigured()) return null;
  const r = await supabase('/auth/v1/user', { headers: { Authorization: 'Bearer ' + m[1] } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? { id: u.id, email: u.email } : null;
}

/** Atomically take one unit of today's quota. Returns the new count, or -1 when the limit is reached. */
async function consumeQuota(userId, kind) {
  const r = await supabase('/rest/v1/rpc/consume_ai_quota', { method: 'POST', body: JSON.stringify({ p_user: userId, p_kind: kind }) });
  if (!r.ok) throw new Error('consume_ai_quota ' + r.status);
  return Number(await r.json());
}

/**
 * Common request gate: method, rate limit, authentication, JSON body.
 * Auth: a Supabase session token or the owner passcode. Call charge() once the input is validated.
 * Returns { body, user } — user is null for passcode / public calls — or null after sending an error.
 */
async function guard(req, res, { maxPerMinute = 20, auth = true, method = 'POST' } = {}) {
  if (req.method !== method) { send(res, 405, { error: 'Chỉ hỗ trợ ' + method }); return null; }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip, maxPerMinute, 60000)) { send(res, 429, { error: 'Gửi quá nhanh, thử lại sau ít phút' }); return null; }

  let user = null;
  if (auth) {
    const hasToken = /^Bearer\s/.test(String(req.headers.authorization || ''));
    const hasPass = !!req.headers['x-app-passcode'];
    if (!supabaseConfigured() && !process.env.APP_PASSCODE) {
      send(res, 503, { error: 'Server chưa cấu hình đăng nhập (SUPABASE_*) hoặc APP_PASSCODE', code: 'not_configured' }); return null;
    }
    if (hasToken) {
      try { user = await userFromToken(req); } catch (e) { send(res, 502, { error: 'Không kiểm tra được phiên đăng nhập, thử lại sau' }); return null; }
      if (!user) { send(res, 401, { error: 'Phiên đăng nhập hết hạn, hãy đăng nhập lại', code: 'bad_token' }); return null; }
    } else if (hasPass) {
      if (!process.env.APP_PASSCODE || !safeEqual(req.headers['x-app-passcode'], process.env.APP_PASSCODE)) {
        send(res, 401, { error: 'Sai mật mã truy cập', code: 'bad_passcode' }); return null;
      }
    } else {
      send(res, 401, { error: 'Đăng nhập để dùng tính năng này', code: 'no_auth' }); return null;
    }
  }

  let body = {};
  if (method === 'POST') {
    body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
    if (!body || typeof body !== 'object') { send(res, 400, { error: 'Body JSON không hợp lệ' }); return null; }
  }

  return { body, user };
}

/**
 * Take one unit of the signed-in user's daily AI quota (passcode callers have no quota).
 * Returns true to continue, false after sending the error response.
 */
async function charge(res, user, kind) {
  if (!user) return true;
  let used;
  try { used = await consumeQuota(user.id, kind); } catch (e) { console.error(e); send(res, 502, { error: 'Không kiểm tra được hạn mức, thử lại sau' }); return false; }
  if (used < 0) { send(res, 429, { error: 'Bạn đã dùng hết lượt AI miễn phí hôm nay, quay lại vào ngày mai nhé', code: 'quota_exceeded' }); return false; }
  return true;
}

function str(v, max) {
  if (v == null) return '';
  return String(v).slice(0, max);
}

module.exports = { send, guard, charge, str, supabase, supabaseConfigured, userFromToken };
