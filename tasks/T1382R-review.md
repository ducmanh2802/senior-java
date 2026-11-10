# T1382R — Fact-check nội dung mới của T1382

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1382 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review nội dung mới của T1382 (6 block "Ví dụ đời thực" + "Trả lời mẫu khi phỏng vấn" chèn vào câu hỏi cũ):
- jpa-029: sửa lỗi kỹ thuật "do MVCD" → "do MVCC" trong đáp án mẫu (Multiversion Concurrency Control). Block ví dụ dòng trên đã đúng "(MVCC ghi row mới)".
- db-031 (advisory lock), db-032 (UUID/UUIDv7), db-033 (gap lock deadlock), db-034 (lost update), db-035 (WAL/replication slot): review xong, đúng kỹ thuật (Java 17/21, Hibernate 6, PostgreSQL 15, MySQL InnoDB), không cần sửa. "SQLSTATE 40001" cho MySQL 1213 khớp quy ước đã có ở HEAD (q-spring-data.js:1971, :7188).
- Không backtick, không `${` trong block mới → template literal không hỏng. Không chỉnh văn phong, không thêm/xoá mục, không động nội dung HEAD.
- node --check js/data/q-spring-data.js: OK. node scripts/validate.js: không báo lỗi về q-spring-data.js.
- LỖI còn lại của validate.js là q-java.js: modern-042.a "code fence ~~~ chưa đóng" — file của task khác, đã hỏng trong working tree trước khi tôi làm (cũng làm build-light-index.js dừng). Không thuộc quyền sở hữu T1382R, không được sửa (quy tắc 3 AGENTS.md).
