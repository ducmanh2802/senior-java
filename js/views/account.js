/* View "account" — owner: task T33. Contract: see AGENTS.md "Views" + mục 10 (App.auth / App.sync). */
(function () {
  'use strict';

  const esc = App.esc;

  // App.auth / App.sync do js/core/auth.js cung cấp. Fallback để view không vỡ nếu file chưa nạp.
  const auth = App.auth || {
    enabled: false, user: null,
    onChange() { return function () {}; },
    profile: async () => ({}),
    usageToday: async () => ({}),
    exportData: async () => ({}),
    updateDisplayName: async () => {},
    signInWithGoogle: async () => {},
    signInWithEmail: async () => {},
    signOut: async () => {},
    deleteAccount: async () => {},
  };
  const sync = App.sync || {
    status: 'off', lastSyncAt: null, lastError: null,
    onStatus() { return function () {}; },
    now: async () => {},
  };

  // Nhãn + icon cho từng trạng thái đồng bộ.
  const SYNC_STATE = {
    off: { icon: '○', label: 'Tắt', cls: 'off' },
    idle: { icon: '✓', label: 'Đã đồng bộ', cls: 'ok' },
    syncing: { icon: '⟳', label: 'Đang đồng bộ…', cls: 'accent' },
    error: { icon: '⚠', label: 'Lỗi đồng bộ', cls: 'bad' },
  };

  // Tên loại lượt AI hiển thị trong hạn mức.
  const KIND_LABEL = {
    grade: 'Chấm câu trả lời',
    review: 'Review code',
    run: 'Chạy code',
    interview: 'Phỏng vấn AI',
  };

  // Từ khoá xác nhận ở bước 2 của xoá tài khoản.
  const DELETE_WORD = 'XOA';

  /** Chữ cái đầu của tên (avatar, nút trên thanh trên cùng). */
  function initialOf(name) {
    const s = String(name || '').trim();
    return s ? s.charAt(0).toUpperCase() : '?';
  }

  /** Tên hiển thị: ưu tiên tên trong hồ sơ, fallback về email. */
  function displayName(user) {
    if (!user) return '';
    return String(user.name || '').trim() || String(user.email || '').trim();
  }

  /** Thông điệp lỗi ngắn gọn từ exception. */
  function errText(e) {
    const m = e && e.message ? String(e.message) : 'lỗi không xác định';
    return m;
  }

  /**
   * Vẽ nút 👤 trên thanh trên cùng: khi đã đăng nhập thì hiện chữ cái đầu của tên.
   * Chỉ sửa phần tử qua DOM, không đụng index.html.
   */
  function paintAccountBtn() {
    const btn = document.querySelector('.account-btn');
    if (!btn) return;
    const u = auth.user;
    const name = displayName(u);
    btn.textContent = u ? (name ? initialOf(name) : '👤') : '👤';
    btn.title = u ? 'Tài khoản — ' + name : 'Tài khoản';
    btn.setAttribute('aria-label', u ? 'Tài khoản: ' + name : 'Tài khoản');
  }

  /** Tải file JSON về máy. */
  function downloadJson(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /** Thẻ số liệu nhỏ. */
  function statCard(num, label, cls) {
    return '<div class="stat"><div class="num ' + (cls || '') + '">' + esc(String(num)) + '</div>' +
      '<div class="lbl">' + esc(label) + '</div></div>';
  }

  /** Tóm tắt tiến độ đang lưu trên máy này. */
  function localStatsHtml() {
    const s = App.stats();
    const due = App.dueItems().length;
    const streak = App.store.streak();
    return '<div class="grid acc-stats">' +
      statCard(s.known, 'Đã thuộc', 'ok') +
      statCard(s.review, 'Cần ôn', 'warn') +
      statCard(s.unknown, 'Chưa biết', 'bad') +
      statCard(s.unseen, 'Chưa học') +
      statCard(due, 'Đến hạn ôn', 'accent') +
      statCard(streak + ' ngày', 'Chuỗi học liên tục') +
      '</div>';
  }

  /** Một mục lợi ích khi đăng nhập. */
  function benefit(icon, title, text) {
    return '<div class="acc-benefit"><span class="acc-benefit-ico" aria-hidden="true">' + icon + '</span>' +
      '<div><b>' + esc(title) + '</b><p>' + esc(text) + '</p></div></div>';
  }
  /** Trạng thái 1 — server chưa cấu hình tài khoản. */
  function notConfiguredHtml() {
    return '<section class="card acc-card acc-off">' +
      '<h2>Chưa bật tài khoản trên máy chủ này</h2>' +
      '<p class="muted">Bản deploy hiện tại chưa cấu hình đăng nhập. Mọi tính năng ôn tập vẫn dùng được bình thường — ' +
      'tiến độ được lưu <b>trong trình duyệt này</b>, không gửi lên máy chủ.</p>' +
      '<ul class="acc-list">' +
        '<li>Không cần đăng nhập: ngân hàng câu hỏi, flashcard, trắc nghiệm, thuật toán và phỏng vấn thử đều hoạt động.</li>' +
        '<li>Dữ liệu không rời khỏi máy của bạn.</li>' +
        '<li>Đổi trình duyệt, xoá dữ liệu site hoặc dùng máy khác thì tiến độ sẽ mất — hãy xuất tiến độ định kỳ.</li>' +
      '</ul>' +
      '<div class="row acc-actions">' +
        '<button type="button" class="btn primary" id="accExportLocal">Xuất tiến độ</button>' +
        '<a class="btn" href="#/legal/privacy">Đọc quyền riêng tư</a>' +
      '</div>' +
    '</section>' +
    '<section class="card acc-card">' +
      '<h2>Tiến độ đang có trên máy này</h2>' +
      localStatsHtml() +
      '<p class="small muted acc-note">“Xuất tiến độ” tải về file JSON; dùng “Nhập tiến độ” ở chân trang để nạp lại trên máy khác.</p>' +
    '</section>';
  }

  /** Trạng thái 2 — đã cấu hình nhưng chưa đăng nhập. */
  function signedOutHtml() {
    return '<section class="card acc-card">' +
      '<h2>Đăng nhập để đồng bộ tiến độ</h2>' +
      '<p class="muted">Đăng nhập miễn phí, không cần mật khẩu.</p>' +
      '<div class="acc-benefits">' +
        benefit('⟳', 'Đồng bộ nhiều thiết bị', 'Máy tính và điện thoại dùng chung tiến độ, lịch ôn và chuỗi học.') +
        benefit('🤖', 'Dùng AI chấm điểm', 'Chấm câu trả lời tự luận, review code và luyện phỏng vấn — có hạn mức mỗi ngày.') +
        benefit('🗂', 'Giữ lịch sử lâu dài', 'Lịch sử trắc nghiệm và phỏng vấn thử nằm trên cloud, không mất khi xoá dữ liệu trình duyệt.') +
        benefit('🔒', 'Bạn chủ dữ liệu', 'Tải toàn bộ dữ liệu về máy hoặc xoá tài khoản bất cứ lúc nào.') +
      '</div>' +
      // hide Google when it is switched off in Supabase (App.auth.providers comes from /auth/v1/settings)
      (App.auth.providers && !App.auth.providers.google ? '' :
        '<div class="row acc-actions">' +
          '<button type="button" class="btn primary lg" id="accGoogle">Đăng nhập với Google</button>' +
        '</div>') +
      '<form class="acc-email" id="accEmailForm" novalidate>' +
        '<label class="field"><span>' + (App.auth.providers && !App.auth.providers.google ? 'Nhận link đăng nhập qua email' : 'Hoặc nhận link đăng nhập qua email') + '</span>' +
          '<input class="input" type="email" id="accEmail" placeholder="ban@example.com" autocomplete="email">' +
        '</label>' +
        '<button type="submit" class="btn" id="accEmailBtn">Gửi link đăng nhập</button>' +
      '</form>' +
      '<p class="small acc-msg" id="accEmailMsg" role="status"></p>' +
      '<p class="small muted">Bằng cách đăng nhập bạn đồng ý với <a href="#/legal/privacy">Quyền riêng tư</a> ' +
        'và <a href="#/legal/terms">Điều khoản</a>.</p>' +
    '</section>';
  }

  /** Avatar: ảnh nếu có, nếu không thì chữ cái đầu. */
  function avatarHtml(user) {
    const name = displayName(user);
    if (user && user.avatar) {
      return '<img class="acc-avatar-img" src="' + esc(user.avatar) + '" alt="" referrerpolicy="no-referrer">';
    }
    return '<span class="acc-avatar-initial">' + esc(initialOf(name)) + '</span>';
  }

  /** Trạng thái 3 — đã đăng nhập. */
  function signedInHtml(user) {
    const name = displayName(user);
    return '<section class="card acc-card acc-profile">' +
      '<h2>Hồ sơ</h2>' +
      '<div class="acc-profile-row">' +
        '<div class="acc-avatar" id="accAvatar">' + avatarHtml(user) + '</div>' +
        '<div class="acc-profile-info">' +
          '<div class="acc-name-line">' +
            '<b id="accNameText">' + esc(name || 'Chưa có tên') + '</b>' +
            '<span class="badge accent" id="accRoleBadge" hidden>admin</span>' +
          '</div>' +
          '<div class="small muted" id="accEmailText">' + esc(user.email || '') + '</div>' +
        '</div>' +
      '</div>' +
      '<form class="acc-name-form" id="accNameForm">' +
        '<label class="field"><span>Tên hiển thị</span>' +
          '<input class="input" id="accNameInput" maxlength="60" placeholder="Tên của bạn" value="' + esc(name) + '">' +
        '</label>' +
        '<button type="submit" class="btn" id="accNameBtn">Lưu tên</button>' +
      '</form>' +
      '<p class="small acc-msg" id="accNameMsg" role="status"></p>' +
    '</section>' +
    syncHtml() + quotaHtml() + dataHtml() + dangerHtml();
  }

  /** Card trạng thái đồng bộ. */
  function syncHtml() {
    const st = SYNC_STATE[sync.status] || SYNC_STATE.off;
    return '<section class="card acc-card">' +
      '<h2>Đồng bộ</h2>' +
      '<div class="row acc-sync-row">' +
        '<span class="acc-sync-icon acc-sync-' + st.cls + '" id="accSyncIcon" aria-hidden="true">' + st.icon + '</span>' +
        '<div class="acc-sync-info">' +
          '<b id="accSyncLabel">' + esc(st.label) + '</b>' +
          '<div class="small muted" id="accSyncMeta">' + esc(lastSyncText()) + '</div>' +
        '</div>' +
        '<span class="spacer"></span>' +
        '<button type="button" class="btn" id="accSyncBtn">Đồng bộ ngay</button>' +
      '</div>' +
      '<p class="small acc-msg" id="accSyncMsg" role="status"></p>' +
    '</section>';
  }

  /** Mô tả lần đồng bộ gần nhất. */
  function lastSyncText() {
    return sync.lastSyncAt ? 'Lần cuối: ' + App.fmtDate(sync.lastSyncAt) : 'Chưa đồng bộ lần nào';
  }

  /** Card hạn mức AI hôm nay (số liệu nạp bằng usageToday()). */
  function quotaHtml() {
    return '<section class="card acc-card">' +
      '<h2>Hạn mức AI hôm nay</h2>' +
      '<div class="row acc-quota-head">' +
        '<b id="accQuotaNum">Đang tải…</b>' +
        '<span class="spacer"></span>' +
        '<span class="small muted" id="accQuotaNote"></span>' +
      '</div>' +
      '<div class="progress acc-quota-bar" id="accQuotaBar" role="progressbar" aria-label="Hạn mức AI đã dùng hôm nay"' +
        ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i style="width:0%"></i></div>' +
      '<div class="acc-quota-kinds" id="accQuotaKinds"><span class="small muted">Đang tải số liệu…</span></div>' +
    '</section>';
  }

  /** Card dữ liệu của tôi. */
  function dataHtml() {
    return '<section class="card acc-card">' +
      '<h2>Dữ liệu của tôi</h2>' +
      '<ul class="acc-list">' +
        '<li><b>Tải xuống toàn bộ dữ liệu</b> — file JSON gồm tiến độ trên máy này và dữ liệu đã đồng bộ lên cloud.</li>' +
        '<li><b>Đăng xuất</b> — dữ liệu trên máy vẫn giữ nguyên, chỉ ngừng đồng bộ và ngừng dùng AI.</li>' +
      '</ul>' +
      '<div class="row acc-actions">' +
        '<button type="button" class="btn" id="accExportAll">Tải xuống toàn bộ dữ liệu</button>' +
        '<button type="button" class="btn" id="accSignOut">Đăng xuất</button>' +
      '</div>' +
      '<p class="small acc-msg" id="accDataMsg" role="status"></p>' +
    '</section>';
  }

  /** Vùng nguy hiểm: xoá tài khoản (xác nhận 2 bước). */
  function dangerHtml() {
    return '<section class="card acc-card acc-danger">' +
      '<h2>Vùng nguy hiểm</h2>' +
      '<p class="small muted">Xoá tài khoản sẽ xoá vĩnh viễn tài khoản và toàn bộ dữ liệu đồng bộ trên cloud. Không thể hoàn tác.</p>' +
      '<div id="accDelStep1"><button type="button" class="btn bad" id="accDeleteBtn">Xoá tài khoản</button></div>' +
      '<div id="accDelStep2" hidden>' +
        '<div class="acc-del-box">' +
          '<p class="acc-del-title"><b>Bước 2/2 — xác nhận</b></p>' +
          '<label class="acc-check"><input type="checkbox" id="accDelLocal"> Xoá cả dữ liệu trên máy này</label>' +
          '<p class="small">Nhập <code>' + DELETE_WORD + '</code> để bật nút xoá:</p>' +
          '<input class="input acc-del-input" id="accDelWord" placeholder="' + DELETE_WORD + '" autocomplete="off" spellcheck="false">' +
          '<div class="row acc-actions">' +
            '<button type="button" class="btn bad" id="accDeleteConfirm" disabled>Xoá vĩnh viễn</button>' +
            '<button type="button" class="btn ghost" id="accDeleteCancel">Huỷ</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<p class="small acc-msg" id="accDelMsg" role="status"></p>' +
    '</section>';
  }
  /** Ghi thông điệp trạng thái (kind: null | 'ok' | 'bad'). */
  function setMsg(el, text, kind) {
    if (!el) return;
    el.textContent = text;
    el.className = 'small acc-msg' + (kind ? ' acc-msg-' + kind : '');
  }

  /** Cập nhật riêng phần hồ sơ (tên/email/avatar) mà không cần vẽ lại cả trang. */
  function updateProfileUi(root, user) {
    const name = displayName(user);
    const nameText = root.querySelector('#accNameText');
    if (nameText) nameText.textContent = name || 'Chưa có tên';
    const emailText = root.querySelector('#accEmailText');
    if (emailText) emailText.textContent = (user && user.email) || '';
    const avatar = root.querySelector('#accAvatar');
    if (avatar) avatar.innerHTML = avatarHtml(user || {});
    const input = root.querySelector('#accNameInput');
    if (input && document.activeElement !== input) input.value = name;
    paintAccountBtn();
  }

  /** Cập nhật riêng dòng trạng thái đồng bộ. */
  function updateSyncUi(root) {
    const st = SYNC_STATE[sync.status] || SYNC_STATE.off;
    const icon = root.querySelector('#accSyncIcon');
    if (icon) { icon.textContent = st.icon; icon.className = 'acc-sync-icon acc-sync-' + st.cls; }
    const label = root.querySelector('#accSyncLabel');
    if (label) label.textContent = st.label;
    const meta = root.querySelector('#accSyncMeta');
    if (meta) meta.textContent = sync.lastError ? 'Lỗi: ' + sync.lastError : lastSyncText();
  }

  /** Nạp hồ sơ (role, tên hiển thị) — lỗi thì bỏ qua, coi như server chưa có dữ liệu. */
  async function loadProfile(root) {
    try {
      const p = await auth.profile();
      if (!p) return;
      const badge = root.querySelector('#accRoleBadge');
      if (badge) badge.hidden = p.role !== 'admin';
      const input = root.querySelector('#accNameInput');
      if (input && p.display_name && document.activeElement !== input && !input.value) {
        input.value = p.display_name;
      }
    } catch (e) { /* server chưa cấu hình: bỏ qua */ }
  }

  /** Nạp hạn mức AI hôm nay và vẽ thanh tiến độ. */
  async function loadUsage(root) {
    const num = root.querySelector('#accQuotaNum');
    const bar = root.querySelector('#accQuotaBar');
    const kinds = root.querySelector('#accQuotaKinds');
    const note = root.querySelector('#accQuotaNote');
    try {
      const u = await auth.usageToday();
      if (!u) throw new Error('Chưa có dữ liệu hạn mức.');
      const used = Number(u.used) || 0;
      const limit = Number(u.limit) || 0;
      const pct = limit > 0 ? Math.max(0, Math.min(100, Math.round(used / limit * 100))) : 0;
      const cls = pct >= 100 ? 'bad' : pct >= 80 ? 'warn' : 'accent';
      if (num) num.textContent = used + ' / ' + (limit || '∞') + ' lượt';
      if (note) note.textContent = limit > 0 ? pct + '% hạn mức đã dùng' : 'Chưa giới hạn';
      if (bar) {
        const fill = bar.querySelector('i');
        if (fill) { fill.className = cls; fill.style.width = pct + '%'; }
        bar.setAttribute('aria-valuenow', String(pct));
      }
      if (kinds) {
        const byKind = u.byKind || {};
        const keys = Object.keys(KIND_LABEL).concat(Object.keys(byKind).filter(k => !KIND_LABEL[k]));
        const rows = keys.map(k => '<div class="acc-quota-kind"><span>' + esc(KIND_LABEL[k] || k) +
          '</span><b>' + esc(String(byKind[k] || 0)) + '</b></div>').join('');
        kinds.innerHTML = rows || '<span class="small muted">Chưa có dữ liệu chi tiết.</span>';
      }
    } catch (e) {
      if (num) num.textContent = 'Không tải được hạn mức';
      if (note) note.textContent = '';
      if (kinds) kinds.innerHTML = '<span class="small muted">' + esc(errText(e)) + '</span>';
      if (bar) { const fill = bar.querySelector('i'); if (fill) fill.style.width = '0%'; }
    }
  }
  /** Trạng thái 1: nút xuất tiến độ (bấm hộ nút #exportBtn có sẵn ở footer). */
  function wireNotConfigured(root) {
    const btn = root.querySelector('#accExportLocal');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const exp = document.getElementById('exportBtn');
      if (exp) { exp.click(); return; }
      downloadJson(App.store.data, 'senior-java-prep-progress.json');
    });
  }

  /** Trạng thái 2: đăng nhập Google hoặc link qua email. */
  function wireSignedOut(root) {
    const out = root.querySelector('#accEmailMsg');
    const g = root.querySelector('#accGoogle');
    if (g) g.addEventListener('click', async () => {
      g.disabled = true;
      g.textContent = 'Đang mở…';
      try {
        await auth.signInWithGoogle();
      } catch (e) {
        g.disabled = false;
        g.textContent = 'Đăng nhập với Google';
        setMsg(out, 'Không đăng nhập được: ' + errText(e), 'bad');
      }
    });

    const form = root.querySelector('#accEmailForm');
    if (!form) return;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const input = root.querySelector('#accEmail');
      const btn = root.querySelector('#accEmailBtn');
      const email = String(input.value || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        setMsg(out, 'Email không hợp lệ — kiểm tra lại địa chỉ.', 'bad');
        return;
      }
      btn.disabled = true;
      setMsg(out, 'Đang gửi link đăng nhập…', null);
      try {
        await auth.signInWithEmail(email);
        setMsg(out, 'Đã gửi, kiểm tra hộp thư ' + email + ' để đăng nhập.', 'ok');
        input.value = '';
      } catch (e) {
        setMsg(out, 'Không gửi được link: ' + errText(e), 'bad');
      } finally {
        btn.disabled = false;
      }
    });
  }

  /** Trạng thái 3: hồ sơ, đồng bộ, xuất dữ liệu, đăng xuất. */
  function wireSignedIn(root) {
    // Hồ sơ — sửa tên hiển thị.
    const nameForm = root.querySelector('#accNameForm');
    const nameMsg = root.querySelector('#accNameMsg');
    if (nameForm) nameForm.addEventListener('submit', async e => {
      e.preventDefault();
      const input = root.querySelector('#accNameInput');
      const btn = root.querySelector('#accNameBtn');
      const name = String(input.value || '').trim();
      if (!name) { setMsg(nameMsg, 'Tên hiển thị không được để trống.', 'bad'); return; }
      btn.disabled = true;
      setMsg(nameMsg, 'Đang lưu…', null);
      try {
        await auth.updateDisplayName(name);
        if (auth.user) auth.user.name = name;
        updateProfileUi(root, auth.user);
        setMsg(nameMsg, 'Đã lưu tên hiển thị.', 'ok');
      } catch (e) {
        setMsg(nameMsg, 'Không lưu được: ' + errText(e), 'bad');
      } finally {
        btn.disabled = false;
      }
    });

    // Đồng bộ — bấm để đồng bộ ngay.
    const syncBtn = root.querySelector('#accSyncBtn');
    const syncMsg = root.querySelector('#accSyncMsg');
    if (syncBtn) syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      setMsg(syncMsg, 'Đang đồng bộ…', null);
      try {
        await sync.now();
        setMsg(syncMsg, 'Đã đồng bộ xong.', 'ok');
      } catch (e) {
        setMsg(syncMsg, 'Không đồng bộ được: ' + errText(e), 'bad');
      } finally {
        syncBtn.disabled = false;
      }
    });

    // Dữ liệu của tôi — tải xuống toàn bộ dữ liệu.
    const dataMsg = root.querySelector('#accDataMsg');
    const expBtn = root.querySelector('#accExportAll');
    if (expBtn) expBtn.addEventListener('click', async () => {
      expBtn.disabled = true;
      setMsg(dataMsg, 'Đang tổng hợp dữ liệu…', null);
      try {
        const data = await auth.exportData();
        downloadJson(data, 'senior-java-prep-data-' + App.dayKey(Date.now()) + '.json');
        setMsg(dataMsg, 'Đã tải file dữ liệu xuống máy.', 'ok');
      } catch (e) {
        setMsg(dataMsg, 'Không xuất được: ' + errText(e), 'bad');
      } finally {
        expBtn.disabled = false;
      }
    });

    // Đăng xuất.
    const outBtn = root.querySelector('#accSignOut');
    if (outBtn) outBtn.addEventListener('click', async () => {
      outBtn.disabled = true;
      setMsg(dataMsg, 'Đang đăng xuất…', null);
      try {
        await auth.signOut();
        setMsg(dataMsg, 'Đã đăng xuất.', 'ok');
      } catch (e) {
        setMsg(dataMsg, 'Không đăng xuất được: ' + errText(e), 'bad');
        outBtn.disabled = false;
      }
    });

    wireDelete(root);

    // Số liệu từ server (hồ sơ + hạn mức) nạp sau khi vẽ.
    loadProfile(root);
    loadUsage(root);
  }

  /** Xoá tài khoản — xác nhận 2 bước, bước 2 phải gõ đúng từ khoá. */
  function wireDelete(root) {
    const step1 = root.querySelector('#accDelStep1');
    const step2 = root.querySelector('#accDelStep2');
    const btn = root.querySelector('#accDeleteBtn');
    const word = root.querySelector('#accDelWord');
    const confirmBtn = root.querySelector('#accDeleteConfirm');
    const cancelBtn = root.querySelector('#accDeleteCancel');
    const localChk = root.querySelector('#accDelLocal');
    const msg = root.querySelector('#accDelMsg');
    if (!step1 || !step2 || !btn || !word || !confirmBtn) return;

    btn.addEventListener('click', () => {
      step1.hidden = true;
      step2.hidden = false;
      word.value = '';
      confirmBtn.disabled = true;
      if (word.focus) word.focus();
    });

    if (cancelBtn) cancelBtn.addEventListener('click', () => {
      step2.hidden = true;
      step1.hidden = false;
      word.value = '';
      confirmBtn.disabled = true;
    });

    word.addEventListener('input', () => {
      confirmBtn.disabled = String(word.value || '').trim().toUpperCase() !== DELETE_WORD;
    });

    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      setMsg(msg, 'Đang xoá tài khoản…', null);
      try {
        const clearLocal = !!(localChk && localChk.checked);
        await auth.deleteAccount({ clearLocal: clearLocal });
        if (clearLocal) App.store.reset();
        setMsg(msg, 'Đã xoá tài khoản. Bạn có thể đăng nhập lại bất cứ lúc nào.', 'ok');
        paintAccountBtn();
      } catch (e) {
        setMsg(msg, 'Không xoá được: ' + errText(e), 'bad');
        confirmBtn.disabled = false;
      }
    });
  }
  /**
   * Vẽ trang theo trạng thái hiện tại của App.auth.
   * @param {HTMLElement} root
   * @param {Function} repaint vẽ lại toàn bộ trang (dùng khi đăng nhập/đăng xuất)
   * @returns {Function} cleanup
   */
  function mount(root, repaint) {
    const unsubs = [];
    const user = auth.user;
    const sub = user ? 'Hồ sơ, trạng thái đồng bộ, hạn mức AI và dữ liệu của bạn.' :
      (auth.enabled ? 'Đăng nhập để đồng bộ tiến độ và dùng AI chấm điểm.' :
        'Tiến độ đang lưu trong trình duyệt này — đây là nơi quản lý dữ liệu của bạn.');

    root.innerHTML = '<div class="page-head"><div><h1>Tài khoản</h1>' +
      '<p>' + esc(sub) + '</p></div></div>' +
      (auth.enabled ? (user ? signedInHtml(user) : signedOutHtml()) : notConfiguredHtml());

    // Nút tài khoản trên thanh trên cùng luôn khớp với trạng thái đăng nhập.
    paintAccountBtn();

    if (!auth.enabled) wireNotConfigured(root);
    else if (!user) wireSignedOut(root);
    else wireSignedIn(root);

    // Đăng nhập/đăng xuất: nếu chỉ đổi tên thì cập nhật tại chỗ, còn lại vẽ lại trang.
    unsubs.push(auth.onChange(u => {
      if (user && u && user.id === u.id) { updateProfileUi(root, u); return; }
      repaint();
    }));
    // Trạng thái đồng bộ thay đổi → cập nhật riêng dòng trạng thái.
    unsubs.push(sync.onStatus(() => updateSyncUi(root)));

    return () => {
      unsubs.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    };
  }

  App.registerView('account', {
    title: 'Tài khoản',
    render(root) {
      let dispose = null;
      const repaint = () => {
        if (dispose) { dispose(); dispose = null; }
        dispose = mount(root, repaint);
      };
      repaint();
      return () => { if (dispose) { dispose(); dispose = null; } };
    },
  });

  // Nút 👤 trên thanh trên cùng: hiện chữ cái đầu của tên khi đã đăng nhập.
  auth.onChange(paintAccountBtn);
  sync.onStatus(paintAccountBtn);
  paintAccountBtn();
})();
