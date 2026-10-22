/*
 * POST /api/status — reports which server features are configured (no secrets). Public, but when the
 * caller sends a passcode or session token it is verified, so the settings dialog can test the passcode.
 * Response: { ok: true, ai, run, accounts, model }
 */
'use strict';

const { send, guard, supabaseConfigured } = require('./_lib');

module.exports = async function handler(req, res) {
  if (!(await guard(req, res, { maxPerMinute: 30, auth: !!(req.headers['x-app-passcode'] || req.headers.authorization) }))) return;
  send(res, 200, {
    ok: true,
    ai: !!process.env.ANTHROPIC_API_KEY,
    run: !!(process.env.JUDGE0_KEY || process.env.JUDGE0_URL),
    accounts: supabaseConfigured(),
    model: process.env.CLAUDE_MODEL || 'claude-opus-5-5',
  });
};
