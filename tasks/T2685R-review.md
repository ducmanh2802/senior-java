# T2685R — Fact-check nội dung mới của T2685

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2685 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa lỗi kỹ thuật quan trọng trong **lab-sql-047** (id lab-sql-047, tiêu đề "Xoá khách hàng chậm vì thiếu chỉ mục khoá ngoại trên bảng đơn hàng"):

1. **Sai cơ chế lock khi kiểm tra FK**: Nội dung gốc nói DELETE giữ `AccessShareLock` trên bảng con (orders) và `AccessShareLock` KHÔNG tương thích với `RowExclusiveLock` (INSERT/UPDATE) → gây chờ. **Thực tế**: PostgreSQL kiểm tra FK qua trigger RI chạy `SELECT ... FOR SHARE` lấy **RowShareLock**. `RowShareLock` **TU THONG** với `RowExclusiveLock` (INSERT/UPDATE). Vấn đề chỉ xảy ra do **Seq Scan 30 triệu dòng mất 45 giây** giữ RowShareLock lâu + I/O contention + lock queue, không phải do lock conflict trực tiếp.

2. **Đã sửa đúng các artifact, hints, answer, rubric, senior tip**: Thay `AccessShareLock` bằng `RowShareLock`, sửa giải thích về tương thích lock, làm rõ nguyên nhân gốc là Seq Scan lâu + I/O contention chứ không phải lock conflict.

3. **Đã sửa syntax error**: Các backtick trong template literal (`SELECT ... FOR SHARE`) đã được thay bằng markup `{{...}}` để tránh lỗi cú pháp JavaScript.

Các lab còn lại (lab-sql-044, 045, 046, 048, 049) đã kiểm tra — nội dung kỹ thuật đúng, không có lỗi kiến thức.
node scripts/validate.js chạy OK (lỗi hiển thị đều thuộc file khác không thuộc sở hữu).
