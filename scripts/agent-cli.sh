#!/usr/bin/env bash
# Run one task with a specific agent CLI (same prompt and rules as run-agents.sh).
#   scripts/agent-cli.sh T83 kilo     -> Kilo Code CLI, model kilo/kilo-auto/free (free router)
#   scripts/agent-cli.sh T82 codex    -> OpenAI Codex CLI (uses the ChatGPT login on this machine)
#   scripts/agent-cli.sh T58 gemini   -> Gemini CLI (Gemini API key in ~/.gemini)
#   scripts/agent-cli.sh T90 agy      -> Antigravity CLI (Google login; AGY_MODEL, see: agy models)
# Log: logs/<task>.log; start/end lines on stdout (append to logs-runner.txt).
set -u
cd "$(dirname "$0")/.."
id="$1"; runner="${2:-kilo}"
file=$(ls tasks/"$id"-*.md 2>/dev/null | head -1)
[ -n "$file" ] || { echo "no task file for $id"; exit 1; }
prompt="Bạn là agent thực hiện task $id của dự án này. Trước tiên hãy đọc kỹ AGENTS.md và $file. \
Sau đó thực hiện ĐẦY ĐỦ task: chỉ sửa các file mà task sở hữu, chạy 'node scripts/validate.js' tới khi OK, \
không git commit, và cuối cùng cập nhật Status: DONE kèm ghi chú vào $file. Làm việc tự động đến khi xong, không hỏi lại. Nếu file của bạn đã có nội dung từ lần chạy trước bị gián đoạn: đọc lại, giữ phần tốt, sửa lỗi cú pháp và làm tiếp phần còn thiếu. Tuân thủ tuyệt đối luật 8-9 trong AGENTS.md: không kill tiến trình theo tên, không mở trình duyệt, không npm install."
# back up the files this task owns: a dying free model can leave them half-written or garbled
bak="logs/backup/$id-$(date +%Y%m%d-%H%M%S)"; mkdir -p "$bak"
for f in $(grep -m1 '^Owns:' "$file" | grep -o '`[^`]*`' | tr -d '`'); do [ -f "$f" ] && cp "$f" "$bak/"; done
# Free models sometimes hang silently (process alive, no output). Run the agent in the background and stop it BY PID
# when logs/<id>.log has not changed for $STALL seconds; the caller then sees the task still TODO and retries later.
run_agent() {
  "$@" > "logs/$id.log" 2>&1 &
  local pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    sleep 30
    if [ $(( $(date +%s) - $(date -r "logs/$id.log" +%s) )) -gt "${STALL:-900}" ]; then
      echo "[$(date +%T)] stalled $id — no output for ${STALL:-900}s, stopping its process"
      taskkill //PID "$(cat /proc/$pid/winpid 2>/dev/null)" //T //F > /dev/null 2>&1 || kill "$pid" 2>/dev/null
      break
    fi
  done
  wait "$pid"
}
echo "[$(date +%T)] start $id ($runner) backup=$bak"
case "$runner" in
  kilo)   run_agent kilo run --auto -m "${KILO_MODEL:-kilo/kilo-auto/free}" --title "$id" "$prompt" ;;
  opencode) run_agent opencode run -m "${OPENCODE_MODEL:-opencode/deepseek-v4.1-flash-free}" --title "$id" "$prompt" ;;
  codex)  run_agent codex ${CODEX_ARGS:-} exec -s workspace-write --skip-git-repo-check "$prompt" ;;
  gemini) run_agent env GEMINI_CLI_TRUST_WORKSPACE=true gemini -y -p "$prompt" ;;
  agy)    run_agent /c/Users/Windows/AppData/Local/Microsoft/WinGet/Links/agy.exe --print-timeout 0 --model "${AGY_MODEL:-claude-opus-4-6-thinking}" -p "$prompt" ;;   # shell commands limited to the allowlist in ~/.gemini/antigravity-cli/settings.json
  *) echo "unknown runner $runner"; exit 1 ;;
esac
code=$?
# agents often write "Status: DONE — notes…"; autopilot needs the bare line
sed -i 's/^Status: DONE[ —:-].*$/Status: DONE/' "$file"
echo "[$(date +%T)] end   $id exit=$code ($runner)"
