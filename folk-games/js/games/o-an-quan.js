/* Ô ăn quan — 2 người cùng máy hoặc đấu với máy.
 *
 * Bàn 12 ô đánh số theo chiều kim đồng hồ:
 *   0        = ô quan trái
 *   1..5     = hàng trên (người chơi 1 / máy), trái → phải
 *   6        = ô quan phải
 *   7..11    = hàng dưới (người chơi 0 / bạn), phải → trái
 * Đi theo chiều +1 là chiều kim đồng hồ.
 */
(function () {
  'use strict';

  const QUAN = 10;          // một viên quan = 10 dân
  const N = 12;
  const OWN = [[7, 8, 9, 10, 11], [1, 2, 3, 4, 5]];
  const mod = (i) => ((i % N) + N) % N;
  const isQuan = (i) => i === 0 || i === 6;
  const has = (c) => c.n > 0 || c.big;

  function initial() {
    const cells = [];
    for (let i = 0; i < N; i++) cells.push({ n: isQuan(i) ? 0 : 5, big: isQuan(i) });
    return { cells, score: [0, 0], turn: 0, over: false };
  }
  const clone = (s) => ({ cells: s.cells.map((c) => ({ n: c.n, big: c.big })), score: s.score.slice(), turn: s.turn, over: s.over });

  function moves(s, p) {
    const out = [];
    for (const i of OWN[p]) if (s.cells[i].n > 0) { out.push([i, 1]); out.push([i, -1]); }
    return out;
  }

  /** Rải quân. Trả về trạng thái mới + chuỗi sự kiện để diễn hoạt. */
  function play(st, from, dir) {
    const s = clone(st);
    const p = s.turn;
    const ev = [];
    let pos = from;
    let hand = s.cells[from].n;
    s.cells[from].n = 0;
    ev.push({ t: 'pick', i: from, n: hand });
    let guard = 0;
    for (;;) {
      while (hand > 0) {
        pos = mod(pos + dir);
        s.cells[pos].n++;
        hand--;
        ev.push({ t: 'drop', i: pos, hand });
      }
      const nx = mod(pos + dir);
      if (has(s.cells[nx])) {
        if (isQuan(nx) || ++guard > 80) { ev.push({ t: 'stop', i: nx }); break; }  // gặp ô quan → mất lượt
        hand = s.cells[nx].n;                 // bốc ô kế tiếp, rải tiếp
        s.cells[nx].n = 0;
        pos = nx;
        ev.push({ t: 'pick', i: nx, n: hand });
        continue;
      }
      // ô kế tiếp trống → ăn ô sau nó, có thể ăn liên tiếp (ăn "cách")
      let empty = nx;
      for (;;) {
        const tgt = mod(empty + dir);
        if (!has(s.cells[tgt])) break;        // hai ô trống liền → hết lượt
        const amt = s.cells[tgt].n + (s.cells[tgt].big ? QUAN : 0);
        s.score[p] += amt;
        ev.push({ t: 'cap', i: tgt, amt, p, big: s.cells[tgt].big });
        s.cells[tgt].n = 0;
        s.cells[tgt].big = false;
        const after = mod(tgt + dir);
        if (has(s.cells[after])) break;
        empty = after;
      }
      break;
    }
    finishTurn(s, ev);
    return { s, ev };
  }

  function finishTurn(s, ev) {
    // Hết quan cả hai bên → "hết quan, tàn dân, thu quân, kéo về"
    if (!has(s.cells[0]) && !has(s.cells[6])) {
      for (const q of [0, 1]) {
        let sum = 0;
        for (const i of OWN[q]) { sum += s.cells[i].n; s.cells[i].n = 0; }
        s.score[q] += sum;
        if (ev) ev.push({ t: 'collect', p: q, amt: sum });
      }
      s.over = true;
      return;
    }
    s.turn = 1 - s.turn;
    // Đến lượt mà 5 ô nhà mình trống → lấy 5 dân đã ăn rải lại (thiếu thì "vay", trừ vào điểm)
    const p = s.turn;
    if (OWN[p].every((i) => s.cells[i].n === 0)) {
      for (const i of OWN[p]) s.cells[i].n = 1;
      s.score[p] -= 5;
      if (ev) ev.push({ t: 'refill', p });
    }
  }

  // ---------- Máy: minimax ----------
  function evaluate(s, me) { return s.score[me] - s.score[1 - me]; }

  function search(s, depth, me, alpha, beta) {
    if (depth === 0 || s.over) return evaluate(s, me);
    const ms = moves(s, s.turn);
    if (!ms.length) return evaluate(s, me);
    const maxing = s.turn === me;
    let best = maxing ? -Infinity : Infinity;
    for (const [i, d] of ms) {
      const v = search(play(s, i, d).s, depth - 1, me, alpha, beta);
      if (maxing) { best = Math.max(best, v); alpha = Math.max(alpha, v); }
      else { best = Math.min(best, v); beta = Math.min(beta, v); }
      if (beta <= alpha) break;
    }
    return best;
  }

  function aiMove(s, level) {
    const ms = moves(s, s.turn);
    if (level === 'easy' && Math.random() < 0.5) return Hub.pick(ms);
    const depth = level === 'hard' ? 6 : level === 'normal' ? 3 : 1;
    let best = -Infinity, choices = [];
    for (const [i, d] of ms) {
      const v = search(play(s, i, d).s, depth - 1, s.turn, -Infinity, Infinity);
      if (v > best) { best = v; choices = [[i, d]]; } else if (v === best) choices.push([i, d]);
    }
    return Hub.pick(choices);
  }

  // ---------- Giao diện ----------
  function stones(n, cls) {
    const shown = Math.min(n, 18);
    let html = '';
    for (let k = 0; k < shown; k++) {
      // vị trí giả ngẫu nhiên nhưng ổn định theo k
      const x = 18 + ((k * 37) % 64), y = 18 + ((k * 53 + (k >> 2) * 11) % 58);
      html += `<i class="soi ${cls || ''}" style="left:${x}%;top:${y}%"></i>`;
    }
    return html;
  }

  Hub.register({
    id: 'o-an-quan',
    name: 'Ô ăn quan',
    icon: '🪨',
    tagline: 'Rải sỏi, ăn dân, bắt quan, trò chơi trí tuệ của trẻ con làng quê.',
    players: '2 người · đấu máy',
    rules: `
      <p>Bàn có <b>10 ô dân</b> (mỗi ô 5 viên sỏi) và <b>2 ô quan</b> ở hai đầu (mỗi ô một viên quan to, tính bằng <b>${QUAN} dân</b>). Bạn giữ hàng dưới.</p>
      <ol>
        <li>Chọn một ô dân bên mình còn sỏi rồi chọn hướng ◀ / ▶. Bốc hết sỏi, rải mỗi ô một viên theo hướng đã chọn.</li>
        <li>Rải xong, nếu ô kế tiếp <b>có sỏi</b> thì bốc ô đó rải tiếp. Nếu ô kế tiếp là <b>ô quan</b> thì mất lượt.</li>
        <li>Nếu ô kế tiếp <b>trống</b> mà ô sau nó có sỏi thì <b>ăn</b> hết ô đó. Sau đó lại một ô trống rồi một ô có sỏi thì ăn tiếp (ăn liền nhiều ô).</li>
        <li>Hai ô trống liền nhau thì hết lượt.</li>
        <li>Đến lượt mà 5 ô nhà mình trống: lấy 5 dân đã ăn rải lại mỗi ô một viên, thiếu thì "vay" (bị trừ điểm).</li>
        <li>Hết cả hai quan thì ván kết thúc ("hết quan, tàn dân"). Dân còn bên nào thuộc về bên đó. Ai nhiều điểm hơn thì thắng.</li>
      </ol>
      <p class="muted">Luật có nhiều dị bản theo vùng, ví dụ quan tính 5 dân hoặc cấm ăn "quan non" khi ô quan còn ít dân. Ở đây dùng luật phổ biến nhất.</p>`,

    render(root, ctx) {
      let mode = Hub.store.get('oaq:mode', 'ai');
      let level = Hub.store.get('oaq:level', 'normal');
      let s, view, busy, selected, speed = Hub.store.get('oaq:speed', 1);
      // online: room = kết nối phòng, seat = 0 (chủ phòng, hàng dưới) | 1 (khách, hàng trên)
      let room = null, seat = 0, moveNo = 0, pending = [], offLobby = null;
      const names = () => mode === 'ai' ? ['Bạn', 'Máy']
        : mode === 'online' ? (seat === 0 ? ['Bạn', 'Bạn kia'] : ['Bạn kia', 'Bạn']) : ['Người 1', 'Người 2'];
      const flip = () => mode === 'online' && seat === 1; // khách online: xoay bàn để hàng mình ở dưới
      const canAct = (p) => mode === 'pvp' || (mode === 'ai' && p === 0) || (mode === 'online' && !!room && p === seat);

      root.innerHTML = `
        ${Hub.modeBar({ modes: [['ai', '🤖 Đấu máy'], ['pvp', '👫 2 người'], ['online', '🌐 Online']], levels: [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']], mode, level })}
        <div class="net-slot"></div>
        <div class="oaq-score"></div>
        <div class="oaq-board" aria-label="Bàn ô ăn quan"></div>
        <p class="oaq-msg" aria-live="polite"></p>
        <div class="row center">
          <button class="btn" data-act="new">🔄 Ván mới <kbd>N</kbd></button>
          <button class="btn" data-act="speed">⏩ Tốc độ: <span class="sp"></span></button>
        </div>`;
      const boardEl = root.querySelector('.oaq-board');
      const scoreEl = root.querySelector('.oaq-score');
      const msgEl = root.querySelector('.oaq-msg');
      root.querySelector('.sp').textContent = speed === 1 ? 'thường' : 'nhanh';
      root.querySelector('[data-level]').parentElement.hidden = mode !== 'ai';

      function msg(t) { msgEl.textContent = t; }

      function cellHtml(i, hl) {
        const c = view.cells[i];
        const quan = isQuan(i);
        const ownerOk = !busy && !view.over && canAct(view.turn) && ((view.turn === 0 && i >= 7) || (view.turn === 1 && i >= 1 && i <= 5));
        const playable = !quan && ownerOk && c.n > 0;
        const top = i >= 1 && i <= 5;
        // hướng trên màn hình → hướng chỉ số (khi bàn bị xoay 180° thì hàng 1..5 nằm dưới)
        const onBottom = flip() ? top : !top;
        const leftDir = onBottom ? 1 : -1, rightDir = -leftDir;
        const total = c.n + (c.big ? QUAN : 0);
        return `<div class="o ${quan ? 'quan ' + ((i === 0) !== flip() ? 'ql' : 'qr') : ''} ${playable ? 'playable' : ''} ${selected === i ? 'sel' : ''} ${hl && hl[i] ? hl[i] : ''}"
            data-i="${i}" ${playable ? `tabindex="0" role="button" aria-label="Ô ${i}, ${c.n} dân"` : ''}>
          ${c.big ? '<i class="quan-stone" title="Quan"></i>' : ''}
          ${stones(c.n)}
          <span class="cnt">${total}</span>
          ${selected === i ? `<button class="dir l" data-dir="${leftDir}" aria-label="Rải sang trái">◀</button><button class="dir r" data-dir="${rightDir}" aria-label="Rải sang phải">▶</button>` : ''}
        </div>`;
      }

      function draw(hl, hand) {
        const nm = names(), f = flip();
        boardEl.innerHTML = `
          ${cellHtml(f ? 6 : 0, hl)}
          <div class="dan top">${(f ? [7, 8, 9, 10, 11] : [1, 2, 3, 4, 5]).map((i) => cellHtml(i, hl)).join('')}</div>
          <div class="dan bot">${(f ? [5, 4, 3, 2, 1] : [11, 10, 9, 8, 7]).map((i) => cellHtml(i, hl)).join('')}</div>
          ${cellHtml(f ? 0 : 6, hl)}`;
        scoreEl.innerHTML = (f ? [0, 1] : [1, 0]).map((p) => `
          <div class="pl ${view.turn === p && !view.over ? 'on' : ''} p${p}">
            <span>${(p === 1) !== f ? '⬆' : '⬇'} ${nm[p]}</span><b>${view.score[p]}</b>
          </div>`).join('') + (hand != null ? `<div class="oaq-hand">✋ Trên tay: <b>${hand}</b></div>` : '');
      }

      async function animate(ev) {
        const delay = speed === 1 ? 260 : 90;
        for (const e of ev) {
          if (!ctx.alive()) return;
          const hl = {};
          if (e.t === 'pick') { view.cells[e.i].n = 0; hl[e.i] = 'flash-pick'; draw(hl, e.n); }
          else if (e.t === 'drop') { Hub.sfx('stone'); view.cells[e.i].n++; hl[e.i] = 'flash-drop'; draw(hl, e.hand); }
          else if (e.t === 'stop') { hl[e.i] = 'flash-stop'; draw(hl); }
          else if (e.t === 'cap') {
            hl[e.i] = 'flash-cap'; draw(hl);
            await Hub.sleep(delay);
            Hub.sfx('drum'); view.cells[e.i].n = 0; view.cells[e.i].big = false; view.score[e.p] += e.amt;
            draw();
            Hub.toast(`${names()[e.p]} ăn ${e.amt}${e.big ? ' (có quan!)' : ''}`, 'good');
          } else if (e.t === 'refill') { Hub.toast(`${names()[e.p]} hết dân, rải lại 5 viên`); }
          else if (e.t === 'collect') { /* xử lý ở cuối */ }
          await Hub.sleep(e.t === 'stop' ? delay * 2 : delay);
        }
      }

      async function doMove(i, d, remote) {
        if (mode === 'online' && room && !remote) room.send({ t: 'move', i, d, k: moveNo });
        moveNo++;
        busy = true; selected = null;
        const r = play(s, i, d);
        await animate(r.ev);
        if (!ctx.alive()) return;
        s = r.s; view = clone(s); busy = false;
        draw();
        if (s.over) return endGame();
        prompt();
        if (pending.length) onNet(pending.shift());
      }

      function endGame() {
        const [a, b] = s.score, nm = names();
        let text;
        if (a === b) text = 'Hoà! Hai bên ngang tài.';
        else text = `${nm[a > b ? 0 : 1]} thắng ${Math.max(a, b)} – ${Math.min(a, b)}!`;
        msg('🏁 Hết quan, tàn dân. ' + text);
        const me = mode === 'online' ? seat : 0;
        if (mode !== 'pvp') Hub.record('o-an-quan', s.score[me] > s.score[1 - me] ? 'win' : a === b ? 'draw' : 'lose');
      }

      async function prompt() {
        const nm = names();
        if (mode === 'ai' && s.turn === 1) {
          msg('🤖 Máy đang tính…');
          busy = true; draw();
          await Hub.sleep(450);
          if (!ctx.alive()) return;
          const [i, d] = aiMove(s, level);
          await doMove(i, d);
        } else if (mode === 'online' && !room) {
          msg('Tạo phòng rồi gửi mã cho bạn, hoặc nhập mã bạn gửi để vào chơi.');
        } else if (mode === 'online' && s.turn !== seat) {
          msg('⏳ Chờ bạn kia đi…');
        } else {
          msg(`Lượt ${nm[s.turn]}: chọn một ô ${(s.turn === 0) !== flip() ? 'hàng dưới' : 'hàng trên'} rồi chọn hướng.`);
        }
      }

      function newGame(fromNet) {
        if (mode === 'online' && room && !fromNet) room.send({ t: 'start' });
        s = initial(); view = clone(s); busy = false; selected = null; moveNo = 0; pending = [];
        draw(); prompt();
      }

      function onNet(m) {
        if (m.t === 'start') return newGame(true);
        if (m.t !== 'move') return;
        if (busy) { pending.push(m); return; }
        if (m.k !== moveNo || s.turn === seat || s.over) {
          Hub.toast('Hai máy bị lệch nhịp, bắt đầu lại ván', 'bad');
          return newGame();
        }
        doMove(m.i, m.d, true);
      }

      function setupMode() {
        const slot = root.querySelector('.net-slot');
        if (offLobby) { offLobby(); offLobby = null; }
        room = null; seat = 0; slot.innerHTML = '';
        if (mode !== 'online') return;
        offLobby = Hub.net.lobby({
          game: 'o-an-quan', el: slot,
          onReady(r) {
            room = r; seat = r.seat; r.onMessage = onNet;
            Hub.toast(seat === 0 ? 'Bạn đi trước' : 'Chủ phòng đi trước, chờ lượt nhé', 'good');
            if (seat === 0) newGame(); else { s = initial(); view = clone(s); moveNo = 0; draw(); prompt(); }
          },
          onPeerLeft() { room = null; busy = false; selected = null; draw(); msg('Bạn kia đã rời phòng. Chờ người khác vào…'); },
          onLeave() { room = null; newGame(); },
        });
      }

      root.addEventListener('click', (e) => {
        const ch = e.target.closest('[data-mode],[data-level]');
        if (ch) {
          if (ch.dataset.mode) { mode = ch.dataset.mode; Hub.store.set('oaq:mode', mode); }
          if (ch.dataset.level) { level = ch.dataset.level; Hub.store.set('oaq:level', level); }
          ch.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === ch));
          root.querySelector('[data-level]').parentElement.hidden = mode !== 'ai';
          if (ch.dataset.mode) setupMode();
          return newGame();
        }
        const act = e.target.closest('[data-act]');
        if (act && act.dataset.act === 'new') return newGame();
        if (act && act.dataset.act === 'speed') {
          speed = speed === 1 ? 2 : 1; Hub.store.set('oaq:speed', speed);
          root.querySelector('.sp').textContent = speed === 1 ? 'thường' : 'nhanh';
          return;
        }
        const dir = e.target.closest('[data-dir]');
        if (dir && selected != null) { e.stopPropagation(); return doMove(selected, +dir.dataset.dir); }
        const cell = e.target.closest('.o.playable');
        if (cell) { selected = +cell.dataset.i; draw(); }
      });
      root.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.o.playable')) {
          e.preventDefault(); selected = +e.target.dataset.i; draw();
          const b = boardEl.querySelector('.o.sel .dir'); if (b) b.focus();
        }
      });
      const offKey = Hub.onKey((e) => { if (e.key === 'n' || e.key === 'N') newGame(); });

      setupMode();
      newGame();
      return () => { offKey(); if (offLobby) offLobby(); };
    },
  });

  // để kiểm thử bằng Node
  if (typeof module !== 'undefined') module.exports = { initial, play, moves, aiMove };
})();
