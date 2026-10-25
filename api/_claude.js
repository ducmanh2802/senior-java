/*
 * Shared Claude call for the serverless functions: one structured-output request with the
 * server-side fallback beta, plus uniform error → HTTP mapping.
 * Env: ANTHROPIC_API_KEY (required), CLAUDE_MODEL (default claude-opus-5-5),
 *      ANTHROPIC_WORKSPACE_ID (only for a key that is not scoped to a workspace).
 */
'use strict';

const { send } = require('./_lib');

const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5-5';

/**
 * Ask Claude for a JSON object matching `schema`.
 * Returns { ok: true, result, model } or { ok: false, status, body } ready for send().
 */
async function askJson({ system, prompt, messages, schema, effort = 'medium', maxTokens = 16000 }) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  // a key that is not scoped to a workspace must name one on every request (400 otherwise)
  const workspace = process.env.ANTHROPIC_WORKSPACE_ID;
  const client = new Anthropic(workspace ? { defaultHeaders: { 'anthropic-workspace-id': workspace } } : {});
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default', // re-run on Anthropic's recommended model if a safety classifier declines
      system,
      output_config: { effort, format: { type: 'json_schema', schema } },
      messages: messages || [{ role: 'user', content: prompt }],
    });
    if (response.stop_reason === 'refusal') return fail(422, 'Model từ chối xử lý nội dung này', 'refusal');
    if (response.stop_reason === 'max_tokens') return fail(502, 'Phản hồi bị cắt do quá dài, thử lại', 'max_tokens');
    const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
    try { return { ok: true, result: JSON.parse(text), model: response.model }; }
    catch (e) { return fail(502, 'Không đọc được kết quả từ AI', 'bad_json'); }
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return fail(503, 'ANTHROPIC_API_KEY không hợp lệ', 'bad_key');
    if (error instanceof Anthropic.RateLimitError) return fail(429, 'Claude API đang giới hạn tốc độ, thử lại sau');
    if (error instanceof Anthropic.BadRequestError) return fail(400, 'Yêu cầu không hợp lệ: ' + error.message);
    if (error instanceof Anthropic.APIError) return fail(502, `Claude API lỗi ${error.status}`);
    console.error(error);
    return fail(500, 'Lỗi server khi gọi AI');
  }
}

function fail(status, error, code) {
  return { ok: false, status, body: code ? { error, code } : { error } };
}

/** send() the outcome of askJson, applying `shape` to a successful result. */
function reply(res, outcome, shape) {
  if (!outcome.ok) return send(res, outcome.status, outcome.body);
  const result = shape ? shape(outcome.result) : outcome.result;
  return send(res, 200, Object.assign(result, { model: outcome.model }));
}

const clampScore = (n, min = 1) => Math.min(5, Math.max(min, Math.round(Number(n) || min)));

module.exports = { askJson, reply, clampScore, MODEL };
