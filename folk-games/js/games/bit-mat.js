/* Bịt mắt bắt dê: bạn bị bịt mắt, chỉ thấy một vòng sáng mờ quanh mình; các bạn "dê" chạy lung tung
 * và thỉnh thoảng kêu "be be" cho biết đang ở đâu. Bắt đủ 3 bạn trong 45 giây là thắng.
 *
 * Toạ độ thế giới W×H. Người chơi chạy 150 px/s; dê đi lang thang chậm hơn và chạy trốn nhanh hơn khi
 * người chơi lại gần (vẫn chậm hơn người chơi, nên có thể dồn vào góc). Bước cố định 1/120 giây.
 */
(function () {
  'use strict';

  const W = 600, H = 400, DT = 1 / 120;
  const PLAYER_R = 12, GOAT_R = 11, PLAYER_V = 150;
  const GOATS = 5, NEED = 3, DURATION = 45;
  const FLEE_DIST = 90, SIGHT = 78;                    // dê bỏ chạy khi người chơi lại gần hơn FLEE_DIST
  const BUBBLE = 1.1;                                  // thời gian hiện "be be" (giây)
  const LEVELS = {                                     // tốc độ đi, tốc độ chạy trốn, khoảng cách giữa hai tiếng kêu (giây)
    easy: { v: 60, flee: 95, call: [1.5, 3] },
    normal: { v: 80, flee: 118, call: [2.5, 4.5] },
    hard: { v: 100, flee: 135, call: [3.5, 6.5] },
  };

  // ---------- Logic thuần ----------
  const clampX = (p, r) => { p.x = Math.max(r, Math.min(W - r, p.x)); p.y = Math.max(r, Math.min(H - r, p.y)); };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const touching = (a, b) => dist(a, b) < a.r + b.r;
  const between = (rnd, [lo, hi]) => lo + rnd() * (hi - lo);

  function makeWorld(level, rnd) {
    rnd = rnd || Math.random;
    const prm = LEVELS[level] || LEVELS.normal, goats = [];
    for (let i = 0; i < GOATS; i++) {
      goats.push({ x: 60 + rnd() * (W - 120), y: 40 + rnd() * (H - 80), r: GOAT_R, tx: 0, ty: 0, wait: 0,
        callIn: between(rnd, prm.call) * rnd(), bubble: 0, caught: false, side: i % 2 ? 1 : -1 });
    }
    const player = { x: W / 2, y: H / 2, r: PLAYER_R };
    goats.forEach((g) => { if (dist(g, player) < 150) { g.x = g.x < W / 2 ? g.x - 150 : g.x + 150; clampX(g, g.r); } });
    return { player, goats, prm, rnd, t: 0, caught: 0, events: [], result: null };
  }

  /** Hướng chạy trốn: ra xa người chơi, lệch sang một bên cho khỏi bị dồn thẳng, và tránh tường. */
  function fleeDir(goat, player) {
    let dx = goat.x - player.x, dy = goat.y - player.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    let sx = dx - dy * 0.5 * goat.side, sy = dy + dx * 0.5 * goat.side;
    const m = 28;
    if (goat.x < m) sx += 1.2; else if (goat.x > W - m) sx -= 1.2;
    if (goat.y < m) sy += 1.2; else if (goat.y > H - m) sy -= 1.2;
    const sl = Math.hypot(sx, sy) || 1;
    return { x: sx / sl, y: sy / sl };
  }

  function stepGoat(w, g, dt) {
    const prm = w.prm, rnd = w.rnd;
    g.bubble = Math.max(0, g.bubble - dt);
    g.callIn -= dt;
    if (g.callIn <= 0) { g.bubble = BUBBLE; g.callIn = between(rnd, prm.call); w.events.push({ type: 'call', goat: g }); }
    if (dist(g, w.player) < FLEE_DIST) {
      const d = fleeDir(g, w.player); g.x += d.x * prm.flee * dt; g.y += d.y * prm.flee * dt;
    } else {
      g.wait -= dt;
      if (g.wait <= 0 || Math.hypot(g.tx - g.x, g.ty - g.y) < 6) {
        g.tx = 20 + rnd() * (W - 40); g.ty = 20 + rnd() * (H - 40); g.wait = 1.5 + rnd() * 2.5;
      }
      const dx = g.tx - g.x, dy = g.ty - g.y, l = Math.hypot(dx, dy) || 1;
      g.x += dx / l * prm.v * dt; g.y += dy / l * prm.v * dt;
    }
    clampX(g, g.r);
  }

  function movePlayer(p, input, dt) {
    if (input && input.dir && (input.dir.x || input.dir.y)) {
      const l = Math.hypot(input.dir.x, input.dir.y);
      p.x += input.dir.x / l * PLAYER_V * dt; p.y += input.dir.y / l * PLAYER_V * dt;
    } else if (input && input.target) {
      let dx = input.target.x - p.x, dy = input.target.y - p.y; const l = Math.hypot(dx, dy), m = PLAYER_V * dt;
      if (l > m) { dx = dx / l * m; dy = dy / l * m; }
      p.x += dx; p.y += dy;
    }
    clampX(p, p.r);
  }

  /** Một bước cố định. Trả về 'win' | 'lose' | null. Sự kiện (call / catch) nằm trong w.events. */
  function stepWorld(w, input, dt) {
    if (w.result) return w.result;
    movePlayer(w.player, input, dt);
    for (const g of w.goats) {
      if (g.caught) continue;
      stepGoat(w, g, dt);
      if (touching(w.player, g)) { g.caught = true; g.bubble = 0; w.caught++; w.events.push({ type: 'catch', goat: g }); }
    }
    w.t += dt;
    if (w.caught >= NEED) w.result = 'win';
    else if (w.t >= DURATION) w.result = 'lose';
    return w.result;
  }

  if (typeof Hub !== 'undefined') Hub.register({
    id: 'bit-mat',
    name: 'Bịt mắt bắt dê',
    icon: '🙈',
    tagline: 'Bị bịt mắt, lần theo tiếng “be be” để bắt cho được các bạn dê.',
    players: '1 người · đấu máy',
    rules: `
      <ol>
        <li>Bạn bị <b>bịt mắt</b> 🙈: sân tối đen, chỉ thấy một vòng sáng mờ quanh mình.</li>
        <li>Di chuột / chạm vào sân để đi về phía đó, hoặc dùng <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> / <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>.</li>
        <li>Các bạn <b>dê</b> 🐐 thỉnh thoảng kêu <b>“be be”</b>: bong bóng chữ hiện đúng chỗ bạn ấy đứng. Đó là manh mối duy nhất!</li>
        <li>Dê thấy bạn lại gần là chạy trốn, nhưng chậm hơn bạn nên có thể dồn vào góc.</li>
        <li>Bắt đủ <b>${NEED} bạn</b> trong <b>${DURATION} giây</b> là thắng.</li>
      </ol>
      <p class="muted">Độ khó thay đổi tốc độ của dê và độ thưa của tiếng kêu.</p>`,

    render(root, ctx) {
      let level = Hub.store.get('bm:level', 'normal');
      let world = makeWorld(level), phase = 'idle', countdown = 0, raf = 0, last = 0, acc = 0, timers = [], target = null;
      const keys = new Set(), C = {};

      root.innerHTML = `
        ${Hub.modeBar({ levels: [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']], level })}
        <div class="bm-wrap"><canvas class="bm-canvas" aria-label="Sân chơi bịt mắt bắt dê: di chuột hoặc chạm để đi, lần theo tiếng be be"></canvas></div>
        <p class="bm-msg" aria-live="polite">Bấm Bắt đầu rồi lắng nghe tiếng “be be” nhé!</p>
        <div class="row center"><button class="btn primary" data-act="start">▶️ Bắt đầu <kbd>Enter</kbd></button></div>`;
      const $ = (q) => root.querySelector(q);
      const cv = $('.bm-canvas'), g = cv.getContext('2d');
      const msg = (t) => { $('.bm-msg').textContent = t; };
      const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

      function readColors() {
        const cs = getComputedStyle(document.documentElement);
        for (const k of ['bg-2', 'paper', 'ink', 'line', 'accent', 'gold', 'green', 'p1', 'p2']) C[k] = cs.getPropertyValue('--' + k).trim() || '#888';
      }
      function resize() {
        const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 300, s = w / W;
        cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
        cv.style.height = (w * H / W) + 'px';
        g.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
      }

      function begin() {
        if (phase === 'count' || phase === 'run') return;
        clearTimers(); world = makeWorld(level); target = null;
        phase = 'count'; countdown = 3; $('[data-act="start"]').hidden = true;
        msg('Bịt mắt rồi… lắng nghe tiếng “be be”!');
        const tick = () => {
          if (!ctx.alive()) return;
          if (--countdown > 0) timers.push(setTimeout(tick, 700)); else { phase = 'run'; acc = 0; }
        };
        timers.push(setTimeout(tick, 700));
      }
      function end(res) {
        phase = 'over'; const b = $('[data-act="start"]'); b.hidden = false; b.innerHTML = '🔄 Chơi lại <kbd>Enter</kbd>';
        if (res === 'win') { msg(`🎉 Bắt đủ ${NEED} bạn dê sau ${world.t.toFixed(1)} giây!`); Hub.toast('🐐 Bắt được rồi!', 'good'); Hub.sfx('gong'); }
        else { msg(`⌛ Hết giờ, mới bắt được ${world.caught}/${NEED} bạn. Thử lại nhé!`); Hub.toast('Hết giờ rồi!', 'bad'); }
        Hub.record('bit-mat', res);
      }
      function input() {
        const dir = { x: 0, y: 0 };
        if (keys.has('l')) dir.x -= 1; if (keys.has('r')) dir.x += 1;
        if (keys.has('u')) dir.y -= 1; if (keys.has('d')) dir.y += 1;
        return { dir, target };
      }
      function handleEvents() {
        for (const ev of world.events) {
          if (ev.type === 'call') Hub.sfx('tap');
          else { Hub.sfx('drum'); Hub.toast(`🐐 Bắt được 1 bạn! (${world.caught}/${NEED})`, 'good'); }
        }
        world.events.length = 0;
      }

      // ---------- Vẽ ----------
      const circle = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); };
      function emoji(ch, x, y, size) {
        g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, y + 1);
      }
      function draw() {
        const p = world.player;
        g.fillStyle = C['bg-2']; g.fillRect(0, 0, W, H);
        g.globalAlpha = 0.25; g.fillStyle = C.green; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
        for (const k of world.goats) {
          if (k.caught) continue;
          g.fillStyle = C.paper; circle(k.x, k.y, k.r); g.fill();
          g.strokeStyle = C.ink; g.globalAlpha = 0.35; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1;
          emoji('🐐', k.x, k.y, k.r * 1.4);
        }
        // tấm vải bịt mắt: tối đen, chỉ chừa vòng sáng mờ quanh người chơi
        const gr = g.createRadialGradient(p.x, p.y, SIGHT * 0.35, p.x, p.y, SIGHT);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.96)');
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        g.fillStyle = C.paper; circle(p.x, p.y, p.r); g.fill();
        g.strokeStyle = C.accent; g.lineWidth = 2; g.stroke();
        emoji('🙈', p.x, p.y, p.r * 1.4);
        for (const k of world.goats) {                          // bong bóng "be be" luôn thấy được, mờ dần
          if (k.caught || k.bubble <= 0) continue;
          g.globalAlpha = Math.min(1, k.bubble / 0.35);
          g.fillStyle = C.paper; g.strokeStyle = C.accent; g.lineWidth = 2;
          const bx = Math.max(34, Math.min(W - 34, k.x)), by = Math.max(26, k.y - 26);
          g.beginPath(); g.roundRect ? g.roundRect(bx - 32, by - 13, 64, 26, 12) : g.rect(bx - 32, by - 13, 64, 26); g.fill(); g.stroke();
          g.fillStyle = C.ink; g.font = 'bold 15px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText('be be!', bx, by + 1); g.globalAlpha = 1;
        }
        g.fillStyle = C.paper; g.font = 'bold 18px system-ui, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
        g.fillText(`🐐 ${world.caught}/${NEED}`, 12, 8);
        g.textAlign = 'right';
        if (phase === 'run' || phase === 'over') g.fillText(`⏱ ${Math.max(0, DURATION - world.t).toFixed(1)}s`, W - 12, 8);
        if (phase === 'count') {
          g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.gold; g.font = 'bold 54px system-ui, sans-serif';
          g.fillText(String(countdown), W / 2, H / 2 - 60);
        }
        if (target && phase === 'run') { g.strokeStyle = C.accent; g.globalAlpha = 0.5; g.lineWidth = 2; circle(target.x, target.y, 6); g.stroke(); g.globalAlpha = 1; }
      }

      function frame(now) {
        if (!ctx.alive()) return;
        const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
        if (phase === 'count') movePlayer(world.player, input(), dt);
        if (phase === 'run') {
          acc += dt;
          while (acc >= DT && phase === 'run') { acc -= DT; const r = stepWorld(world, input(), DT); handleEvents(); if (r) end(r); }
        }
        draw();
        raf = requestAnimationFrame(frame);
      }

      // ---------- Điều khiển ----------
      const toWorld = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
      const onPtr = (e) => { target = toWorld(e); keys.clear(); if (e.type === 'pointerdown' && cv.setPointerCapture) cv.setPointerCapture(e.pointerId); };
      cv.addEventListener('pointerdown', onPtr);
      cv.addEventListener('pointermove', onPtr);
      const KEYMAP = { ArrowLeft: 'l', a: 'l', A: 'l', ArrowRight: 'r', d: 'r', D: 'r', ArrowUp: 'u', w: 'u', W: 'u', ArrowDown: 'd', s: 'd', S: 'd' };
      const offKey = Hub.onKey((e) => {
        if (e.key === 'Enter') { e.preventDefault(); return begin(); }
        const k = KEYMAP[e.key];
        if (k && (phase === 'run' || phase === 'count')) { e.preventDefault(); keys.add(k); target = null; }
      });
      const onKeyUp = (e) => { const k = KEYMAP[e.key]; if (k) keys.delete(k); };
      const onBlur = () => keys.clear();
      document.addEventListener('keyup', onKeyUp);
      window.addEventListener('blur', onBlur);
      const onClick = (e) => {
        const lv = e.target.closest('[data-level]');
        if (lv) {
          if (phase === 'run' || phase === 'count') return Hub.toast('Đang chơi, đổi độ khó sau nhé!');
          level = lv.dataset.level; Hub.store.set('bm:level', level); world = makeWorld(level);
          lv.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === lv));
          return;
        }
        if (e.target.closest('[data-act]')) begin();
      };
      root.addEventListener('click', onClick);

      readColors();
      const mo = new MutationObserver(readColors);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
      if (mq && mq.addEventListener) mq.addEventListener('change', readColors);
      window.addEventListener('resize', resize);
      resize();
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf); clearTimers(); offKey();
        document.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', onBlur);
        window.removeEventListener('resize', resize); root.removeEventListener('click', onClick);
        mo.disconnect(); if (mq && mq.removeEventListener) mq.removeEventListener('change', readColors);
        cv.removeEventListener('pointerdown', onPtr); cv.removeEventListener('pointermove', onPtr);
      };
    },
  });

  if (typeof module !== 'undefined') module.exports = { makeWorld, stepWorld, fleeDir, touching, movePlayer, consts: { W, H, NEED, DURATION, DT, FLEE_DIST, LEVELS } };
})();
