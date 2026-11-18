/* Đánh chuyền: tung quả bóng lên, nhặt que cho đủ rồi bắt bóng trước khi chạm đất.
 * Bàn N: mỗi lần tung nhặt N que (lần cuối nhặt nốt phần còn lại), nhặt hết 10 que thì sang bàn sau. 5 bàn, 3 mạng.
 */
(function () {
  'use strict';

  const STICKS = 10, BANS = 5, LIVES = 3;
  const CHANT = ['Một mốt', 'Đôi hai', 'Ba lá', 'Bốn cái', 'Năm chiếc'];
  const GRACE = 110;                               // ms sau khi bóng về tầm tay vẫn còn bắt kịp

  /** Thời gian bóng bay (ms) ở bàn `ban`: bàn càng cao bóng càng nhanh. */
  function airtime(ban) { return 1300 - (ban - 1) * 70; }
  /** Cửa sổ bắt bóng [từ, đến] tính theo ms kể từ lúc tung. */
  function catchWindow(ban) {
    const T = airtime(ban);
    return [Math.round(T * (0.8 + 0.02 * (ban - 1))), T + GRACE];
  }
  /** Số que phải nhặt ở từng lần tung của một bàn, ví dụ bàn 3 → [3, 3, 3, 1]. */
  function tosses(ban) {
    const out = [];
    for (let left = STICKS; left > 0; left -= Math.min(ban, left)) out.push(Math.min(ban, left));
    return out;
  }
  /** Chấm một lần bắt: 'ok' | 'early' | 'late' | 'short'. */
  function judge(t, ban, picked, need) {
    const w = catchWindow(ban);
    if (t < w[0]) return 'early';
    if (t > w[1]) return 'late';
    if (picked < need) return 'short';
    return 'ok';
  }
  /** Độ cao bóng 0..1 (parabol), 0 lúc tung và lúc về tầm tay. */
  function ballHeight(t, T) {
    if (t <= 0 || t >= T) return 0;
    const x = t / T;
    return 4 * x * (1 - x);
  }
  function chantLine(ban, k) {
    const n = tosses(ban).length;
    return `${CHANT[ban - 1]}… (lần ${k + 1}/${n})`;
  }

  const WHY = {
    early: 'Bắt sớm quá, bóng còn đang bay!',
    late: 'Bóng rơi xuống đất mất rồi!',
    short: 'Chưa nhặt đủ que đã bắt bóng!',
  };

  if (typeof Hub !== 'undefined') Hub.register({
    id: 'danh-chuyen',
    name: 'Đánh chuyền',
    icon: '🎋',
    tagline: '"Một mốt, đôi hai…" Tung quả cà, nhặt que tre thật nhanh rồi bắt cho gọn.',
    players: '1 người · tự luyện',
    rules: `
      <ol>
        <li>Bấm <kbd>Space</kbd> (hoặc nút <b>Tung bóng</b>) để tung quả bóng lên.</li>
        <li>Trong lúc bóng bay, bấm <kbd>J</kbd> (hoặc <b>Nhặt que</b>) đủ số que của bàn: <b>bàn 1</b> nhặt 1 que mỗi lần, <b>bàn 2</b> nhặt 2 que… lần cuối nhặt nốt số que còn lại.</li>
        <li>Bóng rơi gần tới tay (vòng sáng hiện lên) thì bấm <kbd>Space</kbd> / <b>Bắt</b>.</li>
        <li>Bắt sớm, để bóng rơi, hoặc chưa nhặt đủ que là <b>mất lượt</b> (mất 1 mạng ❤️, que vừa nhặt phải đặt lại). Hết 3 mạng là thua.</li>
        <li>Nhặt hết 10 que là qua bàn. Qua đủ <b>5 bàn</b> là thắng. Bàn càng cao bóng rơi càng nhanh.</li>
      </ol>
      <p class="muted">Ngày xưa các bạn gái chơi bằng bó que tre vót và quả cà pháo, quả bòng, vừa chơi vừa đếm theo nhịp đồng dao.</p>`,

    render(root, ctx) {
      let ban = 1, lives = LIVES, score = 0, best = Hub.store.get('dc:best', 0);
      let plan = [], k = 0, taken = 0, picked = 0, phase = 'idle', t0 = 0, raf = 0, dead = false;

      root.innerHTML = `
        <div class="dc-hud">
          <span class="badge dc-ban">Bàn 1/5</span>
          <span class="dc-lives" aria-label="Số mạng"></span>
          <span>Điểm <b class="dc-score">0</b></span>
          <span class="muted">Kỷ lục <b class="dc-best">0</b></span>
        </div>
        <p class="dc-chant" aria-live="polite"></p>
        <div class="dc-court" aria-hidden="true">
          <div class="dc-zone"></div>
          <div class="dc-ball"></div>
          <div class="dc-hand">✋</div>
        </div>
        <div class="dc-sticks" role="img" aria-label="Bó que tre">${'<span class="que"></span>'.repeat(STICKS)}</div>
        <p class="dc-need"></p>
        <p class="dc-msg" aria-live="polite"></p>
        <div class="row center dc-ctrl">
          <button class="btn primary lg" data-act="ball">🎾 Tung bóng <kbd>Space</kbd></button>
          <button class="btn lg" data-act="pick">🎋 Nhặt que <kbd>J</kbd></button>
        </div>
        <div class="row center"><button class="btn" data-act="new">🔄 Ván mới <kbd>N</kbd></button></div>`;
      const $ = (q) => root.querySelector(q);
      const ques = root.querySelectorAll('.que');
      const ballEl = $('.dc-ball');
      const msg = (t) => { $('.dc-msg').textContent = t; };

      // que nằm lệch nhau một chút cho giống bó que thả xuống sân (cố định, không ngẫu nhiên)
      ques.forEach((q, i) => { q.style.setProperty('--r', ((i * 37) % 23 - 11) + 'deg'); });

      function placeBall(h, below) {
        // h: 0..1 độ cao trên tầm tay; below: 0..1 rơi quá tay xuống đất
        const bottom = 16 + h * 72 - below * 14;
        ballEl.style.bottom = bottom + '%';
      }

      function draw() {
        $('.dc-ban').textContent = `Bàn ${ban}/${BANS}`;
        $('.dc-lives').textContent = '❤️'.repeat(lives) + '🤍'.repeat(LIVES - lives);
        $('.dc-score').textContent = score;
        $('.dc-best').textContent = best;
        $('.dc-chant').textContent = phase === 'over' ? '' : chantLine(ban, k);
        const need = plan[k] || 0;
        $('.dc-need').textContent = phase === 'over' ? '' : `Nhặt ${picked}/${need} que · còn ${STICKS - taken} que trên sân`;
        ques.forEach((q, i) => {
          q.classList.toggle('gone', i < taken);
          q.classList.toggle('up', i >= taken && i < taken + picked);
        });
        const ballBtn = $('[data-act="ball"]');
        ballBtn.innerHTML = phase === 'air' ? '✋ Bắt! <kbd>Space</kbd>' : '🎾 Tung bóng <kbd>Space</kbd>';
        ballBtn.disabled = phase === 'over';
        $('[data-act="pick"]').disabled = phase !== 'air';
        const w = catchWindow(ban), T = airtime(ban);
        $('.dc-zone').style.height = (16 + ballHeight(w[0], T) * 72 + 6) + '%';
      }

      function newGame() {
        cancelAnimationFrame(raf);
        ban = 1; lives = LIVES; score = 0;
        startBan();
        msg('Bấm Space để tung bóng.');
      }

      function startBan() {
        plan = tosses(ban); k = 0; taken = 0; picked = 0; phase = 'idle';
        ballEl.className = 'dc-ball';
        placeBall(0, 0);
        draw();
      }

      function toss() {
        if (phase !== 'idle') return;
        phase = 'air'; picked = 0; t0 = performance.now();
        ballEl.className = 'dc-ball';
        msg('');
        draw();
        raf = requestAnimationFrame(tick);
      }

      function tick() {
        if (dead || !ctx.alive() || phase !== 'air') return;
        const t = performance.now() - t0, T = airtime(ban), w = catchWindow(ban);
        placeBall(ballHeight(t, T), t > T ? Math.min(1, (t - T) / GRACE) : 0);
        ballEl.classList.toggle('catchable', t >= w[0] && t <= w[1]);
        $('.dc-court').classList.toggle('catchable', t >= w[0] && t <= w[1]);
        if (t > w[1]) return resolve('late');
        raf = requestAnimationFrame(tick);
      }

      function pick() {
        if (phase !== 'air') return;
        if (picked >= (plan[k] || 0)) return;          // nhặt thừa thì bỏ qua
        picked++;
        draw();
      }

      function catchBall() {
        if (phase !== 'air') return;
        resolve(judge(performance.now() - t0, ban, picked, plan[k]));
      }

      function resolve(res) {
        cancelAnimationFrame(raf);
        $('.dc-court').classList.remove('catchable');
        ballEl.classList.remove('catchable');
        if (res === 'ok') {
          score += plan[k] * ban;
          taken += plan[k]; picked = 0; k++;
          placeBall(0, 0);
          ballEl.classList.add('caught');
          if (score > best) { best = score; Hub.store.set('dc:best', best); }
          if (k >= plan.length) {
            if (ban >= BANS) return finish(true);
            ban++;
            Hub.toast(`Qua bàn ${ban - 1}! Sang bàn ${ban}.`, 'good');
            startBan();
            return msg(`🎉 Sạch que! Bàn ${ban}: mỗi lần nhặt ${ban} que.`);
          }
          phase = 'idle';
          msg('👏 Gọn! Tung tiếp nào.');
          return draw();
        }
        lives--; picked = 0;
        placeBall(0, res === 'late' ? 1 : 0);
        ballEl.classList.add('miss');
        if (lives <= 0) { msg('💥 ' + WHY[res]); return finish(false); }
        phase = 'idle';
        msg(`💥 ${WHY[res]} Mất lượt, còn ${lives} mạng.`);
        draw();
      }

      function finish(won) {
        phase = 'over';
        if (score > best) { best = score; Hub.store.set('dc:best', best); }
        msg(won ? `🏆 Qua cả 5 bàn! Điểm ${score}.` : `Hết mạng ở bàn ${ban}. Điểm ${score}. Bấm N để chơi lại.`);
        Hub.toast(won ? 'Thắng rồi!' : 'Hết lượt', won ? 'good' : 'bad');
        Hub.record('danh-chuyen', won ? 'win' : 'lose');
        draw();
      }

      function ballAct() { if (phase === 'idle') toss(); else if (phase === 'air') catchBall(); }

      root.addEventListener('click', (e) => {
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'ball') ballAct();
        else if (a.dataset.act === 'pick') pick();
        else if (a.dataset.act === 'new') newGame();
      });
      const off = Hub.onKey((e) => {
        if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
        const key = e.key.toLowerCase();
        if (e.key === ' ') { e.preventDefault(); ballAct(); }
        else if (key === 'j') pick();
        else if (key === 'n') newGame();
      });

      newGame();
      return () => { dead = true; off(); cancelAnimationFrame(raf); };
    },
  });

  // để kiểm thử bằng Node
  if (typeof module !== 'undefined') module.exports = { airtime, catchWindow, tosses, judge, ballHeight, chantLine };
})();
