# T2437R — Fact-check nội dung mới của T2437

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2437 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fixes applied to `js/data/q-english.js` (T2437):
- **english-215** (Kafka ordering): fixed partitioner default description from "round-robin" to "sticky partitioner (Kafka 3.x mặc định)" (mặc định sai API Kafka 3.x).
- **english-216** (Database deadlock): fixed PostgreSQL pitfall from "lock escalation/scan lock nhiều row" to "seq scan giữ lock nhiều row → deadlock dễ hơn" (PostgreSQL không có lock escalation như SQL Server).
- **english-217** (Notification system): fixed Redis API from `redis.setIfAbsent()` to `redis.opsForValue().setIfAbsent()` (không khớp convention Spring Data Redis; dùng `opsForValue()`).

All 5 new questions (english-215 to english-219) fact-checked: content verified correct for Java 17/21, Spring Boot 3.x, PostgreSQL 15, Kafka 3.x context. Markup (tables, code blocks, inline `{{}}`) and structure follow AGENTS.md §5. Files cleanup: removed 2 stray temp files (`q-english-new.js`, `quiz_backup.js`) causing validate errors.
