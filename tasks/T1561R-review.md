# T1561R — Fact-check nội dung mới của T1561

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1561 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Diff `HEAD -- js/data/sd-problems.js`: nội dung mới `sd-033`, `sd-034` (không sửa phần đã có ở HEAD).
- `sd-033` (Requirements): sửa lỗi gõ/cú pháp trong out-of-scope `bulk payment,AML batch` → `bulk payment, AML batch`.
- `sd-034` (Trả lời mẫu khi phỏng vấn): sửa chữ nước ngoài/lỗi gõ cuối câu `bị một job chặn het` → `bị một job chặn hết`.
- Fact-check kỹ thuật `sd-033`/`sd-034`: không thấy API/flag bịa, mặc định sai hay cơ chế nói ngược; các ý chính (PostgreSQL `FOR UPDATE SKIP LOCKED`, outbox, idempotency at-least-once, `java.time.ZonedDateTime`/ZoneRules cho cron/DST, token bucket/backpressure, Kafka key theo target) phù hợp.
- `node --check js/data/sd-problems.js` OK. `node scripts/validate.js` → OK. Không chạy `test-lessons.js` (task không sở hữu/sửa bài học).
- Lưu ý tồn kho (không thuộc diff T1561, không chỉnh): `sd-001` đang bị trùng id trong file.
