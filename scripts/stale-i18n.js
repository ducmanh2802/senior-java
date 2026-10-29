#!/usr/bin/env node
/*
 * Which English translations are stale? An item is stale when some line of it in js/data/<file>.js was
 * committed after the last commit of the js/i18n/<file>-<k>.en.js chunk that translates it (a fact-check
 * or rewrite changed the Vietnamese, the overlay still shows the old English).
 *   node scripts/stale-i18n.js            -> per chunk: stale ids
 *   node scripts/stale-i18n.js --tasks    -> also write tasks/T<n>-en-redo-<chunk>.md (re-translate those ids)
 */
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const git = (cmd) => execSync('git ' + cmd, { cwd: ROOT, maxBuffer: 1 << 28 }).toString();

// item id -> newest committer-time of its lines in a data file
const itemTimes = {};
function timesFor(dataFile) {
  if (itemTimes[dataFile]) return itemTimes[dataFile];
  const out = git(`blame --line-porcelain -- "${dataFile}"`).split('\n');
  const t = {}, shaTime = {};
  let sha = null, cur = null;
  for (const l of out) {
    if (/^[0-9a-f]{40} /.test(l)) sha = l.slice(0, 40);
    else if (l.startsWith('committer-time ')) shaTime[sha] = +l.slice(15);
    else if (l.startsWith('\t')) {
      const m = l.match(/^\t\s*id:\s*'([^']+)'/);
      if (m) cur = m[1];
      if (cur) t[cur] = Math.max(t[cur] || 0, shaTime[sha] || 0);
    }
  }
  return (itemTimes[dataFile] = t);
}

const chunks = fs.readdirSync(path.join(ROOT, 'js/i18n')).filter(f => /-\d+\.en\.js$/.test(f));
const stale = [];
for (const c of chunks) {
  const file = 'js/i18n/' + c;
  const head = fs.readFileSync(path.join(ROOT, file), 'utf8').slice(0, 2000);
  const ids = ((head.match(/\* ids: (.*)/) || [])[1] || '').trim().split(/\s+/).filter(Boolean);
  const data = 'js/data/' + c.replace(/-\d+\.en\.js$/, '.js');
  if (!ids.length || !fs.existsSync(path.join(ROOT, data))) continue;
  const ct = +git(`log -1 --format=%ct -- "${file}"`).trim();
  if (!ct) continue;                       // chunk never committed: still being translated
  const t = timesFor(data);
  const ids2 = ids.filter(id => (t[id] || 0) > ct);
  if (ids2.length) stale.push({ chunk: c.replace('.en.js', ''), file, data, ids: ids2 });
}
for (const s of stale) console.log(`${s.chunk}: ${s.ids.join(' ')}`);
console.log(`${stale.reduce((n, s) => n + s.ids.length, 0)} stale item(s) in ${stale.length} chunk(s)`);

if (process.argv.includes('--tasks')) {
  let n = Math.max(...fs.readdirSync(path.join(ROOT, 'tasks')).map(f => +(f.match(/^T(\d+)/) || [0, 0])[1])) + 1;
  for (const s of stale) {
    const name = `T${n}-en-redo-${s.chunk}.md`;
    fs.writeFileSync(path.join(ROOT, 'tasks', name), [
      `# T${n} — Dịch lại (nội dung đã sửa): ${s.chunk} (${s.ids.length} mục)`, '',
      'Status: TODO', 'Agent: opencode', `Owns: \`${s.file}\``, '',
      `Nội dung tiếng Việt của các mục sau trong \`${s.data}\` đã được sửa SAU khi dịch, nên bản tiếng Anh trong \`${s.file}\` đã cũ: **${s.ids.join(', ')}**.`,
      '', `Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong \`${s.data}\` và DỊCH LẠI toàn bộ entry của nó trong \`${s.file}\` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.`,
      'Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).', '',
      '## Nghiệm thu', `node scripts/check-i18n.js ${s.chunk} → OK; node scripts/validate.js → OK.`, '', '## Notes', '',
    ].join('\n'));
    console.log('wrote tasks/' + name);
    n++;
  }
}
