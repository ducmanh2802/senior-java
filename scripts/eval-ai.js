'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const gradeHandler = require(path.join(ROOT, 'api', 'grade'));

async function main() {
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const modelArg = args.filter(a => !a.startsWith('--')).join(',');
let models = modelArg.split(',').map(s => s.trim()).filter(Boolean);
if (!models.length) models = dry ? ['dry-run-model'] : null;
if (!models) { console.error('Usage: node scripts/eval-ai.js model1,model2,... [--dry]'); process.exit(1); }

if (dry) { if (!process.env.OPENROUTER_API_KEY) process.env.OPENROUTER_API_KEY = 'dry-key'; }
else if (!process.env.OPENROUTER_API_KEY) { console.error('OPENROUTER_API_KEY not set'); process.exit(1); }
process.env.APP_PASSCODE = process.env.APP_PASSCODE || 'eval-passcode';

const golden = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'eval', 'golden.json'), 'utf8'));
const sleep = ms => new Promise(r => setTimeout(r, ms));

const dryScores = golden.flatMap(c => c.answers.map(a => a.expected));
let dryIdx = 0;
if (dry) {
  global.fetch = async () => {
    const sc = dryScores[dryIdx++ % dryScores.length];
    const body = { choices: [{ message: { content: JSON.stringify({ score: sc, verdict: 'ok', strengths: [], missing: [], mistakes: [], follow_up: '', improved_answer: '', language: { grammar: [], phrasing_tips: [], fluency: '' } }) } }] };
    return { ok: true, status: 200, headers: { get: () => null }, json: async () => body };
  };
}

const totalReqs = models.length * golden.length * 3;
console.log('Expected requests: 36 per model, ' + models.length + ' model(s) => ' + totalReqs + ' total');
console.log('Models: ' + models.join(', ') + (dry ? ' (DRY)' : ''));

const results = [];
let callCounter = 0;

for (const model of models) {
  process.env.AI_MODELS = model;
  const perModel = { model, dry, calls: 0, valid: 0, invalid: 0, orderingHits: 0, cases: golden.length, maeSum: 0, maeN: 0, latencySum: 0, details: [] };
  console.log('\n=== Model: ' + model + ' ===');
  for (const c of golden) {
    const scores = {};
    for (const a of c.answers) {
      callCounter++;
      const req = { method: 'POST', headers: { 'x-app-passcode': process.env.APP_PASSCODE, 'content-type': 'application/json', 'x-forwarded-for': '10.0.' + (callCounter % 250) + '.' + ((callCounter * 7) % 250) }, body: { kind: 'answer', lang: c.lang, topic: c.topic, level: c.level, question: c.question, reference: c.reference, answer: a.text } };
      const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { this.body = b; } };
      const start = Date.now();
      let thrown = null;
      try { await gradeHandler(req, res); } catch (e) { thrown = e; }
      const latency = Date.now() - start;
      perModel.calls++;
      perModel.latencySum += latency;
      let parsed = null;
      try { parsed = typeof res.body === 'string' ? JSON.parse(res.body) : res.body; } catch (e) {}
      const ok = !thrown && res.statusCode === 200 && parsed && typeof parsed.score === 'number';
      if (ok) perModel.valid++; else perModel.invalid++;
      const score = ok ? parsed.score : null;
      if (score !== null) { perModel.maeSum += Math.abs(score - a.expected); perModel.maeN++; }
      else { perModel.maeSum += 4; perModel.maeN++; }
      scores[a.label] = score;
      perModel.details.push({ caseId: c.id, label: a.label, expected: a.expected, score, valid: ok, latency, error: thrown ? String(thrown) : (res.statusCode !== 200 ? res.body : null) });
      if (!dry) await sleep(3500);
    }
    const b = scores.bad, m = scores.mid, g = scores.good;
    if (b !== null && m !== null && g !== null && b < m && m < g) perModel.orderingHits++;
  }
  const mae = perModel.maeN ? (perModel.maeSum / perModel.maeN) : 0;
  const validRate = perModel.calls ? (perModel.valid / perModel.calls * 100) : 0;
  const orderRate = golden.length ? (perModel.orderingHits / golden.length * 100) : 0;
  const avgLat = perModel.calls ? (perModel.latencySum / perModel.calls) : 0;
  perModel.metrics = { validJsonRate: validRate, orderingRate: orderRate, mae, avgLatencyMs: avgLat, calls: perModel.calls };
  results.push(perModel);
  console.log('valid JSON: ' + validRate.toFixed(1) + '% | ordering: ' + orderRate.toFixed(1) + '% | MAE: ' + mae.toFixed(3) + ' | avg latency: ' + avgLat.toFixed(0) + 'ms | calls: ' + perModel.calls);
}

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const logDir = path.join(ROOT, 'logs');
fs.mkdirSync(logDir, { recursive: true });
const logPath = path.join(logDir, 'eval-ai-' + ts + '.json');
fs.writeFileSync(logPath, JSON.stringify({ timestamp: new Date().toISOString(), dry, models, results }, null, 2) + '\n');
console.log('\nWrote ' + logPath);
console.log('\nSummary:');
for (const r of results) {
  console.log(r.model + ' -> valid=' + r.metrics.validJsonRate.toFixed(1) + '% order=' + r.metrics.orderingRate.toFixed(1) + '% MAE=' + r.metrics.mae.toFixed(3) + ' lat=' + r.metrics.avgLatencyMs.toFixed(0) + 'ms');
}

}
main().catch(e => { console.error(e); process.exit(1); });
