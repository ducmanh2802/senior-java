/* Mèo đuổi chuột: bạn là chuột luồn qua các lỗ hổng giữa những bạn nắm tay thành vòng tròn.
 *
 * Luật đường đi: vòng tròn chặn tất cả, chỉ đi xuyên vòng (từ trong ra ngoài hoặc ngược lại) được
 * ở khe giữa hai bạn. Mèo chỉ được xuyên vòng qua đúng khe mà chuột vừa chui qua gần nhất (lastGap).
 * Sống sót 30 giây là thắng; mèo chạm chuột là thua. Toạ độ thế giới W×H, bước cố định 1/120 giây.
 */
(function () {
  'use strict';

  const W = 600, H = 400, CX = W / 2, CY = H / 2;
  const N = 12, R = 130, STEP = Math.PI * 2 / N, KID_R = 11, MOUSE_R = 8, CAT_R = 11;
  const DT = 1 / 120, DURATION = 30, MOUSE_V = 150;
  const LEVELS = { easy: { v: 105 }, normal: { v: 130 }, hard: { v: 148 } };

  // ---------- Logic thuần ----------
  const TAU = Math.PI * 2;
  const angleOf = (p) => ((Math.atan2(p.y - CY, p.x - CX) % TAU) + TAU) % TAU;
  const radiusOf = (p) => Math.hypot(p.x - CX, p.y - CY);
  /** 0 = trong vòng, 1 = ngoài vòng */
  const sideOf = (p) => (radiusOf(p) < R ? 0 : 1);
  /** Khe số i nằm giữa bạn i và bạn i+1 (bạn i đứng ở góc i·STEP) */
  const sectorOf = (p) => Math.floor(angleOf(p) / STEP) % N;
  const gapPoint = (i, rad) => ({ x: CX + Math.cos((i + 0.5) * STEP) * rad, y: CY + Math.sin((i + 0.5) * STEP) * rad });
  const clampX = (p, r) => { p.x = Math.max(r, Math.min(W - r, p.x)); p.y = Math.max(r, Math.min(H - r, p.y)); };

  function makeKids() {
    const kids = [];
    for (let i = 0; i < N; i++) kids.push({ x: CX + Math.cos(i * STEP) * R, y: CY + Math.sin(i * STEP) * R, r: KID_R });
    return kids;
  }

  function makeWorld(level, rnd) {
    const gap = Math.floor((rnd || Math.random)() * N);
    const a = (gap + 0.5) * STEP;
    return { kids: makeKids(), prm: LEVELS[level] || LEVELS.normal, t: 0, result: null,
      lastGap: gap,                                              // khe chuột vừa dùng (lúc đầu: ngẫu nhiên)
      mouse: { x: CX - Math.cos(a) * 40, y: CY - Math.sin(a) * 40, r: MOUSE_R },
      cat: { x: CX + Math.cos(a) * (R + 90), y: CY + Math.sin(a) * (R + 90), r: CAT_R } };
  }

  /** Đẩy p ra khỏi các bạn trong vòng (chuột và mèo không đi xuyên người). */
  function resolveKids(p, kids) {
    for (const k of kids) {
      const dx = p.x - k.x, dy = p.y - k.y, l = Math.hypot(dx, dy), min = p.r + k.r;
      if (l < min) { const nx = l > 1e-6 ? dx / l : 1, ny = l > 1e-6 ? dy / l : 0; p.x = k.x + nx * min; p.y = k.y + ny * min; }
    }
  }

  function moveToward(p, tx, ty, v, dt) {
    let dx = tx - p.x, dy = ty - p.y; const l = Math.hypot(dx, dy), m = v * dt;
    if (l > m) { dx = dx / l * m; dy = dy / l * m; }
    p.x += dx; p.y += dy;
  }

  /** Chuột đi tới target hoặc theo hướng dir; nếu đổi bên vòng thì ghi lại khe vừa chui. */
  function stepMouse(w, input, dt) {
    const m = w.mouse, before = sideOf(m);
    if (input && input.dir && (input.dir.x || input.dir.y)) {
      const l = Math.hypot(input.dir.x, input.dir.y);
      m.x += input.dir.x / l * MOUSE_V * dt; m.y += input.dir.y / l * MOUSE_V * dt;
    } else if (input && input.target) moveToward(m, input.target.x, input.target.y, MOUSE_V, dt);
    resolveKids(m, w.kids); clampX(m, m.r);
    if (sideOf(m) !== before) w.lastGap = sectorOf(m);
  }

  /** Luật xuyên vòng của mèo: đổi bên chỉ được nếu ở đúng khe lastGap, ngược lại bị ép về bên cũ. */
  function constrainCat(cat, prevSide, lastGap) {
    if (sideOf(cat) === prevSide) return false;
    if (lastGap != null && sectorOf(cat) === lastGap) return false;
    const a = Math.atan2(cat.y - CY, cat.x - CX), rad = prevSide === 0 ? R - 0.5 : R + 0.5;
    cat.x = CX + Math.cos(a) * rad; cat.y = CY + Math.sin(a) * rad;
    return true;
  }

  /** Mèo ở ngoài vòng mà đường thẳng tới đích cắt vòng thì đi vòng ngoài theo hướng ngắn hơn. */
  function aroundRing(c, t) {
    if (sideOf(c) === 0 || sideOf(t) === 0 || !segmentHitsRing(c, t, R + 14)) return t;
    let d = angleOf(t) - angleOf(c); d = ((d + Math.PI) % TAU + TAU) % TAU - Math.PI;
    const a = angleOf(c) + Math.sign(d || 1) * 0.4;
    return { x: CX + Math.cos(a) * (R + 26), y: CY + Math.sin(a) * (R + 26) };
  }

  /** Điểm mèo nhắm tới: cùng bên với chuột thì đuổi thẳng, khác bên thì ra khe lastGap rồi chui qua. */
  function catTarget(w) {
    const c = w.cat, m = w.mouse, cs = sideOf(c);
    if (cs !== sideOf(m)) {
      const g = gapPoint(w.lastGap, R), near = Math.hypot(c.x - g.x, c.y - g.y) < 26;
      return aroundRing(c, near ? gapPoint(w.lastGap, R + (cs === 0 ? 40 : -40)) : gapPoint(w.lastGap, R + (cs === 0 ? -16 : 16)));
    }
    return aroundRing(c, m);
  }

  function segmentHitsRing(a, b, rad) {
    const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((CX - a.x) * dx + (CY - a.y) * dy) / l2));
    return Math.hypot(a.x + dx * t - CX, a.y + dy * t - CY) < rad;
  }

  function stepCat(w, dt) {
    const c = w.cat, side = sideOf(c), t = catTarget(w);
    moveToward(c, t.x, t.y, w.prm.v, dt);
    resolveKids(c, w.kids); clampX(c, c.r);
    constrainCat(c, side, w.lastGap);
  }

  const touching = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;

  /** Một bước cố định. Trả về 'win' | 'lose' | null. */
  function stepWorld(w, input, dt) {
    if (w.result) return w.result;
    stepMouse(w, input, dt); stepCat(w, dt); w.t += dt;
    if (touching(w.cat, w.mouse)) w.result = 'lose';
    else if (w.t >= DURATION) w.result = 'win';
    return w.result;
  }

  const CHANT = ['Mèo đuổi chuột', 'Mời bạn ra đây', 'Tay nắm chặt tay', 'Đứng thành vòng rộng',
    'Chuột luồn lỗ hổng', 'Chạy vội chạy mau', 'Mèo đuổi đằng sau', 'Trốn đâu cho thoát.'];

  if (typeof Hub !== 'undefined') Hub.register({
    id: 'meo-duoi-chuot',
    name: 'Mèo đuổi chuột',
    icon: '🐈',
    tagline: 'Chuột luồn lỗ hổng giữa vòng người, mèo chỉ chui theo đúng lối chuột vừa đi.',
    players: '1 người · đấu máy',
    rules: `
      <ol>
        <li>Các bạn nắm tay đứng thành vòng tròn. Bạn là <b>chuột</b> 🐭, máy là <b>mèo</b> 🐈.</li>
        <li>Di chuột / chạm vào sân để chạy về phía đó, hoặc dùng <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> / <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>.</li>
        <li>Vòng người chắn kín, chỉ <b>chui qua khe hở</b> giữa hai bạn để vào hoặc ra vòng.</li>
        <li>Mèo cũng bị vòng chắn: nó chỉ chui được qua <b>khe chuột vừa chui qua gần nhất</b> (khe có nét đứt trên sân).</li>
        <li>Trốn đủ <b>${DURATION} giây</b> là thắng; mèo chạm chuột là thua. Hãy đổi khe liên tục để mèo phải chạy vòng!</li>
      </ol>
      <p class="muted">Lời đồng dao có nhiều dị bản; trò chơi dùng một bản phổ biến.</p>`,

    render(root, ctx) {
      let level = Hub.store.get('mdc:level', 'normal');
      let world = makeWorld(level), phase = 'idle', countdown = 0, raf = 0, last = 0, acc = 0, timers = [], target = null;
      const keys = new Set(), C = {};

      root.innerHTML = `
        ${Hub.modeBar({ levels: [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']], level })}
        <div class="mdc-chant" aria-live="polite"></div>
        <div class="mdc-wrap"><canvas class="mdc-canvas" aria-label="Sân chơi mèo đuổi chuột: di chuột hoặc chạm để dẫn chuột chạy"></canvas></div>
        <p class="mdc-msg" aria-live="polite">Bấm Bắt đầu để cùng đọc đồng dao nào!</p>
        <div class="row center">
          <button class="btn primary" data-act="start">▶️ Bắt đầu <kbd>Enter</kbd></button>
          <button class="btn" data-act="skip" hidden>⏭️ Bỏ qua lời hát <kbd>Enter</kbd></button>
        </div>`;
      const $ = (q) => root.querySelector(q);
      const cv = $('.mdc-canvas'), g = cv.getContext('2d'), chantEl = $('.mdc-chant');
      const msg = (t) => { $('.mdc-msg').textContent = t; };
      const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
      const setButtons = (s, k) => { $('[data-act="start"]').hidden = !s; $('[data-act="skip"]').hidden = !k; };

      function readColors() {
        const cs = getComputedStyle(document.documentElement);
        for (const k of ['bg-2', 'paper', 'ink', 'muted', 'line', 'accent', 'gold', 'wood', 'wood-2', 'green', 'p1', 'p2']) C[k] = cs.getPropertyValue('--' + k).trim() || '#888';
      }
      function resize() {
        const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 300, s = w / W;
        cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
        cv.style.height = (w * H / W) + 'px';
        g.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
      }

      function begin() {
        if (phase === 'chant') return go();
        if (phase === 'count' || phase === 'run') return;
        clearTimers(); world = makeWorld(level); target = null;
        phase = 'chant'; chantEl.innerHTML = ''; setButtons(false, true); msg('');
        CHANT.forEach((text, i) => timers.push(setTimeout(() => {
          if (!ctx.alive()) return;
          const p = document.createElement('p');
          p.className = 'mdc-line'; p.textContent = '🎵 ' + text;
          chantEl.appendChild(p);
          while (chantEl.children.length > 4) chantEl.firstChild.remove();
        }, i * 800)));
        timers.push(setTimeout(() => { if (ctx.alive() && phase === 'chant') go(); }, CHANT.length * 800 + 500));
      }
      function go() {
        clearTimers(); phase = 'count'; countdown = 3; setButtons(false, false);
        msg('Chui qua khe hở, đừng để mèo bắt kịp!');
        const tick = () => {
          if (!ctx.alive()) return;
          if (--countdown > 0) timers.push(setTimeout(tick, 700)); else { phase = 'run'; acc = 0; }
        };
        timers.push(setTimeout(tick, 700));
      }
      function end(res) {
        phase = 'over'; setButtons(true, false);
        $('[data-act="start"]').innerHTML = '🔄 Chơi lại <kbd>Enter</kbd>';
        if (res === 'win') { msg(`🎉 Chuột trốn thoát sau ${DURATION} giây!`); Hub.toast('🐭 Chuột thắng!', 'good'); Hub.sfx('gong'); }
        else { msg(`😹 Mèo bắt được chuột sau ${world.t.toFixed(1)} giây!`); Hub.toast('Mèo bắt được chuột rồi!', 'bad'); }
        Hub.record('meo-duoi-chuot', res);
      }
      function input() {
        const dir = { x: 0, y: 0 };
        if (keys.has('l')) dir.x -= 1; if (keys.has('r')) dir.x += 1;
        if (keys.has('u')) dir.y -= 1; if (keys.has('d')) dir.y += 1;
        return { dir, target };
      }

      // ---------- Vẽ ----------
      const circle = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
      function emoji(ch, x, y, size) {
        g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, y + 1);
      }
      function body(p, fill, face) {
        g.fillStyle = 'rgba(0,0,0,.22)'; circle(p.x + 2, p.y + 3, p.r); g.fill();
        g.fillStyle = fill; circle(p.x, p.y, p.r); g.fill();
        g.strokeStyle = C.ink; g.globalAlpha = 0.35; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1;
        emoji(face, p.x, p.y, p.r * 1.3);
      }
      function draw() {
        g.fillStyle = C['bg-2']; g.fillRect(0, 0, W, H);
        g.globalAlpha = 0.22; g.fillStyle = C.green; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
        const ks = world.kids;
        g.strokeStyle = C.wood; g.lineWidth = 4; g.lineCap = 'round';     // tay nắm tay, chừa khe ở giữa
        ks.forEach((k, i) => {
          const n = ks[(i + 1) % N], gx = n.x - k.x, gy = n.y - k.y;
          g.beginPath(); g.moveTo(k.x + gx * 0.14, k.y + gy * 0.14); g.lineTo(k.x + gx * 0.36, k.y + gy * 0.36); g.stroke();
          g.beginPath(); g.moveTo(n.x - gx * 0.14, n.y - gy * 0.14); g.lineTo(n.x - gx * 0.36, n.y - gy * 0.36); g.stroke();
        });
        const a = ks[world.lastGap], b = ks[(world.lastGap + 1) % N];         // khe mèo được phép chui
        g.strokeStyle = C.accent; g.lineWidth = 3; g.setLineDash([5, 4]);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.setLineDash([]);
        ks.forEach((k, i) => body(k, C[['p1', 'gold', 'p2', 'wood-2'][i % 4]], '🙂'));
        body(world.mouse, C.paper, '🐭'); body(world.cat, C.paper, '🐈');
        g.fillStyle = C.ink; g.font = 'bold 20px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
        if (phase === 'run' || phase === 'over') g.fillText(`⏱ ${Math.max(0, DURATION - world.t).toFixed(1)}s`, W / 2, 8);
        if (phase === 'count') {
          g.globalAlpha = 0.85; g.fillStyle = C.paper; circle(W / 2, H / 2, 40); g.fill(); g.globalAlpha = 1;
          g.fillStyle = C.accent; g.font = 'bold 48px system-ui, sans-serif'; g.textBaseline = 'middle';
          g.fillText(String(countdown), W / 2, H / 2 + 2);
        }
        if (target && phase === 'run') { g.strokeStyle = C.accent; g.globalAlpha = 0.5; g.lineWidth = 2; circle(target.x, target.y, 6); g.stroke(); g.globalAlpha = 1; }
      }

      function frame(now) {
        if (!ctx.alive()) return;
        const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
        if (phase === 'count') { stepMouse(world, input(), dt); }
        if (phase === 'run') {
          acc += dt;
          while (acc >= DT && phase === 'run') { acc -= DT; const r = stepWorld(world, input(), DT); if (r) end(r); }
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
          level = lv.dataset.level; Hub.store.set('mdc:level', level); world = makeWorld(level);
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

  if (typeof module !== 'undefined') module.exports = { makeWorld, stepMouse, stepCat, stepWorld, constrainCat, sideOf, sectorOf, gapPoint, catTarget, touching, resolveKids, consts: { W, H, CX, CY, N, R, DURATION, DT, LEVELS } };
})();
