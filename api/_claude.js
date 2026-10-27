/*
 * Shared AI call for the serverless functions: one structured-output request to OpenRouter
 * Chat Completions, plus uniform error → HTTP mapping.
 * Env: OPENROUTER_API_KEY (required), AI_MODEL (default openrouter/free).
 * No Anthropic SDK, no Anthropic beta params, no automatic fallback to paid models.
 */
'use strict';

const { send } = require('./_lib');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.AI_MODEL || 'openrouter/free';

/**
 * Build the OpenRouter request body. Tries json_schema structured output when a schema is
 * provided; falls back to json_object + system-prompt instruction if the caller did not
 * supply a schema. The server always validates and re-parses the returned JSON.
 */
function buildBody({ system, prompt, messages, schema, effort = 'medium', maxTokens = 16000 }) {
  const msgList = [];
  if (system) msgList.push({ role: 'system', content: system });
  msgList.push(...(messages || [{ role: 'user', content: prompt }]));
  const body = {
    model: MODEL,
    max_tokens: maxTokens,
    temperature: effort === 'low' ? 0.3 : 0.5,
    messages: msgList,
  };
  if (schema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'answer', strict: true, schema },
    };
  } else {
    body.response_format = { type: 'json_object' };
  }
  return body;
}

/**
 * Map an OpenRouter HTTP error to a { status, code, message } outcome ready for fail()/send().
 * Never logs the API key, full prompt, or full user content.
 */
function mapOpenRouterError(status, message) {
  if (status === 401) return { status: 503, code: 'bad_key', message: 'OPENROUTER_API_KEY không hợp lệ' };
  if (status === 402) return { status: 429, code: 'quota_exceeded', message: 'Hết lượt miễn phí OpenRouter hôm nay, thử lại sau' };
  if (status === 429) return { status: 429, code: 'rate_limited', message: 'OpenRouter đang giới hạn tốc độ, thử lại sau' };
  if (status === 400) return { status: 400, code: 'bad_request', message: 'Yêu cầu OpenRouter không hợp lệ: ' + message };
  if (status >= 500) return { status: 502, code: 'provider_error', message: 'OpenRouter/provider lỗi ' + status };
  return { status: 502, code: 'provider_error', message: 'OpenRouter lỗi ' + status };
}

function fail(status, error, code) {
  return { ok: false, status, body: code ? { error, code } : { error } };
}

/**
 * Ask the AI (via OpenRouter) for a JSON object matching `schema`.
 * Returns { ok: true, result, model } or { ok: false, status, body } ready for send().
 */
async function askJson({ system, prompt, messages, schema, effort = 'medium', maxTokens = 16000 }) {
  if (!process.env.OPENROUTER_API_KEY) {
    return fail(503, 'Server chưa cấu hình OPENROUTER_API_KEY', 'not_configured');
  }
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + process.env.OPENROUTER_API_KEY,
  };
  // Optional OpenRouter attribution; never contains secrets.
  const referer = process.env.OPENROUTER_REFERER;
  const title = process.env.OPENROUTER_APP_TITLE;
  if (referer) headers['HTTP-Referer'] = referer;
  if (title) headers['X-Title'] = title;

  const body = buildBody({ system, prompt, messages, schema, effort, maxTokens });
  let res;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (e) {
    if (e.name === 'AbortError') return fail(504, 'OpenRouter không phản hồi kịp thời', 'timeout');
    return fail(502, 'Không kết nối được OpenRouter', 'network');
  }

  let data;
  try { data = await res.json(); } catch (e) { return fail(502, 'OpenRouter trả về phản hồi không phải JSON', 'bad_json'); }

  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || (data && data.error) || res.statusText;
    const mapped = mapOpenRouterError(res.status, String(msg));
    return fail(mapped.status, mapped.message, mapped.code);
  }

  const choices = data && data.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return fail(502, 'OpenRouter không trả về choices', 'bad_json');
  }
  const message = choices[0].message;
  const text = (message && message.content) || '';
  if (!text || !text.trim()) {
    return fail(502, 'OpenRouter trả về nội dung trống', 'bad_json');
  }
  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return fail(502, 'Không đọc được kết quả từ AI', 'bad_json'); }
  return { ok: true, result: parsed, model: data.model || MODEL };
}

/** send() the outcome of askJson, applying `shape` to a successful result. */
function reply(res, outcome, shape) {
  if (!outcome.ok) return send(res, outcome.status, outcome.body);
  const result = shape ? shape(outcome.result) : outcome.result;
  return send(res, 200, Object.assign(result, { model: outcome.model }));
}

const clampScore = (n, min = 1) => Math.min(5, Math.max(min, Math.round(Number(n) || min)));

module.exports = { askJson, reply, clampScore, MODEL };
