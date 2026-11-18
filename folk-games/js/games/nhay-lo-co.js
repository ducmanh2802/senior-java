/* Nhảy lò cò: ném viên ngói vào đúng ô, lò cò qua các ô (tránh ô có ngói) lên tới "trời" rồi quay về.
 * Đấu lượt với máy; ai đi hết ô 8 trước thì thắng.
 *
 * Sân (từ dưới lên): 1, 2, 3 (ô đơn) · 4-5 (ô đôi) · 6 (ô đơn) · 7-8 (ô đôi) · Trời (nửa vòng tròn, ô 9).
 * Ô 0 = vạch xuất phát (ném ngắn), ô 9 = trời (ném quá tay).
 * Ô đơn → nhảy "1 chân"; ô đôi → "2 chân" (mỗi chân một ô). Ngói nằm ở ô đôi thì hàng đó thành "1 chân";
 * ngói nằm ở ô đơn thì nhảy qua luôn ô đó. Tới trời được đứng 2 chân, rồi quay về theo thứ tự ngược lại.
 */
(function () {
  'use strict';

  const ROWS = [[1], [2], [3], [4, 5], [6], [7, 8]];
  const BASE = 0.04, SPAN = 0.11;                 // vạch lực: [0, 0.04) ngắn; mỗi ô rộng 0.11; > 0.92 rơi vào trời
  const ACC = {                                   // độ chính xác của máy: ném trúng, mỗi bước nhảy
    easy: { th: 0.55, hop: 0.93 },
    normal: { th: 0.7, hop: 0.96 },
    hard: { th: 0.85, hop: 0.985 },
  };

  /** Lực ném 0..1 → ô rơi vào: 0 = chưa tới ô 1, 1..8, 9 = quá tay (rơi vào trời). */
  function powerToSquare(p) {
    if (p < BASE) return 0;
    const s = Math.floor((p - BASE) / SPAN) + 1;
    return s > 8 ? 9 : s;
  }
  /** Khoảng lực để ngói rơi vào ô t: [từ, đến). */
  function squareZone(t) { return [BASE + (t - 1) * SPAN, BASE + t * SPAN]; }

  /** Chuỗi bước nhảy khi ngói nằm ở ô `stone`: [{squares, foot: 1|2}] — đi lên, trời, rồi đi về. */
  function hopSequence(stone) {
    const up = [];
    for (const row of ROWS) {
      const sq = row.filter((s) => s !== stone);
      if (sq.length) up.push({ squares: sq, foot: sq.length });
    }
    return up.concat([{ squares: [9], foot: 2 }], up.slice().reverse());
  }

  /** Thời gian (ms) cho bước nhảy thứ i khi đang đi ô `target`: càng về sau càng ngắn. Bước đầu được thêm 600ms chuẩn bị. */
  function hopWindow(i, target) { return Math.max(500, 1400 - i * 45 - (target - 1) * 70) + (i === 0 ? 600 : 0); }

  /** Kim đo lực chạy qua lại (sóng tam giác) — ô càng xa, kim chạy càng nhanh. */
  function meterAt(ms, target) {
    const period = 1900 - target * 60;
    const x = (ms % period) / period;
    return x < 0.5 ? x * 2 : 2 - x * 2;
  }

  /** Mô phỏng lượt của máy. rng tuỳ chọn để kiểm thử. → {land, steps, fallAt (-1 = không ngã)} */
  function cpuTurn(target, level, rng) {
    const a = ACC[level] || ACC.normal;
    const r = rng || Math.random;
    if (r() >= a.th) return { land: r() < 0.5 ? target - 1 : target + 1, steps: [], fallAt: -1 };
    const steps = hopSequence(target);
    let fallAt = -1;
    for (let i = 0; i < steps.length; i++) if (r() >= a.hop) { fallAt = i; break; }
    return { land: target, steps, fallAt };
  }

  const sqName = (s) => (s === 9 ? 'trời' : s === 0 ? 'vạch xuất phát' : 'ô ' + s);
  const footName = (f) => (f === 1 ? '1 chân' : '2 chân');

  if (typeof Hub !== 'undefined') Hub.register({
    id: 'nhay-lo-co',
    name: 'Nhảy lò cò',
    icon: '🦶',
    tagline: 'Ném viên ngói thật chuẩn, lò cò một chân qua từng ô lên tới "trời" rồi quay về.',
    players: '1 người · đấu máy',
    rules: `
      <ol>
        <li><b>Ném ngói:</b> kim đo lực chạy qua lại, bấm <kbd>Space</kbd> (hoặc nút <b>Ném</b>) để ném. Ngói phải rơi đúng ô bạn đang đi (bắt đầu từ ô 1, vùng sáng trên thước lực). Ném trượt là mất lượt.</li>
        <li><b>Lò cò:</b> nhảy lần lượt qua các hàng lên tới <b>Trời</b> rồi quay về, <b>bỏ qua ô có ngói</b>.
          <ul>
            <li>Ô đơn (1, 2, 3, 6) → <b>1 chân</b> <kbd>J</kbd>.</li>
            <li>Ô đôi (4-5, 7-8) và Trời → <b>2 chân</b> <kbd>K</kbd>. Nếu ngói nằm trong ô đôi thì hàng đó chỉ được nhảy <b>1 chân</b>.</li>
          </ul></li>
        <li>Mỗi bước có thanh thời gian ngắn dần. Bấm sai chân hoặc hết giờ là <b>ngã</b>, mất lượt.</li>
        <li>Đi trọn một vòng thì lên ô tiếp theo và được ném tiếp. Ai đi xong <b>ô 8</b> trước thì thắng.</li>
      </ol>
      <p class="muted">Ngày xưa viên "ngói" là mảnh sành, mảnh ngói vỡ nhặt ngoài ngõ; sân kẻ bằng gạch non hay than củi.</p>`,

    render(root, ctx) {
      let level = Hub.store.get('lc:level', 'normal');
      let prog = [1, 1], turn = 0, phase = 'idle', gen = 0, dead = false, raf = 0;
      let t0 = 0, power = 0, seq = [], step = 0, deadline = 0, win = 1, stone = -1, here = [], next = [];

      const cell = (n, cls) => `<div class="lc-sq ${cls || ''}" data-sq="${n}"><span class="n">${n}</span></div>`;
      const dots = '<span></span>'.repeat(8);
      root.innerHTML = `
        ${Hub.modeBar({ levels: [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']], level })}
        <div class="lc-wrap">
          <div class="lc-board" role="img" aria-label="Sân lò cò 8 ô và trời">
            <div class="lc-sq troi" data-sq="9"><span class="n">Trời</span></div>
            ${cell(7)}${cell(8)}${cell(6, 'wide')}${cell(4)}${cell(5)}${cell(3, 'wide')}${cell(2, 'wide')}${cell(1, 'wide')}
            <div class="lc-sq start" data-sq="0"><span class="n">Vạch xuất phát</span></div>
          </div>
          <div class="lc-panel">
            <div class="lc-players">
              <div class="pl" data-p="0"><span>🧒 Bạn</span><b>ô 1</b><div class="lc-dots">${dots}</div></div>
              <div class="pl" data-p="1"><span>🤖 Máy</span><b>ô 1</b><div class="lc-dots">${dots}</div></div>
            </div>
            <div class="lc-label small muted">Lực ném</div>
            <div class="lc-meter" aria-hidden="true"><div class="zone"></div><div class="needle"></div></div>
            <div class="lc-label small muted">Thời gian bước nhảy</div>
            <div class="lc-timer" aria-hidden="true"><span></span></div>
            <p class="lc-prompt" aria-live="polite"></p>
            <p class="lc-msg" aria-live="polite"></p>
            <div class="row center lc-ctrl">
              <button class="btn primary lg" data-act="throw">🎯 Ném <kbd>Space</kbd></button>
              <button class="btn lg" data-act="one">🦶 1 chân <kbd>J</kbd></button>
              <button class="btn lg" data-act="two">👣 2 chân <kbd>K</kbd></button>
            </div>
            <div class="row center"><button class="btn" data-act="new">🔄 Ván mới <kbd>N</kbd></button></div>
          </div>
        </div>`;
      const $ = (q) => root.querySelector(q);
      const sqEls = root.querySelectorAll('.lc-sq');
      const live = (g) => !dead && ctx.alive() && g === gen;
      const msg = (t) => { $('.lc-msg').textContent = t; };
      const prompt = (t) => { $('.lc-prompt').textContent = t; };

      function draw() {
        const target = prog[turn];
        sqEls.forEach((el) => {
          const n = +el.dataset.sq;
          el.classList.toggle('target', phase !== 'over' && n === target);
          el.classList.toggle('stone', n === stone);
          el.classList.toggle('here', here.includes(n));
          el.classList.toggle('next', next.includes(n));
          el.classList.toggle('cpu', turn === 1);
        });
        root.querySelectorAll('.lc-players .pl').forEach((el, p) => {
          el.classList.toggle('on', p === turn && phase !== 'over');
          el.querySelector('b').textContent = prog[p] > 8 ? 'Về đích' : 'ô ' + prog[p];
          el.querySelectorAll('.lc-dots span').forEach((d, i) => d.classList.toggle('done', i + 1 < prog[p]));
        });
        const z = squareZone(Math.min(prog[0], 8));
        const zone = $('.lc-meter .zone');
        zone.style.left = z[0] * 100 + '%'; zone.style.width = (z[1] - z[0]) * 100 + '%';
        $('[data-act="throw"]').disabled = phase !== 'aim';
        $('[data-act="one"]').disabled = $('[data-act="two"]').disabled = phase !== 'hop';
        if (phase !== 'hop') $('.lc-timer span').style.width = '0%';
      }

      function tick() {
        if (dead || !ctx.alive()) return;
        const now = performance.now();
        if (phase === 'aim') {
          power = meterAt(now - t0, prog[0]);
          $('.lc-meter .needle').style.left = power * 100 + '%';
        } else if (phase === 'hop') {
          const left = Math.max(0, deadline - now);
          $('.lc-timer span').style.width = (left / win) * 100 + '%';
          $('.lc-timer').classList.toggle('low', left / win < 0.3);
          if (left <= 0) fall('Hết giờ!');
        }
        raf = requestAnimationFrame(tick);
      }

      function later(ms, fn) { const g = gen; Hub.sleep(ms).then(() => { if (live(g)) fn(); }); }

      function newGame() {
        gen++;
        prog = [1, 1];
        msg('');
        startPlayer();
      }

      function startPlayer() {
        turn = 0; phase = 'aim'; stone = -1; here = []; next = [];
        t0 = performance.now();
        prompt(`Lượt bạn: ném ngói vào ô ${prog[0]} — bấm Space khi kim nằm trong vùng sáng.`);
        draw();
      }

      function throwStone() {
        if (phase !== 'aim') return;
        stone = powerToSquare(power);
        phase = 'land';
        here = [0];
        const target = prog[0];
        if (stone === target) {
          prompt(''); msg(`🎯 Trúng ô ${target}! Chuẩn bị lò cò…`);
          draw();
          later(500, beginHop);
        } else {
          msg(stone === 0 ? '😅 Ném ngắn quá, chưa tới ô 1. Mất lượt.'
            : `😬 Ngói rơi vào ${sqName(stone)}, không phải ô ${target}. Mất lượt.`);
          prompt('');
          draw();
          later(1100, cpuRun);
        }
      }

      function setStep(i) {
        step = i;
        next = seq[i] ? seq[i].squares : [];
        if (seq[i]) {
          win = hopWindow(i, prog[0]);
          deadline = performance.now() + win;
          prompt(`Bước ${i + 1}/${seq.length}: ${footName(seq[i].foot)} → ${seq[i].squares.map(sqName).join(' - ')}`);
        }
      }

      function beginHop() {
        seq = hopSequence(prog[0]);
        phase = 'hop'; msg('');
        setStep(0);
        draw();
      }

      function hop(foot) {
        if (phase !== 'hop') return;
        const s = seq[step];
        if (foot !== s.foot) return fall(`Sai chân! Ô này phải nhảy ${footName(s.foot)}.`);
        here = s.squares;
        if (step + 1 >= seq.length) {
          here = [0]; next = [];
          prog[0]++;
          draw();
          if (prog[0] > 8) return finish(0);
          phase = 'land';
          msg(`✅ Xong ô ${prog[0] - 1}! Ném tiếp vào ô ${prog[0]}.`); prompt('');
          Hub.toast(`Qua ô ${prog[0] - 1}!`, 'good');
          return later(700, startPlayer);
        }
        setStep(step + 1);
        draw();
      }

      function fall(reason) {
        if (phase !== 'hop') return;
        phase = 'fall'; next = [];
        msg(`💥 ${reason} Bạn ngã rồi, đến lượt máy.`); prompt('');
        draw();
        later(1200, cpuRun);
      }

      async function cpuRun() {
        const g = gen;
        turn = 1; phase = 'cpu'; here = [0]; next = []; stone = -1;
        for (;;) {
          const target = prog[1];
          prompt(`Máy ném ngói vào ô ${target}…`); msg('');
          draw();
          await Hub.sleep(750); if (!live(g)) return;
          const plan = cpuTurn(target, level);
          stone = plan.land;
          draw();
          if (plan.land !== target) {
            msg(`Máy ném trượt (rơi vào ${sqName(plan.land)}). Đến lượt bạn!`);
            await Hub.sleep(1100); if (!live(g)) return;
            break;
          }
          prompt(`Máy trúng ô ${target}, đang lò cò…`);
          await Hub.sleep(450); if (!live(g)) return;
          let fell = false;
          for (let i = 0; i < plan.steps.length; i++) {
            if (i === plan.fallAt) { fell = true; break; }
            here = plan.steps[i].squares;
            next = plan.steps[i + 1] ? plan.steps[i + 1].squares : [];
            draw();
            await Hub.sleep(280); if (!live(g)) return;
          }
          if (fell) {
            msg(`🤖 Máy ngã ở ${plan.steps[plan.fallAt].squares.map(sqName).join(' - ')}! Đến lượt bạn.`);
            next = []; draw();
            await Hub.sleep(1100); if (!live(g)) return;
            break;
          }
          prog[1]++; here = [0]; next = []; stone = -1;
          if (prog[1] > 8) { draw(); return finish(1); }
          msg(`Máy xong ô ${prog[1] - 1}, ném tiếp.`);
          draw();
          await Hub.sleep(600); if (!live(g)) return;
        }
        startPlayer();
      }

      function finish(p) {
        phase = 'over'; next = []; prompt('');
        msg(p === 0 ? '🏆 Bạn lên tới trời trước! Thắng rồi!' : '🤖 Máy đi xong ô 8 trước. Làm ván nữa nhé!');
        Hub.toast(p === 0 ? 'Bạn thắng!' : 'Máy thắng', p === 0 ? 'good' : 'bad');
        Hub.record('nhay-lo-co', p === 0 ? 'win' : 'lose');
        draw();
      }

      root.addEventListener('click', (e) => {
        const lv = e.target.closest('[data-level]');
        if (lv) {
          level = lv.dataset.level; Hub.store.set('lc:level', level);
          lv.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === lv));
          return newGame();
        }
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'throw') throwStone();
        else if (a.dataset.act === 'one') hop(1);
        else if (a.dataset.act === 'two') hop(2);
        else if (a.dataset.act === 'new') newGame();
      });
      const off = Hub.onKey((e) => {
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (e.key === ' ') { e.preventDefault(); throwStone(); }
        else if (k === 'j') hop(1);
        else if (k === 'k') hop(2);
        else if (k === 'n') newGame();
      });

      newGame();
      raf = requestAnimationFrame(tick);
      return () => { dead = true; gen++; off(); cancelAnimationFrame(raf); };
    },
  });

  // để kiểm thử bằng Node
  if (typeof module !== 'undefined') module.exports = { ROWS, powerToSquare, squareZone, hopSequence, hopWindow, meterAt, cpuTurn };
})();
