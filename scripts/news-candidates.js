#!/usr/bin/env node
/*
 * Shortlist candidates for the daily digest ("Bản tin hôm nay"). Fetches every feed in api/_feeds.js directly
 * (no Supabase needed), keeps items from the last N hours, ranks them by source weight + keyword relevance for
 * a Java backend dev + freshness, prints the top 25 as JSON and writes logs/news-candidates.json.
 *   node scripts/news-candidates.js [hours=36] [--top=25]
 * Workflow: docs/NEWS-DIGEST.md. Nothing here is AI-generated: the editor reads the originals and writes the digest.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { FEEDS, fetchFeed } = require(path.join(__dirname, '..', 'api', '_feeds.js'));

const args = process.argv.slice(2);
const hours = Math.max(1, Math.min(24 * 14, Number(args.find(a => /^\d+$/.test(a))) || 36));
const topArg = args.find(a => a.startsWith('--top='));
const TOP = Math.max(1, Math.min(100, Number(topArg && topArg.slice(6)) || 25));

// [regex, points] — matched against title (×2) and summary (×1); each keyword counts once per field
const KEYWORDS = [
  [/\bjava\b|\bjdk\b|openjdk|\bjep\s?\d+/i, 4],
  [/\bspring\b|spring boot|spring cloud|spring ai/i, 4],
  [/\bjvm\b|garbage collect|\bgc\b|\bzgc\b|\bg1\b|graalvm|virtual thread|project loom|valhalla|leyden/i, 4],
  [/hibernate|\bjpa\b|jdbc|quarkus|micronaut|kotlin/i, 3],
  [/kafka|confluent|event[- ]driven|\bcdc\b|debezium|rabbitmq/i, 3],
  [/postgres|postgresql|mysql|\bsql\b|database|\bindex(es|ing)?\b|redis|dynamodb|aurora|\brds\b/i, 3],
  [/kubernetes|\bk8s\b|helm|\beks\b|container|docker|service mesh|istio/i, 3],
  [/\baws\b|amazon|lambda|\bs3\b|\becs\b|fargate|\bsqs\b|\bsns\b|google cloud|\bgcp\b/i, 2],
  [/devops|ci\/cd|github actions|terraform|opentofu|gitops|argo|platform engineering|\bsre\b/i, 2],
  [/observability|opentelemetry|tracing|prometheus|grafana|\bslo\b|incident|outage|postmortem|post-mortem/i, 3],
  [/security|\bcve-\d+|vulnerab|exploit|\boauth\b|\bjwt\b|zero[- ]day|supply chain/i, 3],
  [/microservice|architecture|system design|scalab|latency|throughput|distributed|consistency|resilien/i, 2],
  [/performance|benchmark|tuning|memory leak|\bcache\b|caching/i, 2],
  [/release|general availability|\bga\b|now available|deprecat|end of life|\beol\b|breaking change/i, 1],
  [/\bllm\b|\brag\b|\bmcp\b|\bai agent|vector (db|database|search)|embedding/i, 1],
];
// sponsored / marketing-heavy items are rarely digest material
const PENALTY = [/webinar|sponsored|register now|\bsale\b|discount|customer story|case study:|podcast|this week in/i, -3];

function score(it, feed, now) {
  let s = (feed.weight || 1) * 2;
  const hits = [];
  const lead = (it.summary || '').slice(0, 300);   // long marketing summaries would match everything
  let fromSummary = 0;
  for (const [re, pts] of KEYWORDS) {
    const t = re.test(it.title), d = !t && re.test(lead);
    if (t) s += pts * 2;
    else if (d) fromSummary += pts;
    if (t || d) hits.push(String(re.source.split('|')[0]).replace(/\\b|\\/g, ''));
  }
  s += Math.min(6, fromSummary);   // the title decides; the summary only breaks ties
  if (PENALTY[0].test(it.title)) s += PENALTY[1];
  const ageH = (now - Date.parse(it.published)) / 3600000;
  s += Math.max(0, 3 - ageH / 12);   // up to +3 for the freshest items
  return { score: Math.round(s * 10) / 10, hits };
}

(async () => {
  const now = Date.now();
  const results = await Promise.all(FEEDS.map(f => fetchFeed(f, { sinceMs: hours * 3600000, max: 30, timeoutMs: 15000 })));
  const byId = Object.fromEntries(FEEDS.map(f => [f.id, f]));
  const seen = new Set();
  const all = [];
  for (const r of results) {
    for (const it of r.items) {
      const key = it.url.replace(/[?#].*$/, '').replace(/\/+$/, '');
      if (seen.has(key)) continue;
      seen.add(key);
      const { score: sc, hits } = score(it, byId[r.id], now);
      all.push({
        score: sc,
        title: it.title,
        url: it.url,
        source: it.source,
        category: it.category,
        published: it.published,
        summary: (it.summary || '').slice(0, 400),
        matched: hits,
      });
    }
  }
  all.sort((a, b) => b.score - a.score || Date.parse(b.published) - Date.parse(a.published));
  const top = all.slice(0, TOP);

  const failed = results.filter(r => !r.ok).map(r => r.id + ' (' + r.error + ')');
  const out = {
    generatedAt: new Date(now).toISOString(),
    hours,
    feeds: { total: FEEDS.length, ok: results.filter(r => r.ok).length, failed },
    totalItems: all.length,
    candidates: top,
  };
  const dir = path.join(__dirname, '..', 'logs');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'news-candidates.json'), JSON.stringify(out, null, 2) + '\n');
  process.stdout.write(JSON.stringify(top, null, 2) + '\n');
  console.error(`news-candidates: ${all.length} items in the last ${hours}h from ${out.feeds.ok}/${FEEDS.length} feeds` +
    (failed.length ? '; failed: ' + failed.join(', ') : '') + ' → logs/news-candidates.json');
})().catch(e => { console.error(e); process.exit(1); });
