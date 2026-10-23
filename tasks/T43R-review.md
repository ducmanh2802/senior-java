# T43R — Fact-check nội dung mới của T43

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T43 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lab-sql-006`: bỏ khẳng định bind parameter varchar là nguyên nhân được chứng minh bởi artifact; artifact dùng literal. Nêu đúng cast trên cột làm predicate không khớp index và đề xuất parse/bind BIGINT cùng predicate trực tiếp.
- `lab-sql-007`: nội dung deadlock phù hợp với SQLSTATE 40P01, cycle khóa và retry toàn transaction; không cần sửa.
- `lab-sql-008`: phân biệt logical slot `catalog_xmin`/transaction xmin có thể giữ tuple với `restart_lsn` chỉ thể hiện WAL retention; cập nhật artifact, đáp án, hints và rubric để không khẳng định sai cơ chế vacuum.
- Đã chạy `node --check js/data/labs-sql.js` và `node scripts/validate.js`; validator in `OK — không có lỗi.` (các cảnh báo hiện có thuộc `q-english.js`, ngoài phạm vi task).
