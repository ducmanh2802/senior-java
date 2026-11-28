# T2889R — Fact-check nội dung mới của T2889

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2889 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-security-021, lesson-security-022 (bài mới của T2889): exercises tests chỉ có 1 case `check("not null", true)` → cổng test-lessons.js yêu cầu ≥3 case và starter không được pass hết. Sửa tests gọi method (3 case): reference trả về stored (pass hết), starter ném UnsupportedOperationException (không pass). Nội dung kiến thức (rehash on login, kid chọn khóa verify) đã kiểm tra: đúng kỹ thuật, không lỗi markup, không chữ nước ngoài.
- lesson-security-015, lesson-security-016: T2889 viết hoa mọi xuống dòng trong starter/tests/reference thành "\\n" (dấu gạch chéo kép) → Java báo "illegal character: '\'" khi biên dịch test. Khôi phục lại "\n" đơn (tương đương HEAD, không thay đổi kiến thức).
- validate.js → OK. test-lessons.js: lesson-security-015/016/021/022 pass. 9 thất bại còn lại nằm ở bài học khác (không phải file do task này sở hữu, chưa được sửa).
