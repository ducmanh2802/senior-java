#!/usr/bin/env bash
# Run one task with a specific agent CLI (same prompt and rules as run-agents.sh).
#   scripts/agent-cli.sh T83 kilo     -> Kilo Code CLI, model kilo/kilo-auto/free (free router)
#   scripts/agent-cli.sh T82 codex    -> OpenAI Codex CLI (uses the ChatGPT login on this machine)
#   scripts/agent-cli.sh T58 gemini   -> Gemini CLI (Gemini API key in ~/.gemini)
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
echo "[$(date +%T)] start $id ($runner) backup=$bak"
case "$runner" in
  kilo)   kilo run --auto -m "${KILO_MODEL:-kilo/kilo-auto/free}" --title "$id" "$prompt" > "logs/$id.log" 2>&1 ;;
  codex)  codex exec --full-auto --skip-git-repo-check "$prompt" > "logs/$id.log" 2>&1 ;;
  gemini) GEMINI_CLI_TRUST_WORKSPACE=true gemini -y -p "$prompt" > "logs/$id.log" 2>&1 ;;
  *) echo "unknown runner $runner"; exit 1 ;;
esac
echo "[$(date +%T)] end   $id exit=$? ($runner)"
