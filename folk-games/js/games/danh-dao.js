/* Đánh đáo (đánh đáo lỗ, bản đơn giản): ném "cái" từ vạch vào lỗ, va bật các đồng "đáo" ra khỏi vòng.
 *
 * Toạ độ thế giới: sân dọc W×H, y hướng xuống. Người ném đứng dưới vạch, lỗ ở phía trên.
 * Vật lý bước cố định DT: ma sát trượt (giảm tốc đều), va chạm tròn–tròn đàn hồi, bật tường.
 * Cùng góc + lực luôn cho cùng kết quả (không dùng ngẫu nhiên trong vật lý).
 */
(function () {
  'use strict';

  const W = 400, H = 540;
  const DT = 1 / 120;
  const FRIC = 300;               // giảm tốc do ma sát (đơn vị/s²)
  const MAXV = 650;               // tốc độ ném tối đa
  const START = { x: 200, y: 495 };
  const LINE_Y = 462;             // vạch ném
  const HOLE = { x: 200, y: 150, r: 12 };
  const CIRCLE_R = 70;            // vòng kẻ quanh lỗ
  const RING2 = 28;               // vòng trong: thưởng 2 điểm
  const FALL_V = 170;             // chậm hơn mức này khi qua lỗ thì rơi xuống lỗ
  const DISC_R = 11, COIN_R = 7, COIN_RING = 38, N_COINS = 5;
  const E_BODY = 0.9, E_WALL = 0.5;
  const THROWS = 5;
  const LEVELS = { easy: [0.12, 0.18], normal: [0.06, 0.09], hard: [0.03, 0.05] }; // [độ lệch góc, độ lệch lực]

  // ---------- Vật lý thuần ----------
  function makeState() {
    const bodies = [{ x: START.x, y: START.y, vx: 0, vy: 0, r: DISC_R, m: 1.6, disc: true }];
    for (let i = 0; i < N_COINS; i++) {
      const a = Math.PI / 2 + Math.PI / N_COINS + i * 2 * Math.PI / N_COINS; // khe hở quay về phía người ném
      bodies.push({ x: HOLE.x + COIN_RING * Math.cos(a), y: HOLE.y + COIN_RING * Math.sin(a), vx: 0, vy: 0, r: COIN_R, m: 1 });
    }
    return { bodies, inHole: false, moving: false, steps: 0 };
  }

  function launch(s, angle, power) {
    const p = Math.max(0, Math.min(1, power));
    const d = s.bodies[0];
    d.vx = Math.cos(angle) * p * MAXV; d.vy = Math.sin(angle) * p * MAXV;
    s.moving = true;
  }

  function collide(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const dist = Math.hypot(dx, dy), min = a.r + b.r;
    if (dist >= min || dist === 0) return false;
    const nx = dx / dist, ny = dy / dist;
    const ia = 1 / a.m, ib = 1 / b.m;
    const over = min - dist;                       // tách hai vật theo tỉ lệ nghịch khối lượng
    a.x -= nx * over * ia / (ia + ib); a.y -= ny * over * ia / (ia + ib);
    b.x += nx * over * ib / (ia + ib); b.y += ny * over * ib / (ia + ib);
    const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (vrel >= 0) return true;                    // đang tách ra thì thôi
    const j = -(1 + E_BODY) * vrel / (ia + ib);
    a.vx -= j * ia * nx; a.vy -= j * ia * ny;
    b.vx += j * ib * nx; b.vy += j * ib * ny;
    return true;
  }

  function step(s) {
    const B = s.bodies;
    for (const b of B) {
      if (b.gone) continue;
      const v = Math.hypot(b.vx, b.vy);
      if (v > 0) {
        const nv = Math.max(0, v - FRIC * DT);
        b.vx *= nv / v; b.vy *= nv / v;
      }
      b.x += b.vx * DT; b.y += b.vy * DT;
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * E_WALL; }
      if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * E_WALL; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * E_WALL; }
      if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * E_WALL; }
    }
    for (let i = 0; i < B.length; i++) for (let k = i + 1; k < B.length; k++) {
      if (!B[i].gone && !B[k].gone) collide(B[i], B[k]);
    }
    const d = B[0];
    if (!d.gone && Math.hypot(d.x - HOLE.x, d.y - HOLE.y) < HOLE.r && Math.hypot(d.vx, d.vy) < FALL_V) {
      d.gone = true; s.inHole = true; d.x = HOLE.x; d.y = HOLE.y; d.vx = d.vy = 0;
    }
    s.steps++;
    s.moving = B.some((b) => !b.gone && (b.vx || b.vy));
  }

  function score(s) {
    const B = s.bodies;
    const knocked = B.slice(1).filter((c) => Math.hypot(c.x - HOLE.x, c.y - HOLE.y) > CIRCLE_R).length;
    const dist = Math.hypot(B[0].x - HOLE.x, B[0].y - HOLE.y);
    const base = s.inHole ? 5 : dist <= RING2 ? 2 : dist <= CIRCLE_R ? 1 : 0;
    return { total: base + knocked, inHole: s.inHole, knocked, ring: s.inHole ? 0 : base };
  }

  /** Mô phỏng trọn một lần ném (dùng cho kiểm thử). */
  function simulate(angle, power) {
    const s = makeState();
    launch(s, angle, power);
    while (s.moving && s.steps < 120 * 30) step(s);
    return Object.assign(score(s), { state: s });
  }

  /** Máy ngắm vào lỗ: lực vừa đủ để dừng đúng lỗ, cộng nhiễu theo độ khó. rnd() ∈ [0,1). */
  function cpuAim(level, rnd) {
    const [sa, sp] = LEVELS[level] || LEVELS.normal;
    const g = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;      // xấp xỉ phân phối chuông trong [-1, 1]
    const dx = HOLE.x - START.x, dy = HOLE.y - START.y;
    const v = Math.sqrt(2 * FRIC * Math.hypot(dx, dy)) * 1.04;
    return { angle: Math.atan2(dy, dx) + g() * sa * 2, power: v / MAXV * (1 + g() * sp * 2) };
  }

  Hub.register({
    id: 'danh-dao',
    name: 'Đánh đáo',
    icon: '🪙',
    tagline: 'Ném "cái" thật khéo vào lỗ, bật đồng đáo văng khỏi vòng.',
    players: '1 người · đấu máy',
    rules: `
      <ul>
        <li>Mỗi người có một <b>cái</b> (đồng xu dẹt). Giữa sân có <b>lỗ</b>, quanh lỗ là vòng kẻ với 5 đồng <b>đáo</b>.</li>
        <li>Đứng sau vạch ném: <b>kéo ngược</b> trên sân rồi thả như ná cao su (hướng kéo = hướng ném, kéo dài = mạnh),
          hoặc dùng <kbd>←</kbd>/<kbd>→</kbd> để ngắm và <b>giữ</b> <kbd>Space</kbd> để lấy lực, thả ra để ném.</li>
      </ul>
      <ol>
        <li><b>Cái lọt lỗ</b>: 5 điểm.</li>
        <li>Mỗi đồng đáo <b>văng ra khỏi vòng</b>: 1 điểm.</li>
        <li>Không lọt lỗ thì được thưởng theo vòng: trong vòng nhỏ 2 điểm, trong vòng lớn 1 điểm.</li>
      </ol>
      <p>Bạn và máy ném xen kẽ, mỗi bên ${THROWS} lượt; đáo được xếp lại sau mỗi lượt. Ai nhiều điểm hơn thì thắng.</p>
      <p class="muted">Ngày xưa đáo là đồng xu, đồng chinh; trẻ con quê hay chơi bằng mảnh sành, nắp chai đập dẹt.</p>`,

    render(root, ctx) {
      let level = Hub.store.get('dd:level', 'normal');
      let sim, turn, pts, phase, aim, power, drag, charging, chargeT, timers = [], raf = 0, last = 0, acc = 0;
      let C = {};

      root.innerHTML = `
        ${Hub.modeBar({ levels: [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']], level })}
        <div class="dd-score">
          <div class="pl p0"><span><span class="mini p1"></span>Bạn</span><span class="dd-n">0/${THROWS}</span><b>0</b></div>
          <div class="pl p1"><span><span class="mini p2"></span>Máy</span><span class="dd-n">0/${THROWS}</span><b>0</b></div>
        </div>
        <div class="dd-wrap"><canvas class="dd-canvas" aria-label="Sân đánh đáo: kéo ngược để ngắm và ném"></canvas></div>
        <p class="dd-msg" aria-live="polite"></p>
        <p class="dd-help muted small center">Kéo ngược rồi thả · <kbd>←</kbd><kbd>→</kbd> ngắm · giữ <kbd>Space</kbd> lấy lực</p>
        <div class="row center"><button class="btn" data-act="new">🔄 Ván mới <kbd>N</kbd></button></div>`;
      const $ = (q) => root.querySelector(q);
      const cv = $('.dd-canvas'), g = cv.getContext('2d');
      const pls = root.querySelectorAll('.pl');
      const msg = (t) => { $('.dd-msg').textContent = t; };
      const later = (fn, ms) => { timers.push(setTimeout(() => { if (ctx.alive()) fn(); }, ms)); };

      function readColors() {
        const cs = getComputedStyle(document.documentElement);
        for (const k of ['bg', 'bg-2', 'paper', 'ink', 'muted', 'line', 'accent', 'gold', 'wood', 'wood-2', 'green', 'bad', 'p1', 'p2']) {
          C[k] = cs.getPropertyValue('--' + k).trim() || '#888';
        }
      }
      let scale = 1;
      function resize() {
        const dpr = window.devicePixelRatio || 1;
        const w = cv.clientWidth || 300;
        scale = w / W;
        cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
        cv.style.height = (w * H / W) + 'px';
        g.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      }

      function newGame() {
        timers.forEach(clearTimeout); timers = [];
        turn = 0; pts = [0, 0];
        startTurn();
      }
      function startTurn() {
        sim = makeState(); aim = -Math.PI / 2; power = 0; drag = null; charging = false;
        const who = turn % 2;
        phase = who === 0 ? 'aim' : 'cpu';
        updateScore();
        if (who === 0) { msg(`Lượt ${Math.floor(turn / 2) + 1}/${THROWS}: tới bạn ném!`); }
        else {
          msg('Máy đang ngắm…');
          const t = cpuAim(level, Math.random);
          const a0 = aim;
          const t0 = performance.now();
          const anim = () => {                       // cho máy "ngắm" từ từ trước khi ném
            if (!ctx.alive() || phase !== 'cpu') return;
            const k = Math.min(1, (performance.now() - t0) / 900);
            aim = a0 + (t.angle - a0) * k; power = t.power * k;
            if (k < 1) timers.push(setTimeout(anim, 30)); else throwNow(t.angle, t.power);
          };
          later(anim, 300);
        }
      }
      function throwNow(a, p) {
        if (phase === 'aim' && p < 0.04) { power = 0; charging = false; drag = null; msg('Nhẹ quá, kéo dài hơn nhé!'); return; }
        launch(sim, a, p); phase = 'moving'; power = 0; drag = null; charging = false;
      }
      function endThrow() {
        const who = turn % 2, r = score(sim);
        pts[who] += r.total;
        const parts = [];
        if (r.inHole) parts.push('lọt lỗ +5');
        if (r.knocked) parts.push(`${r.knocked} đáo văng +${r.knocked}`);
        if (r.ring) parts.push(`gần lỗ +${r.ring}`);
        msg(`${who ? 'Máy' : 'Bạn'}: ${parts.length ? parts.join(', ') : 'trượt, 0 điểm'}.`);
        if (who === 0 && r.inHole) Hub.toast('🎯 Lọt lỗ!', 'good');
        turn++; phase = 'result'; updateScore();
        if (turn >= THROWS * 2) return later(finish, 1100);
        later(startTurn, 1400);
      }
      function finish() {
        phase = 'over';
        const res = pts[0] > pts[1] ? 'win' : pts[0] < pts[1] ? 'lose' : 'draw';
        msg(res === 'win' ? `🏆 Bạn thắng ${pts[0]}–${pts[1]}!` : res === 'lose' ? `🤖 Máy thắng ${pts[1]}–${pts[0]}. Ván nữa nhé!` : `Hoà ${pts[0]}–${pts[1]}!`);
        Hub.record('danh-dao', res);
      }
      function updateScore() {
        pls.forEach((el, i) => {
          el.querySelector('b').textContent = pts[i];
          el.querySelector('.dd-n').textContent = `${Math.min(THROWS, Math.floor((turn + 1 - i) / 2))}/${THROWS}`;
          el.classList.toggle('on', phase !== 'over' && turn % 2 === i);
        });
      }

      // ---------- Vẽ ----------
      const specks = [];
      for (let i = 0, s = 7; i < 90; i++) { s = (s * 9301 + 49297) % 233280; const a = s / 233280; s = (s * 9301 + 49297) % 233280; specks.push([a * W, s / 233280 * H, 1 + (i % 3)]); }
      function circle(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
      function coin(b, fill) {
        g.fillStyle = 'rgba(0,0,0,.25)'; circle(b.x + 1.5, b.y + 2, b.r); g.fill();
        g.fillStyle = fill; circle(b.x, b.y, b.r); g.fill();
        g.strokeStyle = C.wood; g.lineWidth = 1.5; g.stroke();
        g.strokeStyle = C.paper; g.globalAlpha = 0.5; circle(b.x, b.y, b.r * 0.55); g.stroke(); g.globalAlpha = 1;
      }
      function draw() {
        g.fillStyle = C['bg-2']; g.fillRect(0, 0, W, H);
        g.globalAlpha = 0.45; g.fillStyle = C['wood-2']; g.fillRect(0, 0, W, H);
        g.globalAlpha = 0.25; g.fillStyle = C.wood;
        for (const [x, y, r] of specks) { circle(x, y, r); g.fill(); }
        g.globalAlpha = 1;
        // vạch ném
        g.strokeStyle = C.paper; g.lineWidth = 3; g.setLineDash([10, 8]);
        g.beginPath(); g.moveTo(16, LINE_Y); g.lineTo(W - 16, LINE_Y); g.stroke();
        // vòng lớn + vòng nhỏ
        g.strokeStyle = C.ink; g.globalAlpha = 0.5; g.lineWidth = 2;
        circle(HOLE.x, HOLE.y, CIRCLE_R); g.stroke();
        g.setLineDash([4, 6]); circle(HOLE.x, HOLE.y, RING2); g.stroke();
        g.setLineDash([]); g.globalAlpha = 1;
        // lỗ
        g.fillStyle = 'rgba(0,0,0,.55)'; circle(HOLE.x, HOLE.y, HOLE.r); g.fill();
        g.strokeStyle = C.wood; g.lineWidth = 2; g.stroke();
        for (let i = 1; i < sim.bodies.length; i++) coin(sim.bodies[i], C.gold);
        const d = sim.bodies[0];
        if (!d.gone) coin(d, turn % 2 ? C.p2 : C.p1);
        else { g.globalAlpha = 0.6; coin({ x: d.x, y: d.y, r: d.r * 0.7 }, turn % 2 ? C.p2 : C.p1); g.globalAlpha = 1; }
        // mũi tên ngắm
        if (phase === 'aim' || phase === 'cpu') {
          const len = 30 + power * 110, ex = d.x + Math.cos(aim) * len, ey = d.y + Math.sin(aim) * len;
          g.strokeStyle = C.accent; g.fillStyle = C.accent; g.lineWidth = 4; g.lineCap = 'round';
          g.globalAlpha = 0.35 + power * 0.65;
          g.beginPath(); g.moveTo(d.x, d.y); g.lineTo(ex, ey); g.stroke();
          g.beginPath(); g.moveTo(ex + Math.cos(aim) * 10, ey + Math.sin(aim) * 10);
          g.lineTo(ex + Math.cos(aim + 2.4) * 10, ey + Math.sin(aim + 2.4) * 10);
          g.lineTo(ex + Math.cos(aim - 2.4) * 10, ey + Math.sin(aim - 2.4) * 10); g.fill();
          g.globalAlpha = 1;
          // thanh lực
          g.fillStyle = C.paper; g.fillRect(W - 26, H - 130, 12, 110);
          g.fillStyle = power > 0.85 ? C.bad : C.green; g.fillRect(W - 26, H - 20 - power * 110, 12, power * 110);
          g.strokeStyle = C.line; g.lineWidth = 1; g.strokeRect(W - 26, H - 130, 12, 110);
        }
      }

      function frame(now) {
        if (!ctx.alive()) return;
        const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
        if (charging && phase === 'aim') {             // lực dao động 0 → 1 → 0 khi giữ Space
          chargeT += dt; const p = (chargeT / 1.2) % 2; power = p < 1 ? p : 2 - p;
        }
        if (phase === 'moving') {
          acc += dt;
          while (acc >= DT && sim.moving) { step(sim); acc -= DT; }
          if (!sim.moving) { acc = 0; endThrow(); }
        }
        draw();
        raf = requestAnimationFrame(frame);
      }

      // ---------- Điều khiển ----------
      const toWorld = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
      function onDown(e) {
        if (phase !== 'aim') return;
        drag = toWorld(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); e.preventDefault();
      }
      function onMove(e) {
        if (!drag || phase !== 'aim') return;
        const p = toWorld(e), dx = drag.x - p.x, dy = drag.y - p.y;   // ná cao su: kéo ngược
        const len = Math.hypot(dx, dy);
        if (len > 4) aim = Math.atan2(dy, dx);
        power = Math.min(1, len / 140);
      }
      function onUp() {
        if (!drag || phase !== 'aim') { drag = null; return; }
        drag = null; throwNow(aim, power);
      }
      cv.addEventListener('pointerdown', onDown);
      cv.addEventListener('pointermove', onMove);
      cv.addEventListener('pointerup', onUp);
      cv.addEventListener('pointercancel', onUp);

      const offKey = Hub.onKey((e) => {
        if (e.key === 'n' || e.key === 'N') return newGame();
        if (phase !== 'aim') { if (e.key === ' ') e.preventDefault(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); aim = Math.max(-Math.PI + 0.1, aim - 0.04); }
        if (e.key === 'ArrowRight') { e.preventDefault(); aim = Math.min(-0.1, aim + 0.04); }
        if (e.key === ' ') { e.preventDefault(); if (!charging) { charging = true; chargeT = 0; power = 0; } }
      });
      const onKeyUp = (e) => { if (e.key === ' ' && charging && phase === 'aim') { e.preventDefault(); throwNow(aim, power); } };
      document.addEventListener('keyup', onKeyUp);

      root.addEventListener('click', (e) => {
        const lv = e.target.closest('[data-level]');
        if (lv) {
          level = lv.dataset.level; Hub.store.set('dd:level', level);
          lv.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === lv));
          Hub.toast('Đổi độ khó, bắt đầu ván mới'); return newGame();
        }
        if (e.target.closest('[data-act="new"]')) newGame();
      });

      readColors();
      const mo = new MutationObserver(readColors);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
      if (mq && mq.addEventListener) mq.addEventListener('change', readColors);
      window.addEventListener('resize', resize);
      resize();
      newGame();
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf); timers.forEach(clearTimeout); offKey();
        document.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', resize);
        mo.disconnect(); if (mq && mq.removeEventListener) mq.removeEventListener('change', readColors);
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
      };
    },
  });

  // để kiểm thử bằng Node
  if (typeof module !== 'undefined') module.exports = { makeState, launch, collide, step, score, simulate, cpuAim, consts: { W, H, HOLE, START, CIRCLE_R, RING2, MAXV, FRIC } };
})();
