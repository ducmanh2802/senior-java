# T2583R — Fact-check nội dung mới của T2583

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2583 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
**lab-sql-036 (Sai kiểu tham số khiến index không được dùng):**
- Sửa artifact explain-analyze.log: EXECUTE stmt(901234567) (không có nháy đơn) thay vì stmt('0901234567') để khớp với comment "tham số kiểu numeric"
- Sửa comment "-- thiếu nháy đơn" thay vì "-- thiếu dấu ngoặc đơn" (vấn đề là thiếu quotes, không phải parentheses)
- Sửa answer: "thiếu nháy đơn" thay vì "thiếu dấu ngoặc đơn"
- Sửa markup: thêm dấu `)` đóng cho `{{Filter: ((phone)::numeric = ...)}}` ở 2 chỗ
- Sửa typo "PostgreScript" → "PostgreSQL" trong Senior tip

**lab-sql-037 (Deadlock do hai giao dịch cập nhật số dư theo thứ tự khác nhau):**
- Sửa typo "số dú" → "số dư" (tiếng Việt) trong scenario
- Sửa typo "PostgreScript" → "PostgreSQL" trong Senior tip
