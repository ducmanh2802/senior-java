/*
 * Service worker — installable app + offline study.
 * Network-first for everything same-origin (content changes often, so online users always get the
 * latest), falling back to the cache when offline or when the network takes longer than 4 s.
 * /api/* is never cached. CDN scripts and fonts are cached after first use.
 * Bump VERSION to drop old caches. Do not list /index.html: Vercel cleanUrls answers it with a 308,
 * and a cached redirect breaks navigations.
 */
'use strict';

const VERSION = 'v2';
const CACHE = 'sjp-' + VERSION;
const SHELL = ['/', '/css/base.css', '/js/core/app.js', '/manifest.json', '/icons/icon-192.png'];
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('sjp-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(request) {
  return caches.open(CACHE).then(cache => {
    const network = fetch(request).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
      return res;
    });
    network.catch(() => {});   // a late failure after the cache answered is not an error
    const timeout = new Promise(resolve => setTimeout(resolve, NETWORK_TIMEOUT_MS));
    const fallback = () => cache.match(request, { ignoreSearch: request.mode === 'navigate' })
      .then(hit => hit || (request.mode === 'navigate' ? cache.match('/') : undefined));
    // slow network: answer from cache if we have it, keep the network response for next time
    return Promise.race([network, timeout.then(fallback)])
      .then(res => res || network)
      .catch(() => fallback().then(hit => hit || Response.error()));
  });
}

function cacheFirst(request) {
  return caches.open(CACHE).then(cache => cache.match(request).then(hit => hit || fetch(request).then(res => {
    if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
    return res;
  })));
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) return;        // AI / run / account: always live
    event.respondWith(networkFirst(req));
  } else if (CDN.test(req.url)) {
    event.respondWith(cacheFirst(req));                   // versioned CDN files never change
  }
});
