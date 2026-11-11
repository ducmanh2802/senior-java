#!/usr/bin/env bash
# Start (or resume) the task pipeline, e.g. after a reboot. Safe to run twice: it only starts what is missing.
#   bash scripts/pipeline-start.sh            # autopilot + 4 kilo + 1 qoder over every open TODO task
#   KILO=2 QODER=0 bash scripts/pipeline-start.sh
cd "$(dirname "$0")/.." || exit 1
KILO=${KILO:-4}; QODER=${QODER:-1}

# workers that died left claims behind: free them first (doctor treats every claim as stale when no worker runs)
if ! ps -ef | grep -q '[w]orker.sh'; then node scripts/pipeline-doctor.js --fix --quiet; fi

if ! ps -ef | grep -q '[a]utopilot.sh'; then
  REVIEWER=${REVIEWER:-kilo} EVERY=${EVERY:-120} PARALLEL=${PARALLEL:-4} nohup scripts/autopilot.sh >> logs-runner.txt 2>&1 &
  echo "started autopilot"
fi

if ps -ef | grep -q '[w]orker.sh'; then
  echo "workers already running: $(ps -ef | grep -c '[w]orker.sh') processes (not starting more)"
else
  ONLY=$(grep -l '^Status: TODO' tasks/T*.md | xargs -n1 basename | cut -d- -f1 | grep -v 'R$' | sort -V | tr '\n' ' ')
  [ -z "$ONLY" ] && { echo "no TODO tasks"; exit 0; }
  for i in $(seq 1 "$KILO"); do ONLY="$ONLY" BACKOFF=900 nohup scripts/worker.sh kilo >> logs-runner.txt 2>&1 & sleep 2; done
  for i in $(seq 1 "$QODER"); do ONLY="$ONLY" BACKOFF=900 nohup scripts/worker.sh qoder >> logs-runner.txt 2>&1 & sleep 2; done
  echo "started $KILO kilo + $QODER qoder workers on $(echo $ONLY | wc -w) TODO tasks"
fi
node scripts/pipeline-doctor.js
