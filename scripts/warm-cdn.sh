#!/usr/bin/env bash
# Warm jsDelivr for the commit just pushed (HEAD; stamp-data-sha.sh pins it at the next push): the first requests for a brand-new commit can get
# 403 while jsDelivr fetches it from GitHub (seen 2026-11-24 on index-light.js). Fetches every js/data + js/i18n
# file once on both hostnames, 8 at a time, retrying a failure up to 5 times. Run in the background by autopilot.
cd "$(dirname "$0")/.." || exit 1
sha=${1:-$(git rev-parse HEAD)}   # default: the commit just pushed (pinned by the NEXT push)
[ -n "$sha" ] || exit 1
fetch() {
  local h u i
  for h in cdn.jsdelivr.net fastly.jsdelivr.net; do
    u="https://$h/gh/ducmanh2802/senior-java@$1/$2"
    for i in 1 2 3 4 5; do [ "$(curl -s -o /dev/null -w '%{http_code}' "$u")" = 200 ] && break; sleep 10; done
  done
}
export -f fetch
git ls-tree -r --name-only "$sha" -- js/data js/i18n | grep '\.js$' | xargs -P 8 -I{} bash -c "fetch $sha {}"
echo "[$(date +%T)] warm-cdn: done for ${sha:0:8}"
