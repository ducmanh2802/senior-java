# T143R — Fact-check nội dung mới của T143

Status: DONE
Agent: opencode
Owns: `js/data/drills-term.js`

Notes:
- `drill-term-076`: trùng nội dung với `drill-term-013` (`throughput`). Đã sửa thành `replication` (phát âm, lỗi hay gặp, ví dụ kỹ thuật đúng).
- `node scripts/validate.js` → OK.
- Không thêm/xoá mục, không sửa nội dung đã có ở HEAD.

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T143 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
