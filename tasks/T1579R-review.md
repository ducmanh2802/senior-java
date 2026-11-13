# T1579R — Fact-check nội dung mới của T1579

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1579 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review lesson-jpa-010 (Transaction/persistence context: flush, commit, detach) và lesson-jpa-011 (Optimistic locking @Version: lost update, retry) mới thêm trong lessons-jpa.js.
- Không có lỗi kỹ thuật (API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ), không lỗi markup (backtick, ${, {{}} khớp, fence ~~~ đóng), related jpa-002/jpa-004 có thật trong q-spring-data.js.
- node --check lessons-jpa.js: OK. node scripts/validate.js: OK — không có lỗi. node scripts/test-lessons.js: lesson-jpa-010/#1 và lesson-jpa-011/#1 pass (reference pass 100% test, starter biên dịch được nhưng không pass).
- 3 thất bại còn lại của test-lessons.js nằm ở lesson-concurrency-012/013 (không sở hữu, không sửa theo luật 3 AGENTS.md).
- Không git commit / không tạo branch.