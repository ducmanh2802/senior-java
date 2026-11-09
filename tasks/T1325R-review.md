# T1325R — Fact-check nội dung mới của T1325

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1325 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review toàn bộ 108 dòng T1325 thêm vào js/data/q-system-design.js (architecture-010 … architecture-015: mục `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn`, chèn trước `> Senior tip:`; không sửa nội dung HEAD, không thêm/xoá mục).

Lỗi đã sửa (mỗi id):
- architecture-013: sửa lỗi chữ "lớpchutz" → "lớp trung gian" trong Ví dụ đời thực (dòng ~3485).
- architecture-015: sửa "bùng explode" → "bùng nổ" trong Ví dụ đời thực và Trả lời mẫu (dòng ~3672, ~3680).

Kiểm tra kỹ thuật các mục mới: đúng chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x; không backtick/`${` trong template literal; markup hợp lệ; không số liệu vô căn cứ; cơ chế đúng (self-invocation bypass proxy AOP, @Builder bỏ field initializer nếu không có @Builder.Default, Abstract Factory tạo họ object nhất quán…).
node --check js/data/q-system-design.js OK; node scripts/build-light-index.js OK; node scripts/validate.js → OK — không có lỗi.
