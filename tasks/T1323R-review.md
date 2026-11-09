# T1323R — Fact-check nội dung mới của T1323

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1323 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Chỉ sửa `js/data/q-sql.js` (nội dung mới so với HEAD, chỉ `sql-038`). Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
- Kiểm tra kỹ thuật (PG 15): isolation levels/phantom read với MVCC, `FOR UPDATE/SKIP LOCKED/NOWAIT`, deadlock detection + SQLSTATE `40P01`, serialization failure `40001` (SSI), idempotency key UNIQUE, outbox at-least-once — **không phát hiện API/flag bịa hay cơ chế nói ngược** trong phần mới. Không có backtick/`${` vi phạm template literal.

### Lỗi đã sửa (theo id)
- **sql-038 — `### Ví dụ đời thực` (phần mới T1323):**
  - **Triệu chứng/số liệu mâu thuẫn, dễ hiểu sai bản chất:** kịch bản gốc mô tả "trừ hai lần, người nhận chỉ nhận một lần" nhưng lại giải thích bằng lost update ở mức `READ COMMITTED` dẫn tới ghi đè cùng balance (thực tế là *thiếu* trừ, không phải trừ đôi); đồng thời lẫn thông điệp lỗi `could not serialize access due to concurrent update` (thường gắn serialization `40001`) với kịch bản lost update ở `READ COMMITTED`. Đã viết lại kịch bản nhất quán: 2 lệnh chuyển đồng thời cùng đọc 10tr ở `READ COMMITTED` → chỉ trừ 5tr (lost update), và tách riêng ca trùng do retry thiếu idempotency key; chỉ ra SQLSTATE `40P01` cho deadlock, nêu `40001` đúng ngữ cảnh retry khi dùng `SERIALIZABLE`.
  - **Nguyên nhân/cách xử lý thiếu chi tiết, mơ hồ:** cụm "cùng tài khoản luôn được khóa theo thứ tự id tăng dần, deadlock giữa các giao dịch chuyển tiền giữa hai tài khoản được giảm thiểu" dễ hiểu nhầm (khóa 1 dòng không cắt vòng A↔B). Đã làm rõ: read-modify-write, khóa **cả hai** tài khoản theo `id` tăng dần (`ORDER BY id FOR UPDATE`) trong cùng transaction để cắt vòng; bổ sung bảng idempotency key + header, retry backoff cho `40P01/40001` khi idempotent, outbox trong cùng transaction.
  - **Giải thích thuật ngữ cho độc giả ít kinh nghiệm:** thêm giải thích ngắn lost update (mất cập nhật/ghi đè dữ liệu cũ) và bối cảnh stack (PostgreSQL 15, Spring Boot 3.x).
- **sql-038 — `### Trả lời mẫu khi phỏng vấn` (phần mới T1323):** bổ sung SQLSTATE `40P01/40001`, làm rõ lý do chọn `REPEATABLE READ` (MVCC/phantom read trong PG) và cách khóa nhiều dòng theo `id` tăng dần; giữ giọng trả lời tự nhiên ~60–90s.

- Xác minh: `node --check js/data/q-sql.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo không liên quan: `path.js` có 2 bài học không nằm trong PATH `lesson-design-006/007`). Không chạy `test-lessons.js` (task không thêm/sửa bài học). Không git commit/push, không mở trình duyệt, không kill process theo tên.
