/*
 * GET /api/digest              → latest daily digest ("Bản tin hôm nay") + recent dates
 * GET /api/digest?date=YYYY-MM-DD → that day's digest (digest: null when there is none)
 * Public, read-only. Rows are written by the editor with scripts/publish-digest.js (docs/NEWS-DIGEST.md).
 * → { configured, digest: {date, intro, items, published_at} | null, dates: ['YYYY-MM-DD', …], setup? }
 */
'use strict';

const { send, guard, supabase, supabaseConfigured } = require('./_lib');

const CACHE = 'public, s-maxage=600, stale-while-revalidate=86400';

/** send() in _lib.js forces Cache-Control: no-store; public read endpoints need CDN caching instead. */
function sendCached(res, status, body, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (!(await guard(req, res, { maxPerMinute: 60, auth: false, method: 'GET' }))) return;

  const q = req.query || {};
  const date = typeof q.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q.date) && !isNaN(Date.parse(q.date)) ? q.date : null;
  if (q.date && !date) { send(res, 400, { error: 'date phải có dạng YYYY-MM-DD', code: 'bad_date' }); return; }

  if (!supabaseConfigured()) {
    sendCached(res, 200, { configured: false, digest: null, dates: [] }, CACHE);
    return;
  }

  const one = date
    ? '/rest/v1/news_digest?date=eq.' + date + '&select=date,intro,items,published_at&limit=1'
    : '/rest/v1/news_digest?select=date,intro,items,published_at&order=date.desc&limit=1';
  let r1, r2;
  try {
    [r1, r2] = await Promise.all([one, '/rest/v1/news_digest?select=date&order=date.desc&limit=60'].map(p => supabase(p)));
  } catch (e) {
    console.error('digest: ' + e.message);
    send(res, 502, { error: 'Không đọc được bản tin, thử lại sau' });
    return;
  }
  if (!r1.ok || !r2.ok) {
    const text = await (r1.ok ? r2 : r1).text();
    // table not created yet (PostgREST: PGRST205 / 42P01) → treat as "no digest yet", tell the admin what to do
    if (/PGRST205|42P01|news_digest/.test(text) && (r1.status === 404 || r2.status === 404 || /does not exist|schema cache/.test(text))) {
      sendCached(res, 200, { configured: true, digest: null, dates: [], setup: 'missing_table' }, 'public, s-maxage=300');
      return;
    }
    console.error('digest: supabase ' + r1.status + '/' + r2.status + ' ' + text.slice(0, 200));
    send(res, 502, { error: 'Supabase query failed' });
    return;
  }

  const rows = await r1.json();
  const dates = (await r2.json()).map(x => x.date);
  const row = rows[0] || null;
  const digest = row ? {
    date: row.date,
    intro: row.intro || '',
    items: Array.isArray(row.items) ? row.items : [],
    published_at: row.published_at,
  } : null;

  sendCached(res, 200, { configured: true, digest, dates }, CACHE);
};
