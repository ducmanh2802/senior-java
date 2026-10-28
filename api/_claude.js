/*
 * Shared AI call for the serverless functions: one JSON-output chat completion, rotated across the
 * free-tier providers that have credentials, plus uniform error → HTTP mapping.
 *
 * Providers (all OpenAI-compatible chat completions; a provider is on when its key AND model are set,
 * except OpenRouter whose model defaults to openrouter/free):
 *   openrouter  OPENROUTER_API_KEY   AI_MODELS (comma list, OpenRouter fallback routing) or AI_MODEL
 *   groq        GROQ_API_KEY         GROQ_MODEL
 *   gemini      GEMINI_API_KEY       GEMINI_MODEL
 *   github      GITHUB_MODELS_TOKEN  GITHUB_MODEL
 *   cerebras    CEREBRAS_API_KEY     CEREBRAS_MODEL
 *   mistral     MISTRAL_API_KEY      MISTRAL_MODEL
 * AI_PROVIDERS=groq,gemini,openrouter sets the order (default: the order above).
 * Last resort (paid, opt-in): ANTHROPIC_API_KEY (+ CLAUDE_MODEL, default claude-haiku-5-5) is called only
 * when every free provider above failed for this request; it is never part of the rotation.
 *
 * Failover: 429 / 402 / 401 / 403 / 400 / 5xx / timeout / unreadable JSON → next provider (at most
 * MAX_TRIES per request). A provider that hit a rate limit or its daily quota cools down in this
 * instance's memory so the next requests skip it. Requests alternate their starting provider.
 * No SDKs (plain fetch). The only paid fallback is the opt-in Claude one. Never logs keys or user content.
 */
'use strict';

const { send } = require('./_lib');

const PROVIDERS = {
  openrouter: { url: 'https://openrouter.ai/api/v1/chat/completions', key: 'OPENROUTER_API_KEY', model: 'AI_MODEL', label: 'OpenRouter' },
  groq:       { url: 'https://api.groq.com/openai/v1/chat/completions', key: 'GROQ_API_KEY', model: 'GROQ_MODEL', label: 'Groq' },
  gemini:     { url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', key: 'GEMINI_API_KEY', model: 'GEMINI_MODEL', label: 'Gemini' },
  github:     { url: 'https://models.github.ai/inference/chat/completions', key: 'GITHUB_MODELS_TOKEN', model: 'GITHUB_MODEL', label: 'GitHub Models' },
  cerebras:   { url: 'https://api.cerebras.ai/v1/chat/completions', key: 'CEREBRAS_API_KEY', model: 'CEREBRAS_MODEL', label: 'Cerebras' },
  mistral:    { url: 'https://api.mistral.ai/v1/chat/completions', key: 'MISTRAL_API_KEY', model: 'MISTRAL_MODEL', label: 'Mistral' },
};
const CLAUDE = { id: 'claude', url: 'https://api.anthropic.com/v1/messages', label: 'Claude' };
const MAX_TRIES = 3;          // providers tried per request
const TOTAL_BUDGET = 50000;   // ms for all tries together (stays under the function limit)
const CALL_TIMEOUT = 25000;   // ms per provider call

const orModels = () => (process.env.AI_MODELS || '').split(',').map(s => s.trim()).filter(Boolean);
const MODEL = orModels()[0] || process.env.AI_MODEL || 'openrouter/free';

// ---------- automatic model choice when *_MODEL is not set ----------
// GET <base>/models (OpenAI-compatible) → best chat model by score; cached per instance for 6 h.
const AUTO = {
  groq: {
    url: 'https://api.groq.com/openai/v1/models',
    skip: /whisper|tts|guard|embed|audio|playai|orpheus|compound|prompt-guard|safeguard|allam/i,
    score: id => (/gpt-oss-120b/i.test(id) ? 50 : 0) + (/versatile/i.test(id) ? 40 : 0) + (/llama-4|maverick|scout/i.test(id) ? 30 : 0)
      + (/qwen|kimi|deepseek/i.test(id) ? 20 : 0) + Math.min(30, sizeB(id) / 4) - (/instant|8b|mini|small/i.test(id) ? 25 : 0),
  },
  gemini: {
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/models',
    skip: /embed|image|imagen|veo|tts|audio|live|aqa|learnlm|gemma|robotics|computer|native|exp-\d/i,
    // flash-lite has the most generous free quota, then flash; newer versions first
    score: id => (/flash-lite/i.test(id) ? 60 : /flash/i.test(id) ? 40 : 0) + version(id) * 5 - (/preview/i.test(id) ? 3 : 0) - (/pro/i.test(id) ? 50 : 0),
  },
};
function sizeB(id) { const m = /(\d+(?:\.\d+)?)b\b/i.exec(id); return m ? Number(m[1]) : 0; }
function version(id) { const m = /gemini-(\d+(?:\.\d+)?)/i.exec(id); return m ? Number(m[1]) : 0; }
const autoCache = new Map();   // provider id → { model, at }

/** Resolve 'auto' to a concrete model id, or '' when the list cannot be read. */
async function resolveModel(p, timeoutMs) {
  const hit = autoCache.get(p.id);
  if (hit && Date.now() - hit.at < 6 * 3600000) return hit.model;
  const a = AUTO[p.id];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 6000));
  try {
    const res = await fetch(a.url, { headers: { Authorization: 'Bearer ' + p.apiKey }, signal: controller.signal });
    if (!res.ok) return '';
    const data = await res.json();
    const ids = (data && Array.isArray(data.data) ? data.data : []).filter(m => m && m.active !== false).map(m => String(m.id || '').replace(/^models\//, ''))
      .filter(id => id && !a.skip.test(id));
    const best = ids.sort((x, y) => a.score(y) - a.score(x))[0] || '';
    if (best) autoCache.set(p.id, { model: best, at: Date.now() });
    return best;
  } catch (e) { return ''; } finally { clearTimeout(timer); }
}

/** Providers with credentials, in AI_PROVIDERS order: [{ id, url, apiKey, model, label }]. */
function enabledProviders() {
  const order = (process.env.AI_PROVIDERS || '').split(',').map(s => s.trim().toLowerCase()).filter(id => PROVIDERS[id]);
  const ids = order.length ? order : Object.keys(PROVIDERS);
  const out = [];
  for (const id of ids) {
    const p = PROVIDERS[id], apiKey = process.env[p.key];
    const model = id === 'openrouter' ? (orModels()[0] || process.env.AI_MODEL || 'openrouter/free')
      : process.env[p.model] || (AUTO[id] ? 'auto' : '');   // no *_MODEL → pick from the provider's model list
    if (apiKey && model) out.push({ id, url: p.url, apiKey, model, label: p.label });
  }
  return out;
}

// ---------- per-instance rotation + cooldown (warm serverless instances keep module state) ----------
const cooldown = new Map();   // provider id → epoch ms when it may be used again
let rotation = 0;

/** Providers to try for this request: available ones first (rotated), then the soonest to recover. */
function pickOrder(list) {
  const now = Date.now();
  const ready = list.filter(p => !(cooldown.get(p.id) > now));
  const cooling = list.filter(p => cooldown.get(p.id) > now).sort((a, b) => cooldown.get(a.id) - cooldown.get(b.id));
  const start = ready.length ? rotation++ % ready.length : 0;
  return ready.slice(start).concat(ready.slice(0, start), cooling).slice(0, MAX_TRIES);
}

function buildBody(p, { system, prompt, messages, schema, effort, maxTokens, temperature }) {
  const jsonHint = 'Chỉ trả về MỘT object JSON hợp lệ' + (schema ? ' đúng schema sau: ' + JSON.stringify(schema) : '') + '. Không thêm chữ, không bọc code fence.';
  const sys = p.id === 'openrouter' && schema ? system : [system, jsonHint].filter(Boolean).join('\n\n');
  const msgList = [];
  if (sys) msgList.push({ role: 'system', content: sys });
  msgList.push(...(messages || [{ role: 'user', content: prompt }]));
  const body = {
    model: p.model,
    max_tokens: p.id === 'openrouter' ? maxTokens : Math.min(maxTokens, Number(process.env.AI_MAX_TOKENS) || 8000),
    temperature: temperature != null ? temperature : (effort === 'low' ? 0.3 : 0.5),
    messages: msgList,
  };
  if (p.id === 'openrouter') {
    const models = orModels();
    if (models.length > 1) body.models = models;
    if (schema) {
      body.response_format = { type: 'json_schema', json_schema: { name: 'answer', strict: true, schema } };
      body.provider = { require_parameters: true };
    } else body.response_format = { type: 'json_object' };
  } else {
    body.response_format = { type: 'json_object' };   // json_schema support varies; the schema is in the system prompt
  }
  return body;
}

/** Parse model output that may be wrapped in a code fence or surrounded by prose. */
function parseJson(text) {
  if (!text || !String(text).trim()) return undefined;
  let s = String(text).trim();
  try { return JSON.parse(s); } catch (e) { /* try harder */ }
  s = s.replace(/^\s*(```|~~~)[a-z]*\s*/i, '').replace(/\s*(```|~~~)\s*$/, '');
  try { return JSON.parse(s); } catch (e) { /* try harder */ }
  const start = s.indexOf('{');
  if (start < 0) return undefined;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {        // first balanced {...}, string-aware
    const c = s[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { try { return JSON.parse(s.slice(start, i + 1)); } catch (e) { return undefined; } }
  }
  return undefined;
}

const header = (res, name) => (res && res.headers && typeof res.headers.get === 'function' && res.headers.get(name)) || null;
const DAILY = /per[- ]day|per day|daily|quota|RESOURCE_EXHAUSTED|tokens per day|requests per day|\bRPD\b|\bTPD\b/i;

/** HH:mm in Vietnam time for an epoch-ms (or epoch-s) reset header. */
function resetText(v) {
  let t = Number(v); if (!t) return '';
  if (t < 1e12) t *= 1000;
  const d = new Date(t + 7 * 3600 * 1000);
  return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
}

/** Map a provider HTTP error to { status, code, message, cool (ms or 0) }. */
function mapError(p, status, message, res) {
  const who = p.label;
  if (status === 401 || status === 403) return { status: 503, code: 'bad_key', message: who + ': API key không hợp lệ hoặc không có quyền', cool: 3600000 };
  if (status === 402) return { status: 429, code: 'quota_exceeded', message: 'Hết lượt AI miễn phí của ' + who, cool: 3600000 };
  if (status === 429) {
    const reset = header(res, 'x-ratelimit-reset') || header(res, 'x-ratelimit-reset-requests');
    if (DAILY.test(message)) {
      const at = resetText(reset);
      const until = Number(reset) ? (Number(reset) < 1e12 ? Number(reset) * 1000 : Number(reset)) - Date.now() : 0;
      return { status: 429, code: 'quota_exceeded', message: 'Hết lượt AI miễn phí hôm nay của ' + who + (at ? ', thử lại sau ' + at : ''), cool: until > 0 ? until : 3600000 };
    }
    const after = Number(header(res, 'retry-after'));
    return { status: 429, code: 'rate_limited', message: who + ' đang giới hạn tốc độ, thử lại sau', cool: (after > 0 ? after * 1000 : 60000), retry_after: after > 0 ? after : undefined };
  }
  if (status === 400) return { status: 400, code: 'bad_request', message: 'Yêu cầu ' + who + ' không hợp lệ: ' + message, cool: 0 };
  return { status: 502, code: 'provider_error', message: who + ' lỗi ' + status, cool: 30000 };
}

function fail(status, error, code, extra) {
  return { ok: false, status, body: Object.assign(code ? { error, code } : { error }, extra || {}) };
}

/** One call to one provider → { ok, result, model } or { ok: false, status, code, message, cool }. */
async function callProvider(p, opts, timeoutMs) {
  const headers = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + p.apiKey };
  if (p.id === 'openrouter') {   // optional attribution; never contains secrets
    if (process.env.OPENROUTER_REFERER) headers['HTTP-Referer'] = process.env.OPENROUTER_REFERER;
    if (process.env.OPENROUTER_APP_TITLE) headers['X-Title'] = process.env.OPENROUTER_APP_TITLE;
  }
  let reqBody = buildBody(p, opts);
  if (p.id === 'claude') {     // Anthropic Messages API: x-api-key + version header, system outside messages
    delete headers.Authorization;
    headers['x-api-key'] = p.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    const sys = reqBody.messages.filter(m => m.role === 'system').map(m => m.content).join('\n\n');
    reqBody = { model: p.model, max_tokens: reqBody.max_tokens, temperature: reqBody.temperature, system: sys || undefined,
      messages: reqBody.messages.filter(m => m.role !== 'system') };
  }
  let res;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    res = await fetch(p.url, { method: 'POST', headers, body: JSON.stringify(reqBody), signal: controller.signal });
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok: false, status: 504, code: 'timeout', message: p.label + ' không phản hồi kịp thời', cool: 30000 };
    return { ok: false, status: 502, code: 'network', message: 'Không kết nối được ' + p.label, cool: 30000 };
  } finally { clearTimeout(timer); }

  let data;
  try { data = await res.json(); } catch (e) { return { ok: false, status: 502, code: 'bad_json', message: p.label + ' trả về phản hồi không phải JSON', cool: 0 }; }
  if (Array.isArray(data)) data = data[0];          // Gemini sometimes wraps errors in an array
  if (!res.ok) {
    const err = data && data.error;
    const msg = (err && (err.message || err.status)) || (typeof err === 'string' ? err : '') || res.statusText || '';
    return Object.assign({ ok: false }, mapError(p, res.status, String(msg), res));
  }
  if (p.id === 'claude' && data && Array.isArray(data.content)) {
    data = { model: data.model, choices: [{ message: { content: data.content.filter(b => b.type === 'text').map(b => b.text).join('') } }] };
  }
  const choice = data && Array.isArray(data.choices) && data.choices[0];
  if (!choice) return { ok: false, status: 502, code: 'bad_json', message: p.label + ' không trả về choices', cool: 0 };
  const msg = choice.message || {};
  const text = msg.content || '';
  if (!String(text).trim() && !msg.reasoning) return { ok: false, status: 502, code: 'bad_json', message: p.label + ' trả về nội dung trống', cool: 0 };
  let parsed = parseJson(text);
  if (parsed === undefined && msg.reasoning) parsed = parseJson(msg.reasoning);
  if (!parsed || typeof parsed !== 'object') return { ok: false, status: 502, code: 'bad_json', message: 'Không đọc được kết quả từ AI (' + p.label + ')', cool: 0 };
  return { ok: true, result: parsed, model: data.model || p.model };
}

/**
 * Ask the AI for a JSON object matching `schema`, failing over across providers.
 * Returns { ok: true, result, model, provider, attempts } or { ok: false, status, body } ready for send().
 */
async function askJson({ system, prompt, messages, schema, effort = 'medium', maxTokens = 16000, temperature, timeoutMs }) {
  const list = enabledProviders();
  if (!list.length && !process.env.ANTHROPIC_API_KEY) return fail(503, 'Server chưa cấu hình AI (OPENROUTER_API_KEY / GROQ_API_KEY / GEMINI_API_KEY…)', 'not_configured');
  const opts = { system, prompt, messages, schema, effort, maxTokens, temperature };
  const started = Date.now();
  const errors = [];
  for (const p of pickOrder(list)) {
    const left = TOTAL_BUDGET - (Date.now() - started);
    if (left < 3000) break;
    if (p.model === 'auto') {
      p.model = await resolveModel(p, left);
      if (!p.model) { cooldown.set(p.id, Date.now() + 60000); errors.push({ provider: p.id, status: 502, code: 'no_model', message: 'Không đọc được danh sách model của ' + p.label }); continue; }
    }
    const r = await callProvider(p, opts, Math.min(timeoutMs || CALL_TIMEOUT, left - 500));
    if (!r.ok && (r.status === 400 || r.status === 404) && autoCache.get(p.id)) autoCache.delete(p.id);   // auto-picked model may be retired
    if (r.ok) { cooldown.delete(p.id); return { ok: true, result: r.result, model: r.model, provider: p.id, attempts: errors.length + 1 }; }
    if (r.cool) cooldown.set(p.id, Date.now() + r.cool);
    errors.push(Object.assign({ provider: p.id }, r));
  }
  const claudeKey = process.env.ANTHROPIC_API_KEY;
  if (claudeKey && !errors.every(e => e.code === 'bad_request')) {   // every free provider failed → paid last resort
    const p = Object.assign({ apiKey: claudeKey, model: process.env.CLAUDE_MODEL || 'claude-haiku-5-5' }, CLAUDE);
    const left = TOTAL_BUDGET + 8000 - (Date.now() - started);
    if (left > 5000) {
      const r = await callProvider(p, opts, Math.min(timeoutMs || CALL_TIMEOUT, left));
      if (r.ok) return { ok: true, result: r.result, model: r.model, provider: 'claude', attempts: errors.length + 1 };
      errors.push(Object.assign({ provider: 'claude' }, r));
    }
  }
  if (errors.length === 1) {   // single provider: keep its precise error
    const e = errors[0];
    return fail(e.status, e.message, e.code, e.retry_after ? { retry_after: e.retry_after } : null);
  }
  const tried = errors.map(e => e.provider + ':' + e.code);
  if (errors.length && errors.every(e => e.code === 'quota_exceeded')) {
    return fail(429, 'Hết lượt AI miễn phí hôm nay ở mọi nhà cung cấp. Thử lại sau.', 'quota_exceeded', { tried });
  }
  return fail(errors.some(e => e.status === 429) ? 429 : 502, 'Tất cả AI miễn phí đang hết lượt hoặc bận. Thử lại sau ít phút.', 'all_providers_busy', { tried });
}

/** send() the outcome of askJson, applying `shape` to a successful result. */
function reply(res, outcome, shape) {
  if (!outcome.ok) return send(res, outcome.status, outcome.body);
  const result = shape ? shape(outcome.result) : outcome.result;
  return send(res, 200, Object.assign(result, { model: outcome.model, provider: outcome.provider }));
}

/** Configured providers for /api/status — ids, models and cooldown only, never keys. */
function providerStatus() {
  const now = Date.now();
  const list = enabledProviders().map(p => ({ id: p.id, model: p.model === 'auto' ? (autoCache.get(p.id) || { model: 'auto' }).model : p.model, cooling: cooldown.get(p.id) > now }));
  if (process.env.ANTHROPIC_API_KEY) list.push({ id: 'claude', model: process.env.CLAUDE_MODEL || 'claude-haiku-5-5', cooling: false, fallback: true });
  return list;
}

const clampScore = (n, min = 1) => Math.min(5, Math.max(min, Math.round(Number(n) || min)));

/** Normalize an array value into a clean string array: drop empty, cap length. */
function strArr(v, max = 8) {
  if (!Array.isArray(v)) return [];
  return v.map(x => (x == null ? '' : String(x))).map(s => s.trim()).filter(Boolean).slice(0, max);
}

/** Keep an array of arbitrary items (e.g. grammar objects) but drop empties and cap length. */
function cleanArr(v, max = 8) {
  if (!Array.isArray(v)) return [];
  return v.filter(x => x !== null && x !== undefined && !(typeof x === 'string' && !x.trim())).slice(0, max);
}

/** String-coerce and cap a scalar value. */
function str(v, max = 4000) {
  return String(v == null ? '' : v).slice(0, max);
}

/** Return v when it is in `allowed`, otherwise `fallback`. */
function enumVal(v, allowed, fallback) {
  return allowed.includes(v) ? v : fallback;
}

/**
 * Standardize the AI output before sending to the client (T309):
 *  - arrays become clean string arrays (≤ 8 items)
 *  - scalars are String()-coerced and length-capped
 *  - enum fields fall back to a safe default
 *  - score fields go through clampScore
 */
function normalizeOut(r, spec, overrides) {
  const out = r && typeof r === 'object' ? Object.assign({}, r) : {};
  for (const k of spec.arrays || []) out[k] = strArr(out[k], spec.arrMax);
  for (const k of (spec.cleanArrays || [])) out[k] = cleanArr(out[k], spec.arrMax);
  for (const k of spec.strings || []) out[k] = str(out[k], spec.strMax);
  for (const [k, allowed, fb] of (spec.enums || [])) out[k] = enumVal(out[k], allowed, fb);
  for (const k of spec.scores || []) out[k] = clampScore(out[k]);
  for (const k of spec.booleans || []) out[k] = Boolean(out[k]);
  if (overrides) Object.assign(out, overrides);
  return out;
}

/** True when at least one provider (or the Claude fallback) has credentials. */
const aiConfigured = () => enabledProviders().length > 0 || !!process.env.ANTHROPIC_API_KEY;

module.exports = { askJson, reply, clampScore, MODEL, providerStatus, parseJson, strArr, cleanArr, str, enumVal, normalizeOut, aiConfigured };
