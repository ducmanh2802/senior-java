#!/usr/bin/env node
/*
 * Check TOEIC Listening & Reading tests (js/data/toeic-lr-<T><a-e>.js -> window.TOEIC_LR) and the 4-skill tips
 * (js/data/toeic-tips.js -> window.TOEIC_TIPS). Schema: docs/TOEIC-LR.md.
 *   node scripts/check-toeic-lr.js   -> prints counts, exits 1 on errors
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA = path.join(__dirname, '..', 'js', 'data');
// file letter -> parts it holds, and the exact unit / question counts per part
const FILE_PARTS = { a: [1, 2], b: [3], c: [4], d: [5, 6], e: [7] };
const PART = {
  1: { units: 6, qs: 6, from: 1, opts: 4 }, 2: { units: 25, qs: 25, from: 7, opts: 3 },
  3: { units: 13, qs: 39, from: 32, opts: 4 }, 4: { units: 10, qs: 30, from: 71, opts: 4 },
  5: { units: 30, qs: 30, from: 101, opts: 4 }, 6: { units: 4, qs: 16, from: 131, opts: 4 },
  7: { units: 15, qs: 54, from: 147, opts: 4 },
};
const L_TYPES = new Set(['photo-person', 'photo-object', 'wh-question', 'yes-no', 'choice', 'suggestion-request', 'statement',
  'indirect', 'gist', 'detail', 'next-action', 'implied', 'graphic', 'inference']);
const R_TYPES = new Set(['word-form', 'verb-tense', 'pronoun', 'preposition', 'conjunction', 'vocabulary', 'relative-clause',
  'comparison', 'sentence-insert', 'main-idea', 'detail', 'inference', 'not-true', 'synonym', 'insert-sentence', 'implied', 'cross-reference']);
const UNIT_KEYS = new Set(['id', 'test', 'part', 'picture', 'script', 'accent', 'graphic', 'passages', 'questions', 'vi', 'vocab']);
const Q_KEYS = new Set(['n', 'q', 'options', 'answer', 'type', 'explain']);
const SPEAKERS = new Set(['M', 'W', 'M2', 'W2', 'N']);
const ACCENTS = new Set(['us', 'uk', 'au', 'ca']);
const SKILLS = new Set(['listening', 'reading', 'speaking', 'writing', 'overall']);
const TIP_KEYS = new Set(['id', 'skill', 'order', 'title', 'summary', 'body', 'checklist', 'videos', 'related']);
// videos: [{title, url, note?}] — url must be a YouTube video listed in scripts/videos-verified.js (AI invents IDs)
const VERIFIED = require('./videos-verified.js');
function checkVideos(errors, id, v, min) {
  if (v == null) { if (min) errors.push(`${id}: cần videos (${min}–3 video trong scripts/videos-verified.js)`); return; }
  if (!Array.isArray(v) || v.length < min || v.length > 3) { errors.push(`${id}: videos ${min}–3 mục`); return; }
  const seen = new Set();
  v.forEach((x, k) => {
    const m = x && /^https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})(&t=\d+s)?$/.exec(x.url || '');
    if (!m) { errors.push(`${id}.videos[${k}]: url dạng https://www.youtube.com/watch?v=<ID> (tuỳ chọn &t=<giây>s)`); return; }
    if (!VERIFIED[m[1]]) errors.push(`${id}.videos[${k}]: video ${m[1]} chưa kiểm chứng, chỉ dùng ID trong scripts/videos-verified.js`);
    if (seen.has(m[1])) errors.push(`${id}.videos[${k}]: video trùng`); seen.add(m[1]);
    if (!x.title || typeof x.title !== 'string' || x.title.length < 5 || /[\[\]]/.test(x.title)) errors.push(`${id}.videos[${k}]: title ≥ 5 ký tự, không có [ ]`);
    if (x.note != null && (typeof x.note !== 'string' || x.note.length > 160)) errors.push(`${id}.videos[${k}]: note ≤ 160 ký tự`);
    Object.keys(x).forEach(q => { if (!['title', 'url', 'note'].includes(q)) errors.push(`${id}.videos[${k}]: field lạ "${q}"`); });
  });
}

const VN = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/gi;

const words = s => (String(s).match(/[A-Za-z0-9'’-]+/g) || []).length;
const str = (v, min) => typeof v === 'string' && v.trim().length >= min;

function check() {
  const errors = [];
  const ctx = { window: {} };
  vm.createContext(ctx);
  const lrFiles = fs.readdirSync(DATA).filter(f => /^toeic-lr-\d+[a-e]\.js$/.test(f)).sort();
  const src = {};
  const byFile = {};
  const tipFiles = fs.readdirSync(DATA).filter(x => /^toeic-tips(-[a-z]+)?.js$/.test(x)).sort();   // toeic-tips.js (L/R/overall) + toeic-tips-sw.js (S/W)
  for (const f of lrFiles.concat(tipFiles)) {
    src[f] = fs.readFileSync(path.join(DATA, f), 'utf8');
    const before = (ctx.window.TOEIC_LR || []).length;
    try { vm.runInContext(src[f], ctx, { filename: f }); }
    catch (e) { errors.push(`${f}: lỗi cú pháp/chạy: ${e.message}`); continue; }
    byFile[f] = (ctx.window.TOEIC_LR || []).slice(before);
  }
  function markup(where, s) {
    if (typeof s !== 'string') return;
    if (s.split('\n').filter(l => l.startsWith('~~~')).length % 2) errors.push(`${where}: code fence ~~~ chưa đóng`);
    const prose = s.replace(/~~~[\s\S]*?~~~/g, '');
    if ((prose.match(/\{\{/g) || []).length !== (prose.match(/\}\}/g) || []).length) errors.push(`${where}: số {{ và }} không khớp`);
    if (/<\/?(div|span|br|b|i|p|code|pre)\b/i.test(prose)) errors.push(`${where}: có thẻ HTML thô`);
  }
  function vietnamese(where, s, min) {
    if (typeof s !== 'string' || s.length < min) return;
    if ((s.match(VN) || []).length / s.length < 0.02) errors.push(`${where}: phải viết tiếng Việt CÓ DẤU`);
  }

  const ids = new Set();
  let units = 0, questions = 0;
  const tests = new Set();
  for (const [f, list] of Object.entries(byFile)) {
    if (/^toeic-tips/.test(f)) { if (list.length) errors.push(`${f}: không push TOEIC_LR`); continue; }
    if (!list.length) continue;                       // placeholder
    const T = parseInt(f.match(/toeic-lr-(\d+)/)[1], 10);
    const parts = FILE_PARTS[f.match(/([a-e])\.js$/)[1]];
    tests.add(T);
    for (const p of parts) {
      const us = list.filter(u => u && u.part === p);
      const spec = PART[p];
      if (us.length !== spec.units) errors.push(`${f}: part ${p} cần đúng ${spec.units} unit (đang ${us.length})`);
      const qs = us.flatMap(u => Array.isArray(u.questions) ? u.questions : []);
      if (qs.length !== spec.qs) errors.push(`${f}: part ${p} cần đúng ${spec.qs} câu (đang ${qs.length})`);
      qs.forEach((q, i) => { if (q && q.n !== spec.from + i) errors.push(`${f}: part ${p} câu thứ ${i + 1} phải có n = ${spec.from + i} (đang ${q.n})`); });
      if (qs.length >= 10) {
        const cnt = {};
        qs.forEach(q => { cnt[q.answer] = (cnt[q.answer] || 0) + 1; });
        // 35%, but never below ceil(n/options)+1: Part 2 has 25 questions × 3 options, so one letter always has ≥ 9 (36%)
        const cap = Math.max(Math.floor(qs.length * 0.35), Math.ceil(qs.length / spec.opts) + 1);
        for (const [a, c] of Object.entries(cnt)) if (c > cap) errors.push(`${f}: part ${p} đáp án ${'ABCD'[a]} chiếm ${c}/${qs.length} câu (tối đa ${cap})`);
      }
      const types = qs.map(q => q && q.type);
      const count = t => types.filter(x => x === t).length;
      if (us.length === spec.units) {
        if (p === 3) {
          if (us.filter(u => Array.isArray(u.script) && new Set(u.script.map(l => l.sp)).size >= 3).length < 2) errors.push(`${f}: part 3 cần ≥ 2 hội thoại 3 người`);
          if (us.filter(u => str(u.graphic, 20)).length < 3) errors.push(`${f}: part 3 cần ≥ 3 bài có graphic`);
        }
        if (p === 4 && us.filter(u => str(u.graphic, 20)).length < 2) errors.push(`${f}: part 4 cần ≥ 2 bài có graphic`);
        if ((p === 3 || p === 4) && count('implied') < 2) errors.push(`${f}: part ${p} cần ≥ 2 câu type implied`);
        if (p === 7) {
          const np = n => us.filter(u => Array.isArray(u.passages) && u.passages.length === n);
          if (np(1).length !== 10) errors.push(`${f}: part 7 cần 10 unit 1 đoạn (đang ${np(1).length})`);
          if (np(2).length !== 2) errors.push(`${f}: part 7 cần 2 unit 2 đoạn`);
          if (np(3).length !== 3) errors.push(`${f}: part 7 cần 3 unit 3 đoạn`);
          np(2).concat(np(3)).forEach(u => { if ((u.questions || []).length !== 5) errors.push(`${u.id}: unit nhiều đoạn cần 5 câu`); });
          np(1).forEach(u => { const k = (u.questions || []).length; if (k < 2 || k > 4) errors.push(`${u.id}: unit 1 đoạn cần 2–4 câu`); });
          if (count('insert-sentence') < 2) errors.push(`${f}: part 7 cần ≥ 2 câu insert-sentence`);
          if (us.filter(u => (u.passages || []).some(x => /text message|online chat/.test(x.kind))).length < 2) errors.push(`${f}: part 7 cần ≥ 2 đoạn text message chain / online chat`);
          if (count('cross-reference') < 4) errors.push(`${f}: part 7 cần ≥ 4 câu cross-reference (đoạn kép/ba)`);
        }
        if (p === 6) us.forEach(u => { if (!(u.questions || []).some(q => q.type === 'sentence-insert')) errors.push(`${u.id}: mỗi đoạn part 6 cần 1 câu sentence-insert`); });
      }
    }
    list.forEach((u, i) => {
      const id = u && u.id || `${f}[${i}]`;
      if (!u || typeof u !== 'object') { errors.push(`${id}: không phải object`); return; }
      units++;
      if (!parts.includes(u.part)) errors.push(`${id}: part ${u.part} không thuộc file ${f}`);
      if (u.test !== T) errors.push(`${id}: test phải là ${T}`);
      if (!new RegExp(`^lr${T}-p${u.part}-\\d{2}$`).test(u.id || '')) errors.push(`${id}: id phải dạng lr${T}-p${u.part}-NN`);
      if (ids.has(u.id)) errors.push(`${id}: id trùng`); ids.add(u.id);
      Object.keys(u).forEach(k => { if (!UNIT_KEYS.has(k)) errors.push(`${id}: field lạ "${k}"`); });
      const L = u.part <= 4;
      if (L) {
        if (!ACCENTS.has(u.accent)) errors.push(`${id}: accent phải là us|uk|au|ca`);
        if (u.passages != null) errors.push(`${id}: listening không có passages`);
        if (u.part === 1) {
          if (!str(u.picture, 60) || words(u.picture) < 25 || words(u.picture) > 70) errors.push(`${id}: picture 25–70 từ tiếng Anh`);
          if (u.script != null) errors.push(`${id}: part 1 không có script`);
        } else {
          if (!Array.isArray(u.script) || !u.script.length) errors.push(`${id}: thiếu script`);
          else {
            u.script.forEach((l, k) => {
              if (!l || !SPEAKERS.has(l.sp) || !str(l.text, 2)) errors.push(`${id}.script[${k}]: cần {sp: M|W|M2|W2|N, text}`);
            });
            const w = words(u.script.map(l => l && l.text).join(' '));
            if (u.part === 2 && u.script.length !== 1) errors.push(`${id}: part 2 script chỉ có 1 câu hỏi`);
            if (u.part === 3 && (w < 70 || w > 170)) errors.push(`${id}: hội thoại part 3 cần 70–170 từ (đang ${w})`);
            if (u.part === 4 && (w < 80 || w > 190)) errors.push(`${id}: bài nói part 4 cần 80–190 từ (đang ${w})`);
            if (u.part === 4 && u.script.some(l => l && l.sp !== 'N')) errors.push(`${id}: part 4 chỉ có sp N`);
            if (u.part === 3 && u.script.some(l => l && l.sp === 'N')) errors.push(`${id}: part 3 không có sp N`);
          }
        }
      } else {
        if (u.script != null || u.picture != null || u.accent != null) errors.push(`${id}: reading không có script/picture/accent`);
        if (u.part === 5 && u.passages != null) errors.push(`${id}: part 5 không có passages`);
        if (u.part >= 6) {
          if (!Array.isArray(u.passages) || !u.passages.length) errors.push(`${id}: thiếu passages`);
          else u.passages.forEach((x, k) => {
            if (!x || !str(x.kind, 3) || !str(x.text, 150)) errors.push(`${id}.passages[${k}]: cần {kind, title?, text ≥ 150 ký tự}`);
            if (x && /\$\{|`/.test(x.text || '')) errors.push(`${id}.passages[${k}]: có backtick hoặc \${`);
          });
          if (u.part === 6 && Array.isArray(u.passages)) {
            const t = u.passages.map(x => x && x.text).join('\n');
            (u.questions || []).forEach(q => { if (q && !t.includes(`(${q.n})`)) errors.push(`${id}: đoạn văn thiếu chỗ trống -------(${q.n})`); });
          }
        }
      }
      if (u.graphic != null && (!(u.part === 3 || u.part === 4 || u.part === 7) || !str(u.graphic, 20))) errors.push(`${id}: graphic chỉ cho part 3/4 và ≥ 20 ký tự`);
      markup(`${id}.graphic`, u.graphic);
      if (u.vi != null) { if (!str(u.vi, 20)) errors.push(`${id}: vi quá ngắn`); vietnamese(`${id}.vi`, u.vi, 80); }
      if (u.vocab != null && (!Array.isArray(u.vocab) || u.vocab.length < 3 || u.vocab.length > 10 || u.vocab.some(v => !/ [–-] /.test(v || '')))) errors.push(`${id}: vocab 3–10 mục dạng "word – nghĩa"`);
      (Array.isArray(u.questions) ? u.questions : []).forEach((q, k) => {
        const qid = `${id} câu ${q && q.n || k + 1}`;
        if (!q || typeof q !== 'object') { errors.push(`${qid}: không phải object`); return; }
        Object.keys(q).forEach(x => { if (!Q_KEYS.has(x)) errors.push(`${qid}: field lạ "${x}"`); });
        const need = PART[u.part] ? PART[u.part].opts : 4;
        if (!Array.isArray(q.options) || q.options.length !== need || q.options.some(o => !str(o, 1))) errors.push(`${qid}: cần đúng ${need} options`);
        else {
          if (new Set(q.options.map(o => o.trim().toLowerCase())).size !== need) errors.push(`${qid}: options trùng`);
          if (q.options.some(o => /^\(?[A-D]\)\s/.test(o))) errors.push(`${qid}: options không ghi (A)…`);
        }
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= need) errors.push(`${qid}: answer ngoài phạm vi`);
        if (typeof q.q !== 'string') errors.push(`${qid}: thiếu q`);
        else if (u.part <= 2 && q.q !== '') errors.push(`${qid}: part 1–2 để q = ''`);
        else if (u.part >= 3 && !str(q.q, 8)) errors.push(`${qid}: thiếu câu hỏi`);
        if (!(L ? L_TYPES : R_TYPES).has(q.type)) errors.push(`${qid}: type "${q.type}" không hợp lệ cho part ${u.part}`);
        if (!str(q.explain, 40)) errors.push(`${qid}: explain ≥ 40 ký tự`);
        else { markup(`${qid}.explain`, q.explain); vietnamese(`${qid}.explain`, q.explain, 60); }
        questions++;
      });
    });
  }

  // tips
  const tips = Array.isArray(ctx.window.TOEIC_TIPS) ? ctx.window.TOEIC_TIPS : [];
  const orders = new Set();
  tips.forEach((t, i) => {
    const id = t && t.id || `TOEIC_TIPS[${i}]`;
    if (!t || typeof t !== 'object') { errors.push(`${id}: không phải object`); return; }
    if (!/^tip-[lrswo]-\d{2}$/.test(t.id || '')) errors.push(`${id}: id phải dạng tip-<l|r|s|w|o>-NN`);
    if (ids.has(t.id)) errors.push(`${id}: id trùng`); ids.add(t.id);
    if (!SKILLS.has(t.skill)) errors.push(`${id}: skill sai`);
    else if (t.id && t.id[4] !== t.skill[0]) errors.push(`${id}: chữ trong id không khớp skill`);
    const ok = `${t.skill}:${t.order}`;
    if (!Number.isInteger(t.order) || t.order < 1) errors.push(`${id}: order ≥ 1`); else if (orders.has(ok)) errors.push(`${id}: order trùng trong skill`); else orders.add(ok);
    if (!str(t.title, 5) || t.title.length > 90) errors.push(`${id}: title 5–90 ký tự`);
    if (!str(t.summary, 40) || t.summary.length > 300) errors.push(`${id}: summary 40–300 ký tự`);
    if (!str(t.body, 2500)) errors.push(`${id}: body ≥ 2500 ký tự (đang ${(t.body || '').length})`);
    else {
      if (!/^\*\*Tóm tắt:\*\*/.test(t.body.trim())) errors.push(`${id}: body mở đầu **Tóm tắt:**`);
      if (!/> Senior tip:/.test(t.body)) errors.push(`${id}: body cần > Senior tip:`);
    }
    markup(`${id}.body`, t.body); vietnamese(`${id}.body`, t.body, 300);
    if (!Array.isArray(t.checklist) || t.checklist.length < 3 || t.checklist.length > 8 || t.checklist.some(c => !str(c, 10))) errors.push(`${id}: checklist 3–8 mục`);
    checkVideos(errors, id, t.videos, 1);
    Object.keys(t).forEach(k => { if (!TIP_KEYS.has(k)) errors.push(`${id}: field lạ "${k}"`); });
  });
  for (const t of tips) for (const r of (t && Array.isArray(t.related) ? t.related : [])) {
    if (!ids.has(r) && !/^toeic-(s|w)\d-\d{3}$/.test(r)) errors.push(`${t.id}: related "${r}" không tồn tại`);
  }
  for (const [f, s] of Object.entries(src)) if (/\$\{/.test(s)) errors.push(`${f}: có \${ trong template literal`);
  return { errors, tests: tests.size, units, questions, tips: tips.length };
}

module.exports = check;
if (require.main === module) {
  const r = check();
  console.log(`TOEIC L&R: ${r.tests} đề (có dữ liệu), ${r.units} unit, ${r.questions} câu; tips: ${r.tips} bài.`);
  if (r.errors.length) { console.log('LỖI:\n  ' + r.errors.join('\n  ')); process.exit(1); }
  console.log('OK — dữ liệu TOEIC L&R hợp lệ.');
}
