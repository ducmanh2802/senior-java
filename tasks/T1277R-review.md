# T1277R — Fact-check nội dung mới của T1277

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1277 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review 5 block mới (`### Ví dụ đời thực`, `### Trả lời mẫu`, `> Senior tip`) chèn vào `js/data/q-system-design.js` (model T1277 viết, chưa review). Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.

- `architecture-002` (Spring proxy/self-invocation): sửa 2 lỗi kỹ thuật:
  1. `(3) Bật spring.aop.proxy-target-class=true (mặc định)` sai — Spring Boot mặc định là `false` (JDK proxy nếu bean có interface; CGLIB chỉ khi không có interface). Đã sửa lại và tránh final class/method vì proxy có thể không áp dụng.
  2. Đoạn **Điều tra** nói ngược cơ chế: ghi "transaction chính rollback nhưng sendConfirmationEmail đã commit riêng" — không thể xảy ra với self-invocation (REQUIRES_NEW bị bỏ qua, cùng 1 transaction). Đã viết lại: self-invocation bỏ qua proxy → REQUIRES_NEW không áp dụng → cả hai cùng rollback → khách không thấy email xác nhận → retry → tạo trùng đơn/trừ tiền 2 lần; nhất quán với Triệu chứng và Trả lời mẫu.
- `design-013`, `architecture-001/003/004/005`: đã review — cơ chế (SKIP LOCKED, lease, idempotency, advisory lock; SOLID/DIP; Strategy + Map injection theo channel() thay vì bean name; ArchUnit dependency rule; outbox pattern Kafka) đúng Java 17/21 + Spring Boot 3 + Hibernate 6 + PostgreSQL 15 + Kafka 3.x; markup `{{...}}`/`###`/`>` OK, không backtick, không ký tự lạ.

`node scripts/build-light-index.js` → index-light đồng bộ. `node scripts/validate.js js/data/q-system-design.js` → OK — không có lỗi.
