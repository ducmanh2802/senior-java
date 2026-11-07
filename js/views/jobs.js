/* View "jobs" — owner: task T862. Hợp đồng: AGENTS.md mục 2, 7, 9, 14, 15 + docs/JOBS-DIGEST.md. */
(function () {
  'use strict';

  App.i18n.add({
    vi: {
      'jobs.viewTitle': 'Việc làm',
      'jobs.todayTab': 'Việc làm hôm nay',
      'jobs.mineTab': 'Việc tôi theo dõi',
      'jobs.subtitle': 'Tin tuyển dụng Java backend đang mở ở Việt Nam, kèm danh sách việc bạn đang ứng tuyển.',
      'jobs.mineSubtitle': 'Theo dõi từng vòng ứng tuyển, dán JD vào để AI chỉ ra cần ôn gì.',
      'jobs.navAria': 'Chuyển giữa hai tab việc làm',
      'jobs.loading': 'Đang tải việc làm…',
      'jobs.noServer': 'Bản tin việc làm chỉ có trên bản deploy (Vercel). Khi mở qua file:// thì API không khả dụng — danh sách việc của bạn vẫn dùng bình thường.',
      'jobs.notConfigured': 'Server chưa cấu hình Supabase (bảng job_digest) nên chưa có bản tin.',
      'jobs.setupMissing': 'Database chưa có bảng job_digest. Quản trị viên cần chạy SQL trong docs/JOBS-DIGEST.md.',
      'jobs.empty': 'Chưa có bản tin việc làm nào. Bản tin được biên tập và đăng mỗi sáng, quay lại sau nhé.',
      'jobs.missing': 'Không có bản tin cho ngày này.',
      'jobs.count': '{n} tin',
      'jobs.published': 'Đăng lúc {time}',
      'jobs.pickDate': 'Xem ngày khác',
      'jobs.latest': 'mới nhất',
      'jobs.levelLabel': 'Cấp bậc',
      'jobs.placeLabel': 'Địa điểm',
      'jobs.locAll': 'Tất cả',
      'jobs.locHanoi': 'Hà Nội',
      'jobs.locHcm': 'HCM',
      'jobs.locRemote': 'Remote',
      'jobs.searchPlaceholder': 'Tìm theo chức danh, công ty, kỹ năng…',
      'jobs.noMatch': 'Không có tin nào khớp bộ lọc hiện tại.',
      'jobs.prepTitle': 'Cần chuẩn bị',
      'jobs.original': 'Xem tin gốc',
      'jobs.sourceLabel': 'Nguồn',
      'jobs.watch': 'Theo dõi',
      'jobs.watched': 'Đang theo dõi',
      'jobs.levelJunior': 'Junior',
      'jobs.levelMid': 'Middle',
      'jobs.levelSenior': 'Senior',
      'jobs.levelLead': 'Lead / Architect',
      'jobs.topicsTitle': 'Ôn chủ đề',
      'jobs.mineEmpty': 'Chưa theo dõi việc nào. Mở tab “Việc làm hôm nay” và bấm ＋ Theo dõi, hoặc bấm Thêm việc để tự nhập.',
      'jobs.addJob': 'Thêm việc',
      'jobs.editJob': 'Sửa việc',
      'jobs.newJob': 'Việc mới',
      'jobs.stAll': 'Tất cả',
      'jobs.stWatch': 'Đang xem',
      'jobs.stApplied': 'Đã nộp',
      'jobs.stInterview': 'Phỏng vấn',
      'jobs.stOffer': 'Offer',
      'jobs.stRejected': 'Trượt',
      'jobs.fTitle': 'Chức danh',
      'jobs.fCompany': 'Công ty',
      'jobs.fUrl': 'Link tin tuyển dụng',
      'jobs.fLocation': 'Địa điểm',
      'jobs.fLevel': 'Cấp bậc',
      'jobs.fSalary': 'Mức lương',
      'jobs.fDeadline': 'Hạn nộp',
      'jobs.fStatus': 'Trạng thái',
      'jobs.fNotes': 'Ghi chú',
      'jobs.fJd': 'Nội dung JD (dán vào đây)',
      'jobs.jdPlaceholder': 'Dán nguyên văn mô tả công việc… Càng đủ ý, phần phân tích càng sát.',
      'jobs.jdHint': 'Mỗi lần phân tích tốn 1 lượt AI.',
      'jobs.jdTooShort': 'JD cần ít nhất 200 ký tự để phân tích.',
      'jobs.analyze': '🤖 Phân tích JD',
      'jobs.analyzing': 'AI đang phân tích…',
      'jobs.reanalyze': '🤖 Phân tích lại',
      'jobs.noJd': 'Chưa có JD nên chưa phân tích được.',
      'jobs.save': 'Lưu',
      'jobs.cancel': 'Huỷ',
      'jobs.edit': 'Sửa',
      'jobs.del': 'Xoá',
      'jobs.deleteConfirm': 'Xoá “{title}” khỏi danh sách theo dõi?',
      'jobs.overdue': 'Qua hạn nộp',
      'jobs.dueIn': 'Còn {n} ngày',
      'jobs.analysedAt': 'Phân tích {time}',
      'jobs.aSummary': 'Việc này là gì',
      'jobs.aRole': 'Vị trí',
      'jobs.aDomain': 'Domain',
      'jobs.aLevel': 'Cấp độ AI đánh giá',
      'jobs.mustHave': 'Kỹ năng bắt buộc',
      'jobs.niceToHave': 'Điểm cộng',
      'jobs.likelyQ': 'Câu hỏi nhiều khả năng bị hỏi',
      'jobs.prepTips': 'Chuẩn bị',
      'jobs.askBack': 'Câu nên hỏi lại',
      'jobs.weight': 'quan trọng {n}/3',
      'jobs.reviewTitle': 'Ôn cho việc này',
      'jobs.reviewCount': '{need}/{total} câu cần ôn',
      'jobs.reviewLoading': 'Đang tính số câu cần ôn…',
      'jobs.shortcut': 'Phím tắt: 1 / 2 chuyển tab · n thêm việc · / tìm kiếm',
      'jobs.followedFrom': 'Lưu từ bản tin',
      'jobs.followedManual': 'Tự nhập',
      'jobs.notesCol': 'Ghi chú',
    },
    en: {
      'jobs.viewTitle': 'Jobs',
      'jobs.todayTab': "Today's jobs",
      'jobs.mineTab': 'Jobs I follow',
      'jobs.subtitle': 'Open Java backend jobs in Vietnam, plus the list of roles you are applying to.',
      'jobs.mineSubtitle': 'Track each application, paste a JD and AI tells you what to revise.',
      'jobs.navAria': 'Switch between job tabs',
      'jobs.loading': 'Loading jobs…',
      'jobs.noServer': 'The job digest is only available on the deployed site (Vercel). It is unavailable via file:// — your own list still works.',
      'jobs.notConfigured': 'The server has no Supabase configured (job_digest table), so there is no digest.',
      'jobs.setupMissing': 'The job_digest table does not exist yet. An admin must run the SQL in docs/JOBS-DIGEST.md.',
      'jobs.empty': 'No job digest yet. It is edited every morning, check back later.',
      'jobs.missing': 'No digest for this day.',
      'jobs.count': '{n} jobs',
      'jobs.published': 'Published {time}',
      'jobs.pickDate': 'Another day',
      'jobs.latest': 'latest',
      'jobs.levelLabel': 'Level',
      'jobs.placeLabel': 'Location',
      'jobs.locAll': 'All',
      'jobs.locHanoi': 'Hanoi',
      'jobs.locHcm': 'HCMC',
      'jobs.locRemote': 'Remote',
      'jobs.searchPlaceholder': 'Search title, company, skills…',
      'jobs.noMatch': 'No job matches the current filters.',
      'jobs.prepTitle': 'What to prepare',
      'jobs.original': 'Original posting',
      'jobs.sourceLabel': 'Source',
      'jobs.watch': 'Follow',
      'jobs.watched': 'Following',
      'jobs.levelJunior': 'Junior',
      'jobs.levelMid': 'Middle',
      'jobs.levelSenior': 'Senior',
      'jobs.levelLead': 'Lead / Architect',
      'jobs.topicsTitle': 'Revise topics',
      'jobs.mineEmpty': "You follow no job yet. Open “Today's jobs” and press ＋ Follow, or add one manually.",
      'jobs.addJob': 'Add job',
      'jobs.editJob': 'Edit job',
      'jobs.newJob': 'New job',
      'jobs.stAll': 'All',
      'jobs.stWatch': 'Watching',
      'jobs.stApplied': 'Applied',
      'jobs.stInterview': 'Interview',
      'jobs.stOffer': 'Offer',
      'jobs.stRejected': 'Rejected',
      'jobs.fTitle': 'Title',
      'jobs.fCompany': 'Company',
      'jobs.fUrl': 'Posting link',
      'jobs.fLocation': 'Location',
      'jobs.fLevel': 'Level',
      'jobs.fSalary': 'Salary',
      'jobs.fDeadline': 'Deadline',
      'jobs.fStatus': 'Status',
      'jobs.fNotes': 'Notes',
      'jobs.fJd': 'Job description (paste here)',
      'jobs.jdPlaceholder': 'Paste the full JD… the more complete, the sharper the analysis.',
      'jobs.jdHint': 'Each analysis costs 1 AI credit.',
      'jobs.jdTooShort': 'The JD needs at least 200 characters to analyse.',
      'jobs.analyze': '🤖 Analyse JD',
      'jobs.analyzing': 'AI is analysing…',
      'jobs.reanalyze': '🤖 Analyse again',
      'jobs.noJd': 'No JD yet, so nothing to analyse.',
      'jobs.save': 'Save',
      'jobs.cancel': 'Cancel',
      'jobs.edit': 'Edit',
      'jobs.del': 'Delete',
      'jobs.deleteConfirm': 'Delete “{title}” from your list?',
      'jobs.overdue': 'Deadline passed',
      'jobs.dueIn': '{n} days left',
      'jobs.analysedAt': 'Analysed {time}',
      'jobs.aSummary': 'What this job is',
      'jobs.aRole': 'Role',
      'jobs.aDomain': 'Domain',
      'jobs.aLevel': 'Level by AI',
      'jobs.mustHave': 'Must-have skills',
      'jobs.niceToHave': 'Nice to have',
      'jobs.likelyQ': 'Likely interview questions',
      'jobs.prepTips': 'Preparation',
      'jobs.askBack': 'Questions to ask back',
      'jobs.weight': 'importance {n}/3',
      'jobs.reviewTitle': 'Revise for this job',
      'jobs.reviewCount': '{need}/{total} to revise',
      'jobs.reviewLoading': 'Counting cards to revise…',
      'jobs.shortcut': 'Shortcuts: 1 / 2 switch tab · n add job · / search',
      'jobs.followedFrom': 'Saved from digest',
      'jobs.followedManual': 'Added manually',
      'jobs.notesCol': 'Notes',
    },
  });

  const esc = App.esc;
  const tr = (key, vars) => App.t('jobs.' + key, vars);
  const locale = () => (App.lang === 'en' ? 'en-US' : 'vi-VN');
  const safeUrl = u => (/^https:\/\//i.test(String(u || '')) ? String(u) : '');
  const arr = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x) : []);
  /** Lowercase + strip diacritics so "Hà Nội" and "Ha Noi" match the same filter. */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const keyOf = url => norm(url).replace(/^https?:\/\//, '').replace(/\/+$/, '');

  const LEVELS = ['junior', 'mid', 'senior', 'lead'];
  const levelLabel = l => (LEVELS.indexOf(l) >= 0 ? tr('level' + l[0].toUpperCase() + l.slice(1)) : String(l || ''));

  const PLACES = [
    { id: 'all', key: 'locAll' },
    { id: 'hanoi', key: 'locHanoi', re: /ha noi|\bhn\b/ },
    { id: 'hcm', key: 'locHcm', re: /ho chi minh|hcmc|\bhcm\b|sai gon/ },
    { id: 'remote', key: 'locRemote', re: /remote|wfh|work from home|toan quoc|anywhere/ },
  ];
  const placeMatches = (loc, id) => {
    if (!id || id === 'all') return true;
    const p = PLACES.find(x => x.id === id);
    return !!p && p.re.test(norm(loc));
  };

  const STATUSES = [
    { id: 'watch', key: 'stWatch', cls: 'info' },
    { id: 'applied', key: 'stApplied', cls: 'accent' },
    { id: 'interview', key: 'stInterview', cls: 'warn' },
    { id: 'offer', key: 'stOffer', cls: 'ok' },
    { id: 'rejected', key: 'stRejected', cls: 'bad' },
  ];
  const statusMeta = s => STATUSES.find(x => x.id === s) || STATUSES[0];
  const statusLabel = s => tr(statusMeta(s).key);
  const CLOSED = { offer: 1, rejected: 1 };

  const uid = () => 'job-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const jobsList = () => (App.store.data.jobs = App.store.data.jobs || []);
  const visibleJobs = () => jobsList().filter(j => j && !j.deleted);
  const findJob = id => jobsList().find(j => j && j.id === id && !j.deleted);
  const persist = () => App.store.save();

  // ---------------- state ----------------
  let root = null;
  let alive = false;
  let tab = 'today';
  let digestDate = null;      // 'YYYY-MM-DD' or null = latest
  let digestState = null;     // { loading, error, data }
  let digestReq = 0;
  let fLevel = '';
  let fPlace = 'all';
  let fTerm = '';
  let mineFilter = '';
  let draft = null;           // { mode: 'add'|'edit', item: {...}, jd }
  let aiBusyId = '';
  let aiErr = null;           // { id, e } — last AI / validation error, shown on that job's card
  let pendingAdd = false;     // "n" pressed on tab 1: open the form once tab 2 renders
  let statsReady = false;
  let keyCleanup = null;

  function fmtDateStr(s, opts) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return String(s || '');
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString(locale(), opts || { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function daysUntil(deadline) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(deadline || ''));
    if (!m) return null;
    const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Math.round((target.setHours(0, 0, 0, 0) - App.startOfDay(Date.now())) / App.DAY);
  }

  // ---------------- tab 1: today's digest ----------------

  function isWatched(url) {
    const k = keyOf(url);
    return !!k && visibleJobs().some(j => keyOf(j.url) === k);
  }

  function digestItems() {
    const d = digestState && digestState.data && digestState.data.digest;
    return d && Array.isArray(d.items) ? d.items : [];
  }

  function filteredItems() {
    const term = norm(fTerm).trim();
    return digestItems().filter(it => {
      if (fLevel && norm(it.level) !== norm(fLevel)) return false;
      if (!placeMatches(it.location, fPlace)) return false;
      if (term) {
        const hay = norm([it.title, it.company, (it.skills || []).join(' ')].join(' '));
        if (hay.indexOf(term) < 0) return false;
      }
      return true;
    });
  }

  function datePicker(dates, current) {
    if (!dates || dates.length < 2) return '';
    const opts = dates.map((d, i) =>
      '<option value="' + esc(d) + '"' + (d === current ? ' selected' : '') + '>' +
      esc(fmtDateStr(d, { day: '2-digit', month: '2-digit', year: 'numeric' })) +
      (i === 0 ? ' (' + esc(tr('latest')) + ')' : '') + '</option>').join('');
    return '<label class="jb-pick"><span class="small muted">' + esc(tr('pickDate')) + '</span>' +
      '<select class="select sm" data-digest-date aria-label="' + esc(tr('pickDate')) + '">' + opts + '</select></label>';
  }

  function chipRow(attr, options, active, ariaLabel) {
    return '<div class="chips" role="group" aria-label="' + esc(ariaLabel) + '">' + options.map(o =>
      '<button type="button" class="chip' + (active === o.id ? ' active' : '') + '" data-' + attr + '="' + esc(o.id) +
      '" aria-pressed="' + (active === o.id) + '">' + esc(o.label) + '</button>').join('') + '</div>';
  }

  function digestCard(it) {
    const url = safeUrl(it.url);
    const watched = url && isWatched(url);
    const skills = arr(it.skills);
    const topics = arr(it.topics);
    const links = topics.map(t => {
      const tp = App.topic(t) || { id: t, name: t, icon: '•' };
      return '<a class="chip jb-topic" href="#/bank/' + esc(t) + '">' + esc(tp.icon || '') + ' ' + esc(tp.name || t) + '</a>';
    }).join('');
    return '<article class="card jb-card">' +
      '<header class="jb-card-head">' +
        '<div class="jb-titles">' +
          '<h3 class="jb-title">' + (url
            ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(it.title || '') + '</a>'
            : esc(it.title || '')) + '</h3>' +
          '<p class="jb-company">' + esc(it.company || '') +
            (it.source ? ' <span class="badge jb-source">' + esc(tr('sourceLabel')) + ': ' + esc(it.source) + '</span>' : '') + '</p>' +
        '</div>' +
        '<button type="button" class="btn sm ' + (watched ? 'ok' : 'primary') + '" data-act="watch"' +
          (watched ? ' disabled' : '') + ' data-url="' + esc(url || '') + '" aria-pressed="' + (watched ? 'true' : 'false') + '">' +
          (watched ? '✓ ' + esc(tr('watched')) : '＋ ' + esc(tr('watch'))) + '</button>' +
      '</header>' +
      '<div class="chips jb-meta">' +
        (it.level ? '<span class="badge accent">' + esc(levelLabel(it.level)) + '</span>' : '') +
        (it.location ? '<span class="badge">📍 ' + esc(it.location) + '</span>' : '') +
        (it.salary ? '<span class="badge ok">💰 ' + esc(it.salary) + '</span>' : '') +
        (it.posted ? '<span class="badge">🗓 ' + esc(it.posted) + '</span>' : '') +
      '</div>' +
      (skills.length ? '<div class="chips jb-skills">' + skills.map(s => '<span class="chip">#' + esc(s) + '</span>').join('') + '</div>' : '') +
      (it.summary ? '<div class="md jb-summary">' + App.md(it.summary) + '</div>' : '') +
      (it.prep ? '<div class="jb-prep"><h4>' + esc(tr('prepTitle')) + '</h4><div class="md">' + App.md(it.prep) + '</div></div>' : '') +
      (links ? '<div class="jb-row-label small muted">' + esc(tr('topicsTitle')) + '</div><div class="chips jb-topics">' + links + '</div>' : '') +
      (url ? '<footer class="jb-foot"><a class="btn sm" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
        esc(tr('original')) + ' ↗</a></footer>' : '') +
      '</article>';
  }

  function digestBodyHtml() {
    if (!digestState || digestState.loading) {
      return '<p class="muted jb-state" role="status">' + esc(tr('loading')) + '</p>';
    }
    if (digestState.error) {
      const e = digestState.error;
      return e.code === 'no_server'
        ? '<div class="empty">' + esc(tr('noServer')) + '</div>'
        : App.ui.error(e);
    }
    const data = digestState.data;
    if (!data.configured) return '<div class="empty">' + esc(tr('notConfigured')) + '</div>';
    if (data.setup === 'missing_table') return '<div class="empty">' + esc(tr('setupMissing')) + '</div>';
    const d = data.digest;
    if (!d) {
      return '<p class="muted jb-state">' + esc(digestDate ? tr('missing') : tr('empty')) + '</p>';
    }
    const items = digestItems();
    const levelOpts = [{ id: '', label: tr('locAll') }].concat(
      LEVELS.filter(l => items.some(it => norm(it.level) === norm(l)))
        .map(l => ({ id: l, label: levelLabel(l) })));
    const shown = filteredItems();
    return '<div class="md jb-intro">' + App.md(d.intro || '') + '</div>' +
      '<p class="small muted jb-count">' + esc(fmtDateStr(d.date)) + ' · ' + esc(tr('count', { n: items.length })) +
        (d.published_at ? ' · ' + esc(tr('published', { time: new Date(d.published_at).toLocaleString(locale(), { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) })) : '') + '</p>' +
      '<div class="jb-toolbar card">' +
        '<div class="jb-tool-row">' + chipRow('level', levelOpts, fLevel, tr('levelLabel')) + chipRow('place', PLACES.map(p => ({ id: p.id, label: tr(p.key) })), fPlace, tr('placeLabel')) + '</div>' +
        '<div class="jb-tool-row">' +
          '<input type="search" class="input jb-search" placeholder="' + esc(tr('searchPlaceholder')) + '" value="' + esc(fTerm) + '" aria-label="' + esc(tr('searchPlaceholder')) + '">' +
          '<kbd>/</kbd>' +
        '</div>' +
      '</div>' +
      (shown.length
        ? '<div class="jb-list">' + shown.map(digestCard).join('') + '</div>'
        : '<div class="empty card">' + esc(items.length ? tr('noMatch') : tr('empty')) + '</div>');
  }

  function renderToday() {
    const d = digestState && !digestState.loading && !digestState.error && digestState.data && digestState.data.digest;
    root.innerHTML =
      '<div class="page-head"><div><h1>💼 ' + esc(tr('viewTitle')) + '</h1>' +
        '<p class="muted">' + esc(tr('subtitle')) + '</p></div>' +
        (d ? datePicker(digestState.data.dates, d.date) : '') + '</div>' +
      tabsHtml() +
      '<section class="jb-today-body" aria-live="' + (digestState && digestState.loading ? 'polite' : 'off') + '">' + digestBodyHtml() + '</section>' +
      '<p class="small muted jb-shortcuts">' + esc(tr('shortcut')) + '</p>';
  }

  // ---------------- tab 2: my jobs ----------------

  function formHtml() {
    if (!draft) {
      return '<div class="row"><button type="button" class="btn primary" data-act="add">＋ ' + esc(tr('addJob')) + '</button>' +
        '<kbd>n</kbd></div>';
    }
    const it = draft.item;
    const opt = (list, cur, label) => list.map(x =>
      '<option value="' + esc(x) + '"' + (x === cur ? ' selected' : '') + '>' + esc(label(x)) + '</option>').join('');
    return '<form class="card jb-form" data-mode="' + esc(draft.mode) + '" data-id="' + esc(it.id || '') + '">' +
      '<h2>' + esc(draft.mode === 'edit' ? tr('editJob') : tr('newJob')) + '</h2>' +
      '<div class="jb-form-grid">' +
        field(tr('fTitle'), '<input class="input" name="title" value="' + esc(it.title || '') + '" required maxlength="200">') +
        field(tr('fCompany'), '<input class="input" name="company" value="' + esc(it.company || '') + '" maxlength="120">') +
        field(tr('fUrl'), '<input class="input" name="url" type="url" value="' + esc(it.url || '') + '" placeholder="https://…">') +
        field(tr('fLocation'), '<input class="input" name="location" value="' + esc(it.location || '') + '" maxlength="120">') +
        field(tr('fLevel'), '<select class="select" name="level">' + opt(LEVELS, it.level || 'senior', levelLabel) + '</select>') +
        field(tr('fSalary'), '<input class="input" name="salary" value="' + esc(it.salary || '') + '" maxlength="80">') +
        field(tr('fDeadline'), '<input class="input" name="deadline" type="date" value="' + esc(it.deadline || '') + '">') +
        field(tr('fStatus'), '<select class="select" name="status">' + opt(STATUSES.map(s => s.id), it.status || 'watch', statusLabel) + '</select>') +
      '</div>' +
      field(tr('fNotes'), '<textarea class="textarea" name="notes" rows="3" placeholder="…">' + esc(it.notes || '') + '</textarea>') +
      field(tr('fJd'), '<textarea class="textarea" name="jd" rows="8" placeholder="' + esc(tr('jdPlaceholder')) + '">' + esc(it.jd || '') + '</textarea>') +
      '<div class="row"><button type="submit" class="btn primary">' + esc(tr('save')) + '</button>' +
        '<button type="button" class="btn" data-act="cancel">' + esc(tr('cancel')) + '</button>' +
        '<span class="spacer"></span><span class="small muted">' + esc(tr('jdHint')) + '</span></div>' +
      '</form>';
  }

  function field(label, control) {
    return '<label class="jb-field"><span>' + esc(label) + '</span>' + control + '</label>';
  }

  function tabsHtml() {
    return '<nav class="jb-tabs" aria-label="' + esc(tr('navAria')) + '">' +
      '<a class="btn' + (tab === 'today' ? ' primary' : '') + '" href="#/jobs">' + esc(tr('todayTab')) + '</a>' +
      '<a class="btn' + (tab === 'mine' ? ' primary' : '') + '" href="#/jobs/mine">' + esc(tr('mineTab')) + '</a>' +
      '</nav>';
  }

  function analysisHtml(j) {
    const a = j.analysis;
    if (!a) {
      // No AI analysis yet: still offer the topics the digest suggested for this posting.
      const tps = arr(j.topics);
      const quick = tps.length ? '<div class="jb-review"><h4>📚 ' + esc(tr('reviewTitle')) + '</h4><div class="chips">' +
        tps.map(t => '<a class="chip jb-review-link" href="#/bank/' + esc(t) + '">' + esc((App.topic(t) || {}).icon || '') + ' ' +
          esc((App.topic(t) || {}).name || t) + ' <span class="jb-review-count" data-count="' + esc(t) + '">' + esc(tr('reviewLoading')) + '</span></a>').join('') +
        '</div></div>' : '';
      return '<p class="small muted">' + esc(j.jd ? tr('jdHint') : tr('noJd')) + '</p>' + quick;
    }
    const must = Array.isArray(a.must_have) ? a.must_have : [];
    const nice = arr(a.nice_to_have);
    const tips = arr(a.prep_tips);
    const ask = arr(a.questions_to_ask);
    const likely = Array.isArray(a.likely_questions) ? a.likely_questions : [];
    const review = [];
    const seen = {};
    must.forEach(m => {
      const t = m && m.topic;
      if (!t || seen[t]) return;
      seen[t] = true;
      review.push({ topic: t, weight: Number(m.weight) || 1 });
    });
    review.sort((x, y) => y.weight - x.weight);
    const links = review.map(r => {
      const tp = App.topic(r.topic) || { id: r.topic, name: r.topic, icon: '•' };
      return '<a class="chip jb-review-link" href="#/bank/' + esc(r.topic) + '" data-topic="' + esc(r.topic) + '">' +
        esc(tp.icon || '') + ' ' + esc(tp.name || r.topic) +
        ' <span class="jb-review-count" data-count="' + esc(r.topic) + '">' + esc(tr('reviewLoading')) + '</span></a>';
    }).join('');
    const ul = (list, empty) => (list.length
      ? '<ul>' + list.map(x => '<li>' + x + '</li>').join('') + '</ul>'
      : '<p class="small muted">' + esc(empty) + '</p>');
    return '<div class="jb-analysis">' +
      (a.analysed_at ? '<p class="small muted">' + esc(tr('analysedAt', { time: App.fmtDate(a.analysed_at) })) + '</p>' : '') +
      (a.summary ? '<h4>' + esc(tr('aSummary')) + '</h4><p class="jb-a-summary">' + esc(a.summary) + '</p>' : '') +
      '<div class="chips jb-a-meta">' +
        (a.role ? '<span class="badge">' + esc(tr('aRole')) + ': ' + esc(a.role) + '</span>' : '') +
        (a.company ? '<span class="badge">' + esc(tr('fCompany')) + ': ' + esc(a.company) + '</span>' : '') +
        (a.level ? '<span class="badge accent">' + esc(tr('aLevel')) + ': ' + esc(levelLabel(a.level)) + '</span>' : '') +
        (a.domain ? '<span class="badge">' + esc(tr('aDomain')) + ': ' + esc(a.domain) + '</span>' : '') +
      '</div>' +
      (must.length ? '<h4>' + esc(tr('mustHave')) + '</h4>' +
        ul(must.map(m => esc(m.skill || '') + (m.topic ? ' <a class="link-btn" href="#/bank/' + esc(m.topic) + '">' + esc((App.topic(m.topic) || {}).name || m.topic) + '</a>' : '') +
          (m.weight ? ' <span class="badge">(' + esc(tr('weight', { n: Number(m.weight) })) + ')</span>' : '')), '—') : '') +
      (nice.length ? '<h4>' + esc(tr('niceToHave')) + '</h4>' + ul(nice.map(x => esc(x)), '—') : '') +
      (likely.length ? '<h4>' + esc(tr('likelyQ')) + '</h4>' +
        ul(likely.map(q => esc(q.q || '') + (q.why ? ' <span class="muted small">— ' + esc(q.why) + '</span>' : '')), '—') : '') +
      (tips.length ? '<h4>' + esc(tr('prepTips')) + '</h4>' + ul(tips.map(x => esc(x)), '—') : '') +
      (ask.length ? '<h4>' + esc(tr('askBack')) + '</h4>' + ul(ask.map(x => esc(x)), '—') : '') +
      (links ? '<div class="jb-review"><h4>📚 ' + esc(tr('reviewTitle')) + '</h4><div class="chips">' + links + '</div></div>' : '') +
      '</div>';
  }

  function mineCard(j) {
    const meta = statusMeta(j.status);
    const left = daysUntil(j.deadline);
    const closed = !!CLOSED[j.status];
    const overdue = left !== null && left < 0 && !closed;
    const soon = left !== null && left >= 0 && left <= 7 && !closed;
    const url = safeUrl(j.url);
    const busy = aiBusyId === j.id;
    return '<article class="card jb-mine-card" data-id="' + esc(j.id) + '">' +
      '<header class="jb-card-head">' +
        '<div class="jb-titles">' +
          '<h3 class="jb-title">' + (url
            ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(j.title || '') + '</a>'
            : esc(j.title || tr('newJob'))) + '</h3>' +
          '<p class="jb-company">' + esc(j.company || '') + '</p>' +
        '</div>' +
        '<span class="badge ' + meta.cls + '">' + esc(statusLabel(j.status)) + '</span>' +
      '</header>' +
      '<div class="chips jb-meta">' +
        (j.level ? '<span class="badge accent">' + esc(levelLabel(j.level)) + '</span>' : '') +
        (j.location ? '<span class="badge">📍 ' + esc(j.location) + '</span>' : '') +
        (j.salary ? '<span class="badge ok">💰 ' + esc(j.salary) + '</span>' : '') +
        (j.deadline ? '<span class="badge ' + (overdue ? 'bad' : soon ? 'warn' : '') + '">🗓 ' + esc(j.deadline) +
          (overdue ? ' · ' + esc(tr('overdue')) : soon ? ' · ' + esc(tr('dueIn', { n: left })) : '') + '</span>' : '') +
        (j.from === 'digest' ? '<span class="badge">' + esc(tr('followedFrom')) + '</span>' : '') +
      '</div>' +
      (j.notes ? '<div class="jb-notes"><span class="small muted">' + esc(tr('notesCol')) + ':</span> ' + esc(j.notes) + '</div>' : '') +
      '<div class="jb-actions row">' +
        '<button type="button" class="btn sm primary" data-act="analyse" data-id="' + esc(j.id) + '"' +
          (busy ? ' disabled' : '') + '>' + esc(busy ? tr('analyzing') : (j.analysis ? tr('reanalyze') : tr('analyze'))) + '</button>' +
        (busy ? '<span class="ai-loading">' + esc(tr('analyzing')) + '</span>' : '') +
        '<span class="spacer"></span>' +
        '<button type="button" class="btn sm" data-act="edit" data-id="' + esc(j.id) + '">' + esc(tr('edit')) + '</button>' +
        '<button type="button" class="btn sm bad" data-act="delete" data-id="' + esc(j.id) + '">' + esc(tr('del')) + '</button>' +
      '</div>' +
      (aiErr && aiErr.id === j.id ? App.ui.error(aiErr.e) : '') +
      (busy ? '' : analysisHtml(j)) +
      '</article>';
  }

  function renderMine() {
    const all = visibleJobs();
    const counts = {};
    STATUSES.forEach(s => { counts[s.id] = 0; });
    all.forEach(j => { counts[statusMeta(j.status).id] = (counts[statusMeta(j.status).id] || 0) + 1; });
    const chips = '<div class="chips" role="group" aria-label="' + esc(tr('fStatus')) + '">' +
      '<button type="button" class="chip' + (!mineFilter ? ' active' : '') + '" data-status="" aria-pressed="' + (!mineFilter) + '">' +
        esc(tr('stAll')) + ' (' + all.length + ')</button>' +
      STATUSES.map(s => '<button type="button" class="chip' + (mineFilter === s.id ? ' active' : '') + '" data-status="' + esc(s.id) +
        '" aria-pressed="' + (mineFilter === s.id) + '">' + esc(tr(s.key)) + ' (' + (counts[s.id] || 0) + ')</button>').join('') +
      '</div>';
    const shown = all
      .filter(j => !mineFilter || statusMeta(j.status).id === mineFilter)
      .slice()
      .sort((a, b) => {
        const da = a.deadline || '9999-99-99';
        const db = b.deadline || '9999-99-99';
        return da.localeCompare(db) || (b.updatedAt || 0) - (a.updatedAt || 0);
      });
    root.innerHTML =
      '<div class="page-head"><div><h1>🔎 ' + esc(tr('mineTab')) + '</h1><p class="muted">' + esc(tr('mineSubtitle')) + '</p></div></div>' +
      tabsHtml() +
      formHtml() +
      '<div class="jb-mine-tools card">' + chips + '</div>' +
      (shown.length
        ? '<div class="jb-list">' + shown.map(mineCard).join('') + '</div>'
        : '<div class="empty card">' + esc(all.length ? tr('noMatch') : tr('mineEmpty')) + '</div>') +
      '<p class="small muted jb-shortcuts">' + esc(tr('shortcut')) + '</p>';
    fillReviewCounts();
  }

  /** Count of questions still to revise per topic; needs the light index (App.stats). */
  function fillReviewCounts() {
    const slots = root.querySelectorAll('[data-count]');
    if (!slots.length) return;
    const paint = () => {
      slots.forEach(el => {
        const t = el.getAttribute('data-count');
        let s;
        try { s = App.stats(t); } catch (e) { s = null; }
        if (!s) { el.textContent = '—'; return; }
        el.textContent = s.total ? tr('reviewCount', { need: (s.unknown || 0) + (s.unseen || 0), total: s.total }) : '—';
      });
    };
    if (statsReady) { paint(); return; }
    if (!App.need) { paint(); return; }
    App.need(['index']).then(() => {
      statsReady = true;
      if (alive && tab === 'mine') paint();
    }).catch(() => { if (alive) slots.forEach(el => { el.textContent = '—'; }); });
  }

  // ---------------- actions ----------------

  function render() {
    if (!root) return;
    if (tab === 'mine') renderMine();
    else renderToday();
  }

  function focusSearch() {
    const input = root.querySelector('.jb-search');
    if (!input) return;
    input.focus();
    try { input.select(); } catch (e) { /* some browsers refuse */ }
  }

  function reRenderKeepFocus() {
    const search = root.querySelector('.jb-search');
    const wasSearch = search && document.activeElement === search;
    const caret = wasSearch ? search.selectionStart : null;
    render();
    if (wasSearch) {
      const again = root.querySelector('.jb-search');
      if (again) {
        again.focus();
        try { again.setSelectionRange(caret, caret); } catch (e) { /* type=search may not support it */ }
      }
    }
  }

  async function loadDigest(date) {
    const req = ++digestReq;
    digestDate = date || null;
    digestState = { loading: true };
    render();
    try {
      const data = await App.news.digest({ kind: 'jobs', date: digestDate });
      if (!alive || req !== digestReq) return;
      digestState = { loading: false, data: data };
    } catch (e) {
      if (!alive || req !== digestReq) return;
      digestState = { loading: false, error: e };
    }
    if (!alive || req !== digestReq) return;
    render();
  }

  function addFromDigest(url) {
    const it = digestItems().find(x => safeUrl(x.url) === url);
    if (!it || isWatched(url)) return;
    const now = Date.now();
    jobsList().push({
      id: uid(),
      updatedAt: now,
      title: String(it.title || '').slice(0, 200),
      company: String(it.company || '').slice(0, 120),
      url: String(it.url || ''),
      location: String(it.location || ''),
      level: String(it.level || ''),
      salary: String(it.salary || ''),
      deadline: '',
      status: 'watch',
      from: 'digest',
      notes: '',
      jd: '',
      topics: arr(it.topics),
    });
    persist();
    render();
  }

  function openAdd(prefill) {
    draft = { mode: 'add', item: Object.assign({ status: 'watch', level: 'senior' }, prefill || {}) };
    tab = 'mine';
    render();
    const el = root.querySelector('.jb-form [name=title]');
    if (el) el.focus();
  }

  function openEdit(id) {
    const j = findJob(id);
    if (!j) return;
    draft = { mode: 'edit', item: Object.assign({}, j) };
    aiErr = null;
    render();
    const el = root.querySelector('.jb-form [name=title]');
    if (el) el.focus();
  }

  function saveForm(form) {
    const f = new FormData(form);
    const get = k => String(f.get(k) || '').trim();
    if (!get('title')) return;
    const now = Date.now();
    const url = get('url');
    const jd = get('jd');
    const base = draft && draft.mode === 'edit' ? jobsList().find(x => x && x.id === draft.item.id) : null;
    const item = base || { id: uid(), updatedAt: now, from: 'manual' };
    item.title = get('title').slice(0, 200);
    item.company = get('company').slice(0, 120);
    item.url = safeUrl(url) || url;
    item.location = get('location').slice(0, 120);
    item.level = get('level');
    item.salary = get('salary').slice(0, 80);
    item.deadline = get('deadline');
    item.status = statusMeta(get('status')).id;
    item.notes = get('notes');
    if (item.jd !== jd) { item.analysis = undefined; }
    item.jd = jd;
    item.updatedAt = now;
    if (!base) jobsList().push(item);
    persist();
    draft = null;
    aiErr = null;
    render();
  }

  async function analyse(id, button) {
    const j = findJob(id);
    if (!j || aiBusyId) return;
    if ((j.jd || '').trim().length < 200) {
      aiErr = { id, e: { message: tr('jdTooShort'), code: 'jd_too_short' } };
      render();
      return;
    }
    aiBusyId = id;
    aiErr = null;
    if (button) button.disabled = true;
    render();
    try {
      const a = await App.ai.jd(j.jd);
      const now = Date.now();
      // Keep the result even if the user left the view meanwhile: the credit is already spent.
      j.analysis = Object.assign({}, a, { analysed_at: now });
      j.updatedAt = now;
      persist();
    } catch (e) {
      aiErr = { id, e };
    } finally {
      aiBusyId = '';
      if (alive) render();
    }
  }

  function removeJob(id) {
    const j = jobsList().find(x => x && x.id === id);
    if (!j) return;
    if (!window.confirm(tr('deleteConfirm', { title: j.title || '' }))) return;
    j.deleted = true;
    j.updatedAt = Date.now();
    if (draft && draft.item && draft.item.id === id) draft = null;
    persist();
    render();
  }

  // ---------------- events ----------------

  function onClick(e) {
    const t = e.target;
    const level = t.closest('[data-level]');
    if (level) { fLevel = level.dataset.level; reRenderKeepFocus(); return; }
    const place = t.closest('[data-place]');
    if (place) { fPlace = place.dataset.place || 'all'; reRenderKeepFocus(); return; }
    const st = t.closest('[data-status]');
    if (st) { mineFilter = st.dataset.status || ''; render(); return; }

    const act = t.closest('[data-act]');
    if (!act) return;
    switch (act.dataset.act) {
      case 'watch': addFromDigest(act.dataset.url || ''); break;
      case 'add': openAdd(); break;
      case 'cancel': draft = null; render(); break;
      case 'edit': openEdit(act.dataset.id); break;
      case 'delete': removeJob(act.dataset.id); break;
      case 'analyse': analyse(act.dataset.id, act); break;
      default: break;
    }
  }

  function onInput(e) {
    if (e.target.classList.contains('jb-search')) {
      fTerm = e.target.value;
      reRenderKeepFocus();
    }
  }

  function onChange(e) {
    if (e.target.matches('[data-digest-date]')) {
      const v = e.target.value;
      loadDigest(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
    }
  }

  function onSubmit(e) {
    if (!e.target.matches('.jb-form')) return;
    e.preventDefault();
    saveForm(e.target);
  }

  App.registerView('jobs', {
    get title() { return App.t('jobs.viewTitle'); },
    render(rootEl, params) {
      root = rootEl;
      alive = true;
      tab = params && params[0] === 'mine' ? 'mine' : 'today';
      draft = null;
      aiBusyId = '';
      aiErr = null;

      root.innerHTML = '';
      root.addEventListener('click', onClick);
      root.addEventListener('input', onInput);
      root.addEventListener('change', onChange);
      root.addEventListener('submit', onSubmit);

      if (tab === 'mine' && pendingAdd) {
        pendingAdd = false;
        openAdd();
      } else {
        render();
      }
      // Reuse a loaded digest between visits; reload if the last attempt failed or was cut off mid-flight.
      if (tab === 'today' && (!digestState || digestState.loading || digestState.error)) loadDigest(digestDate);

      keyCleanup = App.onKey(e => {
        if (e.key === '1') { e.preventDefault(); App.navigate('#/jobs'); }
        else if (e.key === '2') { e.preventDefault(); App.navigate('#/jobs/mine'); }
        else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          if (tab === 'mine') openAdd();
          else { pendingAdd = true; App.navigate('#/jobs/mine'); }
        }
        else if (e.key === '/' && tab === 'today') { e.preventDefault(); focusSearch(); }
      });

      return () => {
        alive = false;
        digestReq++;
        if (keyCleanup) keyCleanup();
        keyCleanup = null;
        root.removeEventListener('click', onClick);
        root.removeEventListener('input', onInput);
        root.removeEventListener('change', onChange);
        root.removeEventListener('submit', onSubmit);
        root = null;
      };
    },
  });
})();
