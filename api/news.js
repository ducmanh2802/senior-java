'use strict';

const { send, guard, supabase, supabaseConfigured } = require('./_lib');

module.exports = async function handler(req, res) {
  if (!(await guard(req, res, { maxPerMinute: 60, auth: false, method: 'GET' }))) return;

  const days = Math.min(30, Math.max(1, Number(req.query.days) || 7));
  const category = req.query.category;
  const validCategories = ['tech', 'hiring', 'company'];
  const catFilter = validCategories.includes(category) ? category : null;

  if (!supabaseConfigured()) {
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    send(res, 200, { configured: false, updatedAt: null, items: [] });
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

  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
  send(res, 200, { configured: true, updatedAt, items });
};