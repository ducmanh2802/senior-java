/* Hub.net: phòng chơi online 2 người qua Supabase Realtime (broadcast + presence).
 *
 * Giao thức rất mỏng: chủ phòng (host) là người 0, khách là người 1. Mỗi trò tự gửi/nhận
 * các message nhỏ như {t:'start'} hoặc {t:'move', ...}. Luật chơi là xác định, nên hai máy
 * chỉ cần trao đổi nước đi là luôn đồng bộ.
 */
(function () {
  'use strict';

  const cfg = window.SANDINH_CONFIG || {};
  let clientPromise = null;
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ I, O, 0, 1 cho dễ đọc

  function loadClient() {
    if (clientPromise) return clientPromise;
    clientPromise = new Promise((resolve, reject) => {
      const make = () => resolve(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }));
      if (window.supabase && window.supabase.createClient) return make();
      const s = document.createElement('script');
      s.src = cfg.supabaseJs;
      if (cfg.supabaseJsIntegrity) { s.integrity = cfg.supabaseJsIntegrity; s.crossOrigin = 'anonymous'; }
      s.onload = make;
      s.onerror = () => { clientPromise = null; reject(new Error('Không tải được thư viện kết nối. Kiểm tra mạng nhé.')); };
      document.head.appendChild(s);
    });
    return clientPromise;
  }

  const myId = (() => {
    let id = Hub.store.get('net:id', null);
    if (!id) { id = Math.random().toString(36).slice(2, 10); Hub.store.set('net:id', id); }
    return id;
  })();

  const net = {
    get enabled() { return !!(cfg.supabaseUrl && cfg.supabaseKey && /^https?:$/.test(location.protocol)); },
    myId,
    newCode() { let c = ''; for (let i = 0; i < 4; i++) c += ALPHA[Hub.rand(ALPHA.length)]; return c; },
    normalize(code) { return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); },

    /**
     * Mở phòng. opts = {game, code, host, name, onMessage(msg), onPeers({count, me, peer, full}), onStatus(text)}
     * Trả về {send(msg), close(), seat} (seat 0 = chủ phòng).
     */
    async open(opts) {
      const client = await loadClient();
      const topic = `sandinh-${opts.game}-${opts.code}`;
      const ch = client.channel(topic, { config: { broadcast: { self: false, ack: false }, presence: { key: myId } } });
      let closed = false;
      const joinedAt = Date.now();

      ch.on('broadcast', { event: 'msg' }, ({ payload }) => { if (!closed && payload) opts.onMessage(payload); });
      ch.on('presence', { event: 'sync' }, () => {
        if (closed) return;
        const state = ch.presenceState();
        // mỗi key là một người; sắp theo thời điểm vào phòng, chủ phòng luôn đứng đầu
        const people = Object.entries(state).map(([id, metas]) => ({ id, ...(metas[0] || {}) }))
          .sort((a, b) => (b.host ? 1 : 0) - (a.host ? 1 : 0) || a.at - b.at);
        const me = people.findIndex((p) => p.id === myId);
        const peer = people.find((p) => p.id !== myId) || null;
        opts.onPeers({ count: people.length, me, peer, full: me >= 2 });
      });

      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Kết nối quá lâu, thử lại nhé.')), 12000);
        ch.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timer);
            try { await ch.track({ at: joinedAt, host: !!opts.host, name: opts.name || '' }); } catch (e) { /* presence lỗi thì vẫn chơi được */ }
            resolve();
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timer);
            if (opts.onStatus) opts.onStatus('Mất kết nối, đang thử lại…');
            reject(new Error('Không vào được phòng (' + status + ').'));
          }
        });
      });

      return {
        seat: opts.host ? 0 : 1,
        send(msg) { if (!closed) ch.send({ type: 'broadcast', event: 'msg', payload: msg }); },
        close() { closed = true; try { client.removeChannel(ch); } catch (e) { /* bỏ qua */ } },
      };
    },

    /**
     * Thanh sảnh dùng chung cho các trò có chế độ online.
     * opts = {game, el (phần tử chứa), onReady(room), onLeave()}; trả về hàm dọn dẹp.
     * onReady được gọi mỗi khi đủ 2 người (kể cả khi bạn kia vào lại).
     */
    lobby(opts) {
      const el = opts.el;
      let room = null, state = 'idle', code = '', disposed = false, wasFull = false;

      function draw(extra) {
        if (disposed) return;
        if (!net.enabled) {
          el.innerHTML = `<div class="lobby"><p>Chế độ online cần mở trang qua web (http/https) và có cấu hình máy chủ.</p></div>`;
          return;
        }
        if (state === 'idle') {
          el.innerHTML = `<div class="lobby">
            <button class="btn primary" data-net="create">🏠 Tạo phòng</button>
            <span class="muted">hoặc</span>
            <label class="join"><span class="sr">Mã phòng</span>
              <input class="input code" maxlength="4" placeholder="MÃ" autocomplete="off" autocapitalize="characters" aria-label="Mã phòng 4 ký tự">
              <button class="btn" data-net="join">Vào phòng</button></label>
            ${extra ? `<p class="lobby-msg">${Hub.esc(extra)}</p>` : ''}
          </div>`;
        } else {
          const link = location.href.split('#')[0] + '#/choi/' + opts.game + '?phong=' + code;
          el.innerHTML = `<div class="lobby on">
            <span>Phòng <b class="room-code">${code}</b></span>
            <button class="btn sm" data-net="copy">📋 Chép link mời</button>
            <span class="lobby-msg">${Hub.esc(extra || '')}</span>
            <button class="btn sm" data-net="leave">Rời phòng</button>
          </div>`;
          el.dataset.link = link;
        }
      }

      async function enter(c, host) {
        code = c; state = 'connecting'; draw('Đang kết nối…');
        try {
          room = await net.open({
            game: opts.game, code, host,
            onMessage: (m) => room && room.onMessage && room.onMessage(m),
            onPeers: ({ count, full, peer }) => {
              if (full) { leave('Phòng đã đủ 2 người rồi.'); return; }
              if (count >= 2) {
                draw('Đã có bạn chơi! 🎉');
                if (!wasFull) { wasFull = true; opts.onReady(room, peer); }
              } else {
                draw(host ? 'Gửi mã hoặc link cho bạn để vào chơi…' : 'Đang chờ chủ phòng…');
                if (wasFull) { wasFull = false; Hub.toast('Bạn kia đã rời phòng'); if (opts.onPeerLeft) opts.onPeerLeft(); }
              }
            },
          });
          if (disposed) { room.close(); return; }
          state = 'in';
        } catch (e) {
          state = 'idle'; room = null; draw(e.message);
        }
      }

      function leave(msg) {
        if (room) room.close();
        room = null; state = 'idle'; wasFull = false;
        draw(msg);
        if (opts.onLeave) opts.onLeave();
      }

      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-net]');
        if (!b) return;
        const act = b.dataset.net;
        if (act === 'create') enter(net.newCode(), true);
        if (act === 'join') {
          const c = net.normalize(el.querySelector('.code').value);
          if (c.length !== 4) return Hub.toast('Mã phòng gồm 4 ký tự', 'bad');
          enter(c, false);
        }
        if (act === 'leave') leave();
        if (act === 'copy') {
          const link = el.dataset.link;
          (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject())
            .then(() => Hub.toast('Đã chép link mời', 'good'))
            .catch(() => window.prompt('Chép link này gửi bạn:', link));
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('.code')) el.querySelector('[data-net="join"]').click();
      });

      draw();
      // vào thẳng từ link mời: #/choi/<game>?phong=ABCD
      const m = location.hash.match(/[?&]phong=([A-Za-z0-9]{4})/);
      if (m && net.enabled) enter(net.normalize(m[1]), false);

      return () => { disposed = true; if (room) room.close(); };
    },
  };

  Hub.net = net;
})();
