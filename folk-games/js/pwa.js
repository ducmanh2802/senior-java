// Đăng ký service worker (PWA). Chỉ chạy qua http(s); lỗi được bỏ qua êm.
(function () {
  'use strict';
  try {
    if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
    window.addEventListener('load', function () {
      try {
        navigator.serviceWorker.register('./sw.js').catch(function () {});
      } catch (e) { /* bỏ qua */ }
    });
  } catch (e) { /* bỏ qua */ }
})();
