# T2675R — Fact-check nội dung mới của T2675

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2675 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed nội dung mới của T2675 trong `js/data/labs-sql.js`: lab-sql-042 (chỉ mục bỏ qua do tham số BigDecimal/numeric khiến PostgreSQL ép cột INTEGER → Seq Scan) và lab-sql-043 (deadlock do hai transaction khoá đơn/tồn kho theo thứ tự ngược).

Kiểm tra: cơ chế ép kiểu ngầm PostgreSQL (int4→numeric áp lên cột, không phải tham số), dòng EXPLAIN `Filter: ((daily_limit)::numeric <= ...)` vs `Index Scan` sau `CAST(:soTien AS INTEGER)`, tỉ lệ 3877 ms / 0,4 ms ≈ 9.600×, buffers ~263k trang ≈ 2,1 GB khớp số liệu artifact; deadlock log PID/xid (18421/987653, 18422/987654), wait_event_type=Lock, wait_event=transactionid, SQLState 40P01 / CannotAcquireLockException, victim lựa chọn, quy tắc khóa theo thứ tự cố định + retry toàn bộ transaction + idempotency key; `~~~seq` hợp lệ (5 actor, mỗi bước ≤ 60 ký tự); markup không có backtick hay `${` trong nội dung; trường schema hợp lệ, rubric 5 ý (≥3).

Không tìm thấy lỗi kỹ thuật, markup hay chữ nước ngoài lẫn vào trong lab-sql-042/lab-sql-043 → không sửa gì (ghi Notes: không có lỗi).

`node --check js/data/labs-sql.js`: OK. `node scripts/validate.js`: không báo lỗi nào từ labs-sql.js. Các lỗi còn lại của validate (lessons-design.js cú pháp, path.js, index-light.js cũ) là của các task khác đang chứa trong working tree, không sở hữu bởi task này → không đụng theo luật 3.
