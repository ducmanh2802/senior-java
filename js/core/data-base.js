/*
 * Where the heavy data files (js/data/*, js/i18n/*) are loaded from.
 * The deploy (Vercel) does not ship them (.vercelignore): they are served by jsDelivr straight from the public
 * GitHub repo, pinned to DATA_SHA so the URL is immutable and caches forever. scripts/autopilot.sh rewrites
 * DATA_SHA to the content commit before every push. Local runs (localhost, file:) read the local files.
 */
(function () {
  window.DATA_SHA = 'd34f2b6a6ca8a85320296aa3d500ac5ee1114241';
  const h = location.hostname;
  const local = location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '';
  const cdn = host => 'https://' + host + '/gh/ducmanh2802/senior-java@' + window.DATA_SHA + '/';
  window.DATA_BASE = local ? '' : cdn('cdn.jsdelivr.net');
  // second jsDelivr hostname, tried once when a file fails on the first one
  window.DATA_BASE_FALLBACK = local ? '' : cdn('fastly.jsdelivr.net');
})();
