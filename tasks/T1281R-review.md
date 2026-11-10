# T1281R — Fact-check nội dung mới của T1281

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1281 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- banking-015 (auto-debit): Sửa lỗi sự thật trong "Ví dụ đời thực" — câu gốc viết "ngày 31 tháng 1 không có ngày 31 (chỉ có 28 ngày)" sai, tháng 1 có 31 ngày. Vấn đề thực tế là tháng 2 không có ngày 31. Đã sửa thành "tháng 2 không có ngày 31 (chỉ có 28 ngày)".
- Các câu hỏi banking-013, 014, 016, 017, 018: Không phát hiện lỗi kỹ thuật, markup, hay từ ngữ lẫn lộn. Nội dung đúng chuẩn Java 17/21, Spring Boot 3.x, ngữ cảnh ngân hàng Việt Nam (NAPAS, VietQR).
- `node scripts/validate.js` → OK.
