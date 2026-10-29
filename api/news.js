'use strict';

const { send, guard, supabase, supabaseConfigured } = require('./_lib');
const { CATEGORIES } = require('./_feeds');

/** send() in _lib.js forces Cache-Control: no-store; public read endpoints need CDN caching instead. */
function sendCached(res, status, body, cache) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (!(await guard(req, res, { maxPerMinute: 60, auth: false, method: 'GET' }))) return;

  const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
  const category = req.query.category;
  const catFilter = CATEGORIES.includes(category) ? category : null;

  if (!supabaseConfigured()) {
    sendCached(res, 200, { configured: false, updatedAt: null, items: [] }, 'public, s-maxage=1800, stale-while-revalidate=86400');
    return;
  }

  const since = new Date(Date.now() - days * 86400000).toISOString();
  let path = `/rest/v1/news_items?published=gte.${since}&order=published.desc&limit=300`;
  if (catFilter) path += `&category=eq.${catFilter}`;

  const r = await supabase(path);
  if (!r.ok) {
    send(res, 502, { error: 'Supabase query failed' });
    return;
  }

  const rows = await r.json();
  const items = rows.map(row => ({
    id: row.id,
    category: row.category,
    source: row.source,
    title: row.title,
    url: row.url,
    summary: row.summary,
    published: row.published,
  }));

  const updatedAt = rows.length > 0 ? rows.reduce((max, row) => row.fetched_at > max ? row.fetched_at : max, rows[0].fetched_at) : null;

  sendCached(res, 200, { configured: true, updatedAt, items }, 'public, s-maxage=1800, stale-while-revalidate=86400');
};