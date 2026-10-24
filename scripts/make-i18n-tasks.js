#!/usr/bin/env node
/*
 * Split Vietnamese content into English-translation chunks (~CHUNK chars of text each):
 * creates js/i18n/<file>-<k>.en.js stubs + tasks/T<n>-en-<file>-<k>.md, then rewrites js/i18n/manifest.js.
 * Re-runnable: items already listed in an existing chunk header are skipped, so new content gets new chunks.
 *   node scripts/make-i18n-tasks.js [--from 160] [--dry]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'js/data'), OUT = path.join(ROOT, 'js/i18n'), TASKS = path.join(ROOT, 'tasks');
const CHUNK = +process.env.CHUNK || 40000;
const dry = process.argv.includes('--dry');
const fromArg = process.argv.indexOf('--from');

// translatable fields per collection (code, ids, urls, artifacts are never translated)
const FIELDS = {
  TOPICS: ['name', 'group'],
  QUESTIONS: ['q', 'a', 'follow'],
  QUIZ: ['q', 'options', 'explain'],
  ALGOS: ['prompt', 'hints', 'solution', 'follow'],
  LESSONS: ['title', 'goals', 'body', 'exercises[].title', 'exercises[].prompt', 'exercises[].hints', 'exercises[].explain', 'check[].q', 'check[].options', 'check[].explain'],
  LABS: ['title', 'scenario', 'questions', 'hints', 'answer', 'rubric'],
  GLOSSARY: ['short', 'body'],
  PATH: ['title', 'phase', 'goal'],
  ROADMAP: ['(every Vietnamese string, same structure)'],
};

const files = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').match(/js\/data\/[a-z0-9-]+\.js/g)
  .map(f => path.basename(f, '.js')).filter(f => !/^(drills-|glossary-|path$)/.test(f));   // drills are English; glossary/path still being written

const covered = new Set();
fs.readdirSync(OUT).filter(f => f.endsWith('.en.js')).forEach(f => {
  const m = fs.readFileSync(path.join(OUT, f), 'utf8').match(/^ \* ids: (.*)$/m);
  if (m) m[1].split(' ').forEach(id => covered.add(id));
});

let next = fromArg > 0 ? +process.argv[fromArg + 1]
  : 1 + Math.max(...fs.readdirSync(TASKS).map(f => +(f.match(/^T(\d+)-/) || [0, 0])[1]));
const made = [];

for (const file of files) {
  const box = { window: {} }; box.window.window = box.window;
  vm.createContext(box.window);
  let src;   // committed version: agents may be mid-edit in the working tree
  try { src = require('child_process').execFileSync('git', ['show', 'HEAD:js/data/' + file + '.js'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 }); } catch (e) { continue; }
  vm.runInContext(src, box.window, { filename: file });
  const coll = Object.keys(FIELDS).find(k => box.window[k] && (Array.isArray(box.window[k]) ? box.window[k].length : true));
  if (!coll) continue;
  const items = coll === 'ROADMAP' ? [{ id: '__roadmap', ...box.window.ROADMAP }] : box.window[coll];
  const todo = items.filter(it => it.id && !covered.has(it.id));
  if (!todo.length) continue;
  const chunks = [[]];
  let size = 0;
  for (const it of todo) {
    const n = JSON.stringify(it).length;
    if (size && size + n > CHUNK) { chunks.push([]); size = 0; }
    chunks[chunks.length - 1].push(it.id); size += n;
  }
  let k = 1;
  for (const ids of chunks) {
    while (fs.existsSync(path.join(OUT, `${file}-${k}.en.js`))) k++;
    const name = `${file}-${k}`, id = 'T' + next++;
    made.push(`${id} ${name} (${ids.length})`);
    if (dry) continue;
    fs.writeFileSync(path.join(OUT, name + '.en.js'),
      `/*\n * English translation of js/data/${file}.js — task ${id}. Format: js/core/i18n.js (content overlay).\n * ids: ${ids.join(' ')}\n */\nApp.i18n.content({\n});\n`);
    fs.writeFileSync(path.join(TASKS, `${id}-en-${name}.md`), `# ${id} — Dịch sang tiếng Anh: ${file} (${ids.length} mục)

Status: TODO
Agent: opencode
Owns: \`js/i18n/${name}.en.js\`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo \`id\` (đọc comment "content translation" trong \`js/core/i18n.js\`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong \`js/data/${file}.js\`: **${ids.join(', ')}**.

Viết vào \`js/i18n/${name}.en.js\`, trong \`App.i18n.content({ ... })\`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **${FIELDS[coll].join(', ')}**${coll === 'ROADMAP' ? ' — dùng key \'__roadmap\', giữ đúng cấu trúc object/mảng, chỉ thay chuỗi' : ''}. Mảng object (vd \`exercises\`, \`check\`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (\`**\`, \`{{code}}\`, \`###\`, \`- \`, \`1. \`, \`>\`, bảng \`|\`, \`~~~lang\` … \`~~~\`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết \`\${\` (nếu bản gốc có \`\\\${\` thì giữ nguyên), \`\\\` phải escape như bản gốc.
- \`node --check js/i18n/${name}.en.js\` và \`node scripts/check-i18n.js ${name}\` → OK, rồi \`Status: DONE\`.

## Notes
`);
  }
}

if (!dry) {
  const names = fs.readdirSync(OUT).filter(f => f.endsWith('.en.js')).map(f => f.slice(0, -6)).sort();
  fs.writeFileSync(path.join(OUT, 'manifest.js'),
    '/* English content files loaded by js/core/i18n.js when the UI is switched to English (generated by scripts/make-i18n-tasks.js). */\nwindow.I18N_FILES = [\n' +
    names.map(n => `  '${n}',`).join('\n') + '\n];\n');
}
console.log(made.length + ' chunk(s)\n' + made.join('\n'));
