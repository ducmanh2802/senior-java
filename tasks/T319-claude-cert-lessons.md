# T319 — CCDV-F bài học + bài tập Java tự chấm (3 bài)

Status: DONE
Agent: opencode
Owns: `js/data/lessons-claude.js`
After: T315

Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001`. Thêm 3 bài `lesson-claude-001..003` (track `claude`, order 1..3) vào `js/data/lessons-claude.js`.

Bài tập **không gọi API thật**: mô phỏng cơ chế bằng Java thuần với một "model giả" trả kết quả định sẵn. Chỉ dùng JDK chuẩn, biên dịch được bằng Java 17, test deterministic. Phần `body` phải đúng theo tài liệu https://docs.claude.com: đọc docs trước, không bịa tên field. Khi cần minh hoạ request/response thật thì dùng `~~~json`.

1. **Vòng lặp agent với tool use** (senior, ~40'):
   - `body`: luồng `tool_use` → `tool_result` → lặp; các `stop_reason`; giới hạn số bước; lỗi tool trả về dạng `is_error`.
   - Bài tập: `AgentLoop.run(FakeModel model, Map<String, Function<Map<String, Object>, String>> tools, int maxSteps)` trả về câu trả lời cuối và số bước.
   - Test: gọi đúng tool với đúng input, nối `tool_result` theo đúng `tool_use_id`, dừng ở `end_turn`, dừng khi vượt `maxSteps`, tool ném exception thì trả `is_error` cho model chứ không làm sập vòng lặp.
2. **Retry đúng cách cho 429/529/5xx** (mid, ~30'):
   - `body`: phân loại lỗi nào nên retry; tôn trọng `retry-after`; exponential backoff + full jitter; giới hạn tổng thời gian chờ; không retry lỗi 400/401.
   - Bài tập: `RetryPolicy` với `Random` có seed và `Sleeper` giả (không sleep thật).
   - Test: chuỗi thời gian chờ đúng công thức, ưu tiên `retry-after`, dừng sau N lần, không retry 400.
3. **Ngân sách context + prompt caching** (senior, ~35'):
   - `body`: context window, `max_tokens`, đặt phần tĩnh (system, tools, tài liệu) trước để cache, breakpoint `cache_control`, đọc usage.
   - Bài tập: `ContextBudget.fit(List<Msg> history, int budget, Tokenizer t)` giữ system và các lượt mới nhất, bỏ hoặc tóm tắt lượt cũ, không bao giờ tách cặp `tool_use`/`tool_result`. Kèm hàm `cacheSavings(...)` tính token đọc từ cache.
   - Test ≥ 4 case.

Mỗi bài: `body` ≥ 2500 ký tự, kết thúc bằng `### Liên hệ phỏng vấn`; 2–4 câu `check`; `related` để trống hoặc trỏ tới id `claude-*` **đã tồn tại**.

`node scripts/test-lessons.js` (reference pass 100%, starter không pass hết) và `node scripts/validate.js` → OK. Ghi Notes, `Status: DONE`.

## Notes

- Added lesson-claude-001 (agent loop + tool use, senior, 40'), 002 (retry 429/529/5xx + full jitter, mid, 30'), 003 (context budget + prompt caching, senior, 35') to js/data/lessons-claude.js.
- Small signature change: AgentLoop.run(userPrompt, model, tools, maxSteps) takes the user prompt as its first parameter, so the loop can build the first user message. ContextBudget has effectiveInputTokens(Usage) + cacheSavings(List<Usage>) (write 1.25x, read 0.1x).
- Tests: ref 7/7, 7/7, 8/8; starters compile and get 0 passes (JDK 17, checked by a scratch runner that loads only lessons-claude.js). node --check OK.
- `node scripts/validate.js` → OK (no errors; only PATH warnings). `node --check` OK. Custom runner: all reference solutions pass 100%, starters compile and fail all tests (JDK 17).
- related: claude-001/002, claude-004/005, claude-006/007. These lessons are not in path.js yet (warning only); the integrator can add them.
Reviewed-by: claude (subagent; test-lessons 3/3 pass, validate OK)
