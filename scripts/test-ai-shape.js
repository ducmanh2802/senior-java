#!/usr/bin/env node
/* T309: mock tests cho phần chuẩn hoá output AI (grade, interview). Không gọi mạng. */
'use strict';
const assert = require('assert');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const claude = require(ROOT + '/api/_claude');
const grade = require(ROOT + '/api/grade');
const interview = require(ROOT + '/api/interview');

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log('  ✔ ' + name); }
  catch (e) { failed++; console.log('  ✘ ' + name + '\n    ' + (e && e.message)); }
}

async function run() {
  console.log('ai-shape (T309)');

  await test('normalizeOut: mảng chuỗi lọc rỗng + cap 8', async () => {
    const out = claude.normalizeOut({ a: [' x ', '', null, 'y'] }, { arrays: ['a'], arrMax: 2 });
    assert.deepStrictEqual(out.a, ['x', 'y']);
  });
  await test('normalizeOut: string String() + cap', async () => {
    const out = claude.normalizeOut({ s: 123 }, { strings: ['s'], strMax: 2 });
    assert.strictEqual(out.s, '12');
  });
  await test('normalizeOut: enum fallback', async () => {
    const out = claude.normalizeOut({ e: 'zzz' }, { enums: [['e', ['a', 'b'], 'a']] });
    assert.strictEqual(out.e, 'a');
  });
  await test('normalizeOut: score clamp', async () => {
    const out = claude.normalizeOut({ score: 99 }, { scores: ['score'] });
    assert.strictEqual(out.score, 5);
    const out2 = claude.normalizeOut({ score: 0 }, { scores: ['score'] });
    assert.strictEqual(out2.score, 1);
  });
  await test('normalizeOut: boolean', async () => {
    const out = claude.normalizeOut({ b: 1 }, { booleans: ['b'] });
    assert.strictEqual(out.b, true);
  });
  await test('normalizeOut: thiếu field -> rỗng', async () => {
    const out = claude.normalizeOut({}, { arrays: ['a'], strings: ['s'], scores: ['score'] });
    assert.deepStrictEqual(out.a, []);
    assert.strictEqual(out.s, '');
    assert.strictEqual(out.score, 1);
  });
  await test('normalizeOut: input null -> object rỗng', async () => {
    const out = claude.normalizeOut(null, { arrays: ['a'] });
    assert.deepStrictEqual(out, { a: [] });
  });

  await test('clampScore: biên', async () => {
    assert.strictEqual(claude.clampScore(0), 1);
    assert.strictEqual(claude.clampScore(5.4), 5);
    assert.strictEqual(claude.clampScore('3'), 3);
  });

  const align = interview._test.alignHireSignal;
  await test('alignHireSignal: score<=2 không yes/strong_yes', async () => {
    assert.strictEqual(align(1, 'strong_yes'), 'lean_no');
    assert.strictEqual(align(2, 'yes'), 'lean_no');
  });
  await test('alignHireSignal: score>=4 không no/strong_no', async () => {
    assert.strictEqual(align(4, 'strong_no'), 'yes');
    assert.strictEqual(align(5, 'no'), 'yes');
  });
  await test('alignHireSignal: enum ngoài -> lean_no', async () => {
    assert.strictEqual(align(3, 'foo'), 'lean_no');
  });
  await test('alignHireSignal: nhất quán giữ nguyên', async () => {
    assert.strictEqual(align(5, 'strong_yes'), 'strong_yes');
    assert.strictEqual(align(1, 'strong_no'), 'strong_no');
  });
  // shapeSummary
  const ss = interview._test.shapeSummary;
  await test('shapeSummary: đầy đủ field + hire_signal align', async () => {
    const n = ss({ overall_score: 1, hire_signal: 'strong_yes', verdict: 'v', by_question: [{ question: 'q', score: 10, comment: 'c', better_answer: 'b' }], strengths: ['s', ''], improvements: null, study_next: ['a','b','c','d','e','f','g','h','i'], communication: 'comm' });
    assert.strictEqual(n.overall_score, 1);
    assert.strictEqual(n.hire_signal, 'lean_no');
    assert.deepStrictEqual(n.strengths, ['s']);
    assert.deepStrictEqual(n.improvements, []);
    assert.strictEqual(n.study_next.length, 8);
    assert.strictEqual(n.by_question.length, 1);
    assert.strictEqual(n.by_question[0].score, 5);
    assert.strictEqual(n.by_question[0].question, 'q');
    assert.strictEqual(n.communication, 'comm');
  });
  await test('shapeSummary: thiếu field -> rỗng', async () => {
    const n = ss({});
    assert.strictEqual(n.overall_score, 1);
    assert.strictEqual(n.hire_signal, 'lean_no');
    assert.deepStrictEqual(n.by_question, []);
    assert.strictEqual(n.verdict, '');
  });

  // shapeTurn
  const st = interview._test.shapeTurn;
  await test('shapeTurn: intent enum + seed_index + last_answer', async () => {
    const n = st({ say: 'hi', intent: 'foo', topic: 't', seed_index: 2, done: 1, last_answer: { score: 3, note: 'n' } }, 'tok', true);
    assert.strictEqual(n.intent, 'question');
    assert.strictEqual(n.seed_index, 2);
    assert.strictEqual(n.session_token, 'tok');
    assert.strictEqual(n.last_answer.score, 3);
    assert.strictEqual(n.last_answer.note, 'n');
    assert.strictEqual(n.done, true);
  });
  await test('shapeTurn: không có answer -> score 0', async () => {
    const n = st({ say: 'hi' }, 'tok', false);
    assert.strictEqual(n.last_answer.score, 0);
    assert.strictEqual(n.seed_index, -1);
    assert.strictEqual(n.say, 'hi');
  });

  // grade shapes
  const gs = grade._test.shapeAnswer;
  const gc = grade._test.shapeCode;
  await test('shapeAnswer: arrays + language', async () => {
    const n = gs({ score: 4, verdict: 'v', strengths: ['a', ''], missing: null, mistakes: ['m'], follow_up: 'f', improved_answer: 'ia', language: { grammar: [{ wrong: 'w', right: 'r', note: 'n' }, null], phrasing_tips: ['p'], fluency: 'fl' } });
    assert.strictEqual(n.score, 4);
    assert.deepStrictEqual(n.strengths, ['a']);
    assert.deepStrictEqual(n.missing, []);
    assert.deepStrictEqual(n.mistakes, ['m']);
    assert.strictEqual(n.language.grammar.length, 1);
    assert.strictEqual(n.language.grammar[0].wrong, 'w');
    assert.deepStrictEqual(n.language.phrasing_tips, ['p']);
    assert.strictEqual(n.language.fluency, 'fl');
  });
  await test('shapeAnswer: thiếu language -> rỗng', async () => {
    const n = gs({ score: 2, verdict: 'v' });
    assert.deepStrictEqual(n.language.grammar, []);
    assert.deepStrictEqual(n.language.phrasing_tips, []);
    assert.strictEqual(n.language.fluency, '');
  });
  await test('shapeCode: correct + arrays', async () => {
    const n = gc({ score: 5, verdict: 'v', correct: 'true', bugs: ['b'], failing_cases: [], complexity: 'O(n)', style: ['s'], follow_up: 'f', improved_answer: 'ia' });
    assert.strictEqual(n.correct, true);
    assert.deepStrictEqual(n.bugs, ['b']);
    assert.strictEqual(n.complexity, 'O(n)');
  });
  await test('shapeCode: correct false string', async () => {
    const n = gc({ score: 1, verdict: 'v', correct: 'false', bugs: [], failing_cases: [], complexity: '', style: [], follow_up: '', improved_answer: '' });
    assert.strictEqual(n.correct, false);
  });

  console.log('\\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
}
run().catch(e => { console.error(e); process.exit(1); });
