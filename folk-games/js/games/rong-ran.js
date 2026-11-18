/* Rồng rắn lên mây: hát đối đáp với thầy thuốc, rồi giữ đầu rồng chắn không cho thầy bắt được khúc đuôi.
 *
 * Toạ độ thế giới W×H. Đầu rồng (bạn điều khiển) chạy tới con trỏ với tốc độ tối đa; các bạn phía sau
 * nối thành chuỗi, mỗi khúc cách khúc trước đúng SEG (ràng buộc dây). Thầy thuốc không đi xuyên được
 * đầu rồng và 2 khúc đầu, nên phải vòng qua. Sống sót 30 giây là thắng.
 */
(function () {
  'use strict';

  const W = 600, H = 400;
  const DT = 1 / 120;
  const SEG = 24, KIDS = 7, HEAD_R = 15, KID_R = 12, DOC_R = 15;
  const HEAD_V = 240;
  const BLOCKERS = 3;                  // đầu + 2 khúc đầu chắn được thầy thuốc
  const DURATION = 30;
  const LEVELS = {                     // tốc độ, nhìn trước đuôi (giây), mức lách vòng qua đầu rồng
    easy: { v: 120, look: 0, avoid: 0.4 },
    normal: { v: 165, look: 0.35, avoid: 1 },
    hard: { v: 195, look: 0.7, avoid: 1.6 },
  };

  // ---------- Logic thuần ----------
  const clampX = (p, r) => { p.x = Math.max(r, Math.min(W - r, p.x)); p.y = Math.max(r, Math.min(H - r, p.y)); };

  function makeWorld(level) {
    const segs = [];
    for (let i = 0; i <= KIDS; i++) segs.push({ x: 340 - i * SEG, y: H / 2, r: i ? KID_R : HEAD_R });
    const tail = segs[KIDS];
    return { segs, doc: { x: 570, y: H / 2, r: DOC_R }, prm: LEVELS[level] || LEVELS.normal,
      t: 0, tailV: { x: 0, y: 0 }, lastTail: { x: tail.x, y: tail.y }, result: null };
  }

  /** Đầu rồng: tiến về target (hoặc theo hướng dir) với tốc độ ≤ vmax. */
  function moveHead(head, input, vmax, dt) {
    let dx = 0, dy = 0;
    if (input && input.dir && (input.dir.x || input.dir.y)) {
      const l = Math.hypot(input.dir.x, input.dir.y); dx = input.dir.x / l * vmax * dt; dy = input.dir.y / l * vmax * dt;
    } else if (input && input.target) {
      dx = input.target.x - head.x; dy = input.target.y - head.y;
      const l = Math.hypot(dx, dy), m = vmax * dt;
      if (l > m) { dx = dx / l * m; dy = dy / l * m; }
    }
    head.x += dx; head.y += dy; clampX(head, head.r);
  }

  /** Mỗi khúc đứng cách khúc trước đúng spacing, theo hướng hiện tại của nó. */
  function followChain(segs, spacing) {
    for (let i = 1; i < segs.length; i++) {
      const p = segs[i - 1], s = segs[i];
      let dx = s.x - p.x, dy = s.y - p.y, l = Math.hypot(dx, dy);
      if (l < 1e-6) { dx = -1; dy = 0; l = 1; }
      s.x = p.x + dx / l * spacing; s.y = p.y + dy / l * spacing;
    }
  }

  /** Đẩy thầy thuốc ra khỏi các vật chắn (không cho đi xuyên). */
  function resolveBlock(doc, blockers) {
    for (const b of blockers) {
      const dx = doc.x - b.x, dy = doc.y - b.y, l = Math.hypot(dx, dy), min = doc.r + b.r;
      if (l < min) {
        const nx = l > 1e-6 ? dx / l : 1, ny = l > 1e-6 ? dy / l : 0;
        doc.x = b.x + nx * min; doc.y = b.y + ny * min;
      }
    }
  }

  /** Thầy thuốc chạy về phía target, lách vòng qua vật chắn nằm trên đường đi. */
  function stepDoctor(doc, target, blockers, prm, dt) {
    let dx = target.x - doc.x, dy = target.y - doc.y;
    const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    let sx = dx, sy = dy;
    for (const b of blockers) {
      const bx = b.x - doc.x, by = b.y - doc.y, bl = Math.hypot(bx, by) || 1;
      const ahead = bx * dx + by * dy;                 // vật chắn ở phía trước?
      const side = Math.abs(bx * dy - by * dx);        // khoảng cách ngang tới đường thẳng tới đích
      if (ahead <= 0 || ahead > l + b.r || bl > 130 || side > b.r + doc.r + 8) continue;
      let tx = -by / bl, ty = bx / bl;                 // tiếp tuyến; chọn phía gần đích hơn
      if (tx * (target.x - b.x) + ty * (target.y - b.y) < 0) { tx = -tx; ty = -ty; }
      const k = prm.avoid * (1 - bl / 130) * 2;
      sx += tx * k; sy += ty * k;
    }
    const sl = Math.hypot(sx, sy) || 1;
    doc.x += sx / sl * prm.v * dt; doc.y += sy / sl * prm.v * dt;
    resolveBlock(doc, blockers);
    clampX(doc, doc.r);
  }

  const touching = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;

  /** Một bước cố định. Trả về 'win' | 'lose' | null. */
  function stepWorld(w, input, dt) {
    if (w.result) return w.result;
    const segs = w.segs, tail = segs[segs.length - 1];
    moveHead(segs[0], input, HEAD_V, dt);
    followChain(segs, SEG);
    // vận tốc đuôi (làm mượt) để thầy thuốc đoán trước
    const vx = (tail.x - w.lastTail.x) / dt, vy = (tail.y - w.lastTail.y) / dt;
    w.tailV.x += (vx - w.tailV.x) * 0.1; w.tailV.y += (vy - w.tailV.y) * 0.1;
    w.lastTail.x = tail.x; w.lastTail.y = tail.y;
    const tgt = { x: tail.x + w.tailV.x * w.prm.look, y: tail.y + w.tailV.y * w.prm.look };
    clampX(tgt, DOC_R);
    stepDoctor(w.doc, tgt, segs.slice(0, BLOCKERS), w.prm, dt);
    w.t += dt;
    if (touching(w.doc, tail)) w.result = 'lose';
    else if (w.t >= DURATION) w.result = 'win';
    return w.result;
  }

  const CHANT = [
    ['rr', 'Rồng rắn lên mây'], ['rr', 'Có cây núc nắc'], ['rr', 'Có nhà điểm binh'],
    ['rr', 'Hỏi thăm thầy thuốc'], ['rr', 'Có nhà hay không?'], ['tt', 'Thầy thuốc đi chơi!'],
    ['rr', 'Rồng rắn lên mây… Có nhà hay không?'], ['tt', 'Thầy thuốc ở nhà! Xin khúc đuôi!'],
    ['rr', 'Tha hồ mà đuổi! 🏃'],
  ];

  Hub.register({
    id: 'rong-ran',
    name: 'Rồng rắn lên mây',
    icon: '🐉',
    tagline: 'Hát đối đáp với thầy thuốc rồi dang tay che cho khúc đuôi.',
    players: '1 người · đấu máy',
    rules: `
      <ol>
        <li>Cả bọn nối đuôi nhau thành con rồng, vừa đi vừa hát đối đáp với <b>thầy thuốc</b>.</li>
        <li>Khi thầy thuốc đòi <b>“xin khúc đuôi”</b>, cuộc đuổi bắt bắt đầu.</li>
        <li>Bạn là <b>đầu rồng</b> 🐲: di chuột / chạm vào sân để chạy về phía đó, hoặc dùng <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> / <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>.</li>
        <li>Thầy thuốc không đi xuyên được đầu rồng và hai bạn đầu tiên. Hãy giữ đầu rồng chắn giữa thầy và khúc đuôi.</li>
        <li>Giữ đuôi an toàn <b>${DURATION} giây</b> là thắng; thầy chạm được bạn cuối hàng là thua.</li>
      </ol>
      <p class="muted">Lời đồng dao có nhiều dị bản; phần đối đáp ở đây được rút gọn cho vui.</p>`,

    render(root, ctx) {
      let level = Hub.store.get('rr:level', 'normal');
      let world = makeWorld(level), phase = 'idle', countdown = 0, raf = 0, last = 0, acc = 0, timers = [];
      let target = null;
      const keys = new Set();
      const C = {};

      root.innerHTML = `
        ${Hub.modeBar({ levels: [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']], level })}
        <div class="rr-chant" aria-live="polite"></div>
        <div class="rr-wrap"><canvas class="rr-canvas" aria-label="Sân chơi rồng rắn: di chuột hoặc chạm để dẫn đầu rồng"></canvas></div>
        <p class="rr-msg" aria-live="polite">Bấm Bắt đầu để cùng hát nào!</p>
        <div class="row center">
          <button class="btn primary" data-act="start">▶️ Bắt đầu <kbd>Enter</kbd></button>
          <button class="btn" data-act="skip" hidden>⏭️ Bỏ qua lời hát <kbd>Enter</kbd></button>
        </div>`;
      const $ = (q) => root.querySelector(q);
      const cv = $('.rr-canvas'), g = cv.getContext('2d');
      const chantEl = $('.rr-chant');
      const msg = (t) => { $('.rr-msg').textContent = t; };
      const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

      function readColors() {
        const cs = getComputedStyle(document.documentElement);
        for (const k of ['bg', 'bg-2', 'paper', 'ink', 'muted', 'line', 'accent', 'gold', 'wood', 'wood-2', 'green', 'bad', 'p1', 'p2']) {
          C[k] = cs.getPropertyValue('--' + k).trim() || '#888';
        }
      }
      function resize() {
        const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 300, s = w / W;
        cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
        cv.style.height = (w * H / W) + 'px';
        g.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
      }

      function setButtons(start, skip) { $('[data-act="start"]').hidden = !start; $('[data-act="skip"]').hidden = !skip; }

      function begin() {
        if (phase === 'chant') return chase();
        if (phase === 'count' || phase === 'run') return;
        clearTimers();
        world = makeWorld(level); target = null;
        phase = 'chant'; chantEl.innerHTML = ''; setButtons(false, true); msg('');
        CHANT.forEach(([who, text], i) => timers.push(setTimeout(() => {
          if (!ctx.alive()) return;
          const p = document.createElement('p');
          p.className = 'rr-line ' + who;
          p.innerHTML = `<b>${who === 'rr' ? '🐉 Rồng rắn' : '🧑‍⚕️ Thầy thuốc'}:</b> ${Hub.esc(text)}`;
          chantEl.appendChild(p);
          while (chantEl.children.length > 4) chantEl.firstChild.remove();
        }, i * 900)));
        timers.push(setTimeout(() => { if (ctx.alive() && phase === 'chant') chase(); }, CHANT.length * 900 + 600));
      }
      function chase() {
        clearTimers();
        phase = 'count'; countdown = 3; setButtons(false, false);
        msg('Giữ đầu rồng chắn trước thầy thuốc!');
        const tick = () => {
          if (!ctx.alive()) return;
          countdown--;
          if (countdown > 0) timers.push(setTimeout(tick, 700));
          else { phase = 'run'; acc = 0; }
        };
        timers.push(setTimeout(tick, 700));
      }
      function end(res) {
        phase = 'over'; setButtons(true, false);
        $('[data-act="start"]').innerHTML = '🔄 Chơi lại <kbd>Enter</kbd>';
        if (res === 'win') { msg(`🎉 Giữ được khúc đuôi trọn ${DURATION} giây. Rồng thắng!`); Hub.toast('🐉 Rồng rắn thắng!', 'good'); }
        else { msg(`😆 Thầy thuốc bắt được khúc đuôi sau ${world.t.toFixed(1)} giây!`); Hub.toast('Bị bắt mất đuôi rồi!', 'bad'); }
        Hub.record('rong-ran', res);
      }

      function input() {
        const dir = { x: 0, y: 0 };
        if (keys.has('l')) dir.x -= 1; if (keys.has('r')) dir.x += 1;
        if (keys.has('u')) dir.y -= 1; if (keys.has('d')) dir.y += 1;
        return { dir, target };
      }

      // ---------- Vẽ ----------
      const COLORS = ['p1', 'gold', 'green', 'p2', 'accent', 'wood-2', 'p1'];
      function circle(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
      function emoji(ch, x, y, size) {
        g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, y + 1);
      }
      function body(p, fill, face) {
        g.fillStyle = 'rgba(0,0,0,.22)'; circle(p.x + 2, p.y + 3, p.r); g.fill();
        g.fillStyle = fill; circle(p.x, p.y, p.r); g.fill();
        g.strokeStyle = C.ink; g.globalAlpha = 0.35; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1;
        emoji(face, p.x, p.y, p.r * 1.25);
      }
      function draw() {
        g.fillStyle = C['bg-2']; g.fillRect(0, 0, W, H);
        g.globalAlpha = 0.22; g.fillStyle = C.green; g.fillRect(0, 0, W, H);
        g.globalAlpha = 0.18; g.strokeStyle = C.paper; g.lineWidth = 3;
        circle(W / 2, H / 2, 140); g.stroke(); g.globalAlpha = 1;
        const segs = world.segs, tail = segs[segs.length - 1];
        // dây tay nắm
        g.strokeStyle = C.wood; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
        g.beginPath(); segs.forEach((s, i) => (i ? g.lineTo(s.x, s.y) : g.moveTo(s.x, s.y))); g.stroke();
        // vòng báo khúc đuôi
        g.strokeStyle = C.accent; g.lineWidth = 2.5; g.setLineDash([5, 4]);
        circle(tail.x, tail.y, tail.r + 6); g.stroke(); g.setLineDash([]);
        for (let i = segs.length - 1; i >= 1; i--) body(segs[i], C[COLORS[(i - 1) % COLORS.length]], i === segs.length - 1 ? '😨' : '🙂');
        body(segs[0], C.accent, '🐲');
        body(world.doc, C.paper, '🧑‍⚕️');
        // HUD
        g.fillStyle = C.ink; g.font = 'bold 20px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
        if (phase === 'run' || phase === 'over') g.fillText(`⏱ ${Math.max(0, DURATION - world.t).toFixed(1)}s`, W / 2, 10);
        if (phase === 'count') {
          g.globalAlpha = 0.85; g.fillStyle = C.paper; circle(W / 2, H / 2, 46); g.fill(); g.globalAlpha = 1;
          g.fillStyle = C.accent; g.font = 'bold 54px system-ui, sans-serif'; g.textBaseline = 'middle';
          g.fillText(String(countdown), W / 2, H / 2 + 2);
        }
        if (target && phase === 'run') { g.strokeStyle = C.accent; g.globalAlpha = 0.5; g.lineWidth = 2; circle(target.x, target.y, 6); g.stroke(); g.globalAlpha = 1; }
      }

      function frame(now) {
        if (!ctx.alive()) return;
        const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
        if (phase === 'count') {                     // đếm ngược: đầu rồng được chạy trước để vào thế
          moveHead(world.segs[0], input(), HEAD_V, dt); followChain(world.segs, SEG);
          const tl = world.segs[KIDS]; world.lastTail.x = tl.x; world.lastTail.y = tl.y;
        }
        if (phase === 'run') {
          acc += dt;
          while (acc >= DT && phase === 'run') {
            acc -= DT;
            const r = stepWorld(world, input(), DT);
            if (r) end(r);
          }
        }
        draw();
        raf = requestAnimationFrame(frame);
      }

      // ---------- Điều khiển ----------
      const toWorld = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
      const onPtr = (e) => {
        target = toWorld(e); keys.clear();
        if (e.type === 'pointerdown' && cv.setPointerCapture) cv.setPointerCapture(e.pointerId);
      };
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

      root.addEventListener('click', (e) => {
        const lv = e.target.closest('[data-level]');
        if (lv) {
          if (phase === 'run' || phase === 'count') return Hub.toast('Đang chơi, đổi độ khó sau nhé!');
          level = lv.dataset.level; Hub.store.set('rr:level', level); world = makeWorld(level);
          lv.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === lv));
          return;
        }
        const a = e.target.closest('[data-act]');
        if (a) begin();
      });

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
        window.removeEventListener('resize', resize);
        mo.disconnect(); if (mq && mq.removeEventListener) mq.removeEventListener('change', readColors);
        cv.removeEventListener('pointerdown', onPtr); cv.removeEventListener('pointermove', onPtr);
      };
    },
  });

  // để kiểm thử bằng Node
  if (typeof module !== 'undefined') module.exports = { makeWorld, moveHead, followChain, resolveBlock, stepDoctor, stepWorld, touching, consts: { W, H, SEG, KIDS, DURATION, DT, BLOCKERS, LEVELS } };
})();
