'use strict';

const { send, supabase, supabaseConfigured } = require('./_lib');

const CRON_SECRET = process.env.CRON_SECRET;

const FEEDS = [
  // tech
  { id: 'inside-java', name: 'Inside Java', category: 'tech', url: 'https://inside.java/feed.xml' },
  { id: 'spring-blog', name: 'Spring Blog', category: 'tech', url: 'https://spring.io/blog.atom' },
  { id: 'jetbrains-idea', name: 'JetBrains IntelliJ Blog', category: 'tech', url: 'https://blog.jetbrains.com/idea/feed/' },
  { id: 'baeldung', name: 'Baeldung', category: 'tech', url: 'https://www.baeldung.com/feed' },
  { id: 'hn-200', name: 'Hacker News ≥200 pts', category: 'tech', url: 'https://hnrss.org/newest?points=200' },
  { id: 'vnexpress-sohoa', name: 'VnExpress Số hóa', category: 'tech', url: 'https://vnexpress.net/rss/so-hoa.rss' },
  { id: 'aws-arch', name: 'AWS Architecture Blog', category: 'tech', url: 'https://aws.amazon.com/blogs/architecture/feed/' },

  // hiring
  { id: 'hn-hiring', name: 'HN Who is hiring', category: 'hiring', url: 'https://hnrss.org/newest?q=hiring&points=100' },
  { id: 'topdev-blog', name: 'TopDev Blog', category: 'hiring', url: 'https://topdev.vn/blog/feed/' },
  { id: 'itviec-blog', name: 'ITviec Blog', category: 'hiring', url: 'https://itviec.com/feed/' },

  // company
  { id: 'netflix-tech', name: 'Netflix Tech Blog', category: 'company', url: 'https://netflixtechblog.com/feed' },
  { id: 'grab-eng', name: 'Grab Engineering', category: 'company', url: 'https://engineering.grab.com/feed/' },
  { id: 'cloudflare-blog', name: 'Cloudflare Blog', category: 'company', url: 'https://blog.cloudflare.com/rss/' },
  { id: 'martin-fowler', name: 'Martin Fowler', category: 'company', url: 'https://martinfowler.com/feed.atom' },
];

function parseRSS(text) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const content = match[1];
    const title = extract(content, '<title>', '</title>');
    const link = extract(content, '<link>', '</link>');
    const pubDate = extract(content, '<pubDate>', '</pubDate>') || extract(content, '<published>', '</published>');
    const description = extract(content, '<description>', '</description>') || extract(content, '<summary>', '</summary>');
    if (title && link) {
      items.push({ title: clean(title), url: clean(link), published: pubDate ? parseDate(pubDate) : null, summary: clean(description) });
    }
  }
  return items;
}

function parseAtom(text) {
  const items = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;
  while ((match = entryRegex.exec(text)) !== null) {
    const content = match[1];
    const title = extract(content, '<title>', '</title>');
    const linkMatch = content.match(/<link[^>]*href=["']([^"']+)["']/i);
    const link = linkMatch ? linkMatch[1] : null;
    const updated = extract(content, '<updated>', '</updated>') || extract(content, '<published>', '</published>');
    const summary = extract(content, '<summary>', '</summary>') || extract(content, '<content>', '</content>');
    if (title && link) {
      items.push({ title: clean(title), url: clean(link), published: updated ? parseDate(updated) : null, summary: clean(summary) });
    }
  }
  return items;
}

function extract(text, start, end) {
  const i = text.indexOf(start);
  if (i === -1) return null;
  const j = text.indexOf(end, i + start.length);
  if (j === -1) return null;
  return text.slice(i + start.length, j).trim();
}

function clean(text) {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDate(str) {
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchFeed(feed) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(feed.url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { id: feed.id, ok: false, count: 0, error: `HTTP ${res.status}` };
    const text = await res.text();
    const isAtom = text.includes('<feed ') || text.includes('<entry>');
    const items = isAtom ? parseAtom(text) : parseRSS(text);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const recent = items
      .filter(it => it.published && new Date(it.published) >= weekAgo)
      .slice(0, 15)
      .map(it => ({ ...it, category: feed.category, source: feed.name }));
    return { id: feed.id, ok: true, count: recent.length, items: recent };
  } catch (e) {
    clearTimeout(timeout);
    return { id: feed.id, ok: false, count: 0, error: e.message };
  }
}

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
  const r = await supabase('/rest/v1/news_items?on_conflict=url', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=ignore-duplicates, return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error('upsert failed: ' + r.status + ' ' + err);
  }
  return { inserted: rows.length };   // attempted; duplicates of existing urls are ignored by the db
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
    const results = await Promise.all(FEEDS.map(fetchFeed));
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