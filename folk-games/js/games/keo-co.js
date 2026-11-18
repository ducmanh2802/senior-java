/* Kéo co: bấm thật nhanh để kéo dây về phía đội mình. */
(function () {
  'use strict';

  const LEVELS = { easy: 4.5, normal: 6.5, hard: 8.5 }; // số lần "kéo" mỗi giây của đội máy

  Hub.register({
    id: 'keo-co',
    name: 'Kéo co',
    icon: '🪢',
    tagline: '"Hò dô ta!" Bấm thật nhanh để kéo dải lụa đỏ qua vạch.',
    players: '1 người · đấu máy',
    rules: `
      <ul>
        <li>Bấm nút <b>Kéo!</b> hoặc gõ phím <kbd>Space</kbd> / <kbd>K</kbd> thật nhanh. Mỗi lần bấm, đội bạn kéo dây về bên trái.</li>
        <li>Kéo được dải lụa đỏ giữa dây qua vạch bên mình thì thắng. Sau 30 giây, dây lệch về bên nào thì bên đó thắng.</li>
      </ul>
      <p class="muted">Kéo co là nghi lễ, trò chơi được UNESCO ghi danh Di sản văn hoá phi vật thể (2015).</p>`,

    render(root, ctx) {
      let level = Hub.store.get('kc:level', 'normal');
      let pos = 0, running = false, timer = null, t0 = 0, raf = 0;

      root.innerHTML = `
        ${Hub.modeBar({ levels: [['easy', 'Đội nhí'], ['normal', 'Đội làng bên'], ['hard', 'Đội lực sĩ']], level })}
        <div class="kc-field">
          <div class="kc-line l"></div><div class="kc-line r"></div><div class="kc-center"></div>
          <div class="kc-rope"><div class="team you">🧒🧒🧒</div><div class="rope"><span class="ribbon"></span></div><div class="team cpu">🧑‍🌾🧑‍🌾🧑‍🌾</div></div>
        </div>
        <div class="kc-info"><span class="kc-time">30.0s</span><span class="kc-msg" aria-live="polite">Sẵn sàng chưa?</span></div>
        <div class="row center">
          <button class="btn primary lg kc-pull" data-act="pull" disabled>💪 Kéo! <kbd>Space</kbd></button>
          <button class="btn" data-act="start">▶️ Bắt đầu <kbd>Enter</kbd></button>
        </div>`;
      const $ = (q) => root.querySelector(q);
      const LIMIT = 100, DUR = 30000;

      function drawRope() {
        $('.kc-rope').style.transform = `translateX(${-pos * 0.2}%)`;
        $('.kc-rope').classList.toggle('strain', running);
      }

      async function start() {
        if (running) return;
        pos = 0; drawRope();
        $('[data-act="start"]').disabled = true;
        for (const c of ['3', '2', '1', 'Hò dô ta!']) {
          $('.kc-msg').textContent = c;
          Hub.sfx('drum');
          await Hub.sleep(650);
          if (!ctx.alive()) return;
        }
        running = true; t0 = performance.now();
        $('.kc-pull').disabled = false; $('.kc-pull').focus();
        const rate = LEVELS[level];
        timer = setInterval(() => {
          // máy kéo ngẫu nhiên quanh tốc độ trung bình, có lúc "dồn sức"
          if (Math.random() < rate / 20) pull(-1);
          if (Math.random() < 0.01) { pos -= 4; }
        }, 50);
        const tick = () => {
          if (!running) return;
          const left = Math.max(0, DUR - (performance.now() - t0));
          $('.kc-time').textContent = (left / 1000).toFixed(1) + 's';
          if (left <= 0) return finish(pos > 0 ? 'win' : pos < 0 ? 'lose' : 'draw');
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }

      function pull(side) {
        if (!running) return;
        pos += side * 3;
        if (side > 0) Hub.sfx('tap');
        drawRope();
        if (pos >= LIMIT) finish('win');
        else if (pos <= -LIMIT) finish('lose');
      }

      function finish(res) {
        running = false; clearInterval(timer); cancelAnimationFrame(raf);
        $('.kc-pull').disabled = true; $('[data-act="start"]').disabled = false;
        $('.kc-msg').textContent = res === 'win' ? '🎉 Đội bạn thắng!' : res === 'lose' ? '😤 Thua rồi, làm ván nữa!' : 'Hoà!';
        drawRope();
        Hub.record('keo-co', res);
      }

      root.addEventListener('click', (e) => {
        const lv = e.target.closest('[data-level]');
        if (lv && !running) {
          level = lv.dataset.level; Hub.store.set('kc:level', level);
          lv.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === lv));
          return;
        }
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'start') start();
        if (a.dataset.act === 'pull') pull(1);
      });
      const off = Hub.onKey((e) => {
        if (e.repeat) return;
        if (e.key === ' ' || e.key === 'k' || e.key === 'K') { e.preventDefault(); pull(1); }
        if (e.key === 'Enter' && !running) { e.preventDefault(); start(); }
      });
      drawRope();
      return () => { off(); running = false; clearInterval(timer); cancelAnimationFrame(raf); };
    },
  });
})();
