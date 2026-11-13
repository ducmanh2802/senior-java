# T1710R — Fact-check nội dung mới của T1710

Status: DONE
Agent: opencode
Owns: `js/data/lessons-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1710 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-sql-010: Sửa lỗi compile trong test (tham chiếu class `Row` không tồn tại — xóa helper method không dùng `static Row r(...)`).
- lesson-sql-010: Sửa kỳ vọng test `nestedLoopCost(10, 10000, true)` từ 40 → 30 để khớp với reference implementation dùng fanout 100 (log100(10000)=2, steps=3, 10×3=30), nhất quán với lesson-sql-007.
- Các lesson còn lại (sql-011, sql-012, sql-013): không phát hiện lỗi kỹ thuật, markup đúng, thuật ngữ tiếng Anh giữ nguyên theo quy ước.
