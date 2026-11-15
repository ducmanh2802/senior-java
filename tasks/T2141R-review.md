# T2141R — Fact-check nội dung mới của T2141

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2141 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed nội dung MỚI so với HEAD (git diff): banking-042 (viết lại đáp án lãi trả góp BigDecimal/actual/365/làm tròn/phần dư) và banking-045 tóm tắt (sửa "garantie delivery" thành giải thích ESB chuẩn).

Không tìm thấy lỗi kỹ thuật (BigDecimal khởi tạo từ String, divide có scale/RoundingMode, actual/365, HALF_UP/HALF_EVEN, divideAndRemainder bù phần dư vào kỳ cuối, code tránh ArithmeticException — hết số liệu vô căn cứ), không có lỗi markup, không có `${` hay backtick lẫn vào template literal. Thuật ngữ kỹ thuật giữ nguyên tiếng Anh theo AGENTS.md.

Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.

node scripts/build-light-index.js → OK; node scripts/validate.js → OK — không có lỗi.