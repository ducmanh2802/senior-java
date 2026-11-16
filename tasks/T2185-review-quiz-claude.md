# T2185 — Rà soát chất lượng các câu tag [Claude Code] và [Eval] (đề CCDV-F) + thêm 10 câu mới cho mỗi domain này vì đang quá ít (6 và 4 câu) trong quiz-claude.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-claude.js`
After: T322

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu tag [Claude Code] và [Eval] (đề CCDV-F) + thêm 10 câu mới cho mỗi domain này vì đang quá ít (6 và 4 câu) (`node scripts/qtool.js list js/data/quiz-claude.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng theo tài liệu chính thức Anthropic (docs.claude.com, code.claude.com/docs, modelcontextprotocol.io) — không có tính năng/tham số/tên model bịa; câu 1 đáp án không có 2 phương án cùng đúng; multi có (Choose N) khớp; explain giải thích đúng + từng phương án sai; tag [Domain] đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-claude.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Đã rà soát toàn bộ câu tag [Claude Code] (6) và [Eval] (4) trong `js/data/quiz-claude.js`, sửa 3 câu quá mỏng, giữ nguyên 7 câu đã chính xác, và thêm 10 câu mới mỗi domain (id 201–210 [Claude Code], 211–220 [Eval]). Tổng id: 220 (không xoá, không đổi id). Đã đối chiếu tài liệu chính thức: code.claude.com/docs (hooks, cli-reference, headless, memory, permission-modes, permissions, sub-agents, skills), platform.claude.com/docs (develop-tests), modelcontextprotocol.io.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-claude-058 | Câu hỏi & đáp án quá mỏng (1 dòng), 3/4 option vô nghĩa, không giải thích vì sao các phương án sai | Viết lại câu hỏi theo tình huống thật (đặt quy tắc "mvn verify trước commit" ở đâu); explain chi tiết cơ chế nạp CLAUDE.md (managed → user → project → local, nối vào context), @import tối đa 4 cấp, AGENTS.md thay thế được; nêu rõ README/.env/commit message sai vì sao; nhắc CLAUDE.md là context không phải cưỡng chế |
| qz-claude-059 | Đáp án đúng nhưng explain 1 dòng; thiếu khái niệm deny→ask→allow, permission mode, --bare, least privilege | Viết lại explain: least privilege, thứ tự deny→ask→allow, deny hiệu lực mọi mode kể cả bypassPermissions; các mode default/acceptEdits/plan/dontAsk/bypassPermissions; --bare cho script; vì sao --dangerously-skip-permissions/root/chia sẻ session sai |
| qz-claude-060 | Câu hỏi chung chung "phương pháp nào phù hợp", explain 1 dòng | Viết lại thành tình huống đổi model cần so sánh khách quan; explain nêu success criteria (specific/measurable/achievable/relevant), test case phản ánh phân phối thật + edge case, chấm tự động (exact match/LLM judge), regression tracking, pass@k/pass^k |
| qz-claude-127 | (rà soát) | Đúng: nhiều PreToolUse hook khớp → gộp theo deny > defer > ask > allow; exit 2 chặn + stderr là phản hồi; allow không vượt deny rule. Giữ nguyên |
| qz-claude-128 | (rà soát) | Đúng: --bare bỏ hooks/MCP/CLAUDE.md tự nạp; --allowedTools dùng cú pháp permission rule; dấu cách trước * trong Bash(git diff *) là bắt buộc (git diff* khớp cả git diff-index); --dangerously-skip-permissions chỉ dùng container cô lập; -p không thay cấu hình quyền. Giữ nguyên |
| qz-claude-129 | (rà soát) | Đúng: 3 nguyên tắc eval design (task-specific / automate when possible / prioritize volume over quality), có edge case. Giữ nguyên |
| qz-claude-130 | (rà soát) | Đúng: rubric chi tiết, output cụ thể (correct/incorrect hoặc 1–5), encourage reasoning (thinking), "test reliability first then scale". Giữ nguyên |
| qz-claude-198 | (rà soát) | Đúng: --output-format json + --json-schema → đọc structured_output, kiểm tra tồn tại vì có thể thiếu khi Claude từ chối; invalid schema → lỗi "--json-schema is not a valid JSON Schema". Giữ nguyên |
| qz-claude-199 | (rà soát) | Đúng: exit 0 = không phản đối (vẫn qua permission flow), exit 2 = chặn, code khác = lỗi không chặn; muốn allow phải in JSON permissionDecision "allow". Giữ nguyên |
| qz-claude-200 | (rà soát) | Đúng: success criteria Specific/Measurable/Achievable/Relevant; ví dụ <0,1%/10.000 bị gắn cờ và F1 ≥ 0,85 trên held-out 10.000. Giữ nguyên |
| qz-claude-201 (mới, multi) | — | [Claude Code] Thứ tự nạp CLAUDE.md (managed→user→project→local, nối vào context) + @import tối đa 4 cấp; loại 2 phương án sai (CLAUDE.md không cưỡng chế; ~/.claude/CLAUDE.md không commit) |
| qz-claude-202 (mới) | — | [Claude Code] acceptEdits tự duyệt edit + lệnh filesystem trong working dir, Bash khác vẫn hỏi; phân biệt default/plan/bypassPermissions |
| qz-claude-203 (mới) | — | [Claude Code] plan mode: đọc + lập plan, không sửa file nguồn; nêu caveat phiên interactive có bypass |
| qz-claude-204 (mới) | — | [Claude Code] subagent có context window riêng, chỉ trả tóm tắt; không làm tăng context chính |
| qz-claude-205 (mới) | — | [Claude Code] skill SKILL.md + YAML frontmatter (name/description), progressive disclosure, gọi /review-pr; phân biệt với MCP/hook/subagent |
| qz-claude-206 (mới) | — | [Claude Code] .mcp.json project scope commit qua git; phân biệt ~/.claude.json, settings.local.json |
| qz-claude-207 (mới) | — | [Claude Code] stream-json + --verbose để đọc từng sự kiện; json trả 1 object cuối; text mặc định |
| qz-claude-208 (mới) | — | [Claude Code] --continue/-c (phiên gần nhất), --resume/-r (theo ID/tên), --fork-session |
| qz-claude-209 (mới) | — | [Claude Code] --add-dir / /add-dir + permissions.additionalDirectories; CLAUDE.md không cấp quyền đọc/ghi |
| qz-claude-210 (mới) | — | [Claude Code] quy tắc cứng dùng deny rule / hook PreToolUse deny (hiệu lực mọi mode), vì CLAUDE.md/README/prompt chỉ là context |
| qz-claude-211 (mới) | — | [Eval] code grader trước → LLM judge cho phần mở → người chấm hiệu chỉnh; dùng model khác làm judge |
| qz-claude-212 (mới) | — | [Eval] pass@k (có ≥1 lần đúng) vs pass^k (mọi lần đều đúng); BLEU/perplexity sai ngữ cảnh |
| qz-claude-213 (mới) | — | [Eval] chấm outcome không chấm đường đi; kiểm tra ràng buộc tác dụng phụ riêng |
| qz-claude-214 (mới, multi) | — | [Eval] chạy nhiều lần + báo cáo pass@k/pass^k; xem danh sách case lỗi thay vì chỉ trung bình; cần held-out |
| qz-claude-215 (mới) | — | [Eval] success criteria đa chiều (quality/latency/cost…) mỗi chiều có ngưỡng đo được |
| qz-claude-216 (mới, multi) | — | [Eval] edge case: rỗng/quá dài/mơ hồ/không liên quan + input độc hại; không chỉ input đẹp |
| qz-claude-217 (mới) | — | [Eval] bắt đầu 20–50 task từ lỗi thật; mỗi lỗi production thành case; task-specific |
| qz-claude-218 (mới) | — | [Eval] "test reliability first then scale"; so với người chấm trên mẫu, model khác, bật thinking; tránh self-preference |
| qz-claude-219 (mới, multi) | — | [Eval] rubric chi tiết + output cụ thể (correct/incorrect hoặc 1–5) + cho judge suy luận trước |
| qz-claude-220 (mới) | — | [Eval] held-out tránh overfitting, điểm gần thực tế; bác "chạy nhanh hơn"/"không cần chấm"/"buộc 10.000 case" |

Kiểm tra: `node --check js/data/quiz-claude.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → "OK — không có lỗi." (claude: 561 trắc nghiệm). Không commit.
