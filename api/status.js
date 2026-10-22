/*
 * POST /api/status — verifies the passcode and reports which server features are configured.
 * Response: { ok: true, ai: boolean, run: boolean, model }
 */
'use strict';

const { send, guard } = require('./_lib');

module.exports = async function handler(req, res) {
  if (!guard(req, res, { maxPerMinute: 30 })) return;
  send(res, 200, {
    ok: true,
    ai: !!process.env.ANTHROPIC_API_KEY,
    run: !!(process.env.JUDGE0_KEY || process.env.JUDGE0_URL),
    model: process.env.CLAUDE_MODEL || 'claude-opus-5-5',
  });
};
