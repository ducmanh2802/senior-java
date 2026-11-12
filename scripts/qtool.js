#!/usr/bin/env node
// qtool — safe, atomic helpers for reading and editing js/data/*.js (integrator + Claude subagents, 2026-11-11).
// Every write takes a per-file lock (logs/lock/<file>.lock), is verified by evaluating the new source and comparing
// it object-by-object with the old one (only the requested ids/fields may change), and replaces the file atomically,
// so several agents can work on the same data file at the same time without ever leaving it broken.
//
//   node scripts/qtool.js list   <file>                       ids, size, flags (R=Ví dụ đời thực S=Trả lời mẫu T=Senior tip)
//   node scripts/qtool.js show   <file> <id>... [--only a,follow] [--skip exercises]
//   node scripts/qtool.js added  <file> <rev> [<id>... | @idfile]   lines added (+) / removed (-) since <rev>, per id
//   node scripts/qtool.js apply  <patch.qt>                   insert sections / exact-text fixes (format below)
//   node scripts/qtool.js append <file> <part.js>             append new object literals to the file's main array
//   node scripts/qtool.js check  <file> [<id>...]             syntax + validate.js errors/warnings of this file only
//
// Patch format (plain text, NO escaping needed; a line starting with "@@ " is a directive, everything else is content):
//   @@ file js/data/q-devops.js
//   @@ id devops-055                       insert the following text into field `a`, right before the LAST line that
//   ### Ví dụ đời thực                     starts with "> Senior tip:" (appended at the end when there is no such line)
//   ...
//   @@ follow                              (optional, only when the object has no follow yet) one question per line
//   Câu hỏi đào sâu 1?
//   @@ id lesson-x-001 field=body before="### Liên hệ phỏng vấn"     other field / other anchor line / mode=append
//   ...
//   @@ fix devops-012                      exact replacement inside that object (omit the id to search the whole file)
//   @@ old                                 optional: count=2 (expected number of occurrences, default 1), raw
//   text exactly as printed by `show`
//   @@ new
//   corrected text
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
process.chdir(path.join(__dirname, '..'));

class QError extends Error {}
const die = (m) => { throw new QError(m); };
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const readSrc = (file) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
function evalSrc(src, label) {
  const w = {}, ctx = { window: w };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: label || 'data.js' });
  return w;
}
function collect(w) {
  const out = [];
  for (const k of Object.keys(w)) {
    if (!Array.isArray(w[k])) continue;
    w[k].forEach((o) => { if (o && typeof o === 'object' && typeof o.id === 'string') out.push({ id: o.id, obj: o, key: k }); });
  }
  return out;
}
function flatten(o, pre, out) {
  out = out || {};
  if (typeof o === 'string') out[pre] = o;
  else if (Array.isArray(o)) o.forEach((v, i) => flatten(v, pre + '[' + i + ']', out));
  else if (o && typeof o === 'object') for (const k of Object.keys(o)) flatten(o[k], pre ? pre + '.' + k : k, out);
  else out[pre] = String(o);
  return out;
}
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
function withLock(file, fn) {
  const dir = path.join('logs', 'lock');
  fs.mkdirSync(dir, { recursive: true });
  const lock = path.join(dir, path.basename(file) + '.lock'), t0 = Date.now();
  for (;;) {
    try { fs.mkdirSync(lock); break; } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 120000) { fs.rmdirSync(lock); continue; } } catch (_) { continue; }
      if (Date.now() - t0 > 180000) die('could not get lock ' + lock);
      sleep(200);
    }
  }
  try { return fn(); } finally { try { fs.rmdirSync(lock); } catch (_) { /* ignore */ } }
}
function atomicWrite(file, src) {
  const tmp = path.join(path.dirname(file), '.qtool-' + process.pid + '-' + path.basename(file));
  fs.writeFileSync(tmp, src);
  for (let i = 0; ; i++) {
    try { fs.renameSync(tmp, file); return; } catch (e) {
      if (i >= 20) { fs.writeFileSync(file, src); try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ } return; }
      sleep(150);
    }
  }
}

// ---------------------------------------------------------------- locating things in the source text
function objectSpan(src, id) {
  const re = new RegExp('(^|\\n)([ \\t]*)id:\\s*[\'"]' + escRe(id) + '[\'"]', 'g');
  const m = re.exec(src);
  if (!m) die('id not found in source (need "id: \'' + id + '\'" at the start of a line): ' + id);
  if (re.exec(src)) die('id appears more than once in source: ' + id);
  const start = m.index + m[1].length, indent = m[2];
  const next = new RegExp('\\n' + indent + 'id:\\s*[\'"]', 'g');
  next.lastIndex = start + 1;
  const n = next.exec(src);
  return { start, end: n ? n.index : src.length, indent };
}
function templateField(src, span, field) {
  const re = new RegExp('\\n[ \\t]*' + escRe(field) + ':\\s*`', 'g');
  re.lastIndex = span.start;
  const m = re.exec(src);
  if (!m || m.index >= span.end) die('field `' + field + '` (template literal) not found in that object');
  const open = m.index + m[0].length - 1;
  let i = open + 1;
  for (; i < src.length; i++) { const c = src[i]; if (c === '\\') { i++; continue; } if (c === '`') break; }
  if (i >= src.length) die('unterminated template literal: ' + field);
  return { open, close: i };
}
const toRaw = (s) => s.replace(/\\/g, '\\\\');
function checkMarkup(text, what) {
  if (text.includes('`')) die(what + ': contains a backtick (not allowed inside answers; use {{code}} or ~~~ blocks)');
  if (text.includes('${')) die(what + ': contains "${" (not allowed; write the placeholder differently)');
  const re = /\{\{([\s\S]*?)\}\}/g; let m;
  while ((m = re.exec(text))) if (/[{}]/.test(m[1])) die(what + ': inline code {{…}} must not contain { or } → "' + m[0].slice(0, 60) + '"');
  if (((text.match(/^~~~/gm) || []).length) % 2) die(what + ': unbalanced ~~~ code fences');
}
const sq = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s*\n\s*/g, ' ') + "'";

// ---------------------------------------------------------------- patch parsing
function parsePatch(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const ops = []; let file = null, cur = null, buf = null;
  const flush = () => { if (cur && buf) cur[buf.key] = buf.lines.join('\n').replace(/^\n+|\n+$/g, ''); buf = null; };
  const kv = (rest) => {
    const o = { _: [] }; const re = /(\w+)=("([^"]*)"|\S+)|(\S+)/g; let m;
    while ((m = re.exec(rest))) { if (m[1]) o[m[1]] = m[3] !== undefined ? m[3] : m[2]; else o._.push(m[4]); }
    return o;
  };
  for (const line of lines) {
    if (!line.startsWith('@@ ') && line !== '@@') { if (buf) buf.lines.push(line); else if (line.trim() && !file) die('patch must start with "@@ file <path>"'); continue; }
    const [, word, rest] = /^@@\s*(\S*)\s*(.*)$/.exec(line);
    if (word === 'file') { flush(); file = rest.trim(); cur = null; continue; }
    if (word === 'id') {
      flush(); const a = kv(rest);
      if (!a._[0]) die('"@@ id" needs an id');
      cur = { op: 'insert', id: a._[0], field: a.field || 'a', before: a.before || '> Senior tip:', mode: a.mode || 'before' };
      ops.push(cur); buf = { key: 'text', lines: [] }; continue;
    }
    if (word === 'follow') { flush(); if (!cur || cur.op !== 'insert') die('"@@ follow" must come inside an "@@ id" block'); buf = { key: 'followText', lines: [] }; continue; }
    if (word === 'fix') {
      flush(); const a = kv(rest);
      cur = { op: 'fix', id: a._.find((x) => x !== 'raw') || null, count: a.count ? +a.count : 1, raw: a._.includes('raw') };
      ops.push(cur); continue;
    }
    if (word === 'old' || word === 'new') { flush(); if (!cur || cur.op !== 'fix') die('"@@ ' + word + '" must come after "@@ fix"'); buf = { key: word, lines: [] }; continue; }
    die('unknown directive: ' + line);
  }
  flush();
  if (!file) die('patch has no "@@ file <path>" line');
  if (!ops.length) die('patch has no operations');
  for (const o of ops) {
    if (o.op === 'insert') {
      if (!o.text && !o.followText) die(o.id + ': empty insertion');
      if (o.followText) o.follow = o.followText.split('\n').map((s) => s.trim().replace(/^[-*]\s+/, '')).filter(Boolean);
    } else if (o.old === undefined || o.new === undefined || !o.old) die('fix' + (o.id ? ' ' + o.id : '') + ': needs non-empty "@@ old" and an "@@ new" block');
  }
  return { file, ops };
}

function prefixHint(scope, old) {
  let lo = 0, hi = old.length;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (scope.includes(old.slice(0, mid))) lo = mid; else hi = mid - 1; }
  if (!lo) return 'the first characters of "@@ old" do not occur at all';
  const at = scope.indexOf(old.slice(0, lo));
  return 'first ' + lo + ' chars match; then patch has ' + JSON.stringify(old.slice(lo, lo + 50)) + ' but file has ' + JSON.stringify(scope.slice(at + lo, at + lo + 50));
}

function cmdApply(patchFile) {
  const { file, ops } = parsePatch(fs.readFileSync(patchFile, 'utf8'));
  if (!fs.existsSync(file)) die('no such file: ' + file);
  return withLock(file, () => {
    const oldSrc = readSrc(file);
    const oldAll = collect(evalSrc(oldSrc, file)), oldMap = new Map(oldAll.map((x) => [x.id, x.obj]));
    let src = oldSrc;
    const expect = new Map();   // id -> { fields: {name: expectedValue}, follow }
    const fixIds = new Set(); let globalFix = false;
    const exp = (id) => { if (!expect.has(id)) expect.set(id, { fields: {} }); return expect.get(id); };
    for (const o of ops) {
      if (o.op === 'insert') {
        const obj = oldMap.get(o.id); if (!obj) die('unknown id: ' + o.id);
        if (o.text) {
          checkMarkup(o.text, o.id);
          const cur = exp(o.id).fields[o.field] !== undefined ? exp(o.id).fields[o.field] : obj[o.field];
          if (typeof cur !== 'string') die(o.id + ': field ' + o.field + ' is not a string');
          for (const h of o.text.match(/^### .+$/gm) || []) if (cur.includes('\n' + h + '\n') || cur.startsWith(h + '\n')) die(o.id + ': section already exists in the answer: ' + h);
          if (/^> Senior tip:/m.test(o.text) && /^> Senior tip:/m.test(cur)) die(o.id + ': the answer already has a "> Senior tip:" line; do not add another');
          const span = objectSpan(src, o.id), f = templateField(src, span, o.field);
          const raw = src.slice(f.open + 1, f.close);
          const p = o.mode === 'append' ? -1 : raw.lastIndexOf('\n' + o.before), cp2 = o.mode === 'append' ? -1 : cur.lastIndexOf('\n' + o.before);
          if ((p < 0) !== (cp2 < 0)) die(o.id + ': anchor mismatch between source and value (escapes?)');
          let nraw, ncur;
          if (p < 0) {
            if (o.mode !== 'append' && o.before !== '> Senior tip:') die(o.id + ': anchor line not found: ' + o.before);
            const sep = raw.endsWith('\n') ? '' : '\n';
            nraw = raw + sep + toRaw(o.text); ncur = cur + sep + o.text;
          } else {
            nraw = raw.slice(0, p + 1) + toRaw(o.text) + '\n' + raw.slice(p + 1);
            ncur = cur.slice(0, cp2 + 1) + o.text + '\n' + cur.slice(cp2 + 1);
          }
          src = src.slice(0, f.open + 1) + nraw + src.slice(f.close);
          exp(o.id).fields[o.field] = ncur;
        }
        if (o.follow) {
          if (Array.isArray(obj.follow) && obj.follow.length) die(o.id + ': already has follow questions (' + obj.follow.length + ')');
          if (o.follow.length < 2 || o.follow.length > 3) die(o.id + ': follow needs 2–3 questions (one per line), got ' + o.follow.length);
          o.follow.forEach((q) => { if (q.includes('`')) die(o.id + ': follow contains a backtick'); });
          const span = objectSpan(src, o.id);
          if (/\n[ \t]*follow:/.test(src.slice(span.start, span.end))) die(o.id + ': source already has a follow: field');
          const f = templateField(src, span, o.field);
          let j = f.close + 1; while (src[j] === ' ') j++;
          const lit = span.indent + 'follow: [' + o.follow.map(sq).join(', ') + ']';
          src = src[j] === ',' ? src.slice(0, j + 1) + '\n' + lit + ',' + src.slice(j + 1) : src.slice(0, f.close + 1) + ',\n' + lit + src.slice(f.close + 1);
          exp(o.id).follow = o.follow.map((s) => s.replace(/\s*\n\s*/g, ' '));
        }
      } else {
        const oldT = o.raw ? o.old : toRaw(o.old), newT = o.raw ? o.new : toRaw(o.new);
        if (!o.raw) { if (o.new.includes('`')) die('fix: new text contains a backtick'); if (o.new.includes('${')) die('fix: new text contains "${"'); }
        let a = 0, b = src.length;
        if (o.id) { if (!oldMap.has(o.id)) die('unknown id: ' + o.id); const s = objectSpan(src, o.id); a = s.start; b = s.end; fixIds.add(o.id); } else globalFix = true;
        const scope = src.slice(a, b), n = scope.split(oldT).length - 1;
        if (n !== o.count) die('fix' + (o.id ? ' ' + o.id : '') + ': expected ' + o.count + ' occurrence(s) of "@@ old", found ' + n + (n ? '' : ' — ' + prefixHint(scope, oldT)) + '\n  old starts: ' + JSON.stringify(o.old.slice(0, 80)));
        src = src.slice(0, a) + scope.split(oldT).join(newT) + src.slice(b);
      }
    }
    // ---- verify: evaluate and compare object by object
    let newAll;
    try { newAll = collect(evalSrc(src, file)); } catch (e) { die('result does not evaluate: ' + e.message); }
    if (newAll.length !== oldAll.length || newAll.some((x, i) => x.id !== oldAll[i].id)) die('result changes the list/order of ids — refused');
    const changed = [];
    for (const x of newAll) {
      const o = oldMap.get(x.id), e = expect.get(x.id);
      const fo = flatten(o, ''), fn = flatten(x.obj, '');
      const diff = [...new Set([...Object.keys(fo), ...Object.keys(fn)])].filter((p) => fo[p] !== fn[p]);
      if (!diff.length) { if (e && Object.keys(e.fields).length) die(x.id + ': insertion had no effect'); continue; }
      for (const p of diff) {
        const top = p.replace(/[.[].*$/, '');
        if (e && top in e.fields && p === top && !fixIds.has(x.id) && !globalFix) { if (fn[p] !== e.fields[top]) die(x.id + '.' + p + ': result differs from the expected insertion — refused'); }
        else if (e && e.follow && top === 'follow') { /* checked below */ }
        else if (!fixIds.has(x.id) && !globalFix) die(x.id + '.' + p + ' changed although the patch does not touch it — refused');
        changed.push(x.id + '.' + p + ' ' + ((fo[p] || '').length) + '→' + ((fn[p] || '').length));
      }
      if (e && e.follow && JSON.stringify(x.obj.follow) !== JSON.stringify(e.follow)) die(x.id + ': follow was not written as expected');
    }
    if (!changed.length) die('patch changed nothing');
    atomicWrite(file, src);
    console.log('applied to ' + file + ':\n  ' + changed.join('\n  '));
  });
}

function cmdAppend(file, partFile) {
  let part = fs.readFileSync(partFile, 'utf8').replace(/\r\n/g, '\n').trim();
  if (!part.startsWith('{')) die('part file must contain object literals: { … }, { … }');
  part = part.replace(/,\s*$/, '');
  let objs;
  try { objs = vm.runInNewContext('[' + part + '\n]'); } catch (e) { die('part file does not evaluate: ' + e.message); }
  if (!objs.length || objs.some((o) => !o || typeof o.id !== 'string')) die('every new object needs a string id');
  return withLock(file, () => {
    const oldSrc = readSrc(file), oldAll = collect(evalSrc(oldSrc, file));
    const have = new Set(oldAll.map((x) => x.id));
    for (const o of objs) if (have.has(o.id)) die('id already exists in ' + file + ': ' + o.id);
    if (new Set(objs.map((o) => o.id)).size !== objs.length) die('duplicate ids inside the part file');
    const m = /\n[\])]+;?[ \t]*\n*$/.exec(oldSrc);
    if (!m) die('cannot find the closing line of the main array in ' + file);
    let head = oldSrc.slice(0, m.index).replace(/\s+$/, '');
    if (!head.endsWith(',')) head += ',';
    const src = head + '\n' + part + ',' + oldSrc.slice(m.index);
    let newAll;
    try { newAll = collect(evalSrc(src, file)); } catch (e) { die('result does not evaluate: ' + e.message); }
    if (newAll.length !== oldAll.length + objs.length) die('object count mismatch after append (' + oldAll.length + ' + ' + objs.length + ' ≠ ' + newAll.length + ')');
    for (let i = 0; i < oldAll.length; i++) if (JSON.stringify(newAll[i].obj) !== JSON.stringify(oldAll[i].obj)) die('existing object changed: ' + oldAll[i].id);
    atomicWrite(file, src);
    console.log('appended ' + objs.length + ' object(s) to ' + file + ': ' + objs.map((o) => o.id).join(' '));
  });
}

function cmdShow(file, rest) {
  const opt = { only: null, skip: null }, ids = [];
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--only') opt.only = rest[++i].split(','); else if (rest[i] === '--skip') opt.skip = rest[++i].split(','); else ids.push(rest[i]);
  }
  const all = collect(evalSrc(readSrc(file), file));
  for (const id of ids) {
    const e = all.find((x) => x.id === id);
    if (!e) { console.log('!! not found: ' + id); continue; }
    console.log('==================== ' + id + ' (' + e.key + ')');
    for (const k of Object.keys(e.obj)) {
      if ((opt.only && !opt.only.includes(k)) || (opt.skip && opt.skip.includes(k))) continue;
      const v = e.obj[k];
      if (typeof v === 'string' && (v.includes('\n') || v.length > 200)) console.log('--- ' + k + ' (' + v.length + ' chars):\n' + v);
      else console.log('--- ' + k + ': ' + (typeof v === 'string' ? v : JSON.stringify(v, null, 1)));
    }
    console.log('');
  }
}
function cmdList(file) {
  for (const e of collect(evalSrc(readSrc(file), file))) {
    const o = e.obj, main = o.a || o.body || o.reference || o.sample || o.fix || '';
    const fl = (/### Ví dụ đời thực/.test(main) ? 'R' : '-') + (/### (Trả lời mẫu|Sample answer)|Trả lời miệng/.test(main) ? 'S' : '-') + (/^> Senior tip:/m.test(main) ? 'T' : '-');
    console.log([e.id, o.level || o.kind || '', main.length, fl, 'follow=' + (o.follow || []).length, String(o.q || o.title || o.name || o.term || '').replace(/\s+/g, ' ').slice(0, 80)].join('\t'));
  }
}
function cmdAdded(file, rev, rest) {
  let ids = [];
  for (const a of rest) ids = ids.concat(a.startsWith('@') ? fs.readFileSync(a.slice(1), 'utf8').split(/\s+/).filter(Boolean) : [a]);
  const cur = collect(evalSrc(readSrc(file), file));
  let base = [];
  try { base = collect(evalSrc(cp.execFileSync('git', ['show', rev + ':' + file], { encoding: 'utf8', maxBuffer: 1e9 }).replace(/\r\n/g, '\n'), 'base')); }
  catch (e) { console.log('(file does not exist in ' + rev + ': everything is new)'); }
  const bmap = new Map(base.map((x) => [x.id, x.obj]));
  for (const e of cur) {
    if (ids.length && !ids.includes(e.id)) continue;
    const b = bmap.get(e.id), fc = flatten(e.obj, ''), fb = b ? flatten(b, '') : {}, out = [];
    for (const p of Object.keys(fc)) {
      if (fc[p] === fb[p]) continue;
      const bl = new Set((fb[p] || '').split('\n')), cl = new Set(fc[p].split('\n'));
      const add = fc[p].split('\n').filter((l) => l.trim() && !bl.has(l)), rem = (fb[p] || '').split('\n').filter((l) => l.trim() && !cl.has(l));
      if (add.length || rem.length) { out.push('--- ' + p + (b ? '' : ' (NEW OBJECT)')); add.forEach((l) => out.push('+ ' + l)); rem.forEach((l) => out.push('- ' + l)); }
    }
    for (const p of Object.keys(fb)) if (!(p in fc)) out.push('--- ' + p + ' REMOVED: ' + fb[p].slice(0, 120));
    if (out.length) console.log('==================== ' + e.id + '\n' + out.join('\n') + '\n');
  }
}
function cmdCheck(file, ids) {
  const base = path.basename(file);
  try { collect(evalSrc(readSrc(file), file)); } catch (e) { console.log('check: SYNTAX/EVAL ERROR in ' + file + ': ' + e.message); process.exitCode = 1; return; }
  const r = cp.spawnSync(process.execPath, ['scripts/validate.js'], { encoding: 'utf8', maxBuffer: 1e9 });
  const lines = ((r.stdout || '') + '\n' + (r.stderr || '')).split('\n');
  let sec = '', errs = [], warns = [], other = 0;
  for (const l of lines) {
    if (/^Cảnh báo:/.test(l)) { sec = 'w'; continue; }
    if (/^LỖI:/.test(l)) { sec = 'e'; continue; }
    if (!l.trim() || !sec) continue;
    const mine = l.includes(base + ':');
    if (sec === 'e') { if (mine) errs.push(l.trim()); else if (!/index-light\.js/.test(l)) other++; }
    else if (mine && (!ids.length || ids.some((id) => l.includes(id)))) warns.push(l.trim());
  }
  if (warns.length) console.log('warnings (' + warns.length + '):\n  ' + warns.slice(0, 40).join('\n  '));
  if (errs.length) { console.log('ERRORS in ' + base + ' (' + errs.length + '):\n  ' + errs.join('\n  ')); process.exitCode = 1; }
  console.log('check: ' + (errs.length ? 'FAILED' : 'OK') + ' for ' + base + (other ? ' (' + other + ' error(s) in OTHER files — not yours, ignore)' : ''));
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'list' && args[0]) cmdList(args[0]);
  else if (cmd === 'show' && args.length >= 2) cmdShow(args[0], args.slice(1));
  else if (cmd === 'added' && args.length >= 2) cmdAdded(args[0], args[1], args.slice(2));
  else if (cmd === 'apply' && args[0]) cmdApply(args[0]);
  else if (cmd === 'append' && args.length === 2) cmdAppend(args[0], args[1]);
  else if (cmd === 'check' && args[0]) cmdCheck(args[0], args.slice(1));
  else { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 28).join('\n')); process.exitCode = 2; }
} catch (e) {
  if (e instanceof QError) { console.error('qtool: ' + e.message); process.exitCode = 1; } else throw e;
}
