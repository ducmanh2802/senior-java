/* Đánh quay: quấn dây, bổ con quay gỗ vào sân, va bật quay của máy ra khỏi vòng. Thắng 2/3 hiệp.
 *
 * Toạ độ thế giới: sân vuông W×H, vòng tròn tâm (CX, CY) bán kính RING_R. y hướng xuống.
 * Vật lý bước cố định DT: vận tốc tắt dần theo hàm mũ, "spin" (vòng/phút) giảm dần, giảm nhanh hơn khi lắc (wobble).
 * Va chạm tròn–tròn: quay xoay nhanh hơn truyền lực bật mạnh hơn. Không dùng ngẫu nhiên trong vật lý.
 */
(function () {
  'use strict';

  const W = 400, H = 400, CX = 200, CY = 195, RING_R = 175;
  const DT = 1 / 120;
  const DRAG = 1.1;                 // tắt dần vận tốc: v *= exp(-DRAG·dt)
  const BASE_DEC = 80, WOB_DEC = 180; // spin mất mỗi giây: nền + phần do lắc
  const STOP_SPIN = 40;             // dưới mức này quay ngã, thua
  const R = 17, E = 0.8, KICK = 100;
  const MAX_WIND = 20, WIND_TIME = 3000;
  const START = { x: CX, y: CY + 150 };
  const LEVELS = { easy: 0.4, normal: 0.65, hard: 0.9 };    // chất lượng bổ của máy

  // ---------- Vật lý thuần ----------
  function makeTop(x, y, spin, vx, vy) {
    return { x, y, vx: vx || 0, vy: vy || 0, spin: spin || 0, r: R, wob: 0, hw: 0, rot: 0, on: true, dead: null };
  }
  function spinFromThrow(winds, power) {
    return 300 + Math.min(MAX_WIND, winds) * 30 + Math.max(0, Math.min(1, power)) * 250;
  }
  /** Quay của máy đã bổ sẵn: rnd() ∈ [0,1). Chất lượng cao thì gần tâm, nhiều spin, đứng yên hơn. */
  function aiTop(level, rnd) {
    const q = Math.max(0.1, Math.min(1, (LEVELS[level] || LEVELS.normal) + (rnd() - 0.5) * 0.2));
    const off = (1 - q) * 90, a = rnd() * Math.PI * 2, d = (1 - q) * 40;
    const v = rnd() * Math.PI * 2;
    return makeTop(CX + Math.cos(a) * off, CY + Math.sin(a) * off, 300 + q * 700 * (0.85 + 0.3 * rnd()), Math.cos(v) * d, Math.sin(v) * d);
  }
  function makeState(ai) {
    return { tops: [{ x: START.x, y: START.y, vx: 0, vy: 0, spin: 0, r: R, wob: 0, hw: 0, rot: 0, on: false, dead: null }, ai],
      launched: false, hit: false, steps: 0, order: [], over: false, winner: -1 };
  }
  function launch(s, angle, power, winds) {
    const p = Math.max(0, Math.min(1, power)), t = s.tops[0];
    const v = 80 + p * 320;
    Object.assign(t, { x: START.x, y: START.y, vx: Math.cos(angle) * v, vy: Math.sin(angle) * v, spin: spinFromThrow(winds, p), on: true, dead: null });
    s.launched = true;
  }
  function die(s, t, why) { t.dead = why; t.vx = t.vy = 0; s.order.push(s.tops.indexOf(t)); }

  /** Va chạm: quay nhanh hơn đẩy mạnh hơn; mỗi lần va đều làm cả hai lắc và mất spin (bên yếu mất nhiều hơn). */
  function collide(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), min = a.r + b.r;
    if (dist >= min || dist === 0) return false;
    const nx = dx / dist, ny = dy / dist, over = (min - dist) / 2;
    a.x -= nx * over; a.y -= ny * over; b.x += nx * over; b.y += ny * over;
    const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (vrel >= 0) return true;
    const sum = (a.spin + b.spin) || 1, ka = 2 * b.spin / sum, kb = 2 * a.spin / sum;   // quay a nhanh → b bị bật nhiều
    const dv = -vrel * (1 + E) / 2 + KICK * sum / 2000;
    a.vx -= nx * dv * ka; a.vy -= ny * dv * ka;
    b.vx += nx * dv * kb; b.vy += ny * dv * kb;
    const weak = a.spin < b.spin ? a : b;
    a.spin *= 0.95; b.spin *= 0.95; weak.spin *= 0.92;
    a.hw = b.hw = 0.5;
    return true;
  }

  function step(s) {
    const T = s.tops;
    s.hit = false; s.steps++;
    if (!s.launched) return;
    const f = Math.exp(-DRAG * DT);
    for (const t of T) {
      if (!t.on || t.dead) continue;
      t.x += t.vx * DT; t.y += t.vy * DT; t.vx *= f; t.vy *= f;
      t.hw = Math.max(0, t.hw - 1.5 * DT);
      t.wob = Math.min(1, Math.max(0, 1 - t.spin / 300) + t.hw);
      t.spin -= (BASE_DEC + WOB_DEC * t.wob) * DT;
      t.rot += t.spin * DT * 0.02;
      if (t.spin <= STOP_SPIN) { t.spin = 0; die(s, t, 'stop'); }
    }
    for (let i = 0; i < T.length; i++) for (let k = i + 1; k < T.length; k++) {
      const a = T[i], b = T[k];
      if (a.on && b.on && !a.dead && !b.dead && collide(a, b)) s.hit = true;
    }
    for (const t of T) if (t.on && !t.dead && Math.hypot(t.x - CX, t.y - CY) > RING_R) die(s, t, 'out');
    const alive = T.filter((t) => t.on && !t.dead);
    if (alive.length <= 1) { s.over = true; s.winner = alive.length ? T.indexOf(alive[0]) : s.order[s.order.length - 1]; }
  }

  /** Mô phỏng trọn một lần bổ (dùng cho kiểm thử). */
  function simulate(angle, power, winds, ai) {
    const s = makeState(ai);
    launch(s, angle, power, winds);
    while (!s.over && s.steps < 120 * 60) step(s);
    return s;
  }

  if (typeof Hub !== 'undefined') Hub.register({
    id: 'danh-quay',
    name: 'Đánh quay',
    icon: '🪀',
    tagline: 'Quấn dây, bổ con quay gỗ, va bật quay đối thủ ra khỏi vòng.',
    players: '1 người · đấu máy',
    rules: `
      <ul>
        <li>Mỗi hiệp: máy đã bổ sẵn con quay đang xoay trong <b>sân</b> (vòng tròn). Tới lượt bạn <b>quấn dây</b> rồi <b>bổ</b>.</li>
        <li><b>Quấn dây</b>: bấm/chạm sân hoặc <kbd>Space</kbd> thật nhanh trong 3 giây, tối đa ${MAX_WIND} vòng. Quấn càng nhiều, quay xoay càng lâu và càng khoẻ.</li>
        <li><b>Bổ quay</b>: kéo ngược trên sân rồi thả như ná cao su, hoặc <kbd>←</kbd>/<kbd>→</kbd> ngắm và giữ <kbd>Space</kbd> lấy lực, thả ra để bổ.</li>
      </ul>
      <p>Quay xoay nhanh va vào quay yếu sẽ bật nó đi xa hơn. Sau mỗi cú va, quay bị lắc và chóng mệt. Quay <b>văng khỏi vòng</b> hoặc <b>ngã</b> (hết xoay) là thua hiệp. Thắng 2 trên 3 hiệp.</p>
      <p class="muted">Ngày trước trẻ con gọt quay bằng gỗ ổi, gỗ mít, đóng đinh làm mũi, quấn dây dừa hoặc dây nhợ để bổ.</p>`,

    render(root, ctx) {
      let level = Hub.store.get('dq:level', 'normal');
      let st, phase, winds, windT0, aim, power, drag, charging, chargeT, wins, round, timers = [], raf = 0, last = 0, acc = 0, hitCd = 0;
      const C = {};

      root.innerHTML = `
        ${Hub.modeBar({ levels: [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']], level })}
        <div class="dq-score">
          <div class="pl"><span><span class="mini p1"></span>Bạn</span><b>0</b></div>
          <div class="dq-round">Hiệp 1/3</div>
          <div class="pl"><span><span class="mini p2"></span>Máy</span><b>0</b></div>
        </div>
        <div class="dq-wrap"><canvas class="dq-canvas" aria-label="Sân đánh quay: chạm để quấn dây, kéo ngược rồi thả để bổ"></canvas></div>
        <p class="dq-msg" aria-live="polite"></p>
        <p class="dq-help muted small center">Quấn: chạm sân / <kbd>Space</kbd> · Bổ: kéo ngược rồi thả, hoặc <kbd>←</kbd><kbd>→</kbd> + giữ <kbd>Space</kbd></p>
        <div class="row center"><button class="btn" data-act="wind">🪢 Quấn dây</button><button class="btn" data-act="new">🔄 Ván mới <kbd>N</kbd></button></div>`;
      const $ = (q) => root.querySelector(q);
      const cv = $('.dq-canvas'), g = cv.getContext('2d');
      const msg = (t) => { $('.dq-msg').textContent = t; };
      const later = (fn, ms) => { timers.push(setTimeout(() => { if (ctx.alive()) fn(); }, ms)); };

      function readColors() {
        const cs = getComputedStyle(document.documentElement);
        for (const k of ['bg-2', 'paper', 'ink', 'line', 'accent', 'gold', 'wood', 'wood-2', 'wood-ink', 'green', 'bad', 'p1', 'p2']) C[k] = cs.getPropertyValue('--' + k).trim() || '#888';
      }
      function resize() {
        const dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 300, sc = w / W;
        cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr);
        cv.style.height = (w * H / W) + 'px';
        g.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0);
      }

      function newMatch() { timers.forEach(clearTimeout); timers = []; wins = [0, 0]; round = 1; newRound(); }
      function newRound() {
        st = makeState(aiTop(level, Math.random));
        phase = 'wind'; winds = 0; windT0 = 0; aim = -Math.PI / 2; power = 0; drag = null; charging = false; acc = 0;
        msg(`Hiệp ${round}: máy đã bổ xong. Chạm sân hoặc nhấn Space liên tục để quấn dây!`);
        updateScore();
      }
      function updateScore() {
        root.querySelectorAll('.dq-score b').forEach((b, i) => { b.textContent = wins[i]; });
        $('.dq-round').textContent = `Hiệp ${Math.min(3, round)}/3`;
        $('[data-act="wind"]').hidden = phase !== 'wind';
      }
      function addWind() {
        if (phase !== 'wind') return;
        if (!windT0) windT0 = performance.now();
        if (winds < MAX_WIND) { winds++; msg(`Quấn dây: ${winds}/${MAX_WIND} vòng`); }
      }
      function endWind() {
        phase = 'aim'; updateScore();
        msg(winds ? `Quấn ${winds} vòng. Kéo ngược rồi thả để bổ!` : 'Chưa quấn vòng nào, quay sẽ yếu. Kéo ngược rồi thả để bổ!');
      }
      function throwNow(a, p) {
        if (phase !== 'aim') return;
        if (p < 0.08) { power = 0; charging = false; drag = null; msg('Nhẹ quá, kéo dài hơn nhé!'); return; }
        launch(st, a, p, winds); phase = 'fly'; power = 0; drag = null; charging = false;
        msg('Quay đang xoay…');
      }
      function endRound() {
        const w = st.winner, me = w === 0;
        wins[me ? 0 : 1]++; round++; phase = 'result'; updateScore();
        const why = st.tops[w ^ 1].dead === 'out' ? 'văng khỏi vòng' : 'ngã';
        msg(`${me ? 'Bạn thắng hiệp!' : 'Máy thắng hiệp.'} Quay ${me ? 'máy' : 'bạn'} ${why}.`);
        if (wins[0] === 2 || wins[1] === 2) return later(finish, 1200);
        later(newRound, 1700);
      }
      function finish() {
        phase = 'over';
        const res = wins[0] > wins[1] ? 'win' : 'lose';
        msg(res === 'win' ? `🏆 Bạn thắng ${wins[0]}–${wins[1]}!` : `🤖 Máy thắng ${wins[1]}–${wins[0]}. Ván nữa nhé!`);
        Hub.record('danh-quay', res);
      }

      // ---------- Vẽ ----------
      function circle(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
      function drawTop(t, color, windsShown) {
        if (!t.on) return;
        const wob = t.dead ? 0 : t.wob, tt = performance.now() / 1000;
        const x = t.x + Math.sin(tt * 31) * wob * 3, y = t.y + Math.cos(tt * 27) * wob * 3;
        g.save(); g.globalAlpha = t.dead ? 0.4 : 1;
        g.fillStyle = 'rgba(0,0,0,.25)'; circle(x + 2, y + 3, t.r); g.fill();
        g.translate(x, y); g.scale(1, 1 - wob * 0.18);
        g.fillStyle = C['wood-2']; circle(0, 0, t.r); g.fill();
        g.strokeStyle = C.wood; g.lineWidth = 2; g.stroke();
        g.rotate(t.rot);
        g.strokeStyle = color; g.lineWidth = 4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-t.r * 0.8, 0); g.lineTo(t.r * 0.8, 0); g.stroke();
        g.strokeStyle = C.paper; g.lineWidth = 2;
        g.beginPath(); g.moveTo(0, -t.r * 0.8); g.lineTo(0, t.r * 0.8); g.stroke();
        g.fillStyle = C.wood; circle(0, 0, 3); g.fill();
        if (windsShown) { g.strokeStyle = C.gold; g.lineWidth = 1.5; for (let i = 0; i < Math.min(5, Math.ceil(windsShown / 4)); i++) { circle(0, 0, t.r * (0.45 + i * 0.1)); g.stroke(); } }
        g.restore();
      }
      function draw() {
        g.fillStyle = C['bg-2']; g.fillRect(0, 0, W, H);
        g.fillStyle = C['wood-2']; g.globalAlpha = 0.55; circle(CX, CY, RING_R); g.fill(); g.globalAlpha = 1;
        g.strokeStyle = C.wood; g.lineWidth = 5; circle(CX, CY, RING_R); g.stroke();
        g.strokeStyle = C.paper; g.globalAlpha = 0.5; g.lineWidth = 2; g.setLineDash([6, 8]); circle(CX, CY, RING_R * 0.5); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
        const [me, ai] = st.tops;
        drawTop(ai, C.p2, 0);
        if (me.on) drawTop(me, C.p1, 0);
        else drawTop(makeTop(START.x, START.y, 0), C.p1, winds);
        if (phase === 'aim') {                                  // mũi tên ngắm + thanh lực
          const len = 30 + power * 110, ex = START.x + Math.cos(aim) * len, ey = START.y + Math.sin(aim) * len;
          g.strokeStyle = C.accent; g.fillStyle = C.accent; g.lineWidth = 4; g.lineCap = 'round'; g.globalAlpha = 0.35 + power * 0.65;
          g.beginPath(); g.moveTo(START.x, START.y); g.lineTo(ex, ey); g.stroke();
          g.beginPath(); g.moveTo(ex + Math.cos(aim) * 10, ey + Math.sin(aim) * 10);
          g.lineTo(ex + Math.cos(aim + 2.4) * 10, ey + Math.sin(aim + 2.4) * 10); g.lineTo(ex + Math.cos(aim - 2.4) * 10, ey + Math.sin(aim - 2.4) * 10); g.fill();
          g.globalAlpha = 1;
          g.fillStyle = C.paper; g.fillRect(W - 24, H - 120, 12, 100);
          g.fillStyle = power > 0.85 ? C.bad : C.green; g.fillRect(W - 24, H - 20 - power * 100, 12, power * 100);
        }
        if (phase === 'wind') {                                 // thanh vòng quấn + đồng hồ 3 giây
          const left = windT0 ? Math.max(0, 1 - (performance.now() - windT0) / WIND_TIME) : 1;
          g.fillStyle = C.paper; g.fillRect(40, 18, W - 80, 12);
          g.fillStyle = C.gold; g.fillRect(40, 18, (W - 80) * winds / MAX_WIND, 12);
          g.fillStyle = left < 0.33 ? C.bad : C.green; g.fillRect(40, 34, (W - 80) * left, 5);
        }
        if (phase === 'fly' || phase === 'result') {            // spin hiện tại
          [me, ai].forEach((t, i) => { g.fillStyle = i ? C.p2 : C.p1; g.fillRect(i ? W - 24 : 12, H - 14 - t.spin / 12, 12, t.spin / 12); });
        }
      }

      function frame(now) {
        if (!ctx.alive()) return;
        const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
        if (phase === 'wind' && windT0 && now - windT0 >= WIND_TIME) endWind();
        if (charging && phase === 'aim') { chargeT += dt; const p = (chargeT / 1.2) % 2; power = p < 1 ? p : 2 - p; }
        hitCd = Math.max(0, hitCd - dt);
        if (phase === 'fly') {
          acc += dt;
          while (acc >= DT && !st.over) { step(st); acc -= DT; if (st.hit && !hitCd) { Hub.sfx('drum'); hitCd = 0.15; } }
          if (st.over) { acc = 0; endRound(); }
        }
        draw();
        raf = requestAnimationFrame(frame);
      }

      // ---------- Điều khiển ----------
      const toWorld = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
      function onDown(e) {
        e.preventDefault();
        if (phase === 'wind') return addWind();
        if (phase !== 'aim') return;
        drag = toWorld(e); cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
      }
      function onMove(e) {
        if (!drag || phase !== 'aim') return;
        const p = toWorld(e), dx = drag.x - p.x, dy = drag.y - p.y, len = Math.hypot(dx, dy);
        if (len > 4) aim = Math.atan2(dy, dx);
        power = Math.min(1, len / 120);
      }
      function onUp() { if (!drag || phase !== 'aim') { drag = null; return; } drag = null; throwNow(aim, power); }
      cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
      cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);

      const offKey = Hub.onKey((e) => {
        if (e.key === 'n' || e.key === 'N') return newMatch();
        if (e.key === ' ') e.preventDefault();
        if (phase === 'wind') { if (e.key === ' ' && !e.repeat) addWind(); return; }
        if (phase !== 'aim') return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); aim = Math.max(-Math.PI + 0.25, aim - 0.04); }
        if (e.key === 'ArrowRight') { e.preventDefault(); aim = Math.min(-0.25, aim + 0.04); }
        if (e.key === ' ' && !charging) { charging = true; chargeT = 0; power = 0; }
      });
      const onKeyUp = (e) => { if (e.key === ' ' && charging && phase === 'aim') { e.preventDefault(); throwNow(aim, power); } };
      document.addEventListener('keyup', onKeyUp);

      root.addEventListener('click', (e) => {
        const lv = e.target.closest('[data-level]');
        if (lv) {
          level = lv.dataset.level; Hub.store.set('dq:level', level);
          lv.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === lv));
          Hub.toast('Đổi độ khó, bắt đầu ván mới'); return newMatch();
        }
        if (e.target.closest('[data-act="new"]')) newMatch();
        if (e.target.closest('[data-act="wind"]')) addWind();
      });

      readColors();
      const mo = new MutationObserver(readColors);
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      const mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
      if (mq && mq.addEventListener) mq.addEventListener('change', readColors);
      window.addEventListener('resize', resize);
      resize(); newMatch();
      raf = requestAnimationFrame(frame);

      return () => {
        cancelAnimationFrame(raf); timers.forEach(clearTimeout); offKey();
        document.removeEventListener('keyup', onKeyUp); window.removeEventListener('resize', resize);
        mo.disconnect(); if (mq && mq.removeEventListener) mq.removeEventListener('change', readColors);
        cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onUp);
      };
    },
  });

  // để kiểm thử bằng Node
  if (typeof module !== 'undefined') module.exports = { makeTop, makeState, launch, collide, step, simulate, aiTop, spinFromThrow, consts: { W, H, CX, CY, RING_R, START, DT, STOP_SPIN } };
})();
