#!/usr/bin/env node
/*
 * Validate a hand-written daily digest and publish it to Supabase (table public.news_digest).
 *   node scripts/publish-digest.js logs/digest-2026-10-29.json --dry      # validate only
 *   node scripts/publish-digest.js logs/digest-2026-10-29.json            # validate + upsert (same date = replace)
 *   options: --min=N (default 5) --max=N (default 10) to relax the item count (e.g. a tiny --dry sample)
 * Credentials: SUPABASE_URL + SUPABASE_SECRET_KEY from the environment or a gitignored .env.local in the repo root.
 * The key is never printed. Workflow + editorial rules: docs/NEWS-DIGEST.md.
 *
 * Job digest (docs/JOBS-DIGEST.md): a file under jobs/ (or --kind=jobs) goes to table public.job_digest with job items:
 *   { title, company, url (https, the original posting), source, location, level: junior|mid|senior|lead, salary?, posted?: 'YYYY-MM-DD',
 *     skills: ['Java', …], summary, prep, topics?: ['spring', …] (topic ids), tags? }
 * File schema:
 *   { date: 'YYYY-MM-DD', intro: 'markup', editor?: 'name',
 *     items: [{ title_vi, title, url (https), source, category, summary, why, interview_q,
 *               related?: ['question-id', …], tags?: ['…'] }] }
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
const dry = args.includes('--dry');
const opt = (name, def) => { const a = args.find(x => x.startsWith('--' + name + '=')); return a ? Number(a.split('=')[1]) : def; };
const KIND = args.includes('--kind=jobs') || /(^|[\\/])jobs[\\/][^\\/]+\.json$/.test(file || '') ? 'jobs' : 'news';
const TABLE = KIND === 'jobs' ? 'job_digest' : 'news_digest';
const MIN = opt('min', KIND === 'jobs' ? 3 : 5), MAX = opt('max', KIND === 'jobs' ? 12 : 10);

if (!file) {
  console.error('Cách dùng: node scripts/publish-digest.js <file.json> [--dry] [--min=N] [--max=N]');
  process.exit(2);
}

const CATEGORIES = require(path.join(ROOT, 'api', '_feeds.js')).CATEGORIES;
const LIMITS = { intro: 800, title_vi: 160, title: 300, source: 80, summary: 600, why: 500, interview_q: 300, tag: 30 };
const TOP_KEYS = new Set(['date', 'intro', 'items', 'editor']);
const JOB_KEYS = new Set(['title', 'company', 'url', 'source', 'location', 'level', 'salary', 'posted', 'skills', 'summary', 'prep', 'topics', 'tags']);
const JOB_LEVELS = ['junior', 'mid', 'senior', 'lead'];
const ITEM_KEYS = new Set(['title_vi', 'title', 'url', 'source', 'category', 'summary', 'why', 'interview_q', 'related', 'tags']);
const VI = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i;
const HTML = /<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>|<!--|&lt;|&#\d+;/i;

const errors = [];
const err = (where, msg) => errors.push(where + ': ' + msg);

/** Question ids of the bank, loaded like scripts/validate.js does (vm sandbox over the manifest's files). */
function questionIds() {
  const M = require(path.join(ROOT, 'js', 'core', 'data-manifest.js'));
  const sandbox = { window: {}, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const f of M.groups.questions) {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data', f), 'utf8'), sandbox, { filename: f }); }
    catch (e) { err('bank', 'không nạp được js/data/' + f + ': ' + e.message); }
  }
  return new Set((sandbox.window.QUESTIONS || []).map(q => q.id));
}

/** Topic ids from js/data/topics.js (window.TOPICS). */
function topicIds() {
  const sandbox = { window: {}, console }; sandbox.globalThis = sandbox; vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'data', 'topics.js'), 'utf8'), sandbox, { filename: 'topics.js' });
  return new Set((sandbox.window.TOPICS || []).map(t => t.id));
}

function validateJob(it, w, topics) {
  for (const k of Object.keys(it)) if (!JOB_KEYS.has(k)) err(w, `field lạ "${k}"`);
  text(w + '.title', it.title, 160);
  text(w + '.company', it.company, 120);
  text(w + '.source', it.source, 80);
  text(w + '.location', it.location, 120);
  if (!JOB_LEVELS.includes(it.level)) err(w + '.level', 'phải là một trong: ' + JOB_LEVELS.join(', '));
  if (it.salary != null) text(w + '.salary', it.salary, 80);
  if (it.posted != null && !(/^\d{4}-\d{2}-\d{2}$/.test(it.posted) && !isNaN(Date.parse(it.posted)))) err(w + '.posted', 'phải là YYYY-MM-DD');
  text(w + '.summary', it.summary, 600, { vi: true });
  if (typeof it.summary === 'string' && it.summary.trim().length < 80) err(w + '.summary', 'quá ngắn (< 80 ký tự)');
  text(w + '.prep', it.prep, 500, { vi: true });
  if (!Array.isArray(it.skills) || !it.skills.length || it.skills.length > 12) err(w + '.skills', 'phải là mảng 1–12 kỹ năng');
  else it.skills.forEach(x => { if (typeof x !== 'string' || !x.trim() || x.length > 40 || HTML.test(x)) err(w + '.skills', `kỹ năng không hợp lệ: ${JSON.stringify(x)}`); });
  if (it.topics != null) {
    if (!Array.isArray(it.topics) || it.topics.length > 6) err(w + '.topics', 'phải là mảng ≤ 6 topic id');
    else it.topics.forEach(t => { if (!topics.has(t)) err(w + '.topics', `topic "${t}" không có trong js/data/topics.js`); });
  }
  if (it.tags != null && (!Array.isArray(it.tags) || it.tags.length > 6 || it.tags.some(t => typeof t !== 'string' || !t.trim() || t.length > LIMITS.tag))) err(w + '.tags', 'phải là mảng ≤ 6 tag ngắn');
}

function text(where, v, max, { vi = false, required = true } = {}) {
  if (v == null || v === '') { if (required) err(where, 'bắt buộc'); return; }
  if (typeof v !== 'string') { err(where, 'phải là chuỗi'); return; }
  const s = v.trim();
  if (!s) { if (required) err(where, 'không được rỗng'); return; }
  if (s.length > max) err(where, `dài ${s.length} ký tự, tối đa ${max}`);
  if (HTML.test(s.replace(/\{\{[\s\S]*?\}\}/g, ''))) err(where, 'không được chứa HTML (dùng markup: **đậm**, {{code}}, - list)');
  if (s.includes('`')) err(where, 'không dùng backtick, inline code viết {{code}}');
  if (vi && !VI.test(s)) err(where, 'phải viết bằng tiếng Việt (không thấy dấu tiếng Việt)');
}

function validate(d, bank, topics) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) { err('file', 'phải là một object JSON'); return; }
  for (const k of Object.keys(d)) if (!TOP_KEYS.has(k)) err('file', `field lạ "${k}" (chỉ có: ${[...TOP_KEYS].join(', ')})`);

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.date || '');
  const dt = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (!m || !dt || dt.getUTCDate() !== +m[3] || dt.getUTCMonth() !== +m[2] - 1) err('date', 'phải là ngày hợp lệ dạng YYYY-MM-DD');
  else if (dt.getTime() > Date.now() + 2 * 86400000) err('date', 'không được ở tương lai');
  text('intro', d.intro, LIMITS.intro, { vi: true });
  if (d.editor != null) text('editor', d.editor, 60);

  if (!Array.isArray(d.items)) { err('items', 'phải là mảng'); return; }
  if (d.items.length < MIN || d.items.length > MAX) err('items', `cần ${MIN}–${MAX} tin, đang có ${d.items.length}`);
  const urls = new Set();
  d.items.forEach((it, i) => {
    const w = `items[${i}]`;
    if (!it || typeof it !== 'object' || Array.isArray(it)) { err(w, 'phải là object'); return; }
    if (KIND === 'jobs') {
      validateJob(it, w, topics);
      let u = null;
      try { u = new URL(it.url); } catch (e) { /* invalid */ }
      if (!u || u.protocol !== 'https:' || !u.hostname.includes('.')) err(w + '.url', 'phải là URL https hợp lệ');
      else if (urls.has(u.href)) err(w + '.url', 'trùng với tin khác');
      else urls.add(u.href);
      return;
    }
    for (const k of Object.keys(it)) if (!ITEM_KEYS.has(k)) err(w, `field lạ "${k}"`);
    text(w + '.title_vi', it.title_vi, LIMITS.title_vi, { vi: true });
    text(w + '.title', it.title, LIMITS.title);
    text(w + '.source', it.source, LIMITS.source);
    text(w + '.summary', it.summary, LIMITS.summary, { vi: true });
    text(w + '.why', it.why, LIMITS.why, { vi: true });
    text(w + '.interview_q', it.interview_q, LIMITS.interview_q);
    if (typeof it.summary === 'string' && it.summary.trim().length < 120) err(w + '.summary', 'quá ngắn (< 120 ký tự), hãy tóm tắt ý chính');
    if (!CATEGORIES.includes(it.category)) err(w + '.category', `phải là một trong: ${CATEGORIES.join(', ')}`);

    let u = null;
    try { u = new URL(it.url); } catch (e) { /* invalid */ }
    if (!u || u.protocol !== 'https:' || !u.hostname.includes('.')) err(w + '.url', 'phải là URL https hợp lệ');
    else if (urls.has(u.href)) err(w + '.url', 'trùng với tin khác');
    else urls.add(u.href);

    if (it.related != null) {
      if (!Array.isArray(it.related) || it.related.length > 4) err(w + '.related', 'phải là mảng ≤ 4 id câu hỏi');
      else it.related.forEach(id => {
        if (typeof id !== 'string' || !bank.has(id)) err(w + '.related', `câu hỏi "${id}" không tồn tại trong ngân hàng`);
      });
    }
    if (it.tags != null) {
      if (!Array.isArray(it.tags) || it.tags.length > 6) err(w + '.tags', 'phải là mảng ≤ 6 tag');
      else it.tags.forEach(t => { if (typeof t !== 'string' || !t.trim() || t.length > LIMITS.tag || HTML.test(t)) err(w + '.tags', `tag không hợp lệ: ${JSON.stringify(t)}`); });
    }
  });
}

/** SUPABASE_URL / SUPABASE_SECRET_KEY from env, else from .env.local (KEY=value lines; quotes stripped). */
function loadEnv() {
  const env = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY };
  const p = path.join(ROOT, '.env.local');
  if ((!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) && fs.existsSync(p)) {
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m || line.trim().startsWith('#')) continue;
      const v = m[2].replace(/^(['"])(.*)\1$/, '$2');
      if (m[1] === 'SUPABASE_URL' && !env.SUPABASE_URL) env.SUPABASE_URL = v;
      if ((m[1] === 'SUPABASE_SECRET_KEY' || m[1] === 'SUPABASE_SERVICE_ROLE_KEY') && !env.SUPABASE_SECRET_KEY) env.SUPABASE_SECRET_KEY = v;
    }
  }
  return env;
}

async function publish(d) {
  const env = loadEnv();
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    console.error('Thiếu SUPABASE_URL / SUPABASE_SECRET_KEY (đặt trong biến môi trường hoặc file .env.local ở thư mục gốc).');
    process.exit(1);
  }
  const key = env.SUPABASE_SECRET_KEY;
  const headers = { apikey: key, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' };
  if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;   // legacy JWT service_role key
  const row = {
    date: d.date,
    intro: d.intro.trim(),
    items: d.items,
    editor: (d.editor || 'claude').trim(),
    published_at: new Date().toISOString(),
  };
  const r = await fetch(env.SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/' + TABLE + '?on_conflict=date', {
    method: 'POST', headers, body: JSON.stringify(row), signal: AbortSignal.timeout(15000),
  });
  const body = await r.text();
  if (!r.ok) {
    console.error(`Supabase trả về ${r.status}: ${body.slice(0, 400).split(key).join('***')}`);
    if (/PGRST205|42P01/.test(body)) console.error(`→ Chưa có bảng ${TABLE}: chạy SQL trong docs/${KIND === 'jobs' ? 'JOBS' : 'NEWS'}-DIGEST.md.`);
    process.exit(1);
  }
  console.log(`Đã đăng ${KIND === 'jobs' ? 'bản tin việc làm' : 'bản tin'} ${d.date} (${d.items.length} mục). Trang #/${KIND} sẽ thấy sau tối đa ~10 phút (cache CDN).`);
}

(async () => {
  let d;
  try { d = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8')); }
  catch (e) { console.error('Không đọc được JSON: ' + e.message); process.exit(1); }
  const bank = questionIds();
  validate(d, bank, KIND === 'jobs' ? topicIds() : null);
  if (errors.length) {
    console.error(`✘ ${errors.length} lỗi trong ${file}:`);
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }
  console.log(`✔ ${file}: hợp lệ — ${d.date}, ${d.items.length} tin` + (dry ? ' (--dry, không đăng)' : ''));
  if (!dry) await publish(d);
})().catch(e => { console.error(e && e.message || e); process.exit(1); });
