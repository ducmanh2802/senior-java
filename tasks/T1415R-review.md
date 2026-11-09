# T1415R — Fact-check nội dung mới của T1415

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1415 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Sửa lesson-banking-003: ví dụ code comment sai ">= 50 triệu" → thực tế amount = 5 triệu, ngưỡng strongAuthThreshold = 50 triệu, nên kết quả là ALLOW chứ không phải REQUIRE_STRONG_AUTH. Đã sửa comment thành "5 triệu < 50 triệu ngưỡng xác thực mạnh, chưa vượt hạn mức ngày → ALLOW".
- Các bài học lesson-banking-003, 004 (phần mới thêm): kiểm tra kỹ thuật đều đúng (Clock injection, ZoneId Asia/Ho_Chi_Minh, velocity check sliding window, daily limit check-before-add, BigDecimal scale handling, annuity formula, 0% interest special case, last period adjustment). Không có lỗi kiến thức, markup, hay từ lóng nước ngoài.
- node scripts/validate.js → OK
- node scripts/test-lessons.js → 220/220 pass
