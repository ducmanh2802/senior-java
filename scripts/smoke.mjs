#!/usr/bin/env node
/*
 * Browser smoke test: serves the repo statically, opens every route in headless Chromium,
 * fails on page errors, console errors or the router's "Lỗi khi hiển thị" fallback.
 *   npm run smoke            (needs: npx playwright install chromium)
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
  const file = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const routes = ['', ...[...html.matchAll(/data-route="([a-z]+)"/g)].map(m => m[1]).filter(r => r !== 'dashboard'),
  'bank/core', 'flash/due', 'algo/algo-001'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const problems = [];
let current = '';
page.on('pageerror', e => problems.push(`[${current}] pageerror: ${e.message}`));
// the static smoke server has no Vercel functions: a 404 from /api/* is expected here, anything else is a bug
page.on('console', m => {
  if (m.type() !== 'error' || /fonts\.g(oogleapis|static)\.com/.test(m.text())) return;
  const url = (m.location() && m.location().url) || '';
  if (/\/api\//.test(url) && /404/.test(m.text())) return;
  problems.push(`[${current}] console: ${m.text()}`);
});
page.on('requestfailed', r => { if (r.url().startsWith(base)) problems.push(`[${current}] request failed: ${r.url()}`); });

for (const r of [...new Set(routes)]) {
  current = '#/' + r;
  await page.goto(base + '#/' + r);
  await page.waitForTimeout(400);
  const text = await page.locator('#main').innerText();
  if (/Lỗi khi hiển thị/.test(text)) problems.push(`[${current}] view threw (router error fallback)`);
  if (text.trim().length < 40) problems.push(`[${current}] view rendered almost nothing`);
}

// mobile width: no horizontal page scroll on the main routes
await page.setViewportSize({ width: 360, height: 800 });
for (const r of ['', 'bank', 'algo', 'mock']) {
  current = '#/' + r + ' @360px';
  await page.goto(base + '#/' + r);
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 2) problems.push(`[${current}] horizontal overflow ${overflow}px`);
}

await browser.close();
server.close();
console.log(`Smoke: ${routes.length} routes checked`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('OK — không có lỗi.');
