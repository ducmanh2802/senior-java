/*
 * App.auth + App.sync — accounts (Supabase) and cloud sync of study progress.
 * CONTRACT FIRST (T31): this file currently exposes the full API with a "not configured" implementation,
 * so views (T33 account page…) can be built against it. The integrator replaces the internals; the
 * public API below must not change. See AGENTS.md section 10.
 */
(function () {
  'use strict';

  const listeners = new Set();
  const syncListeners = new Set();
  const NOT_CONFIGURED = 'Tính năng tài khoản chưa được cấu hình trên server này.';

  const auth = {
    /** true when Supabase is configured (js/config.js). When false, the site works fully offline/local. */
    enabled: false,
    /** Current user or null: { id, email, name, avatar } */
    user: null,
    /** Subscribe to sign-in / sign-out. Returns unsubscribe. fn(user|null) */
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    /** Redirects to Google sign-in. */
    async signInWithGoogle() { throw new Error(NOT_CONFIGURED); },
    /** Sends a magic link to the email. Resolves when sent. */
    async signInWithEmail(email) { throw new Error(NOT_CONFIGURED); },
    async signOut() { throw new Error(NOT_CONFIGURED); },
    /** { display_name, role: 'user'|'admin', ai_daily_limit } */
    async profile() { throw new Error(NOT_CONFIGURED); },
    async updateDisplayName(name) { throw new Error(NOT_CONFIGURED); },
    /** AI usage today: { used, limit, byKind: { grade, review, run, interview } } */
    async usageToday() { throw new Error(NOT_CONFIGURED); },
    /** Permanently deletes the account and all cloud data (server side). Local data is kept unless clearLocal. */
    async deleteAccount(opts) { throw new Error(NOT_CONFIGURED); },
    /** Everything we hold about the user (local + cloud) as a plain object, for "Tải dữ liệu của tôi". */
    async exportData() { return { exportedAt: new Date().toISOString(), local: App.store.data, cloud: null }; },
    /** Access token for /api calls (null when signed out). Used by App.ai. */
    async token() { return null; },
  };

  const sync = {
    /** 'off' (not signed in / not configured) | 'idle' | 'syncing' | 'error' */
    status: 'off',
    lastSyncAt: null,
    lastError: null,
    /** Subscribe to status changes. fn({status, lastSyncAt, lastError}). Returns unsubscribe. */
    onStatus(fn) { syncListeners.add(fn); return () => syncListeners.delete(fn); },
    /** Force a pull + merge + push now. */
    async now() { throw new Error(NOT_CONFIGURED); },
  };

  // internal helpers for the real implementation
  auth._emit = () => listeners.forEach(fn => { try { fn(auth.user); } catch (e) { console.error(e); } });
  sync._emit = () => syncListeners.forEach(fn => { try { fn({ status: sync.status, lastSyncAt: sync.lastSyncAt, lastError: sync.lastError }); } catch (e) { console.error(e); } });

  App.auth = auth;
  App.sync = sync;
})();
