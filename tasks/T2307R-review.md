# T2307R — Fact-check nội dung mới của T2307

Status: DONE
Agent: opencode
Owns: `js/data/lessons-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2307 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Đã review kỹ 2 bài MỚI của T2307 trong `js/data/lessons-claude.js` (`lesson-claude-012`, `lesson-claude-013`):
  - `lesson-claude-012` (stream SSE của Messages API): thứ tự event `message_start` → `content_block_start/delta/stop` → `message_delta` (stop_reason + usage) → `message_stop`, ghép `text_delta`/`input_json_delta`, bỏ qua `ping`/comment, `max_tokens` khác `end_turn` — đều đúng với tài liệu Messages API của Anthropic. Không có lỗi kỹ thuật.
  - `lesson-claude-013` (structured output + validate phía client): JSON Schema subset (type/required/enum/additionalProperties), validate bằng `containsKey` chứ không phải `get==null`, thứ tự lỗi deterministic bằng `TreeSet`, retry giới hạn `maxRetries` (tổng gọi = maxRetries+1), không chạy `tool_use` khi `stop_reason = max_tokens` — đều đúng. Không có lỗi kỹ thuật.
- Không có lỗi markup: không có backtick lạc trong template literal, không có `${`, `{{code}}` và `~~~` block hợp lệ, không lẫn chữ nước ngoài không phải thuật ngữ.
- Kiểm tra:
  - `node --check js/data/lessons-claude.js` → OK.
  - `node scripts/test-lessons.js lesson-claude-012` → reference 6/6 PASS.
  - `node scripts/test-lessons.js lesson-claude-013` → reference 9/9 PASS.
  - `node scripts/build-light-index.js` → ghi lại `js/data/index-light.js`.
  - `node scripts/validate.js` → bài học `lessons-claude.js` không còn lỗi/cảnh báo nào (lỗi `index-light.js` cũ đã được tạo lại).
- Còn 2 lỗi validate thuộc file KHÁC (không thuộc task này, đang do task khác làm dở nên không sửa theo luật 3): `sdlc.js` lỗi cú pháp `missing ) after argument list`; `quiz-spring.js` báo `qz-spring-054..065` thiếu/trùng id. Đề nghị integrator xử lý trước khi commit.
