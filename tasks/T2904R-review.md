# T2904R — Fact-check nội dung mới của T2904

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2904 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review T2904 (nội dung mới: lesson-banking-037, lesson-banking-038, cuộn cuỗi js/data/lessons-banking.js):

- Kỹ thuật: không tìm thấy lỗi API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ. Double-entry (Nợ=Có), FROZEN chặn ghi Nợ vẫn cho Có, CLOSED chặn cả hai, CA/ không âm, SYS/ được âm, kiểm tra trạng thái+số dư TRƯỚC khi ghi (nguyên tử), txId idempotency — nhất quán giữa body, prompt, reference, tests, check và explain.
- Markup: không có backtick/`${` bên trong nội dung, ~~~ khớp, bảng/App.md hợp lệ, không chèn HTML.
- Không chỉnh văn phong, độ dài, bố cục, không thêm/xoá mục, không sửa nội dung đã có ở HEAD (theo chỉ thị task).
- Code Java 17: reference của 037 pass 27/27, của 038 pass 13/13 qua `node scripts/test-lessons.js` (starter biên dịch được nhưng không pass hết). `node --check lessons-banking.js` OK.
- `node scripts/build-light-index.js` đã chạy (index-light.js sinh lại theo AGENTS.md #6).
- `node scripts/validate.js`: duy nhất lỗi báo là `js/data/quiz-cca-5.js.clean` (file rác untracked, không trong manifest) — tồn tại trước khi làm, nằm ngoài file sở hữu của T2904R, không do thay đổi của tôi; không xóa/sửa file của người khác (luật 3, 5 AGENTS.md).