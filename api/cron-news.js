'use strict';

const { send, supabase, supabaseConfigured } = require('./_lib');
// feed list + RSS/Atom parsing live in api/_feeds.js (shared with scripts/news-candidates.js)
const { FEEDS, fetchFeed } = require('./_feeds');

const CRON_SECRET = process.env.CRON_SECRET;

async function upsertNews(allItems) {
  if (!supabaseConfigured() || allItems.length === 0) return { inserted: 0 };
  // one bad row (no url/title/date, or the same url twice in a batch) would fail the whole insert
  const seen = new Set();
  const valid = allItems.filter(it => it.url && /^https?:\/\//.test(it.url) && it.title && it.published &&
    !seen.has(it.url) && seen.add(it.url));
  const rows = valid.map(it => ({
    url: it.url,
    category: it.category,
    source: it.source,
    title: it.title,
    summary: it.summary ? it.summary.slice(0, 300) : null,
    published: it.published,
  }));
  const insert = list => supabase('/rest/v1/news_items?on_conflict=url', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=ignore-duplicates, return=minimal' },
    body: JSON.stringify(list),
  });
  let r = await insert(rows);
  let sent = rows;
  if (!r.ok) {
    let err = await r.text();
    // 23514 = check violation: the db still has the old category check (before the devops/cloud migration
    // in docs/NEWS-DIGEST.md) — keep the old categories flowing instead of failing the whole batch
    if (/23514/.test(err)) {
      sent = rows.filter(x => ['tech', 'hiring', 'company'].includes(x.category));
      console.warn('cron-news: news_items rejects new categories, run the migration in docs/NEWS-DIGEST.md');
      r = await insert(sent);
      if (!r.ok) err = await r.text();
    }
    if (!r.ok) throw new Error('upsert failed: ' + r.status + ' ' + err);
  }
  return { inserted: sent.length };   // attempted; duplicates of existing urls are ignored by the db
}

async function cleanupOldNews() {
  if (!supabaseConfigured()) return;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  await supabase('/rest/v1/news_items?published=lt.' + thirtyDaysAgo, { method: 'DELETE' });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    send(res, 405, { error: 'Method not allowed' });
    return;
  }
  const auth = req.headers.authorization || '';
  if (!CRON_SECRET) {
    console.error('cron-news: CRON_SECRET is not set (add it in Vercel env, then redeploy)');
    send(res, 500, { error: 'CRON_SECRET not configured', code: 'not_configured' });
    return;
  }
  if (auth !== 'Bearer ' + CRON_SECRET) {
    send(res, 401, { error: 'invalid cron secret', code: 'unauthorized' });
    return;
  }

  try {
    const results = await Promise.all(FEEDS.map(f => fetchFeed(f)));
    const allItems = results.flatMap(r => r.ok ? r.items : []);
    const { inserted } = await upsertNews(allItems);
    await cleanupOldNews();
    const feeds = results.map(r => ({ id: r.id, ok: r.ok, count: r.count, error: r.error }));
    console.log('cron-news: fetched ' + allItems.length + ', inserted ' + inserted + ', failed feeds: ' +
      (feeds.filter(f => !f.ok).map(f => f.id).join(', ') || 'none'));
    send(res, 200, { ok: true, fetched: allItems.length, inserted, feeds });
  } catch (e) {
    console.error('cron-news: ' + e.message);
    send(res, 500, { error: e.message, code: 'cron_failed' });
  }
};