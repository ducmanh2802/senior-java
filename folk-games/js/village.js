/* Bản đồ làng: mỗi "góc" làng gom vài trò chơi, kèm lời Bà kể chuyện. */
(function () {
  'use strict';

  const SPOTS = [
    {
      id: 'goc-da', name: 'Gốc đa đầu làng', icon: '🌳', x: 17, y: 50,
      games: ['o-an-quan', 'oan-tu-ti'],
      tale: 'Trưa hè, cả xóm kéo nhau ra gốc đa đầu làng hóng mát. Đứa nào cũng nhặt sẵn một túi sỏi, lấy gạch non kẻ bàn ô ăn quan ngay xuống đất. Ai đi trước thì cứ "oẳn tù tì" mà định.',
    },
    {
      id: 'san-dinh', name: 'Sân đình', icon: '🏮', x: 50, y: 42,
      games: ['keo-co', 'rong-ran', 'meo-duoi-chuot', 'bit-mat'],
      tale: 'Hội làng đầu xuân, sân đình đông như trẩy hội. Trai làng kéo co, tiếng trống thúc "hò dô ta" vang cả một góc trời. Bọn trẻ con thì nắm áo nhau chơi rồng rắn lên mây quanh mấy cây cột đình.',
    },
    {
      id: 'dau-ngo', name: 'Đầu ngõ', icon: '🏡', x: 79, y: 56,
      games: ['co-ganh', 'nhay-lo-co', 'danh-chuyen', 'danh-quay'],
      tale: 'Đầu ngõ nhà nào cũng có khoảng sân gạch. Con trai ngồi xổm đánh cờ gánh, con gái kẻ ô nhảy lò cò, hoặc ngồi bệt xuống thềm đánh chuyền, miệng đếm "một mốt, một hai…".',
    },
    {
      id: 'cho-tet', name: 'Phiên chợ Tết', icon: '🧧', x: 34, y: 75,
      games: ['bau-cua'],
      tale: 'Mùng Một Tết, áo mới tinh, túi đầy tiền lì xì. Ông bà trải tấm bạt bầu cua ra hiên, cả nhà ngồi quây lại, đặt vài đồng lấy may. Ván nào thắng thì cười như được mùa!',
    },
    {
      id: 'bo-de', name: 'Bờ đê', icon: '🪁', x: 66, y: 22,
      games: ['danh-dao'],
      tale: 'Chiều chiều trên bờ đê, diều sáo bay vi vu. Dưới chân đê, mấy đứa con trai khoét một cái lỗ nhỏ, đứng sau vạch ném đáo, tiếng đồng xu chạm nhau lách cách.',
    },
  ];

  const SCENE = `
  <svg class="vl-scene" viewBox="0 0 800 440" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="vlSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sky1"/><stop offset="1" class="sky2"/></linearGradient>
    </defs>
    <rect width="800" height="440" fill="url(#vlSky)"/>
    <circle cx="690" cy="70" r="34" class="sun"/>
    <path d="M0 190 L90 120 L170 170 L260 105 L360 175 L450 130 L560 180 L660 125 L800 185 L800 230 L0 230Z" class="mount"/>
    <!-- đê + diều -->
    <path d="M0 150 Q400 95 800 140 L800 175 Q400 135 0 190Z" class="dyke" transform="translate(0,40)"/>
    <g class="kite" transform="translate(560 40) rotate(12)"><path d="M0 -22 L16 0 L0 26 L-16 0Z"/><path d="M0 26 q6 14 -4 26 q-8 12 2 24" class="tail"/></g>
    <path d="M552 66 Q520 120 520 170" class="string"/>
    <!-- ruộng lúa -->
    <path d="M0 230 L800 230 L800 440 L0 440Z" class="field"/>
    <g class="rows">${Array.from({ length: 9 }, (_, k) => `<path d="M${-40 + k * 110} 440 L${360 + k * 15} 230"/>`).join('')}</g>
    <!-- đường làng -->
    <path d="M330 440 Q380 330 400 280 Q420 250 400 232 L430 232 Q450 255 440 285 Q430 340 470 440Z" class="road"/>
    <!-- cây đa -->
    <g transform="translate(135 215)">
      <rect x="-12" y="-10" width="24" height="70" rx="6" class="trunk"/>
      <path d="M-8 55 q-20 6 -30 10 M8 55 q20 6 30 10" class="root"/>
      <circle cx="0" cy="-40" r="62" class="canopy"/><circle cx="-50" cy="-15" r="38" class="canopy2"/><circle cx="52" cy="-12" r="40" class="canopy2"/>
    </g>
    <!-- đình -->
    <g transform="translate(400 185)">
      <path d="M-120 0 Q-110 -26 -80 -28 L80 -28 Q110 -26 120 0 Q90 -10 70 -10 L-70 -10 Q-90 -10 -120 0Z" class="roof1"/>
      <path d="M-80 -28 Q-66 -56 -40 -58 L40 -58 Q66 -56 80 -28Z" class="roof2"/>
      <circle cx="0" cy="-64" r="6" class="pearl"/>
      <rect x="-80" y="-10" width="160" height="44" class="wall"/>
      <rect x="-14" y="2" width="28" height="32" class="door"/><rect x="-56" y="6" width="20" height="16" class="door"/><rect x="36" y="6" width="20" height="16" class="door"/>
    </g>
    <!-- nhà tranh -->
    <g transform="translate(640 250)">
      <path d="M-70 0 L0 -50 L70 0Z" class="thatch"/><rect x="-55" y="0" width="110" height="46" class="wall"/>
      <rect x="-12" y="14" width="24" height="32" class="door"/>
      <path d="M90 46 L90 -10 M78 -6 q12 -20 24 0" class="bamboo"/>
    </g>
    <!-- chợ -->
    <g transform="translate(270 330)">
      <path d="M-60 0 L0 -30 L60 0Z" class="tent"/><rect x="-50" y="0" width="100" height="26" class="stall"/>
      <circle cx="-25" cy="-6" r="6" class="lantern"/><circle cx="25" cy="-6" r="6" class="lantern"/>
    </g>
  </svg>`;

  function render(el) {
    const ids = new Set(Hub.games.map((g) => g.id));
    el.innerHTML = `
      <div class="village" role="group" aria-label="Bản đồ làng">
        ${SCENE}
        ${SPOTS.map((s) => `<button class="vl-spot" data-spot="${s.id}" style="left:${s.x}%;top:${s.y}%">
          <span class="ic" aria-hidden="true">${s.icon}</span><span class="lb">${s.name}</span></button>`).join('')}
      </div>
      <div class="vl-panel card" aria-live="polite" hidden></div>`;
    const panel = el.querySelector('.vl-panel');

    function open(id) {
      const s = SPOTS.find((x) => x.id === id);
      el.querySelectorAll('.vl-spot').forEach((b) => b.classList.toggle('active', b.dataset.spot === id));
      Hub.store.set('village:last', id);
      const games = s.games.filter((g) => ids.has(g)).map((g) => Hub.game(g));
      panel.hidden = false;
      panel.innerHTML = `
        <div class="ba"><span class="ba-face" aria-hidden="true">👵</span>
          <div class="ba-say"><b>Bà kể:</b> <span class="tale"></span></div></div>
        <h3>${s.icon} ${Hub.esc(s.name)}</h3>
        <div class="vl-games">${games.map((g) => `<a class="btn" href="#/choi/${g.id}">${g.icon} ${Hub.esc(g.name)}</a>`).join('') || '<span class="muted">Sắp có trò mới ở đây…</span>'}</div>`;
      typewrite(panel.querySelector('.tale'), s.tale);
    }

    let typing = 0;
    function typewrite(node, text) {
      const my = ++typing;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { node.textContent = text; return; }
      let i = 0;
      (function step() {
        if (my !== typing || !node.isConnected) return;
        i = Math.min(text.length, i + 2);
        node.textContent = text.slice(0, i);
        if (i < text.length) setTimeout(step, 18);
      })();
    }

    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-spot]');
      if (b) { Hub.sfx('tap'); open(b.dataset.spot); }
    });
    open(Hub.store.get('village:last', 'goc-da'));
  }

  Hub.village = { render, SPOTS };
})();
