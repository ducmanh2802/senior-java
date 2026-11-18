// Service worker: offline cho site tĩnh Sân Đình.
// Same-origin GET: stale-while-revalidate. Cross-origin (Supabase, CDN): luôn lấy từ mạng, không cache.
const CACHE = 'sandinh-v1';

// Danh sách precache. File nào thiếu sẽ bị bỏ qua (không làm hỏng install).
const PRECACHE = [
  './',
  'index.html',
  'css/style.css',
  'css/village.css',
  'css/games-2.css',
  'manifest.json',
  'icons/icon.svg',
  // js/
  'js/config.js',
  'js/core.js',
  'js/main.js',
  'js/net.js',
  'js/pwa.js',
  'js/sound.js',
  'js/village.js',
  // js/data/
  'js/data/lore.js',
  // js/games/
  'js/games/bau-cua.js',
  'js/games/co-ganh.js',
  'js/games/danh-chuyen.js',
  'js/games/danh-dao.js',
  'js/games/keo-co.js',
  'js/games/nhay-lo-co.js',
  'js/games/o-an-quan.js',
  'js/games/oan-tu-ti.js',
  'js/games/rong-ran.js',
  'js/games/meo-duoi-chuot.js',
  'js/games/bit-mat.js',
  'js/games/danh-quay.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(PRECACHE.map((path) =>
      cache.add(path).catch(() => { /* file chưa có hoặc lỗi mạng: bỏ qua */ })
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    // Cross-origin: không can thiệp, để trình duyệt gọi mạng bình thường.
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);

    const network = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') {
        cache.put(req, res.clone()).catch(() => {});
      }
      return res;
    }).catch(() => null);

    if (cached) {
      event.waitUntil(network);
      return cached;
    }

    const fresh = await network;
    if (fresh) return fresh;

    // Offline và chưa cache: với điều hướng trang, trả về trang chính.
    if (req.mode === 'navigate') {
      const home = await cache.match('index.html') || await cache.match('./');
      if (home) return home;
    }
    return Response.error();
  })());
});
