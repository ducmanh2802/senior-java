#!/usr/bin/env node
/*
 * Check English content files (js/i18n/*.en.js): they parse, every key is a real id listed in the file header,
 * values only hold translatable fields, no backtick, and translated answers keep their code blocks.
 *   node scripts/check-i18n.js [chunk-name]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'js/i18n');
const only = process.argv[2];
const ALLOWED = new Set(['name', 'group', 'q', 'a', 'follow', 'options', 'explain', 'prompt', 'hints', 'solution',
  'title', 'goals', 'body', 'exercises', 'check', 'scenario', 'questions', 'answer', 'rubric', 'short', 'phase', 'goal']);

const errors = [];
let total = 0;
for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.en.js') && (!only || f === only + '.en.js'))) {
  const src = fs.readFileSync(path.join(OUT, f), 'utf8');
  const header = (src.match(/^ \* ids: (.*)$/m) || [])[1];
  const ids = new Set(header ? header.split(' ') : []);
  const map = {};
  try {
    vm.runInNewContext(src, { App: { i18n: { content: m => Object.assign(map, m) } } }, { filename: f });
  } catch (e) { errors.push(`${f}: không chạy được — ${e.message}`); continue; }
  for (const [id, val] of Object.entries(map)) {
    total++;
    if (header && !ids.has(id)) errors.push(`${f}: id ${id} không nằm trong danh sách ids của file`);
    if (id === '__roadmap') continue;
    for (const k of Object.keys(val)) if (!ALLOWED.has(k)) errors.push(`${f}: ${id}.${k} không phải field được dịch`);
    const text = JSON.stringify(val);
    if (text.includes('`')) errors.push(`${f}: ${id} chứa backtick`);
    if (/"(starter|tests|reference|artifacts|code)"/.test(text)) errors.push(`${f}: ${id} chép cả code/artifact — chỉ chép field dịch`);
    if (/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]{1}.*[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệ]/i.test(text.replace(/~~~[\s\S]*?~~~/g, '')))
      errors.push(`${f}: ${id} còn chữ tiếng Việt`);
  }
  if (header && only && Object.keys(map).length < ids.size) errors.push(`${f}: mới dịch ${Object.keys(map).length}/${ids.size} mục`);
}
if (errors.length) { console.log('LỖI:\n  ' + errors.join('\n  ')); process.exit(1); }
console.log(`OK — ${total} mục đã dịch.`);
