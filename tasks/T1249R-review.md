# T1249R — Fact-check nội dung mới của T1249

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1249 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã fact-check toàn bộ phần mới (`### Ví dụ đời thực`) thêm vào `claude-001`…`claude-006` (diff HEAD vs working tree của `js/data/q-claude.js`).
- **claude-001**: giữ nguyên, kịch bản stateless/history overwrite kỹ thuật đúng (input_tokens giảm khi mất history, prompt caching bù chi phí) — số liệu minh hoạ hợp lý.
- **claude-002**: sửa lỗi markup + kỹ thuật code mẫu. Bản gốc dùng `{{if (stopReason == "max_tokens") retryWithLargerBudget();}}` (so sánh chuỗi bằng `==` trong Java sai ngữ nghĩa; inline code có `{ }` lồng nhau → validator báo `inline code … chứa dấu { } lồng nhau — sẽ hiển thị sai`). Đổi thành diễn giải an toàn (kiểm tra `stopReason` là `max_tokens` rồi retry) và bỏ ví dụ JSON cụt có ngoặc kép/ngoặc nhọn gây rủi ro render. Cơ chế max_tokens/truncated output đúng.
- **claude-003**: sửa ví dụ SSE/Spring MVC không chính xác. Bản gốc dùng `emitter.send(event.text(), MediaType.TEXT_EVENT_STREAM)` (không đúng chữ ký chuẩn `SseEmitter#send`); đổi thành `emitter.send(SseEmitter.event().data(text))`. Thêm giải thích TTFT (time to first token). Cơ chế Nginx buffering/X-Accel-Buffering đúng.
- **claude-004**: sửa câu tiếng Anh lẫn ("thousands of clients", "429 rate") → tiếng Việt; làm rõ retry chồng tầng (SDK + app) gây bội số request thay vì khẳng định số lần cố định dễ hiểu nhầm; giải thích "thundering herd". Cơ chế 429/retry-after, exponential backoff+jitter, circuit breaker đúng.
- **claude-005**: giữ nguyên nội dung kỹ thuật (ITPM/RPM/OTPM, token bucket Redis, batch/caching) — kịch bản và số liệu minh hoạ hợp lý, không bịa API.
- **claude-006**: giữ nguyên (cache prefix byte-for-byte, timestamp trong system prompt làm vỡ cache, kiểm tra usage cache_read/cache_creation) — đúng kỹ thuật.
- Kiểm tra markup/safety: không có backtick, không có `${` chưa escape trong phần mới; `node --check js/data/q-claude.js` OK.
- Lỗi `claude-002.a` inline code lồng `{ }` do validator báo đã được khắc phục.
- `node scripts/build-light-index.js` hiện **fail** do lỗi cú pháp có sẵn ở file khác không thuộc quyền sở hữu: `js/data/lessons-ai.js:378` (`ReferenceError: PHONE_1 is not defined`). Không sửa vì ngoài phạm vi task (rule 3).
- `node scripts/validate.js` trên toàn repo hiện **không đạt OK** vì các lỗi có sẵn ngoài `q-claude.js` (ví dụ `lessons-ai.js` cú pháp/chạy, `projects.js`/`path.js` ref `lesson-ai-*` không tồn tại, `index-light.js` cũ). **Không còn lỗi nào do validator báo cho `q-claude.js`** sau khi sửa claude-002. Cần integrator xử lý các lỗi repo-wide để validator toàn cục OK.
