# T2310R — Fact-check nội dung mới của T2310

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2310 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff T2310 (claude-043 → claude-048, thêm mới trong `js/data/q-claude.js`).
- **claude-044**: thay `@EnableVirtualThreads` (annotation không tồn tại trong Spring Boot) bằng cấu hình đúng `spring.threads.virtual.enabled=true` trong ví dụ và phần "Cách xử lý" (Spring Boot 3.2+).
- Kiểm tra: không có backtick trong template literal, không có `${` chưa escape, không bịa API/flag rõ ràng khác, markup hợp lệ, nội dung kỹ thuật phù hợp (timeout/retry/circuit breaker/idempotency, SSE/WebFlux/virtual threads, prompt caching/Batch/cost, prompt injection defense, eval/regression, AI platform).
- `node --check js/data/q-claude.js` OK. Đã chạy `node scripts/build-light-index.js`.
- `node scripts/validate.js`: không báo lỗi nào thuộc `js/data/q-claude.js`; còn lỗi cú pháp pre-existing ngoài phạm vi sở hữu tại `sdlc.js` (`missing ) after argument list`) nên validator chưa in "OK — không có lỗi" toàn cục. Không sửa file không thuộc quyền sở hữu (luật 3).
