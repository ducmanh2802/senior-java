#!/usr/bin/env node
/*
 * Unit tests for provider rotation / failover in api/_claude.js. Mocks global.fetch; no network.
 *   node scripts/test-providers.js
 */
'use strict';

const assert = require('assert');
const path = require('path');

const MOD = path.join(__dirname, '..', 'api', '_claude.js');
const ENV = ['ANTHROPIC_API_KEY', 'CLAUDE_MODEL', 'OPENROUTER_API_KEY', 'AI_MODEL', 'AI_MODELS', 'AI_PROVIDERS', 'GROQ_API_KEY', 'GROQ_MODEL', 'GEMINI_API_KEY', 'GEMINI_MODEL',
  'GITHUB_MODELS_TOKEN', 'GITHUB_MODEL', 'CEREBRAS_API_KEY', 'CEREBRAS_MODEL', 'MISTRAL_API_KEY', 'MISTRAL_MODEL'];
let passed = 0, failed = 0;

function load(env) {
  for (const k of ENV) delete process.env[k];
  Object.assign(process.env, env);
  delete require.cache[require.resolve(MOD)];
  return require(MOD);
}
const host = url => new URL(url).hostname.split('.').slice(-2)[0];   // openrouter | groq | googleapis | github …
const ok = obj => ({ ok: true, status: 200, headers: new Map(), json: async () => ({ model: 'm', choices: [{ message: { content: JSON.stringify(obj) } }] }) });
const err = (status, message, headers) => ({ ok: false, status, statusText: 'x', headers: new Map(Object.entries(headers || {})), json: async () => ({ error: { message } }) });
let calls;
function mock(byHost) {
  calls = [];
  global.fetch = async (url, init) => {
    const h = host(url); calls.push({ h, body: JSON.parse(init.body), auth: init.headers.Authorization });
    const r = byHost[h]; if (typeof r === 'function') return r(); return r;
  };
}
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ✔ ' + name); } catch (e) { failed++; console.log('  ✘ ' + name + '\n    ' + (e && e.message)); }
}
const THREE = { AI_PROVIDERS: 'groq,gemini,openrouter', GROQ_API_KEY: 'gk', GROQ_MODEL: 'llama', GEMINI_API_KEY: 'gm', GEMINI_MODEL: 'flash-lite', OPENROUTER_API_KEY: 'or' };

(async () => {
  console.log('api/_claude.js (multi-provider failover)');

  await test('provider thiếu model thì không bật; không provider nào → not_configured', async () => {
    const m = load({ GROQ_API_KEY: 'gk' });
    mock({});
    const r = await m.askJson({ prompt: 'P' });
    assert.strictEqual(r.body.code, 'not_configured'); assert.strictEqual(calls.length, 0);
  });

  await test('theo thứ tự AI_PROVIDERS, thành công ở provider đầu', async () => {
    const m = load(THREE);
    mock({ groq: ok({ a: 1 }) });
    const r = await m.askJson({ prompt: 'P', schema: { type: 'object' } });
    assert.strictEqual(r.ok, true); assert.strictEqual(r.provider, 'groq'); assert.deepStrictEqual(r.result, { a: 1 });
    assert.strictEqual(calls[0].body.response_format.type, 'json_object');
    assert.ok(!('models' in calls[0].body) && !('provider' in calls[0].body), 'tham số riêng OpenRouter không lọt sang groq');
    assert.ok(/JSON/.test(calls[0].body.messages[0].content), 'system có hướng dẫn JSON');
  });

  await test('429 / 5xx / timeout / bad_json → chuyển provider kế tiếp', async () => {
    for (const bad of [err(429, 'Rate limit reached'), err(503, 'down'), () => { const e = new Error('t'); e.name = 'AbortError'; throw e; },
      { ok: true, status: 200, headers: new Map(), json: async () => ({ choices: [{ message: { content: 'không phải json' } }] }) }]) {
      const m = load(THREE);
      mock({ groq: bad, googleapis: ok({ b: 2 }) });
      const r = await m.askJson({ prompt: 'P' });
      assert.strictEqual(r.provider, 'gemini'); assert.strictEqual(r.attempts, 2);
    }
  });

  await test('401 key sai ở một provider vẫn chuyển sang provider khác', async () => {
    const m = load(THREE);
    mock({ groq: err(401, 'bad key'), googleapis: ok({ c: 3 }) });
    assert.strictEqual((await m.askJson({ prompt: 'P' })).provider, 'gemini');
  });

  await test('cooldown: provider vừa 429 bị bỏ qua ở request sau', async () => {
    const m = load(THREE);
    mock({ groq: err(429, 'Rate limit reached', { 'retry-after': '30' }), googleapis: ok({ d: 4 }), openrouter: ok({ d: 5 }) });
    await m.askJson({ prompt: 'P' });
    mock({ groq: ok({ x: 0 }), googleapis: ok({ d: 4 }), openrouter: ok({ d: 5 }) });
    for (let i = 0; i < 4; i++) await m.askJson({ prompt: 'P' });
    assert.ok(!calls.some(c => c.h === 'groq'), 'groq đang cooldown không được gọi');
  });

  await test('luân phiên: các request liên tiếp bắt đầu ở provider khác nhau', async () => {
    const m = load(THREE);
    mock({ groq: ok({}), googleapis: ok({}), openrouter: ok({}) });
    const used = [];
    for (let i = 0; i < 3; i++) used.push((await m.askJson({ prompt: 'P' })).provider);
    assert.deepStrictEqual(used.sort(), ['gemini', 'groq', 'openrouter']);
  });

  await test('hết hạn mức ngày ở mọi provider → quota_exceeded; lẫn lỗi khác → all_providers_busy', async () => {
    let m = load(THREE);
    mock({ groq: err(429, 'Rate limit reached for tokens per day (TPD)'), googleapis: err(429, 'RESOURCE_EXHAUSTED quota'), openrouter: err(429, 'Rate limit exceeded: free-models-per-day') });
    let r = await m.askJson({ prompt: 'P' });
    assert.strictEqual(r.body.code, 'quota_exceeded'); assert.deepStrictEqual(r.body.tried.length, 3);
    m = load(THREE);
    mock({ groq: err(503, 'x'), googleapis: err(429, 'slow down'), openrouter: err(502, 'x') });
    r = await m.askJson({ prompt: 'P' });
    assert.strictEqual(r.body.code, 'all_providers_busy'); assert.strictEqual(r.status, 429);
  });

  await test('OpenRouter: AI_MODELS → models[] + require_parameters khi có schema', async () => {
    const m = load({ OPENROUTER_API_KEY: 'or', AI_MODELS: 'a/x:free, b/y:free' });
    mock({ openrouter: ok({}) });
    await m.askJson({ prompt: 'P', schema: { type: 'object' } });
    assert.strictEqual(calls[0].body.model, 'a/x:free'); assert.deepStrictEqual(calls[0].body.models, ['a/x:free', 'b/y:free']);
    assert.deepStrictEqual(calls[0].body.provider, { require_parameters: true });
  });

  await test('parseJson: code fence, chữ lẫn JSON, ngoặc trong chuỗi', async () => {
    const m = load({});
    assert.deepStrictEqual(m.parseJson('```json\n{"a":1}\n```'), { a: 1 });
    assert.deepStrictEqual(m.parseJson('Đây là kết quả: {"a":"x}y","b":{"c":2}} hết'), { a: 'x}y', b: { c: 2 } });
    assert.strictEqual(m.parseJson('không có'), undefined);
  });

  await test('providerStatus không lộ key', async () => {
    const m = load(THREE);
    const s = JSON.stringify(m.providerStatus());
    assert.ok(!/gk|"gm"|"or"/.test(s.replace(/"id":"[a-z]+"/g, '')), s);
    assert.deepStrictEqual(m.providerStatus().map(p => p.id), ['groq', 'gemini', 'openrouter']);
  });

  await test('Claude chỉ được gọi khi mọi provider free đều lỗi (Messages API, header x-api-key)', async () => {
    const m = load(Object.assign({ ANTHROPIC_API_KEY: 'sk-ant' }, THREE));
    const claudeOk = { ok: true, status: 200, headers: new Map(), json: async () => ({ model: 'claude-haiku-5-5', content: [{ type: 'text', text: '{"e":5}' }] }) };
    let claudeInit = null;
    calls = [];
    global.fetch = async (url, init) => {
      const h = host(url); calls.push({ h });
      if (h === 'anthropic') { claudeInit = init; return claudeOk; }
      return h === 'groq' ? ok({ free: 1 }) : err(503, 'x');
    };
    let r = await m.askJson({ system: 'S', prompt: 'P' });
    assert.strictEqual(r.provider, 'groq'); assert.ok(!calls.some(c => c.h === 'anthropic'), 'free ok → không gọi Claude');
    const m2 = load(Object.assign({ ANTHROPIC_API_KEY: 'sk-ant' }, THREE));
    global.fetch = async (url, init) => { const h = host(url); if (h === 'anthropic') { claudeInit = init; return claudeOk; } return err(429, 'tokens per day'); };
    r = await m2.askJson({ system: 'S', prompt: 'P' });
    assert.strictEqual(r.provider, 'claude'); assert.deepStrictEqual(r.result, { e: 5 });
    const b = JSON.parse(claudeInit.body);
    assert.strictEqual(claudeInit.headers['x-api-key'], 'sk-ant'); assert.ok(!claudeInit.headers.Authorization);
    assert.ok(b.system && /JSON/.test(b.system)); assert.ok(b.messages.every(x => x.role !== 'system')); assert.ok(!('response_format' in b));
    assert.ok(m2.providerStatus().some(p => p.id === 'claude' && p.fallback));
  });

  delete global.fetch;
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
