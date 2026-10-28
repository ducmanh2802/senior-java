#!/usr/bin/env bash
# Release gate: agents and autopilot commit to branch `content` (Vercel builds a Preview deploy for it);
# production (`main`) only changes when a human merges content → main on GitHub.
#   scripts/release.sh          -> prepend a dated section to CHANGELOG.md from commits not yet in main,
#                                  commit + push it to content, print the GitHub compare/PR link
#   scripts/release.sh --dry    -> only print the section
# After checking the Preview deploy, open the link, create the PR and merge it with "Create a merge commit"
# (not squash: squash makes the next PR show the same commits again).
cd "$(dirname "$0")/.."
set -e
git fetch -q origin
range="origin/main..origin/content"
[ "$(git rev-parse --abbrev-ref HEAD)" = content ] || { echo "run on branch content"; exit 1; }
n=$(git rev-list --count --no-merges "$range")
[ "$n" -gt 0 ] || { echo "Nothing to release: content == main"; exit 0; }

section="## $(date +%F)

### Nội dung
$(git log --no-merges --format='- %s' "$range" | grep -E '^- Content' | sed 's/^- Content: /- /' || true)

### Ứng dụng
$(git log --no-merges --format='- %s' "$range" | grep -vE '^- (Content|Release)' || true)
"
if [ "${1:-}" = --dry ]; then echo "$section"; exit 0; fi

# never race autopilot's staging
for _ in $(seq 1 30); do git diff --cached --quiet && break; sleep 10; done
{ echo "# Changelog"; echo; echo "$section"; [ -f CHANGELOG.md ] && sed '1{/^# Changelog$/d}' CHANGELOG.md; } > CHANGELOG.md.tmp
mv -f CHANGELOG.md.tmp CHANGELOG.md
git add CHANGELOG.md
git commit -q -m "Release notes $(date +%F) ($n commits)" -- CHANGELOG.md
git push -q
echo "CHANGELOG.md updated ($n commits). Open, check the Preview deploy, then create + merge the PR:"
echo "  https://github.com/ducmanh2802/senior-java/compare/main...content?expand=1"
