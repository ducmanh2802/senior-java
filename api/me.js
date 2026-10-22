/*
 * DELETE /api/me — permanently delete the signed-in user's account.
 * Removes the auth user via the Supabase Admin API; profiles, user_state and ai_usage rows go with it
 * (on delete cascade in supabase/schema.sql). Requires "Authorization: Bearer <session access token>".
 */
'use strict';

const { send, guard, supabase, supabaseConfigured } = require('./_lib');

module.exports = async function handler(req, res) {
  if (!supabaseConfigured()) return send(res, 503, { error: 'Server chưa cấu hình tài khoản', code: 'not_configured' });
  const ctx = await guard(req, res, { maxPerMinute: 5, method: 'DELETE' });
  if (!ctx) return;
  if (!ctx.user) return send(res, 401, { error: 'Cần đăng nhập để xoá tài khoản', code: 'no_auth' });
  try {
    const r = await supabase('/auth/v1/admin/users/' + encodeURIComponent(ctx.user.id), { method: 'DELETE' });
    if (!r.ok) {
      console.error('delete user', r.status, await r.text().catch(() => ''));
      return send(res, 502, { error: 'Xoá tài khoản thất bại, thử lại sau' });
    }
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error(e);
    return send(res, 502, { error: 'Không kết nối được máy chủ tài khoản' });
  }
};
