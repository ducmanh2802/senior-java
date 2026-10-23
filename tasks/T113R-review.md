# T113R — Fact-check nội dung mới của T113

Status: DONE
Agent: opencode
Owns: `js/views/companies.js`, `css/views/companies.css`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T113 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `js/views/companies.js`: bỏ quy đổi kết quả interview thủ công `passed/failed` thành điểm mock giả định 5/1; chỉ đưa các phiên có điểm số thật 1–5 vào readiness.
- `js/views/companies.js`: chỉ ghép AI interview theo đúng company id hoặc mock có topic giao với focus; bỏ phiên không có topic để tránh tính điểm chung cho mọi công ty. Dùng `aiAvg` của mock thường khi có, nếu không mới dùng `avg`.
- Xác minh: `node --check js/views/companies.js` và `node scripts/validate.js` đều đạt; validator in `OK — không có lỗi.` (có cảnh báo ngắn về các câu tiếng Anh T113 hiện có, không thuộc file sở hữu của T113R).
