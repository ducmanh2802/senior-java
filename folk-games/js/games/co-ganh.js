/* Cờ gánh: bàn 5×5, mỗi bên 8 quân. Gánh và vây để "đổi màu" quân đối phương. */
(function () {
  'use strict';

  const S = 5;
  const idx = (r, c) => r * S + c;
  const rc = (i) => [Math.floor(i / S), i % S];
  const inB = (r, c) => r >= 0 && r < S && c >= 0 && c < S;
  const diagOk = (i) => { const [r, c] = rc(i); return (r + c) % 2 === 0; };
  const ORTH = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const DIAG = [[1, 1], [-1, -1], [1, -1], [-1, 1]];

  // Bảng hàng xóm tính sẵn
  const NB = [];
  for (let i = 0; i < S * S; i++) {
    const [r, c] = rc(i);
    const ds = diagOk(i) ? ORTH.concat(DIAG) : ORTH;
    NB.push(ds.filter(([dr, dc]) => inB(r + dr, c + dc)).map(([dr, dc]) => idx(r + dr, c + dc)));
  }
  // Các trục để gánh: cặp (trái, phải) đối xứng qua ô
  const AXES = [];
  for (let i = 0; i < S * S; i++) {
    const [r, c] = rc(i);
    const pairs = [[[0, 1], [0, -1]], [[1, 0], [-1, 0]]];
    if (diagOk(i)) pairs.push([[1, 1], [-1, -1]], [[1, -1], [-1, 1]]);
    AXES.push(pairs
      .filter(([a, b]) => inB(r + a[0], c + a[1]) && inB(r + b[0], c + b[1]))
      .map(([a, b]) => [idx(r + a[0], c + a[1]), idx(r + b[0], c + b[1])]));
  }

  function initial() {
    const b = new Array(S * S).fill(0);
    // Quân 1 (bạn, phía dưới), quân 2 (phía trên). Thế cờ xuất phát truyền thống.
    for (let c = 0; c < S; c++) { b[idx(4, c)] = 1; b[idx(0, c)] = 2; }
    b[idx(3, 0)] = 1; b[idx(3, 4)] = 1; b[idx(2, 4)] = 1;
    b[idx(1, 0)] = 2; b[idx(1, 4)] = 2; b[idx(2, 0)] = 2;
    return { b, turn: 1, plies: 0 };
  }

  function moves(st, p) {
    const out = [];
    for (let i = 0; i < 25; i++) if (st.b[i] === p) for (const j of NB[i]) if (st.b[j] === 0) out.push([i, j]);
    return out;
  }

  /** Đi quân; trả về trạng thái mới + danh sách quân bị gánh / bị vây. */
  function play(st, from, to) {
    const b = st.b.slice();
    const p = b[from], o = 3 - p;
    b[to] = p; b[from] = 0;
    const ganh = [];
    for (const [x, y] of AXES[to]) if (b[x] === o && b[y] === o) { b[x] = p; b[y] = p; ganh.push(x, y); }
    // Vây (chẹt): nhóm quân đối phương không còn đường đi → thành quân mình
    const vay = [];
    const seen = new Array(25).fill(false);
    for (let i = 0; i < 25; i++) {
      if (b[i] !== o || seen[i]) continue;
      const group = [i]; seen[i] = true; let free = false;
      for (let k = 0; k < group.length; k++) {
        for (const j of NB[group[k]]) {
          if (b[j] === 0) free = true;
          else if (b[j] === o && !seen[j]) { seen[j] = true; group.push(j); }
        }
      }
      if (!free) vay.push(...group);
    }
    for (const i of vay) b[i] = p;
    return { s: { b, turn: o, plies: st.plies + 1 }, ganh, vay };
  }

  const count = (b, p) => b.reduce((n, v) => n + (v === p ? 1 : 0), 0);

  // ---------- Máy ----------
  function evaluate(st, me) {
    const mine = count(st.b, me), theirs = count(st.b, 3 - me);
    if (theirs === 0) return 1000;
    if (mine === 0) return -1000;
    return (mine - theirs) * 10 + (moves(st, me).length - moves(st, 3 - me).length) * 0.3;
  }
  function search(st, depth, me, alpha, beta) {
    const mine = count(st.b, me), theirs = count(st.b, 3 - me);
    if (depth === 0 || mine === 0 || theirs === 0) return evaluate(st, me);
    const ms = moves(st, st.turn);
    if (!ms.length) return evaluate(st, me);
    const maxing = st.turn === me;
    let best = maxing ? -Infinity : Infinity;
    for (const [f, t] of ms) {
      const v = search(play(st, f, t).s, depth - 1, me, alpha, beta);
      if (maxing) { if (v > best) best = v; if (v > alpha) alpha = v; }
      else { if (v < best) best = v; if (v < beta) beta = v; }
      if (beta <= alpha) break;
    }
    return best;
  }
  function aiMove(st, level) {
    const ms = moves(st, st.turn);
    if (!ms.length) return null;
    if (level === 'easy' && Math.random() < 0.45) return Hub.pick(ms);
    const depth = level === 'hard' ? 4 : level === 'normal' ? 2 : 1;
    let best = -Infinity, choices = [];
    for (const [f, t] of ms) {
      const v = search(play(st, f, t).s, depth - 1, st.turn, -Infinity, Infinity);
      if (v > best + 1e-9) { best = v; choices = [[f, t]]; } else if (Math.abs(v - best) < 1e-9) choices.push([f, t]);
    }
    return Hub.pick(choices);
  }

  // ---------- Giao diện ----------
  const CELL = 70, PAD = 35, SZ = PAD * 2 + CELL * 4;
  const px = (i) => { const [r, c] = rc(i); return [PAD + c * CELL, PAD + r * CELL]; };

  function linesSvg() {
    let l = '';
    for (let k = 0; k < S; k++) {
      l += `<line x1="${PAD}" y1="${PAD + k * CELL}" x2="${PAD + 4 * CELL}" y2="${PAD + k * CELL}"/>`;
      l += `<line x1="${PAD + k * CELL}" y1="${PAD}" x2="${PAD + k * CELL}" y2="${PAD + 4 * CELL}"/>`;
    }
    // Đường chéo đi qua các điểm (r+c) chẵn
    const d = [[0, 0, 4, 4], [0, 4, 4, 0], [0, 2, 2, 0], [0, 2, 2, 4], [2, 0, 4, 2], [2, 4, 4, 2]];
    for (const [r1, c1, r2, c2] of d) l += `<line x1="${PAD + c1 * CELL}" y1="${PAD + r1 * CELL}" x2="${PAD + c2 * CELL}" y2="${PAD + r2 * CELL}"/>`;
    return l;
  }

  Hub.register({
    id: 'co-ganh',
    name: 'Cờ gánh',
    icon: '⚫',
    tagline: 'Cờ của làng Ngọc Thanh (Quảng Nam): đi một bước, gánh hai quân.',
    players: '2 người · đấu máy',
    rules: `
      <p>Bàn 5×5 giao điểm, mỗi bên 8 quân. Không ăn quân mà <b>biến quân đối phương thành quân mình</b>.</p>
      <ol>
        <li>Mỗi lượt đi một quân sang một điểm trống kề bên, theo đường kẻ (cả đường chéo nếu có).</li>
        <li><b>Gánh:</b> đi vào giữa hai quân đối phương nằm trên cùng một đường thẳng thì cả hai quân đó thành quân mình.</li>
        <li><b>Vây (chẹt):</b> quân hoặc nhóm quân đối phương không còn đường đi thì cũng thành quân mình.</li>
        <li>Bên nào hết quân thì thua. Sau 200 nước mà chưa phân thắng bại thì hoà.</li>
      </ol>
      <p class="muted">Một số nơi chơi thêm luật "mở" (buộc đối phương phải vào thế gánh). Bản này chưa áp dụng luật đó.</p>`,

    render(root, ctx) {
      let mode = Hub.store.get('cg:mode', 'ai');
      let level = Hub.store.get('cg:level', 'normal');
      let s, sel = null, busy = false, last = null, flips = [];
      let room = null, mySide = 1, moveNo = 0, offLobby = null;
      const names = () => mode === 'ai' ? { 1: 'Bạn', 2: 'Máy' }
        : mode === 'online' ? (mySide === 1 ? { 1: 'Bạn (Đỏ)', 2: 'Bạn kia' } : { 1: 'Bạn kia', 2: 'Bạn (Xanh)' }) : { 1: 'Đỏ', 2: 'Xanh' };

      root.innerHTML = `
        ${Hub.modeBar({ modes: [['ai', '🤖 Đấu máy'], ['pvp', '👫 2 người'], ['online', '🌐 Online']], levels: [['easy', 'Dễ'], ['normal', 'Vừa'], ['hard', 'Khó']], mode, level })}
        <div class="net-slot"></div>
        <div class="cg-score"></div>
        <div class="cg-wrap"><svg class="cg-board" viewBox="0 0 ${SZ} ${SZ}" role="img" aria-label="Bàn cờ gánh">
          <rect x="4" y="4" width="${SZ - 8}" height="${SZ - 8}" rx="14" class="cg-bg"/>
          <g class="cg-lines">${linesSvg()}</g><g class="cg-pts"></g></svg></div>
        <p class="cg-msg" aria-live="polite"></p>
        <div class="row center"><button class="btn" data-act="new">🔄 Ván mới <kbd>N</kbd></button>
          <button class="btn" data-act="undo">↩️ Đi lại <kbd>U</kbd></button></div>`;
      const ptsEl = root.querySelector('.cg-pts');
      const scoreEl = root.querySelector('.cg-score');
      const msgEl = root.querySelector('.cg-msg');
      const lvlBar = root.querySelector('[data-level]').parentElement;
      lvlBar.hidden = mode !== 'ai';
      let history = [];

      function flipped() { return mode === 'online' && mySide === 2; }
      function humanTurn() {
        if (mode === 'online') return !!room && s.turn === mySide;
        return mode === 'pvp' || s.turn === 1;
      }

      function draw() {
        const targets = sel != null ? NB[sel].filter((j) => s.b[j] === 0) : [];
        let g = '';
        for (let i = 0; i < 25; i++) {
          const [x, y] = px(flipped() ? 24 - i : i); // khách online: xoay bàn 180° để quân mình ở dưới
          const v = s.b[i];
          const isT = targets.includes(i);
          const canPick = !busy && humanTurn() && v === s.turn && NB[i].some((j) => s.b[j] === 0);
          g += `<g class="pt ${isT ? 'target' : ''} ${canPick ? 'pick' : ''}" data-i="${i}" ${isT || canPick ? 'tabindex="0" role="button"' : ''}
                aria-label="${['Trống', 'Quân đỏ', 'Quân xanh'][v]} hàng ${Math.floor(i / 5) + 1} cột ${i % 5 + 1}">
            <circle cx="${x}" cy="${y}" r="30" class="hit"/>
            ${isT ? `<circle cx="${x}" cy="${y}" r="10" class="dot-t"/>` : ''}
            ${v ? `<circle cx="${x}" cy="${y}" r="22" class="piece p${v} ${sel === i ? 'sel' : ''} ${last === i ? 'last' : ''} ${flips.includes(i) ? 'flip' : ''}"/>` : ''}
          </g>`;
        }
        ptsEl.innerHTML = g;
        const nm = names();
        scoreEl.innerHTML = (flipped() ? [1, 2] : [2, 1]).map((p) => `<div class="pl p${p} ${s.turn === p ? 'on' : ''}"><span><i class="mini p${p}"></i>${nm[p]}</span><b>${count(s.b, p)}</b></div>`).join('');
      }
      const msg = (t) => { msgEl.textContent = t; };

      function checkEnd() {
        const a = count(s.b, 1), b = count(s.b, 2), nm = names();
        if (a && b && s.plies < 200 && moves(s, s.turn).length) return false;
        let res;
        if (!b || (a && !moves(s, 2).length && s.turn === 2)) res = 1;
        else if (!a || (b && !moves(s, 1).length && s.turn === 1)) res = 2;
        else res = 0;
        msg(res ? `🏁 ${nm[res]} thắng!` : '🏁 Hoà sau 200 nước.');
        const me = mode === 'online' ? mySide : 1;
        if (mode !== 'pvp') Hub.record('co-ganh', !res ? 'draw' : res === me ? 'win' : 'lose');
        busy = true; draw();
        return true;
      }

      async function apply(f, t, remote) {
        if (mode === 'online' && room && !remote) room.send({ t: 'move', f, to: t, k: moveNo });
        moveNo++;
        history.push(s);
        const r = play(s, f, t);
        s = r.s; last = t; sel = null; flips = r.ganh.concat(r.vay);
        Hub.sfx(flips.length ? 'drum' : 'stone');
        draw();
        const mover = names()[3 - s.turn];
        if (r.ganh.length) Hub.toast(`${mover} gánh ${r.ganh.length} quân!`, 'good');
        if (r.vay.length) Hub.toast(`${mover} vây được ${r.vay.length} quân!`, 'good');
        if (checkEnd()) return;
        await next();
      }

      async function next() {
        if (mode === 'ai' && s.turn === 2) {
          busy = true; msg('🤖 Máy đang nghĩ…'); draw();
          await Hub.sleep(500);
          if (!ctx.alive()) return;
          const m = aiMove(s, level);
          busy = false;
          if (m) await apply(m[0], m[1]);
        } else if (mode === 'online' && !room) {
          busy = false; draw(); msg('Tạo phòng rồi gửi mã cho bạn, hoặc nhập mã bạn gửi để vào chơi.');
        } else if (mode === 'online' && s.turn !== mySide) {
          busy = false; draw(); msg('⏳ Chờ bạn kia đi…');
        } else {
          busy = false; draw();
          msg(`Lượt ${names()[s.turn]}: chọn quân rồi chọn điểm đến.`);
        }
      }

      function newGame(fromNet) {
        if (mode === 'online' && room && !fromNet) room.send({ t: 'start' });
        s = initial(); sel = null; last = null; flips = []; busy = false; history = []; moveNo = 0; draw(); next();
      }

      function onNet(m) {
        if (m.t === 'start') return newGame(true);
        if (m.t !== 'move') return;
        const legal = m.k === moveNo && s.turn !== mySide && s.b[m.f] === s.turn && s.b[m.to] === 0 && NB[m.f].includes(m.to);
        if (!legal) { Hub.toast('Hai máy bị lệch nhịp, bắt đầu lại ván', 'bad'); return newGame(); }
        apply(m.f, m.to, true);
      }

      function setupMode() {
        const slot = root.querySelector('.net-slot');
        if (offLobby) { offLobby(); offLobby = null; }
        room = null; mySide = 1; slot.innerHTML = '';
        root.querySelector('[data-act="undo"]').hidden = mode === 'online';
        if (mode !== 'online') return;
        offLobby = Hub.net.lobby({
          game: 'co-ganh', el: slot,
          onReady(r) {
            room = r; mySide = r.seat + 1; r.onMessage = onNet;
            Hub.toast(mySide === 1 ? 'Bạn cầm quân Đỏ, đi trước' : 'Bạn cầm quân Xanh, chờ lượt nhé', 'good');
            if (mySide === 1) newGame(); else newGame(true);
          },
          onPeerLeft() { room = null; draw(); msg('Bạn kia đã rời phòng. Chờ người khác vào…'); },
          onLeave() { room = null; newGame(); },
        });
      }

      function undo() {
        if (busy || !history.length || mode === 'online') return;
        // đấu máy: lùi cả nước của máy lẫn của mình
        let back = mode === 'ai' ? 2 : 1;
        while (back-- > 0 && history.length) s = history.pop();
        if (mode === 'ai' && s.turn === 2 && history.length) s = history.pop();
        sel = null; last = null; flips = []; draw(); next();
      }

      function choose(i) {
        if (busy || !humanTurn()) return;
        if (sel != null && s.b[i] === 0 && NB[sel].includes(i)) return apply(sel, i);
        if (s.b[i] === s.turn) { sel = sel === i ? null : i; flips = []; draw(); }
      }

      root.addEventListener('click', (e) => {
        const ch = e.target.closest('[data-mode],[data-level]');
        if (ch) {
          if (ch.dataset.mode) { mode = ch.dataset.mode; Hub.store.set('cg:mode', mode); }
          if (ch.dataset.level) { level = ch.dataset.level; Hub.store.set('cg:level', level); }
          ch.parentElement.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === ch));
          lvlBar.hidden = mode !== 'ai';
          if (ch.dataset.mode) setupMode();
          return newGame();
        }
        const act = e.target.closest('[data-act]');
        if (act) return act.dataset.act === 'new' ? newGame() : undo();
        const pt = e.target.closest('.pt');
        if (pt) choose(+pt.dataset.i);
      });
      root.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.pt')) { e.preventDefault(); choose(+e.target.closest('.pt').dataset.i); }
      });
      const off = Hub.onKey((e) => {
        if (e.key === 'n' || e.key === 'N') newGame();
        if (e.key === 'u' || e.key === 'U') undo();
      });

      setupMode();
      newGame();
      return () => { off(); if (offLobby) offLobby(); };
    },
  });

  if (typeof module !== 'undefined') module.exports = { initial, play, moves, aiMove, NB, AXES };
})();
