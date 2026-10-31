/*
 * App.auth + App.sync — accounts (Supabase) and cloud sync of study progress.
 * Public API is a contract for views (AGENTS.md section 10); do not change signatures.
 *
 * Enabled only when js/config.js has a Supabase URL + publishable key, the supabase-js UMD bundle loaded,
 * and the page is served over http(s) (OAuth / magic-link redirects cannot return to file://).
 * Otherwise every method reports "not configured" and the app keeps working purely on localStorage.
 *
 * Sync model: the whole App.store.data (minus device prefs) is one JSON row in public.user_state.
 * Every sync is pull → merge → push, so two devices never overwrite each other; see merge() for rules.
 */
(function () {
  'use strict';

  // ---------- i18n (core strings) ----------
  App.i18n.add({
    vi: {
      'auth.notConfigured': 'Tính năng tài khoản chưa được cấu hình trên server này.',
      'auth.notSignedIn': 'Bạn chưa đăng nhập.',
      'auth.googleNotEnabled': 'Đăng nhập Google chưa được bật — hãy dùng link đăng nhập qua email.',
      'auth.invalidEmail': 'Email không hợp lệ.',
      'auth.rateLimit': 'Bạn thao tác quá nhanh, thử lại sau ít phút.',
      'auth.networkError': 'Không kết nối được máy chủ tài khoản.',
      'auth.genericError': 'Có lỗi xảy ra.',
      'auth.emptyDisplayName': 'Tên hiển thị không được để trống.',
      'auth.deleteAccount.confirm': 'Xoá tài khoản và toàn bộ dữ liệu đám mây? Thao tác không thể hoàn tác.',
      'auth.deleteAccount.clearLocal': 'Cũng xoá dữ liệu cục bộ trên thiết bị này?',
      'auth.export.title': 'Tải dữ liệu của tôi',
      'auth.sync.status.off': 'Tắt',
      'auth.sync.status.idle': 'Sẵn sàng',
      'auth.sync.status.syncing': 'Đang đồng bộ…',
      'auth.sync.status.error': 'Lỗi',
      'auth.sync.lastSync': 'Lần đồng bộ gần nhất',
      'auth.sync.never': 'Chưa bao giờ',
      'auth.sync.errorPrefix': 'Lỗi đồng bộ: ',
      'auth.login.failed': 'Đăng nhập thất bại: ',
      'auth.login.checkConfig': 'Kiểm tra cấu hình Google provider và Redirect URLs trong Supabase.',
    },
    en: {
      'auth.notConfigured': 'Account feature is not configured on this server.',
      'auth.notSignedIn': 'You are not signed in.',
      'auth.googleNotEnabled': 'Google sign-in is not enabled — use email sign-in instead.',
      'auth.invalidEmail': 'Invalid email.',
      'auth.rateLimit': 'Too many requests, please try again in a few minutes.',
      'auth.networkError': 'Cannot connect to the account server.',
      'auth.genericError': 'An error occurred.',
      'auth.emptyDisplayName': 'Display name cannot be empty.',
      'auth.deleteAccount.confirm': 'Delete account and all cloud data? This cannot be undone.',
      'auth.deleteAccount.clearLocal': 'Also clear local data on this device?',
      'auth.export.title': 'Download my data',
      'auth.sync.status.off': 'Off',
      'auth.sync.status.idle': 'Ready',
      'auth.sync.status.syncing': 'Syncing…',
      'auth.sync.status.error': 'Error',
      'auth.sync.lastSync': 'Last synced',
      'auth.sync.never': 'Never',
      'auth.sync.errorPrefix': 'Sync error: ',
      'auth.login.failed': 'Login failed: ',
      'auth.login.checkConfig': 'Check Google provider and Redirect URLs in Supabase.',
    },
  });

  const listeners = new Set();
  const syncListeners = new Set();
  const RETURN_KEY = 'sjp.auth.return';
  const LOCAL_ONLY = ['theme'];          // device preferences, never synced
  const HISTORY_MAX = 50;

  const cfg = window.APP_CONFIG || {};
  const lib = window.supabase;
  const enabled = !!(cfg.supabaseUrl && cfg.supabaseKey && lib && lib.createClient && /^https?:$/.test(location.protocol));
  const client = enabled ? lib.createClient(cfg.supabaseUrl, cfg.supabaseKey, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'sjp.auth' },
  }) : null;

  // ---------- merge (pure; exported for tests) ----------
  /**
   * Merge two copies of App.store.data. `local` wins for scalar fields it has (theme…).
   * - progress: per item, the newer self-assessment (higher t) wins — it carries its own SRS schedule
   * - bookmarks, roadmap.done: union (a bookmark removed on one device may come back from another)
   * - quiz/mock history: union by content, newest first, capped
   * - daily log: per day, per counter, the max (devices are not additive; undercounts rather than doubles)
   * - roadmap.start: the earliest
   */
  function merge(local, remote) {
    const a = local || {}, b = remote || {};
    const out = Object.assign({}, b, a);

    const progress = Object.assign({}, b.progress);
    Object.entries(a.progress || {}).forEach(([id, p]) => {
      const r = progress[id];
      if (!r || ((p && p.t) || 0) >= (r.t || 0)) progress[id] = p;
    });
    out.progress = progress;

    out.bookmarks = Object.assign({}, b.bookmarks, a.bookmarks);

    const history = (x, y) => {
      const seen = new Set();
      return (x || []).concat(y || [])
        .filter(h => { const k = JSON.stringify(h); if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((p, q) => ((q && q.at) || 0) - ((p && p.at) || 0))
        .slice(0, HISTORY_MAX);
    };
    out.quizHistory = history(a.quizHistory, b.quizHistory);
    out.mockHistory = history(a.mockHistory, b.mockHistory);

    const daily = {};
    [b.daily, a.daily].forEach(src => Object.entries(src || {}).forEach(([day, counters]) => {
      const d = daily[day] || (daily[day] = {});
      Object.entries(counters || {}).forEach(([k, v]) => { d[k] = Math.max(d[k] || 0, Number(v) || 0); });
    }));
    out.daily = daily;

    // user-authored lists (STAR stories, real interview log): union by id, the newer updatedAt wins
    ['stories', 'interviewLog'].forEach(k => {
      const by = new Map();
      [].concat(b[k] || [], a[k] || []).forEach(x => {
        if (!x || !x.id) return;
        const cur = by.get(x.id);
        if (!cur || (x.updatedAt || 0) >= (cur.updatedAt || 0)) by.set(x.id, x);
      });
      if (by.size || a[k] || b[k]) out[k] = [...by.values()].sort((p, q) => (q.updatedAt || 0) - (p.updatedAt || 0));
    });

    // single user-authored objects (upcoming interview plan): the newer updatedAt wins; deletion is { deleted: true }
    ['interviewPlan'].forEach(k => {
      if (a[k] || b[k]) out[k] = ((a[k] && a[k].updatedAt) || 0) >= ((b[k] && b[k].updatedAt) || 0) ? a[k] || b[k] : b[k];
    });

    const ra = a.roadmap || {}, rb = b.roadmap || {};
    const starts = [ra.start, rb.start].filter(Boolean).sort();
    out.roadmap = { start: starts[0] || null, done: Object.assign({}, rb.done, ra.done) };

    // AWS Pro track (#/aws): start the earliest, done weeks union, per question the newer answer wins, mocks union by time
    if (a.aws || b.aws) {
      const wa = a.aws || {}, wb = b.aws || {};
      const answers = Object.assign({}, wb.answers);
      Object.entries(wa.answers || {}).forEach(([id, x]) => {
        if (!answers[id] || ((x && x.at) || 0) >= (answers[id].at || 0)) answers[id] = x;
      });
      const mocks = new Map();
      [].concat(wb.mocks || [], wa.mocks || []).forEach(m => { if (m) mocks.set(m.at || JSON.stringify(m), m); });
      out.aws = Object.assign({}, wb, wa, {
        start: [wa.start, wb.start].filter(Boolean).sort()[0] || null,
        done: Object.assign({}, wb.done, wa.done),
        answers,
        mocks: [...mocks.values()].sort((p, q) => (q.at || 0) - (p.at || 0)).slice(0, 20),
      });
    }
    return out;
  }

  function cloudCopy(data) {
    const copy = Object.assign({}, data);
    LOCAL_ONLY.forEach(k => delete copy[k]);
    return copy;
  }

  // ---------- auth ----------
  function toUser(u) {
    if (!u) return null;
    const meta = u.user_metadata || {};
    return {
      id: u.id,
      email: u.email || '',
      name: meta.full_name || meta.name || (u.email || '').split('@')[0],
      avatar: meta.avatar_url || meta.picture || null,
    };
  }

  function need() {
    if (!enabled) throw new Error(App.t('auth.notConfigured'));
    if (!auth.user) throw new Error(App.t('auth.notSignedIn'));
  }

  function friendly(error) {
    const msg = (error && error.message) || String(error);
    if (/rate limit|too many/i.test(msg)) return new Error(App.t('auth.rateLimit'));
    if (/fetch|network/i.test(msg)) return new Error(App.t('auth.networkError'));
    return new Error(msg);
  }

  /** Where OAuth / magic link return to. Supabase appends ?code=…, so the hash route is restored after. */
  function redirectTo() {
    try { sessionStorage.setItem(RETURN_KEY, location.hash || '#/'); } catch (e) { /* ignore */ }
    return location.origin + location.pathname;
  }

  const auth = {
    /** true when Supabase is configured (js/config.js). When false, the site works fully offline/local. */
    enabled,
    /** Sign-in methods switched on in Supabase ({ google, email }); filled from /auth/v1/settings, null until known. */
    providers: null,
    /** Current user or null: { id, email, name, avatar } */
    user: null,
    /** Subscribe to sign-in / sign-out. Returns unsubscribe. fn(user|null) */
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    /** Redirects to Google sign-in. */
    async signInWithGoogle() {
      if (!enabled) throw new Error(App.t('auth.notConfigured'));
      if (auth.providers && !auth.providers.google) throw new Error(App.t('auth.googleNotEnabled'));
      const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } });
      if (error) throw friendly(error);
    },
    /** Sends a magic link to the email. Resolves when sent. */
    async signInWithEmail(email) {
      if (!enabled) throw new Error(App.t('auth.notConfigured'));
      const e = String(email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new Error(App.t('auth.invalidEmail'));
      const { error } = await client.auth.signInWithOtp({ email: e, options: { emailRedirectTo: redirectTo() } });
      if (error) throw friendly(error);
    },
    async signOut() {
      if (!enabled) throw new Error(App.t('auth.notConfigured'));
      if (auth.user) await sync.now().catch(() => {});   // last push before leaving
      const { error } = await client.auth.signOut();
      if (error) throw friendly(error);
    },
    /** { display_name, role: 'user'|'admin', ai_daily_limit } */
    async profile() {
      need();
      const { data, error } = await client.from('profiles').select('display_name, role, ai_daily_limit').eq('id', auth.user.id).maybeSingle();
      if (error) throw friendly(error);
      return data || { display_name: auth.user.name, role: 'user', ai_daily_limit: 0 };
    },
    async updateDisplayName(name) {
      need();
      const n = String(name || '').trim().slice(0, 60);
      if (!n) throw new Error(App.t('auth.emptyDisplayName'));
      const { error } = await client.from('profiles').update({ display_name: n }).eq('id', auth.user.id);
      if (error) throw friendly(error);
      auth.user = Object.assign({}, auth.user, { name: n });
      auth._emit();
    },
    /** AI usage today: { used, limit, byKind: { grade, review, run, interview } } */
    async usageToday() {
      need();
      const [usage, prof] = await Promise.all([client.from('my_ai_usage_today').select('kind, count'), auth.profile()]);
      if (usage.error) throw friendly(usage.error);
      const byKind = { grade: 0, review: 0, run: 0, interview: 0 };
      (usage.data || []).forEach(r => { byKind[r.kind] = r.count; });
      return { used: Object.values(byKind).reduce((s, n) => s + n, 0), limit: prof.ai_daily_limit, byKind };
    },
    /** Permanently deletes the account and all cloud data (server side). Local data is kept unless clearLocal. */
    async deleteAccount(opts) {
      need();
      const token = await auth.token();
      let res;
      try { res = await fetch('/api/me', { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } }); }
      catch (e) { throw new Error(App.t('auth.networkError')); }
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error((body && body.error) || (App.t('auth.genericError') + ' (lỗi ' + res.status + ').'));
      await client.auth.signOut({ scope: 'local' }).catch(() => {});
      if (opts && opts.clearLocal) App.store.reset();
    },
    /** Everything we hold about the user (local + cloud) as a plain object, for "Tải dữ liệu của tôi". */
    async exportData() {
      const out = { exportedAt: new Date().toISOString(), local: App.store.data, cloud: null };
      if (!enabled || !auth.user) return out;
      const uid = auth.user.id;
      const [prof, state, usage] = await Promise.all([
        client.from('profiles').select('*').eq('id', uid).maybeSingle(),
        client.from('user_state').select('data, updated_at').eq('user_id', uid).maybeSingle(),
        client.from('ai_usage').select('day, kind, count').eq('user_id', uid).order('day', { ascending: false }),
      ]);
      const err = prof.error || state.error || usage.error;
      if (err) throw friendly(err);
      out.cloud = { user: auth.user, profile: prof.data, state: state.data, aiUsage: usage.data };
      return out;
    },
    /** Access token for /api calls (null when signed out). Used by App.ai. */
    async token() {
      if (!enabled) return null;
      const { data } = await client.auth.getSession();
      return (data && data.session && data.session.access_token) || null;
    },
  };

  // ---------- sync ----------
  let running = null, again = false, timer = null, applying = false;

  function setStatus(status, error) {
    sync.status = status;
    sync.lastError = error ? ((error && error.message) || String(error)) : null;
    if (status === 'idle') sync.lastSyncAt = Date.now();
    sync._emit();
  }

  async function syncOnce() {
    const uid = auth.user && auth.user.id;
    if (!uid) return;
    setStatus('syncing');
    const pulled = await client.from('user_state').select('data').eq('user_id', uid).maybeSingle();
    if (pulled.error) throw pulled.error;
    const local = App.store.data;
    const merged = merge(local, pulled.data && pulled.data.data);
    const changedLocal = JSON.stringify(cloudCopy(merged)) !== JSON.stringify(cloudCopy(local));
    if (changedLocal) {
      applying = true;
      try { App.store.replace(merged); } finally { applying = false; }
    }
    const pushed = await client.from('user_state').upsert({ user_id: uid, data: cloudCopy(merged), updated_at: new Date().toISOString() });
    if (pushed.error) throw pushed.error;
    return changedLocal;
  }

  const sync = {
    /** 'off' (not signed in / not configured) | 'idle' | 'syncing' | 'error' */
    status: 'off',
    lastSyncAt: null,
    lastError: null,
    /** Subscribe to status changes. fn({status, lastSyncAt, lastError}). Returns unsubscribe. */
    onStatus(fn) { syncListeners.add(fn); return () => syncListeners.delete(fn); },
    /** Force a pull + merge + push now. Resolves to true when cloud data changed this device. */
    async now() {
      need();
      clearTimeout(timer);
      if (running) { again = true; return running; }
      running = (async () => {
        let changed = false;
        try {
          do { again = false; changed = (await syncOnce()) || changed; } while (again && auth.user);
          if (auth.user) setStatus('idle');
          return changed;
        } catch (e) {
          setStatus('error', friendly(e));
          throw friendly(e);
        } finally { running = null; }
      })();
      return running;
    },
    merge,
  };

  // Helper to format sync status for display
  function formatSyncStatus(status) {
    switch (status) {
      case 'off': return App.t('auth.sync.status.off');
      case 'idle': return App.t('auth.sync.status.idle');
      case 'syncing': return App.t('auth.sync.status.syncing');
      case 'error': return App.t('auth.sync.status.error');
      default: return status;
    }
  }

  function formatLastSync(ts) {
    if (!ts) return App.t('auth.sync.never');
    return new Date(ts).toLocaleString(App.lang === 'en' ? 'en-US' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  auth._emit = () => listeners.forEach(fn => { try { fn(auth.user); } catch (e) { console.error(e); } });
  sync._emit = () => syncListeners.forEach(fn => { try { fn({ status: sync.status, lastSyncAt: sync.lastSyncAt, lastError: sync.lastError, statusLabel: formatSyncStatus(sync.status), lastSyncLabel: formatLastSync(sync.lastSyncAt) }); } catch (e) { console.error(e); } });

  App.auth = auth;
  App.sync = sync;

  if (!enabled) return;

  // push local changes a few seconds after the last edit
  function schedule(delay) {
    if (!auth.user) return;
    clearTimeout(timer);
    timer = setTimeout(() => { sync.now().catch(() => {}); }, delay);
  }
  const save = App.store.save;
  App.store.save = function () { save.apply(this, arguments); if (!applying) schedule(4000); };

  // flush when leaving the tab; refresh from other devices when coming back
  document.addEventListener('visibilitychange', () => {
    if (!auth.user) return;
    if (document.visibilityState === 'hidden') { if (timer) schedule(0); }
    else if (!sync.lastSyncAt || Date.now() - sync.lastSyncAt > 60000) schedule(0);
  });

  function onSession(session) {
    const prev = auth.user && auth.user.id;
    auth.user = toUser(session && session.user);
    if ((auth.user && auth.user.id) === prev) return;     // token refresh, same user
    auth._emit();
    if (!auth.user) { clearTimeout(timer); setStatus('off'); return; }
    // first sync after sign-in: re-render so merged cloud progress shows up
    sync.now().then(changed => { if (changed) App.route(); }).catch(() => {});
    restoreRoute();
  }

  function restoreRoute() {
    let back = null;
    try { back = sessionStorage.getItem(RETURN_KEY); sessionStorage.removeItem(RETURN_KEY); } catch (e) { /* ignore */ }
    if (!location.search && !back) return;
    const target = back || location.hash;
    const moved = target !== location.hash;
    history.replaceState(null, '', location.pathname + target);   // drop ?code=… from the address bar
    if (moved) App.route();
  }

  // supabase-js warns against awaiting its own calls inside this callback → defer
  client.auth.onAuthStateChange((event, session) => { setTimeout(() => onSession(session), 0); });

  // OAuth / magic-link failures come back as ?error=…&error_description=… (or in the hash): show them
  const qs = new URLSearchParams(location.search + '&' + location.hash.replace(/^#\/?[^?&]*[?&]?/, ''));
  if (qs.get('error_description') || qs.get('error')) {
    const msg = (qs.get('error_description') || qs.get('error')).replace(/\+/g, ' ');
    sync.lastError = App.t('auth.login.failed') + msg;
    setTimeout(() => alert(App.t('auth.login.failed') + msg + '\n\n' + App.t('auth.login.checkConfig')), 300);
    history.replaceState(null, '', location.pathname + '#/account');
  }

  // which sign-in methods are switched on (so the account page can hide e.g. a disabled Google button)
  fetch(cfg.supabaseUrl.replace(/\/+$/, '') + '/auth/v1/settings', { headers: { apikey: cfg.supabaseKey } })
    .then(r => (r.ok ? r.json() : null))
    .then(s => { if (s && s.external) { auth.providers = { google: !!s.external.google, email: s.external.email !== false }; auth._emit(); } })
    .catch(() => { /* offline: keep showing all options */ });
})();
