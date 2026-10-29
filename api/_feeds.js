/*
 * Shared feed list + RSS/Atom parsing (files starting with "_" are not routes on Vercel).
 * Used by api/cron-news.js (daily fetch into news_items) and scripts/news-candidates.js (editor shortlist).
 *
 * category: 'tech' (Java/Spring/backend/data), 'company' (big-tech engineering blogs),
 *           'devops' (Kubernetes, containers, IaC, observability), 'cloud' (AWS / GCP).
 *           Must match the check constraint on public.news_items.category (supabase/schema.sql).
 * weight:   1–3, how much an item from this source counts when ranking candidates for the daily digest
 *           (3 = primary source for our learners, e.g. official Java/Spring/AWS release notes).
 * Every URL was checked to return a live RSS/Atom feed (2026-10-29). InfoQ DevOps and the old InfoQ /cloud/
 * feeds were dropped: they stopped updating in 2022.
 */
'use strict';

const CATEGORIES = ['tech', 'hiring', 'company', 'devops', 'cloud'];

const FEEDS = [
  // tech: Java / Spring ecosystem
  { id: 'inside-java', name: 'Inside Java', category: 'tech', weight: 3, url: 'https://inside.java/feed.xml' },
  { id: 'spring-blog', name: 'Spring Blog', category: 'tech', weight: 3, url: 'https://spring.io/blog.atom' },
  { id: 'infoq-java', name: 'InfoQ Java', category: 'tech', weight: 3, url: 'https://feed.infoq.com/java/' },
  { id: 'foojay', name: 'Foojay', category: 'tech', weight: 2, url: 'https://foojay.io/feed/' },
  { id: 'quarkus', name: 'Quarkus Blog', category: 'tech', weight: 2, url: 'https://quarkus.io/feed.xml' },
  { id: 'baeldung', name: 'Baeldung', category: 'tech', weight: 2, url: 'https://www.baeldung.com/feed' },
  { id: 'vlad-mihalcea', name: 'Vlad Mihalcea', category: 'tech', weight: 3, url: 'https://vladmihalcea.com/feed/' },
  { id: 'jetbrains-idea', name: 'JetBrains IntelliJ Blog', category: 'tech', weight: 1, url: 'https://blog.jetbrains.com/idea/feed/' },
  // tech: backend data / architecture
  { id: 'infoq-arch', name: 'InfoQ Architecture', category: 'tech', weight: 2, url: 'https://feed.infoq.com/architecture-design/' },
  { id: 'confluent', name: 'Confluent Blog', category: 'tech', weight: 2, url: 'https://www.confluent.io/rss.xml' },
  { id: 'postgresql', name: 'PostgreSQL News', category: 'tech', weight: 3, url: 'https://www.postgresql.org/news.rss' },
  { id: 'redis', name: 'Redis Blog', category: 'tech', weight: 1, url: 'https://redis.io/blog/feed/' },
  { id: 'bytebytego', name: 'ByteByteGo', category: 'tech', weight: 2, url: 'https://blog.bytebytego.com/feed' },
  { id: 'pragmatic-engineer', name: 'The Pragmatic Engineer', category: 'tech', weight: 2, url: 'https://newsletter.pragmaticengineer.com/feed' },
  { id: 'martin-fowler', name: 'Martin Fowler', category: 'tech', weight: 3, url: 'https://martinfowler.com/feed.atom' },
  { id: 'hn-300', name: 'Hacker News ≥300 pts', category: 'tech', weight: 1, url: 'https://hnrss.org/newest?points=300' },

  // devops: containers, Kubernetes, IaC, observability
  { id: 'kubernetes', name: 'Kubernetes Blog', category: 'devops', weight: 3, url: 'https://kubernetes.io/feed.xml' },
  { id: 'cncf', name: 'CNCF Blog', category: 'devops', weight: 2, url: 'https://www.cncf.io/feed/' },
  { id: 'docker', name: 'Docker Blog', category: 'devops', weight: 2, url: 'https://www.docker.com/blog/feed/' },
  { id: 'grafana', name: 'Grafana Labs Blog', category: 'devops', weight: 2, url: 'https://grafana.com/blog/index.xml' },
  { id: 'hashicorp', name: 'HashiCorp Blog', category: 'devops', weight: 2, url: 'https://www.hashicorp.com/blog/feed.xml' },
  { id: 'the-new-stack', name: 'The New Stack', category: 'devops', weight: 1, url: 'https://thenewstack.io/feed/' },
  { id: 'aws-devops', name: 'AWS DevOps Blog', category: 'devops', weight: 2, url: 'https://aws.amazon.com/blogs/devops/feed/' },

  // cloud: AWS / Google Cloud
  { id: 'aws-news', name: 'AWS News Blog', category: 'cloud', weight: 3, url: 'https://aws.amazon.com/blogs/aws/feed/' },
  { id: 'aws-containers', name: 'AWS Containers Blog', category: 'cloud', weight: 2, url: 'https://aws.amazon.com/blogs/containers/feed/' },
  { id: 'aws-database', name: 'AWS Database Blog', category: 'cloud', weight: 2, url: 'https://aws.amazon.com/blogs/database/feed/' },
  { id: 'aws-arch', name: 'AWS Architecture Blog', category: 'cloud', weight: 2, url: 'https://aws.amazon.com/blogs/architecture/feed/' },
  { id: 'google-cloud', name: 'Google Cloud Blog', category: 'cloud', weight: 2, url: 'https://cloudblog.withgoogle.com/rss/' },
  { id: 'infoq-cloud', name: 'InfoQ Cloud', category: 'cloud', weight: 2, url: 'https://feed.infoq.com/cloud-computing/' },

  // company: engineering blogs of big tech
  { id: 'netflix-tech', name: 'Netflix Tech Blog', category: 'company', weight: 2, url: 'https://netflixtechblog.com/feed' },
  { id: 'meta-eng', name: 'Engineering at Meta', category: 'company', weight: 2, url: 'https://engineering.fb.com/feed/' },
  { id: 'github-eng', name: 'GitHub Engineering', category: 'company', weight: 2, url: 'https://github.blog/engineering/feed/' },
  { id: 'cloudflare-blog', name: 'Cloudflare Blog', category: 'company', weight: 2, url: 'https://blog.cloudflare.com/rss/' },
  { id: 'stripe-blog', name: 'Stripe Blog', category: 'company', weight: 1, url: 'https://stripe.com/blog/feed.rss' },
  { id: 'shopify-eng', name: 'Shopify Engineering', category: 'company', weight: 2, url: 'https://shopify.engineering/blog.atom' },
  { id: 'discord-blog', name: 'Discord Blog', category: 'company', weight: 1, url: 'https://discord.com/blog/rss.xml' },
  { id: 'slack-eng', name: 'Slack Engineering', category: 'company', weight: 2, url: 'https://slack.engineering/feed/' },
  { id: 'dropbox-tech', name: 'Dropbox Tech', category: 'company', weight: 2, url: 'https://dropbox.tech/feed' },
  { id: 'pinterest-eng', name: 'Pinterest Engineering', category: 'company', weight: 1, url: 'https://medium.com/feed/@Pinterest_Engineering' },
  { id: 'grab-eng', name: 'Grab Engineering', category: 'company', weight: 2, url: 'https://engineering.grab.com/feed.xml' },
];

/** Text of the first <tag ...>…</tag> (attributes allowed; <media:tag> is not matched). */
function extract(text, tag) {
  const m = new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'i').exec(text);
  return m ? m[1].trim() : null;
}

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** CDATA → entities → strip tags (descriptions are often escaped HTML) → collapse whitespace. */
function clean(text) {
  if (!text) return '';
  let s = text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  s = s.replace(/<[^>]+>/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

function parseDate(str) {
  const d = new Date(clean(str));
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseRSS(text) {
  const items = [];
  const re = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const c = m[1];
    const title = extract(c, 'title');
    const link = extract(c, 'link') || extract(c, 'guid');
    const date = extract(c, 'pubDate') || extract(c, 'dc:date') || extract(c, 'published');
    const desc = extract(c, 'description') || extract(c, 'summary');
    if (title && link) items.push({ title: clean(title), url: clean(link), published: date ? parseDate(date) : null, summary: clean(desc) });
  }
  return items;
}

function parseAtom(text) {
  const items = [];
  const re = /<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const c = m[1];
    const title = extract(c, 'title');
    const links = [...c.matchAll(/<link\b[^>]*>/gi)].map(x => x[0]);
    const alt = links.find(l => /rel=["']alternate["']/i.test(l)) || links.find(l => !/rel=/i.test(l)) || links[0];
    const href = alt && /href=["']([^"']+)["']/i.exec(alt);
    const date = extract(c, 'published') || extract(c, 'updated');
    const summary = extract(c, 'summary') || extract(c, 'content');
    if (title && href) items.push({ title: clean(title), url: decodeEntities(href[1]).trim(), published: date ? parseDate(date) : null, summary: clean(summary) });
  }
  return items;
}

function parseFeed(text) {
  return /<feed[\s>]/.test(text) && /<entry[\s>]/.test(text) ? parseAtom(text) : parseRSS(text);
}

/**
 * Fetch one feed. Keeps items published within sinceMs (default 7 days), at most `max`.
 * → { id, ok, count, items: [{title, url, published, summary, category, source, feed}], error? }
 */
async function fetchFeed(feed, { sinceMs = 7 * 86400000, max = 15, timeoutMs = 10000 } = {}) {
  try {
    const res = await fetch(feed.url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'SeniorJavaPrep-NewsBot/1.0 (+https://github.com)', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5' },
    });
    if (!res.ok) return { id: feed.id, ok: false, count: 0, items: [], error: 'HTTP ' + res.status };
    const text = await res.text();
    const since = Date.now() - sinceMs;
    const items = parseFeed(text)
      .filter(it => it.published && Date.parse(it.published) >= since && /^https?:\/\//.test(it.url))
      .slice(0, max)
      .map(it => Object.assign(it, { category: feed.category, source: feed.name, feed: feed.id }));
    return { id: feed.id, ok: true, count: items.length, items };
  } catch (e) {
    return { id: feed.id, ok: false, count: 0, items: [], error: e.name === 'TimeoutError' ? 'timeout' : e.message };
  }
}

module.exports = { FEEDS, CATEGORIES, fetchFeed, parseFeed, clean };
