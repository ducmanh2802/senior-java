/* Bầu cua tôm cá: trò lắc xúc xắc ngày Tết. Chỉ chơi bằng "xu" ảo, không tiền thật. */
(function () {
  'use strict';

  const FACES = [
    { id: 'nai', name: 'Nai', icon: '🦌' },
    { id: 'bau', name: 'Bầu', icon: '🍐' },
    { id: 'ga', name: 'Gà', icon: '🐓' },
    { id: 'ca', name: 'Cá', icon: '🐟' },
    { id: 'cua', name: 'Cua', icon: '🦀' },
    { id: 'tom', name: 'Tôm', icon: '🦐' },
  ];
  const CHIPS = [1, 5, 10, 25];

  Hub.register({
    id: 'bau-cua',
    name: 'Bầu cua tôm cá',
    icon: '🦀',
    tagline: 'Đặt xu, lắc bát, mở ra xem. Trò không thể thiếu mỗi dịp Tết.',
    players: '1 người · xu ảo',
    rules: `
      <ol>
        <li>Chọn mệnh giá xu rồi bấm vào các con vật để đặt cược, đặt được nhiều con.</li>
        <li>Bấm <b>Lắc bát</b>: ba viên xúc xắc được lắc trong bát.</li>
        <li>Con vật xuất hiện <b>k</b> lần thì bạn được nhận lại xu đã đặt cộng thêm <b>k lần</b> số đó. Con không ra thì mất xu đặt vào con đó.</li>
      </ol>
      <p class="muted">Chỉ là xu ảo để vui chơi. Hết xu thì xin lì xì ông bà 🧧.</p>`,

    render(root, ctx) {
      let coins = Hub.store.get('bc:coins', 100);
      let chip = 5, bets = {}, rolling = false, dice = [null, null, null];

      root.innerHTML = `
        <div class="bc-top">
          <div class="bc-coins">🪙 <b class="c"></b> xu</div>
          <div class="chips bc-chips" role="group" aria-label="Mệnh giá">${CHIPS.map((c) => `<button class="chip" data-chip="${c}">${c}</button>`).join('')}</div>
        </div>
        <div class="bc-bowl" aria-live="polite"><div class="bowl-lid">🥣</div><div class="dice"></div></div>
        <div class="bc-mat">${FACES.map((f, k) => `
          <button class="bc-cell" data-face="${f.id}" aria-label="Đặt cược ${f.name}">
            <span class="ic">${f.icon}</span><span class="nm">${f.name} <kbd>${k + 1}</kbd></span><span class="bet"></span>
          </button>`).join('')}</div>
        <p class="bc-msg" aria-live="polite">Đặt cược đi nào!</p>
        <div class="row center">
          <button class="btn primary lg" data-act="roll">🎲 Lắc bát <kbd>Space</kbd></button>
          <button class="btn" data-act="clear">Bỏ cược <kbd>C</kbd></button>
          <button class="btn" data-act="lixi" hidden>🧧 Xin lì xì</button>
        </div>`;

      const $ = (q) => root.querySelector(q);
      const totalBet = () => Object.values(bets).reduce((a, b) => a + b, 0);

      function draw() {
        $('.c').textContent = coins;
        root.querySelectorAll('[data-chip]').forEach((b) => b.classList.toggle('active', +b.dataset.chip === chip));
        root.querySelectorAll('.bc-cell').forEach((el) => {
          const v = bets[el.dataset.face] || 0;
          el.querySelector('.bet').textContent = v ? '🪙 ' + v : '';
          el.classList.toggle('has', !!v);
          const hits = dice.filter((d) => d === el.dataset.face).length;
          el.classList.toggle('hit', !rolling && hits > 0);
          el.dataset.hits = hits ? '×' + hits : '';
        });
        $('[data-act="lixi"]').hidden = coins + totalBet() > 0;
        $('[data-act="roll"]').disabled = rolling;
      }
      function drawDice(arr, spinning) {
        $('.dice').innerHTML = arr.map((d) => {
          const f = FACES.find((x) => x.id === d);
          return `<span class="die ${spinning ? 'spin' : ''}">${f ? f.icon : '❔'}</span>`;
        }).join('');
      }

      function bet(face) {
        if (rolling) return;
        if (coins < chip) return Hub.toast('Không đủ xu!', 'bad');
        if (dice[0]) { dice = [null, null, null]; drawDice(dice); }
        bets[face] = (bets[face] || 0) + chip;
        Hub.sfx('tap');
        coins -= chip;
        Hub.store.set('bc:coins', coins);
        draw();
      }
      function clear() {
        if (rolling) return;
        coins += totalBet(); bets = {}; Hub.store.set('bc:coins', coins); draw();
      }

      async function roll() {
        if (rolling) return;
        if (!totalBet()) return Hub.toast('Đặt ít nhất một con đã!');
        rolling = true; draw();
        $('.bc-bowl').classList.add('shaking');
        for (let k = 0; k < 10; k++) {
          drawDice([Hub.pick(FACES).id, Hub.pick(FACES).id, Hub.pick(FACES).id], true);
          Hub.sfx('stone');
          await Hub.sleep(110);
          if (!ctx.alive()) return;
        }
        $('.bc-bowl').classList.remove('shaking');
        dice = [0, 1, 2].map(() => Hub.pick(FACES).id);
        drawDice(dice);
        let back = 0;
        for (const [face, v] of Object.entries(bets)) {
          const k = dice.filter((d) => d === face).length;
          if (k) back += v + v * k;
        }
        const spent = totalBet();
        coins += back;
        Hub.store.set('bc:coins', coins);
        const net = back - spent;
        $('.bc-msg').textContent = net > 0 ? `🎉 Thắng ${net} xu!` : net === 0 ? 'Hoà vốn.' : `😅 Mất ${-net} xu.`;
        Hub.record('bau-cua', net > 0 ? 'win' : net < 0 ? 'lose' : 'draw');
        bets = {}; rolling = false; draw();
      }

      root.addEventListener('click', (e) => {
        const c = e.target.closest('[data-chip]');
        if (c) { chip = +c.dataset.chip; return draw(); }
        const f = e.target.closest('[data-face]');
        if (f) return bet(f.dataset.face);
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'roll') roll();
        if (a.dataset.act === 'clear') clear();
        if (a.dataset.act === 'lixi') {
          coins += 50; Hub.store.set('bc:coins', coins);
          Hub.toast('Bà cho 50 xu, nhớ chơi vui thôi nhé! 🧧', 'good'); draw();
        }
      });
      const off = Hub.onKey((e) => {
        if (e.key === ' ') { e.preventDefault(); roll(); }
        else if (e.key === 'c' || e.key === 'C') clear();
        else if (e.key >= '1' && e.key <= '6') bet(FACES[+e.key - 1].id);
      });

      drawDice(dice); draw();
      return off;
    },
  });
})();
