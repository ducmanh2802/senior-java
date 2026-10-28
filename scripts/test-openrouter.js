#!/usr/bin/env node
/*
 * Unit tests for api/_claude.js → OpenRouter Chat Completions adapter.
 * Mocks global.fetch; không gọi API thật, không cần Anthropic SDK, không cần mạng.
 *   node scripts/test-openrouter.js
 */
'use strict';

const assert = require('assert');
delete process.env.ANTHROPIC_API_KEY;   // the paid Claude fallback must not kick in during these tests
const path = require('path');

const ROOT = path.join(__dirname, '..');
let failed = 0, passed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; console.log('  ✘ ' + name + '\n    ' + (e && e.message)); }
}

const calls = [];
function mockFetch(handler) {
  global.fetch = async (url, init) => {
    calls.push({ url, init });
    return handler(url, init);
  };
}

function restoreFetch() {
  delete global.fetch;
}

function loadClaude() {
  const cp = require.resolve(ROOT + '/api/_claude.js');
  delete require.cache[cp];
  return require(cp);
}

const BASE_SCHEMA = {
  type: 'object',
  properties: { score: { type: 'integer' }, verdict: { type: 'string' } },
  required: ['score', 'verdict'],
  additionalProperties: false,
};

async function runTests() {
  console.log('api/_claude.js (OpenRouter adapter)');

  // ---------- Missing API key ----------
  await test('thiếu OPENROUTER_API_KEY → 503 not_configured, không gọi fetch', async () => {
    delete process.env.OPENROUTER_API_KEY;
    calls.length = 0;
    restoreFetch();
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 503);
    assert.strictEqual(outcome.body.code, 'not_configured');
    assert.strictEqual(calls.length, 0);
  });

  // ---------- Success ----------
  await test('thành công với JSON hợp lệ, trả model và result', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test-123';
    process.env.AI_MODEL = 'openrouter/free';
    calls.length = 0;
    mockFetch((url, init) => {
      assert.strictEqual(url, 'https://openrouter.ai/api/v1/chat/completions');
      assert.strictEqual(init.method, 'POST');
      assert.strictEqual(init.headers.Authorization, 'Bearer sk-or-test-123');
      const body = JSON.parse(init.body);
      assert.strictEqual(body.model, 'openrouter/free');
      assert.ok(body.response_format);
      assert.ok(Array.isArray(body.messages));
      assert.ok(body.messages.some(m => m.role === 'system'));
      return Promise.resolve({ ok: true, status: 200,
        json: async () => ({
          id: 'gen-1', model: 'openrouter/free',
          choices: [{ message: { content: JSON.stringify({ score: 4, verdict: 'tốt' }) } }],
        }),
        text: async () => JSON.stringify({}),
      });
    });
    const mod = loadClaude();
    const outcome = await mod.askJson({
      system: 'Bạn là interviewer',
      prompt: 'Chấm câu này',
      schema: BASE_SCHEMA,
    });
    assert.strictEqual(outcome.ok, true);
    assert.strictEqual(outcome.model, 'openrouter/free');
    assert.deepStrictEqual(outcome.result, { score: 4, verdict: 'tốt' });
    assert.strictEqual(calls.length, 1);
    restoreFetch();
  });

  // ---------- Invalid JSON ----------
  await test('OpenRouter trả JSON không parse được → 502 bad_json', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    mockFetch(() => Promise.resolve({ ok: true, status: 200,
      json: async () => ({ id: 'g', model: 'openrouter/free', choices: [{ message: { content: 'đây không phải JSON' } }] }),
      text: async () => JSON.stringify({}),
    }));
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 502);
    assert.strictEqual(outcome.body.code, 'bad_json');
    restoreFetch();
  });

  // ---------- Empty choices ----------
  await test('OpenRouter không trả choices → 502 bad_json', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    mockFetch(() => Promise.resolve({ ok: true, status: 200,
      json: async () => ({ id: 'g', model: 'openrouter/free', choices: [] }),
      text: async () => JSON.stringify({}),
    }));
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 502);
    assert.strictEqual(outcome.body.code, 'bad_json');
    restoreFetch();
  });

  // ---------- Empty content ----------
  await test('OpenRouter trả content trống → 502 bad_json', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    mockFetch(() => Promise.resolve({ ok: true, status: 200,
      json: async () => ({ id: 'g', model: 'openrouter/free', choices: [{ message: { content: '' } }] }),
      text: async () => JSON.stringify({}),
    }));
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 502);
    assert.strictEqual(outcome.body.code, 'bad_json');
    restoreFetch();
  });

  // ---------- 401 ----------
  await test('OpenRouter 401 → 503 bad_key', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-bad';
    calls.length = 0;
    mockFetch(() => Promise.resolve({ ok: false, status: 401,
      json: async () => ({ error: { message: 'Incorrect API key' } }),
      text: async () => JSON.stringify({}),
    }));
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 503);
    assert.strictEqual(outcome.body.code, 'bad_key');
    restoreFetch();
  });

  // ---------- 429 ----------
  await test('OpenRouter 429 → 429 rate_limited', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    mockFetch(() => Promise.resolve({ ok: false, status: 429,
      json: async () => ({ error: { message: 'Rate limited' } }),
      text: async () => JSON.stringify({}),
    }));
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 429);
    assert.strictEqual(outcome.body.code, 'rate_limited');
    restoreFetch();
  });

  // ---------- 402 quota ----------
  await test('OpenRouter 402 → 429 quota_exceeded', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    mockFetch(() => Promise.resolve({ ok: false, status: 402,
      json: async () => ({ error: { message: 'No credits remaining' } }),
      text: async () => JSON.stringify({}),
    }));
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 429);
    assert.strictEqual(outcome.body.code, 'quota_exceeded');
    restoreFetch();
  });

  // ---------- 400 model unavailable ----------
  await test('OpenRouter 400 model không khả dụng → 400 bad_request', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    mockFetch(() => Promise.resolve({ ok: false, status: 400,
      json: async () => ({ error: { message: 'Model not found: openrouter/free' } }),
      text: async () => JSON.stringify({}),
    }));
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 400);
    assert.strictEqual(outcome.body.code, 'bad_request');
    restoreFetch();
  });

  // ---------- 5xx ----------
  await test('OpenRouter 502 → 502 provider_error', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    mockFetch(() => Promise.resolve({ ok: false, status: 502,
      json: async () => ({ error: { message: 'Bad gateway' } }),
      text: async () => JSON.stringify({}),
    }));
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 502);
    assert.strictEqual(outcome.body.code, 'provider_error');
    restoreFetch();
  });

  // ---------- Timeout ----------
  await test('fetch ném AbortError → 504 timeout', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    const origFetch = global.fetch;
    global.fetch = async () => { throw Object.assign(new Error('aborted'), { name: 'AbortError' }); };
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 504);
    assert.strictEqual(outcome.body.code, 'timeout');
    global.fetch = origFetch;
  });

  // ---------- Network ----------
  await test('fetch ném lỗi mạng → 502 network', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-test';
    calls.length = 0;
    const origFetch = global.fetch;
    global.fetch = async () => { throw new Error('ENOTFOUND'); };
    const mod = loadClaude();
    const outcome = await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(outcome.ok, false);
    assert.strictEqual(outcome.status, 502);
    assert.strictEqual(outcome.body.code, 'network');
    global.fetch = origFetch;
  });

  // ---------- Default model ----------
  await test('mặc định MODEL là openrouter/free', async () => {
    delete process.env.AI_MODEL;
    const mod = loadClaude();
    assert.strictEqual(mod.MODEL, 'openrouter/free');
  });

  // ---------- AI_MODEL override ----------
  await test('AI_MODEL được ghi đè qua env', async () => {
    process.env.AI_MODEL = 'openrouter/gpt-oss-20b:free';
    const mod = loadClaude();
    assert.strictEqual(mod.MODEL, 'openrouter/gpt-oss-20b:free');
    delete process.env.AI_MODEL;
  });

  // ---------- No Anthropic headers / secrets not leaked ----------
  await test('không gửi header Anthropic, Authorization đúng', async () => {
    process.env.OPENROUTER_API_KEY = 'sk-or-secret';
    calls.length = 0;
    let capturedInit = null;
    mockFetch((url, init) => { capturedInit = init; return Promise.resolve({ ok: true, status: 200,
      json: async () => ({ id: 'g', model: 'openrouter/free', choices: [{ message: { content: JSON.stringify({ ok: true }) } }] }),
      text: async () => JSON.stringify({}),
    }); });
    const mod = loadClaude();
    await mod.askJson({ system: 'S', prompt: 'P', schema: BASE_SCHEMA });
    assert.strictEqual(capturedInit.headers.Authorization, 'Bearer sk-or-secret');
    assert.strictEqual(capturedInit.headers['Content-Type'], 'application/json');
    assert.strictEqual(capturedInit.headers['anthropic-workspace-id'], undefined);
    assert.strictEqual(capturedInit.headers['x-api-key'], undefined);
    restoreFetch();
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}

runTests().catch(e => { console.error(e); process.exit(1); });