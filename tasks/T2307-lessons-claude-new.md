# T2307 — 2 bài học Claude mới (bài tập Java tự chấm): đọc stream SSE, structured output + validate

Status: DONE
Agent: kilo
Owns: `js/data/lessons-claude.js`
After: T2233

Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001`; đọc lướt các bài lesson-claude-* có sẵn để không trùng (đã có agent loop, retry, context budget, tool schema, MCP, permissions).
Thêm 2 bài (id `lesson-claude-NNN` tiếp số lớn nhất, order tiếp theo):
1. **Đọc streaming SSE của Messages API**: event message_start, content_block_start/delta/stop, message_delta (stop_reason, usage), message_stop; ghép text_delta, input_json_delta cho tool_use. Bài tập: viết `SseAccumulator` nhận các dòng `event:`/`data:` (JSON đã parse sẵn thành Map đơn giản hoặc chuỗi) và dựng lại message cuối; test ≥ 4 case (text, tool_use JSON ghép từ nhiều mảnh, stop_reason max_tokens, dòng ping bỏ qua).
2. **Structured output và validate phía client**: yêu cầu JSON theo schema, kiểm tra field bắt buộc/kiểu/enum, xử lý output sai (retry có giới hạn, không thực thi tool_use bị cắt khi stop_reason=max_tokens). Bài tập: `OutputValidator` + `RetryOnInvalid`; test ≥ 4 case.
Code chỉ JDK chuẩn, Java 17, không class public ngoài Main, không gọi mạng (mô phỏng).

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Đếm id trước/sau trong Notes (phải tăng đúng số đã thêm) — lần trước có task ghi đã thêm mà file không đổi.

## Nghiệm thu
`node --check js/data/lessons-claude.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

- Đã thêm 2 bài vào `js/data/lessons-claude.js`:
  - `lesson-claude-012` (order 12): đọc streaming SSE của Messages API — event `message_start`, `content_block_start/delta/stop`, `message_delta` (stop_reason, usage), `message_stop`; ghép `text_delta` và `input_json_delta`; bỏ qua `ping`/comment. Bài tập `SseAccumulator` (6 test: text nhiều delta, tool_use JSON ghép nhiều mảnh, `max_tokens` khác `end_turn`, bỏ qua ping/comment, lỗi parse JSON có index, `getResult` trước `message_stop`).
  - `lesson-claude-013` (order 13): structured output + validate phía client — required/type/enum/additionalProperties, retry có giới hạn + backoff, không chạy `tool_use` khi `stop_reason=max_tokens`. Bài tập `OutputValidator` + `RetryOnInvalid` (9 test: hợp lệ, thiếu required, sai type, enum, field lạ, thứ tự lỗi deterministic, retry thành công, retry hết lượt, supplier ném exception).
- Id trước: `lesson-claude-001`..`011` (11 bài). Sau: `001`..`013` (13 bài), tăng đúng 2.
- Đã sửa các lỗi biên dịch còn sót từ lần chạy trước (reference của bài 012 dùng `Message.Builder`, sealed interface bị vi phạm, regex/escape JSON sai; bài 013 escape parser JSON sai và kỳ vọng số attempt không nhất quán). Không sửa file/task của người khác.
- Kiểm tra:
  - `node --check js/data/lessons-claude.js` → OK.
  - `node scripts/test-lessons.js lesson-claude-012` → reference 6/6 pass, starter không pass.
  - `node scripts/test-lessons.js lesson-claude-013` → reference 9/9 pass, starter không pass.
  - `node scripts/build-light-index.js` → ghi `js/data/index-light.js` OK.
  - `node scripts/validate.js` → **không còn lỗi ở `lessons-claude.js`**. Validate vẫn báo 2 lỗi ở file không thuộc task này (đang do task khác làm dở): `sdlc.js` lỗi cú pháp `missing ) after argument list`, `labs-thread.js` có id `lab-thread-007/008` sai dạng. Theo luật 3, không tự sửa; đề xuất integrator/task chủ sở hữu xử lý trước khi commit.
Reviewed-by: kilo (T2307R)
