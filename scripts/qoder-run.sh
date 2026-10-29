#!/usr/bin/env bash
# qodercli with a model fallback, used by scripts/agent-cli.sh (runner "qoder"):
#   scripts/qoder-run.sh "<prompt>"
# Tries each model of $QODER_MODELS in turn; moves on only when the run fails with a credits/quota error
# (plan credits used up), so a normal failure is not retried on another model. The list starts with the
# strong model and ends with the cheap/free tiers. File edits + node scripts only (the auto-mode
# classifier blocks --dangerously-skip-permissions); stream-json keeps the log growing for the stall check.
out=$(mktemp)
for m in ${QODER_MODELS:-Kimi-K3.1-Pro Efficient Fast}; do
  echo "[qoder-run] model $m"
  qodercli -p -m "$m" -o stream-json --permission-mode accept_edits --allowed-tools 'Bash(node scripts/*)' -w "$PWD" -- "$1" 2>&1 | tee "$out"
  code=${PIPESTATUS[0]}
  # only the final lines (error/result event), not the translated text, which may itself mention credits
  { [ "$code" != 0 ] || tail -n 3 "$out" | grep -q '"is_error":true'; } &&
    tail -n 3 "$out" | grep -qiE 'quota|credits?|insufficient|exceeded your|payment required|\b402\b' || { rm -f "$out"; exit "$code"; }
  echo "[qoder-run] $m: out of credits/quota — falling back"
done
rm -f "$out"; exit 1
