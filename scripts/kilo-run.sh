#!/usr/bin/env bash
# kilo with a model fallback, used by scripts/agent-cli.sh (runner "kilo"):
#   scripts/kilo-run.sh "<title>" "<prompt>"
# Tries each model of $KILO_MODELS in turn; moves on only when the run fails because the free model's usage
# limit is reached, so a normal failure is not retried on another model.
out=$(mktemp)
for m in ${KILO_MODELS:-${KILO_MODEL:-kilo/kilo-auto/free} kilo/nvidia/nemotron-3-ultra-550b-a55b:free kilo/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free}; do
  echo "[kilo-run] model $m"
  kilo run --auto -m "$m" --title "$1" "$2" 2>&1 | tee "$out"
  code=${PIPESTATUS[0]}
  tail -n 5 "$out" | grep -qiE 'usage limit reached|too many requests|rate limit' || { rm -f "$out"; exit "$code"; }
  echo "[kilo-run] $m: free usage limit — falling back"
done
rm -f "$out"; exit 1
