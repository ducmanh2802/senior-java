/* Oẳn tù tì: búa, kéo, bao. Đấu với máy, ai thắng 3 hiệp trước thì thắng trận. */
(function () {
  'use strict';

  const H = {
    bua: { name: 'Búa', icon: '✊', beats: 'keo', key: '1' },
    keo: { name: 'Kéo', icon: '✌️', beats: 'bao', key: '2' },
    bao: { name: 'Bao', icon: '✋', beats: 'bua', key: '3' },
  };
  const IDS = Object.keys(H);

  Hub.register({
    id: 'oan-tu-ti',
    name: 'Oẳn tù tì',
    icon: '✊',
    tagline: '"Oẳn tù tì, ra cái gì, ra cái này!" Cách chọn ai đi trước của cả xóm.',
    players: '1 người · đấu máy',
    rules: `
      <ul>
        <li><b>Búa</b> ✊ đập <b>Kéo</b> ✌️, <b>Kéo</b> cắt <b>Bao</b> ✋, <b>Bao</b> bọc <b>Búa</b>.</li>
        <li>Cả hai cùng hô "Oẳn tù tì, ra cái gì, ra cái này!" rồi ra tay cùng lúc.</li>
        <li>Ai thắng <b>3 hiệp</b> trước thì thắng trận.</li>
      </ul>
      <p class="muted">Máy có để ý thói quen ra tay của bạn đấy 😉</p>`,

    render(root, ctx) {
      let score = [0, 0], busy = false, hist = [];

      root.innerHTML = `
        <div class="ott-arena">
          <div class="side"><div class="who">Bạn</div><div class="hand you">✊</div><b class="sc">0</b></div>
          <div class="chant" aria-live="polite">Chọn tay đi!</div>
          <div class="side"><div class="who">Máy</div><div class="hand cpu">✊</div><b class="sc">0</b></div>
        </div>
        <div class="row center ott-picks">${IDS.map((id) => `<button class="btn lg" data-h="${id}">${H[id].icon} ${H[id].name} <kbd>${H[id].key}</kbd></button>`).join('')}</div>
        <p class="ott-msg center" aria-live="polite"></p>
        <div class="row center"><button class="btn" data-act="new">🔄 Trận mới <kbd>N</kbd></button></div>`;
      const $ = (q) => root.querySelector(q);
      const scEls = root.querySelectorAll('.sc');

      // Máy đoán theo cặp (nước trước của bạn → nước bạn hay ra tiếp theo)
      function cpuPick() {
        if (hist.length < 3 || Math.random() < 0.35) return Hub.pick(IDS);
        const prev = hist[hist.length - 1];
        const cnt = { bua: 0, keo: 0, bao: 0 };
        for (let i = 1; i < hist.length; i++) if (hist[i - 1] === prev) cnt[hist[i]]++;
        const guess = IDS.reduce((a, b) => (cnt[b] > cnt[a] ? b : a), Hub.pick(IDS));
        return IDS.find((id) => H[id].beats === guess);
      }

      async function go(me) {
        if (busy) return;
        if (score[0] >= 3 || score[1] >= 3) newMatch();
        busy = true;
        root.querySelectorAll('[data-h]').forEach((b) => { b.disabled = true; });
        $('.ott-msg').textContent = '';
        const you = $('.hand.you'), cpu = $('.hand.cpu');
        you.textContent = cpu.textContent = '✊';
        for (const w of ['Oẳn tù tì…', 'ra cái gì…', 'ra cái này!']) {
          $('.chant').textContent = w;
          Hub.sfx('tap');
          you.classList.remove('bob'); cpu.classList.remove('bob');
          void you.offsetWidth;
          you.classList.add('bob'); cpu.classList.add('bob');
          await Hub.sleep(420);
          if (!ctx.alive()) return;
        }
        const ai = cpuPick();
        hist.push(me);
        you.textContent = H[me].icon; cpu.textContent = H[ai].icon;
        let r;
        if (me === ai) { r = 'Hoà hiệp này!'; }
        else if (H[me].beats === ai) { score[0]++; r = `${H[me].name} thắng ${H[ai].name}. Bạn ăn hiệp này!`; }
        else { score[1]++; r = `${H[ai].name} thắng ${H[me].name}. Máy ăn hiệp này.`; }
        scEls[0].textContent = score[0]; scEls[1].textContent = score[1];
        $('.chant').textContent = 'vs';
        if (score[0] === 3 || score[1] === 3) {
          const win = score[0] === 3;
          r += win ? ' 🏆 Bạn thắng trận!' : ' 🤖 Máy thắng trận.';
          Hub.record('oan-tu-ti', win ? 'win' : 'lose');
        }
        $('.ott-msg').textContent = r;
        busy = false;
        root.querySelectorAll('[data-h]').forEach((b) => { b.disabled = false; });
      }

      function newMatch() {
        score = [0, 0]; scEls[0].textContent = scEls[1].textContent = '0';
        $('.ott-msg').textContent = ''; $('.chant').textContent = 'Chọn tay đi!';
      }

      root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-h]');
        if (b) return go(b.dataset.h);
        if (e.target.closest('[data-act="new"]')) newMatch();
      });
      return Hub.onKey((e) => {
        const id = IDS.find((x) => H[x].key === e.key);
        if (id) go(id);
        if (e.key === 'n' || e.key === 'N') newMatch();
      });
    },
  });
})();
