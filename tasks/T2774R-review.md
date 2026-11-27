# T2774R — Fact-check nội dung mới của T2774

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2774 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lab-sql-054: Sửa claim sai "numeric(12,2) dùng 2 byte scale, numeric(18,4) dùng 4 byte scale" — PostgreSQL numeric storage không hoạt động như vậy (scale là metadata, không phải fixed byte); thêm lưu ý rewrite vẫn bắt buộc do catalog/format đĩa thay đổi. Sửa backfill query dùng `ctid BETWEEN` thay vì `id BETWEEN 1 AND 10000` (tránh giả định kiểu PK).
- lab-sql-055: Sửa duplicate step numbering (hai "6." → "6." và "7."). Sửa typo "Chuong trình" → "Chương trình".
- lab-sql-056: Không có lỗi kỹ thuật/markup.
- lab-sql-057: Sửa "Execution Time: 1.125 ms" → "1.125 s" (artifact hiển thị 1125.212 ms = 1.125 giây).
