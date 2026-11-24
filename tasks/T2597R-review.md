# T2597R — Fact-check nội dung mới của T2597

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2597 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Nội dung MỚI của T2597 = 10 câu trắc nghiệm PostgreSQL `qz-db-931` … `qz-db-940` (đã fact-check theo chuẩn PostgreSQL 15 / HikariCP): Repeatable Read snapshot, MVCC xmin/xmax, GIN vs B-tree, BRIN, partial index, covering index INCLUDE, advisory lock, FOR UPDATE/FOR SHARE, connection pool sizing, VACUUM/autovacuum. **Không có lỗi kiến thức** (API/tham số/cơ chế/số liệu đều đúng).
- Đã sửa 1 lỗi cú pháp do lần chạy trước bị gián đoạn để lại: token rác `BLOCKEND` ở cuối file (sau `qz-db-940`, trước `);`) gây `ReferenceError: BLOCKEND is not defined`. Đã xoá; file load lại OK (213 câu QUIZ).
- `node scripts/validate.js`: KHÔNG còn lỗi nào thuộc `quiz-spring.js`. Các lỗi còn lại (`lessons-aws.js` syntax "Unexpected identifier 'Hết'", `path.js` thiếu lesson-aws, `index-light.js` cũ) thuộc task khác (T2670 — lessons-aws) đang dở, KHÔNG thuộc quyền sở hữu của T2597R nên không sửa (luật 3). `build-light-index.js` hiện bị chặn bởi chính file lessons-aws.js lỗi đó.
