/* View "account" — owner: task T33. Contract: see AGENTS.md "Views" + mục 10 (App.auth / App.sync). */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'acc.title': 'Tài khoản',
      'acc.subSignedIn': 'Hồ sơ, trạng thái đồng bộ, hạn mức AI và dữ liệu của bạn.',
      'acc.subSignedOut': 'Đăng nhập để đồng bộ tiến độ và dùng AI chấm điểm.',
      'acc.subLocal': 'Tiến độ đang lưu trong trình duyệt này — đây là nơi quản lý dữ liệu của bạn.',
      'acc.accountBtn': 'Tài khoản',
      'acc.accountBtnName': 'Tài khoản — {name}',
      'acc.accountBtnAria': 'Tài khoản: {name}',
      'acc.syncOff': 'Tắt', 'acc.syncIdle': 'Đã đồng bộ', 'acc.syncing': 'Đang đồng bộ…', 'acc.syncError': 'Lỗi đồng bộ',
      'acc.kindGrade': 'Chấm câu trả lời', 'acc.kindReview': 'Review code', 'acc.kindRun': 'Chạy code', 'acc.kindInterview': 'Phỏng vấn AI',
      'acc.errUnknown': 'lỗi không xác định',
      'acc.statKnown': 'Đã thuộc', 'acc.statReview': 'Cần ôn', 'acc.statUnknown': 'Chưa biết', 'acc.statUnseen': 'Chưa học',
      'acc.statDue': 'Đến hạn ôn', 'acc.streakDays': '{n} ngày', 'acc.streakLbl': 'Chuỗi học liên tục',
      'acc.notConfiguredTitle': 'Chưa bật tài khoản trên máy chủ này',
      'acc.notConfiguredBody': 'Bản deploy hiện tại chưa cấu hình đăng nhập. Mọi tính năng ôn tập vẫn dùng được bình thường — tiến độ được lưu <b>trong trình duyệt này</b>, không gửi lên máy chủ.',
      'acc.offL1': 'Không cần đăng nhập: ngân hàng câu hỏi, flashcard, trắc nghiệm, thuật toán và phỏng vấn thử đều hoạt động.',
      'acc.offL2': 'Dữ liệu không rời khỏi máy của bạn.',
      'acc.offL3': 'Đổi trình duyệt, xoá dữ liệu site hoặc dùng máy khác thì tiến độ sẽ mất — hãy xuất tiến độ định kỳ.',
      'acc.exportLocal': 'Xuất tiến độ',
      'acc.readPrivacy': 'Đọc quyền riêng tư',
      'acc.localStatsTitle': 'Tiến độ đang có trên máy này',
      'acc.localStatsNote': '“Xuất tiến độ” tải về file JSON; dùng “Nhập tiến độ” ở chân trang để nạp lại trên máy khác.',
      'acc.signInTitle': 'Đăng nhập để đồng bộ tiến độ',
      'acc.signInSub': 'Đăng nhập miễn phí, không cần mật khẩu.',
      'acc.benefit1Title': 'Đồng bộ nhiều thiết bị', 'acc.benefit1Text': 'Máy tính và điện thoại dùng chung tiến độ, lịch ôn và chuỗi học.',
      'acc.benefit2Title': 'Dùng AI chấm điểm', 'acc.benefit2Text': 'Chấm câu trả lời tự luận, review code và luyện phỏng vấn — có hạn mức mỗi ngày.',
      'acc.benefit3Title': 'Giữ lịch sử lâu dài', 'acc.benefit3Text': 'Lịch sử trắc nghiệm và phỏng vấn thử nằm trên cloud, không mất khi xoá dữ liệu trình duyệt.',
      'acc.benefit4Title': 'Bạn chủ dữ liệu', 'acc.benefit4Text': 'Tải toàn bộ dữ liệu về máy hoặc xoá tài khoản bất cứ lúc nào.',
      'acc.googleBtn': 'Đăng nhập với Google',
      'acc.emailLabel': 'Hoặc nhận link đăng nhập qua email',
      'acc.emailLabelNoG': 'Nhận link đăng nhập qua email',
      'acc.emailBtn': 'Gửi link đăng nhập',
      'acc.agree': 'Bằng cách đăng nhập bạn đồng ý với <a href="#/legal/privacy">Quyền riêng tư</a> và <a href="#/legal/terms">Điều khoản</a>.',
      'acc.profileTitle': 'Hồ sơ',
      'acc.noName': 'Chưa có tên',
      'acc.displayName': 'Tên hiển thị',
      'acc.namePlaceholder': 'Tên của bạn',
      'acc.saveName': 'Lưu tên',
      'acc.syncTitle': 'Đồng bộ',
      'acc.syncNow': 'Đồng bộ ngay',
      'acc.lastSync': 'Lần cuối: {date}',
      'acc.neverSynced': 'Chưa đồng bộ lần nào',
      'acc.syncErrorMsg': 'Lỗi: {err}',
      'acc.quotaTitle': 'Hạn mức AI hôm nay',
      'acc.loading': 'Đang tải…',
      'acc.quotaAria': 'Hạn mức AI đã dùng hôm nay',
      'acc.loadingKinds': 'Đang tải số liệu…',
      'acc.usageNum': '{used} / {limit} lượt',
      'acc.quotaUsed': '{p}% hạn mức đã dùng',
      'acc.quotaUnlimited': 'Chưa giới hạn',
      'acc.kindsEmpty': 'Chưa có dữ liệu chi tiết.',
      'acc.quotaFail': 'Không tải được hạn mức',
      'acc.quotaNoData': 'Chưa có dữ liệu hạn mức.',
      'acc.dataTitle': 'Dữ liệu của tôi',
      'acc.dataL1': '<b>Tải xuống toàn bộ dữ liệu</b> — file JSON gồm tiến độ trên máy này và dữ liệu đã đồng bộ lên cloud.',
      'acc.dataL2': '<b>Đăng xuất</b> — dữ liệu trên máy vẫn giữ nguyên, chỉ ngừng đồng bộ và ngừng dùng AI.',
      'acc.exportAll': 'Tải xuống toàn bộ dữ liệu',
      'acc.signOut': 'Đăng xuất',
      'acc.dangerTitle': 'Vùng nguy hiểm',
      'acc.dangerBody': 'Xoá tài khoản sẽ xoá vĩnh viễn tài khoản và toàn bộ dữ liệu đồng bộ trên cloud. Không thể hoàn tác.',
      'acc.deleteBtn': 'Xoá tài khoản',
      'acc.deleteStep2': 'Bước 2/2 — xác nhận',
      'acc.deleteLocalChk': 'Xoá cả dữ liệu trên máy này',
      'acc.deleteWordHint': 'Nhập <code>{word}</code> để bật nút xoá:',
      'acc.deleteForever': 'Xoá vĩnh viễn',
      'acc.cancel': 'Huỷ',
      'acc.opening': 'Đang mở…',
      'acc.signInFail': 'Không đăng nhập được: {err}',
      'acc.emailInvalid': 'Email không hợp lệ — kiểm tra lại địa chỉ.',
      'acc.emailSending': 'Đang gửi link đăng nhập…',
      'acc.emailSent': 'Đã gửi, kiểm tra hộp thư {email} để đăng nhập.',
      'acc.emailFail': 'Không gửi được link: {err}',
      'acc.nameEmpty': 'Tên hiển thị không được để trống.',
      'acc.saving': 'Đang lưu…',
      'acc.nameSaved': 'Đã lưu tên hiển thị.',
      'acc.saveFail': 'Không lưu được: {err}',
      'acc.syncing': 'Đang đồng bộ…',
      'acc.syncDone': 'Đã đồng bộ xong.',
      'acc.syncFail': 'Không đồng bộ được: {err}',
      'acc.exporting': 'Đang tổng hợp dữ liệu…',
      'acc.exportDone': 'Đã tải file dữ liệu xuống máy.',
      'acc.exportFail': 'Không xuất được: {err}',
      'acc.signingOut': 'Đang đăng xuất…',
      'acc.signOutDone': 'Đã đăng xuất.',
      'acc.signOutFail': 'Không đăng xuất được: {err}',
      'acc.deleting': 'Đang xoá tài khoản…',
      'acc.deleteDone': 'Đã xoá tài khoản. Bạn có thể đăng nhập lại bất cứ lúc nào.',
      'acc.deleteFail': 'Không xoá được: {err}',
    },
    en: {
      'acc.title': 'Account',
      'acc.subSignedIn': 'Your profile, sync status, AI quota and data.',
      'acc.subSignedOut': 'Sign in to sync progress and use AI grading.',
      'acc.subLocal': 'Progress is saved in this browser — this page manages your data.',
      'acc.accountBtn': 'Account',
      'acc.accountBtnName': 'Account — {name}',
      'acc.accountBtnAria': 'Account: {name}',
      'acc.syncOff': 'Off', 'acc.syncIdle': 'Synced', 'acc.syncing': 'Syncing…', 'acc.syncError': 'Sync error',
      'acc.kindGrade': 'Answer grading', 'acc.kindReview': 'Code review', 'acc.kindRun': 'Code run', 'acc.kindInterview': 'AI interview',
      'acc.errUnknown': 'unknown error',
      'acc.statKnown': 'Known', 'acc.statReview': 'Review', 'acc.statUnknown': 'Don\'t know', 'acc.statUnseen': 'Not studied',
      'acc.statDue': 'Due for review', 'acc.streakDays': '{n} days', 'acc.streakLbl': 'Study streak',
      'acc.notConfiguredTitle': 'Accounts are not enabled on this server',
      'acc.notConfiguredBody': 'This deployment has no sign-in configured. All study features work as usual — progress is saved <b>in this browser</b> and never sent to a server.',
      'acc.offL1': 'No sign-in needed: question bank, flashcards, quizzes, algorithms and mock interviews all work.',
      'acc.offL2': 'Your data never leaves your machine.',
      'acc.offL3': 'Switching browsers, clearing site data or using another device loses progress — export it regularly.',
      'acc.exportLocal': 'Export progress',
      'acc.readPrivacy': 'Read the privacy notice',
      'acc.localStatsTitle': 'Progress stored on this device',
      'acc.localStatsNote': '"Export progress" downloads a JSON file; use "Import progress" in the footer to load it on another machine.',
      'acc.signInTitle': 'Sign in to sync your progress',
      'acc.signInSub': 'Sign in for free, no password needed.',
      'acc.benefit1Title': 'Sync across devices', 'acc.benefit1Text': 'Desktop and phone share progress, schedule and streak.',
      'acc.benefit2Title': 'AI grading', 'acc.benefit2Text': 'Grade written answers, review code and practise interviews — with a daily quota.',
      'acc.benefit3Title': 'History kept safe', 'acc.benefit3Text': 'Quiz and mock history lives in the cloud and survives browser resets.',
      'acc.benefit4Title': 'You own your data', 'acc.benefit4Text': 'Download all your data or delete your account at any time.',
      'acc.googleBtn': 'Sign in with Google',
      'acc.emailLabel': 'Or get a sign-in link by email',
      'acc.emailLabelNoG': 'Get a sign-in link by email',
      'acc.emailBtn': 'Email me a sign-in link',
      'acc.agree': 'By signing in you agree to the <a href="#/legal/privacy">Privacy notice</a> and <a href="#/legal/terms">Terms</a>.',
      'acc.profileTitle': 'Profile',
      'acc.noName': 'No name yet',
      'acc.displayName': 'Display name',
      'acc.namePlaceholder': 'Your name',
      'acc.saveName': 'Save name',
      'acc.syncTitle': 'Sync',
      'acc.syncNow': 'Sync now',
      'acc.lastSync': 'Last: {date}',
      'acc.neverSynced': 'Never synced yet',
      'acc.syncErrorMsg': 'Error: {err}',
      'acc.quotaTitle': 'AI quota today',
      'acc.loading': 'Loading…',
      'acc.quotaAria': 'AI quota used today',
      'acc.loadingKinds': 'Loading usage…',
      'acc.usageNum': '{used} / {limit} turns',
      'acc.quotaUsed': '{p}% of quota used',
      'acc.quotaUnlimited': 'No limit',
      'acc.kindsEmpty': 'No breakdown yet.',
      'acc.quotaFail': 'Could not load quota',
      'acc.quotaNoData': 'Quota data unavailable.',
      'acc.dataTitle': 'My data',
      'acc.dataL1': '<b>Download all data</b> — a JSON file with local progress and everything synced to the cloud.',
      'acc.dataL2': '<b>Sign out</b> — local data is kept; only syncing and AI usage stop.',
      'acc.exportAll': 'Download all data',
      'acc.signOut': 'Sign out',
      'acc.dangerTitle': 'Danger zone',
      'acc.dangerBody': 'Deleting your account permanently removes it and all synced cloud data. This cannot be undone.',
      'acc.deleteBtn': 'Delete account',
      'acc.deleteStep2': 'Step 2/2 — confirm',
      'acc.deleteLocalChk': 'Also delete data on this device',
      'acc.deleteWordHint': 'Type <code>{word}</code> to enable the delete button:',
      'acc.deleteForever': 'Delete permanently',
      'acc.cancel': 'Cancel',
      'acc.opening': 'Opening…',
      'acc.signInFail': 'Sign-in failed: {err}',
      'acc.emailInvalid': 'Invalid email — check the address.',
      'acc.emailSending': 'Sending the sign-in link…',
      'acc.emailSent': 'Sent — check the inbox of {email} to sign in.',
      'acc.emailFail': 'Could not send the link: {err}',
      'acc.nameEmpty': 'Display name cannot be empty.',
      'acc.saving': 'Saving…',
      'acc.nameSaved': 'Display name saved.',
      'acc.saveFail': 'Could not save: {err}',
      'acc.syncing': 'Syncing…',
      'acc.syncDone': 'Sync finished.',
      'acc.syncFail': 'Sync failed: {err}',
      'acc.exporting': 'Collecting data…',
      'acc.exportDone': 'Data file downloaded.',
      'acc.exportFail': 'Export failed: {err}',
      'acc.signingOut': 'Signing out…',
      'acc.signOutDone': 'Signed out.',
      'acc.signOutFail': 'Sign-out failed: {err}',
      'acc.deleting': 'Deleting account…',
      'acc.deleteDone': 'Account deleted. You can sign in again at any time.',
      'acc.deleteFail': 'Deletion failed: {err}',
    },
  });

  const tr = (key, vars) => App.t('acc.' + key, vars);
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

  // Nhãn + icon cho từng trạng thái đồng bộ (nhãn qua App.t, đổi theo ngôn ngữ).
  const SYNC_STATE = {
    off: { icon: '○', labelKey: 'syncOff', cls: 'off' },
    idle: { icon: '✓', labelKey: 'syncIdle', cls: 'ok' },
    syncing: { icon: '⟳', labelKey: 'syncing', cls: 'accent' },
    error: { icon: '⚠', labelKey: 'syncError', cls: 'bad' },
  };

  // Tên loại lượt AI hiển thị trong hạn mức (khóa App.t các loại đã biết).
  const KIND_LABEL = {
    grade: 'kindGrade',
    review: 'kindReview',
    run: 'kindRun',
    interview: 'kindInterview',
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
    const m = e && e.message ? String(e.message) : tr('errUnknown');
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
    btn.title = u ? tr('accountBtnName', { name: name }) : tr('accountBtn');
    btn.setAttribute('aria-label', u ? tr('accountBtnAria', { name: name }) : tr('accountBtn'));
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
      statCard(s.known, tr('statKnown'), 'ok') +
      statCard(s.review, tr('statReview'), 'warn') +
      statCard(s.unknown, tr('statUnknown'), 'bad') +
      statCard(s.unseen, tr('statUnseen')) +
      statCard(due, tr('statDue'), 'accent') +
      statCard(tr('streakDays', { n: streak }), tr('streakLbl')) +
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
      '<h2>' + tr('notConfiguredTitle') + '</h2>' +
      '<p class="muted">' + tr('notConfiguredBody') + '</p>' +
      '<ul class="acc-list">' +
        '<li>' + tr('offL1') + '</li>' +
        '<li>' + tr('offL2') + '</li>' +
        '<li>' + tr('offL3') + '</li>' +
      '</ul>' +
      '<div class="row acc-actions">' +
        '<button type="button" class="btn primary" id="accExportLocal">' + tr('exportLocal') + '</button>' +
        '<a class="btn" href="#/legal/privacy">' + tr('readPrivacy') + '</a>' +
      '</div>' +
    '</section>' +
    '<section class="card acc-card">' +
      '<h2>' + tr('localStatsTitle') + '</h2>' +
      localStatsHtml() +
      '<p class="small muted acc-note">' + tr('localStatsNote') + '</p>' +
    '</section>';
  }

  /** Trạng thái 2 — đã cấu hình nhưng chưa đăng nhập. */
  function signedOutHtml() {
    return '<section class="card acc-card">' +
      '<h2>' + tr('signInTitle') + '</h2>' +
      '<p class="muted">' + tr('signInSub') + '</p>' +
      '<div class="acc-benefits">' +
        benefit('⟳', tr('benefit1Title'), tr('benefit1Text')) +
        benefit('🤖', tr('benefit2Title'), tr('benefit2Text')) +
        benefit('🗂', tr('benefit3Title'), tr('benefit3Text')) +
        benefit('🔒', tr('benefit4Title'), tr('benefit4Text')) +
      '</div>' +
      // hide Google when it is switched off in Supabase (App.auth.providers comes from /auth/v1/settings)
      (App.auth.providers && !App.auth.providers.google ? '' :
        '<div class="row acc-actions">' +
          '<button type="button" class="btn primary lg" id="accGoogle">' + tr('googleBtn') + '</button>' +
        '</div>') +
      '<form class="acc-email" id="accEmailForm" novalidate>' +
        '<label class="field"><span>' + (App.auth.providers && !App.auth.providers.google ? tr('emailLabelNoG') : tr('emailLabel')) + '</span>' +
          '<input class="input" type="email" id="accEmail" placeholder="ban@example.com" autocomplete="email">' +
        '</label>' +
        '<button type="submit" class="btn" id="accEmailBtn">' + tr('emailBtn') + '</button>' +
      '</form>' +
      '<p class="small acc-msg" id="accEmailMsg" role="status"></p>' +
      '<p class="small muted">' + tr('agree') + '</p>' +
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
      '<h2>' + tr('profileTitle') + '</h2>' +
      '<div class="acc-profile-row">' +
        '<div class="acc-avatar" id="accAvatar">' + avatarHtml(user) + '</div>' +
        '<div class="acc-profile-info">' +
          '<div class="acc-name-line">' +
            '<b id="accNameText">' + esc(name || tr('noName')) + '</b>' +
            '<span class="badge accent" id="accRoleBadge" hidden>admin</span>' +
          '</div>' +
          '<div class="small muted" id="accEmailText">' + esc(user.email || '') + '</div>' +
        '</div>' +
      '</div>' +
      '<form class="acc-name-form" id="accNameForm">' +
        '<label class="field"><span>' + tr('displayName') + '</span>' +
          '<input class="input" id="accNameInput" maxlength="60" placeholder="' + esc(tr('namePlaceholder')) + '" value="' + esc(name) + '">' +
        '</label>' +
        '<button type="submit" class="btn" id="accNameBtn">' + tr('saveName') + '</button>' +
      '</form>' +
      '<p class="small acc-msg" id="accNameMsg" role="status"></p>' +
    '</section>' +
    syncHtml() + quotaHtml() + dataHtml() + dangerHtml();
  }

  /** Card trạng thái đồng bộ. */
  function syncHtml() {
    const st = SYNC_STATE[sync.status] || SYNC_STATE.off;
    return '<section class="card acc-card">' +
      '<h2>' + tr('syncTitle') + '</h2>' +
      '<div class="row acc-sync-row">' +
        '<span class="acc-sync-icon acc-sync-' + st.cls + '" id="accSyncIcon" aria-hidden="true">' + st.icon + '</span>' +
        '<div class="acc-sync-info">' +
          '<b id="accSyncLabel">' + esc(tr(st.labelKey)) + '</b>' +
          '<div class="small muted" id="accSyncMeta">' + esc(lastSyncText()) + '</div>' +
        '</div>' +
        '<span class="spacer"></span>' +
        '<button type="button" class="btn" id="accSyncBtn">' + tr('syncNow') + '</button>' +
      '</div>' +
      '<p class="small acc-msg" id="accSyncMsg" role="status"></p>' +
    '</section>';
  }

  /** Mô tả lần đồng bộ gần nhất. */
  function lastSyncText() {
    return sync.lastSyncAt ? tr('lastSync', { date: App.fmtDate(sync.lastSyncAt) }) : tr('neverSynced');
  }

  /** Card hạn mức AI hôm nay (số liệu nạp bằng usageToday()). */
  function quotaHtml() {
    return '<section class="card acc-card">' +
      '<h2>' + tr('quotaTitle') + '</h2>' +
      '<div class="row acc-quota-head">' +
        '<b id="accQuotaNum">' + tr('loading') + '</b>' +
        '<span class="spacer"></span>' +
        '<span class="small muted" id="accQuotaNote"></span>' +
      '</div>' +
      '<div class="progress acc-quota-bar" id="accQuotaBar" role="progressbar" aria-label="' + esc(tr('quotaAria')) + '"' +
        ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i style="width:0%"></i></div>' +
      '<div class="acc-quota-kinds" id="accQuotaKinds"><span class="small muted">' + tr('loadingKinds') + '</span></div>' +
    '</section>';
  }

  /** Card dữ liệu của tôi. */
  function dataHtml() {
    return '<section class="card acc-card">' +
      '<h2>' + tr('dataTitle') + '</h2>' +
      '<ul class="acc-list">' +
        '<li>' + tr('dataL1') + '</li>' +
        '<li>' + tr('dataL2') + '</li>' +
      '</ul>' +
      '<div class="row acc-actions">' +
        '<button type="button" class="btn" id="accExportAll">' + tr('exportAll') + '</button>' +
        '<button type="button" class="btn" id="accSignOut">' + tr('signOut') + '</button>' +
      '</div>' +
      '<p class="small acc-msg" id="accDataMsg" role="status"></p>' +
    '</section>';
  }

  /** Vùng nguy hiểm: xoá tài khoản (xác nhận 2 bước). */
  function dangerHtml() {
    return '<section class="card acc-card acc-danger">' +
      '<h2>' + tr('dangerTitle') + '</h2>' +
      '<p class="small muted">' + tr('dangerBody') + '</p>' +
      '<div id="accDelStep1"><button type="button" class="btn bad" id="accDeleteBtn">' + tr('deleteBtn') + '</button></div>' +
      '<div id="accDelStep2" hidden>' +
        '<div class="acc-del-box">' +
          '<p class="acc-del-title"><b>' + tr('deleteStep2') + '</b></p>' +
          '<label class="acc-check"><input type="checkbox" id="accDelLocal"> ' + tr('deleteLocalChk') + '</label>' +
          '<p class="small">' + tr('deleteWordHint', { word: DELETE_WORD }) + '</p>' +
          '<input class="input acc-del-input" id="accDelWord" placeholder="' + DELETE_WORD + '" autocomplete="off" spellcheck="false">' +
          '<div class="row acc-actions">' +
            '<button type="button" class="btn bad" id="accDeleteConfirm" disabled>' + tr('deleteForever') + '</button>' +
            '<button type="button" class="btn ghost" id="accDeleteCancel">' + tr('cancel') + '</button>' +
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
    if (nameText) nameText.textContent = name || tr('noName');
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
    if (label) label.textContent = tr(st.labelKey);
    const meta = root.querySelector('#accSyncMeta');
    if (meta) meta.textContent = sync.lastError ? tr('syncErrorMsg', { err: sync.lastError }) : lastSyncText();
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
      if (!u) throw new Error(tr('quotaNoData'));
      const used = Number(u.used) || 0;
      const limit = Number(u.limit) || 0;
      const pct = limit > 0 ? Math.max(0, Math.min(100, Math.round(used / limit * 100))) : 0;
      const cls = pct >= 100 ? 'bad' : pct >= 80 ? 'warn' : 'accent';
      if (num) num.textContent = tr('usageNum', { used: used, limit: limit || '∞' });
      if (note) note.textContent = limit > 0 ? tr('quotaUsed', { p: pct }) : tr('quotaUnlimited');
      if (bar) {
        const fill = bar.querySelector('i');
        if (fill) { fill.className = cls; fill.style.width = pct + '%'; }
        bar.setAttribute('aria-valuenow', String(pct));
      }
      if (kinds) {
        const byKind = u.byKind || {};
        const keys = Object.keys(KIND_LABEL).concat(Object.keys(byKind).filter(k => !KIND_LABEL[k]));
        const rows = keys.map(k => '<div class="acc-quota-kind"><span>' + esc(KIND_LABEL[k] ? tr(KIND_LABEL[k]) : k) +
          '</span><b>' + esc(String(byKind[k] || 0)) + '</b></div>').join('');
        kinds.innerHTML = rows || '<span class="small muted">' + tr('kindsEmpty') + '</span>';
      }
    } catch (e) {
      if (num) num.textContent = tr('quotaFail');
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
      g.textContent = tr('opening');
      try {
        await auth.signInWithGoogle();
      } catch (e) {
        g.disabled = false;
        g.textContent = tr('googleBtn');
        setMsg(out, tr('signInFail', { err: errText(e) }), 'bad');
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
        setMsg(out, tr('emailInvalid'), 'bad');
        return;
      }
      btn.disabled = true;
      setMsg(out, tr('emailSending'), null);
      try {
        await auth.signInWithEmail(email);
        setMsg(out, tr('emailSent', { email: email }), 'ok');
        input.value = '';
      } catch (e) {
        setMsg(out, tr('emailFail', { err: errText(e) }), 'bad');
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
      if (!name) { setMsg(nameMsg, tr('nameEmpty'), 'bad'); return; }
      btn.disabled = true;
      setMsg(nameMsg, tr('saving'), null);
      try {
        await auth.updateDisplayName(name);
        if (auth.user) auth.user.name = name;
        updateProfileUi(root, auth.user);
        setMsg(nameMsg, tr('nameSaved'), 'ok');
      } catch (e) {
        setMsg(nameMsg, tr('saveFail', { err: errText(e) }), 'bad');
      } finally {
        btn.disabled = false;
      }
    });

    // Đồng bộ — bấm để đồng bộ ngay.
    const syncBtn = root.querySelector('#accSyncBtn');
    const syncMsg = root.querySelector('#accSyncMsg');
    if (syncBtn) syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      setMsg(syncMsg, tr('syncing'), null);
      try {
        await sync.now();
        setMsg(syncMsg, tr('syncDone'), 'ok');
      } catch (e) {
        setMsg(syncMsg, tr('syncFail', { err: errText(e) }), 'bad');
      } finally {
        syncBtn.disabled = false;
      }
    });

    // Dữ liệu của tôi — tải xuống toàn bộ dữ liệu.
    const dataMsg = root.querySelector('#accDataMsg');
    const expBtn = root.querySelector('#accExportAll');
    if (expBtn) expBtn.addEventListener('click', async () => {
      expBtn.disabled = true;
      setMsg(dataMsg, tr('exporting'), null);
      try {
        const data = await auth.exportData();
        downloadJson(data, 'senior-java-prep-data-' + App.dayKey(Date.now()) + '.json');
        setMsg(dataMsg, tr('exportDone'), 'ok');
      } catch (e) {
        setMsg(dataMsg, tr('exportFail', { err: errText(e) }), 'bad');
      } finally {
        expBtn.disabled = false;
      }
    });

    // Đăng xuất.
    const outBtn = root.querySelector('#accSignOut');
    if (outBtn) outBtn.addEventListener('click', async () => {
      outBtn.disabled = true;
      setMsg(dataMsg, tr('signingOut'), null);
      try {
        await auth.signOut();
        setMsg(dataMsg, tr('signOutDone'), 'ok');
      } catch (e) {
        setMsg(dataMsg, tr('signOutFail', { err: errText(e) }), 'bad');
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
      setMsg(msg, tr('deleting'), null);
      try {
        const clearLocal = !!(localChk && localChk.checked);
        await auth.deleteAccount({ clearLocal: clearLocal });
        if (clearLocal) App.store.reset();
        setMsg(msg, tr('deleteDone'), 'ok');
        paintAccountBtn();
      } catch (e) {
        setMsg(msg, tr('deleteFail', { err: errText(e) }), 'bad');
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
    const sub = user ? tr('subSignedIn') :
      (auth.enabled ? tr('subSignedOut') : tr('subLocal'));

    root.innerHTML = '<div class="page-head"><div><h1>' + tr('title') + '</h1>' +
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
    get title() { return App.t('acc.title'); },
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
