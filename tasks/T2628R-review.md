# T2628R — Fact-check nội dung mới của T2628

Status: TODO
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2628 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review nội dung mới của T2628 trong js/data/lessons-security.js (lesson-security-015, lesson-security-016). Sửa lỗi kỹ thuật:
- lesson-security-015: exp hết hạn là now >= exp (RFC 7519), không phải now > exp.
- lesson-security-015: getBytes() không charset → StandardCharsets.UTF_8 (khối mã mẫu và reference), thêm import java.nio.charset.StandardCharsets.
- lesson-security-016: số liệu GPU vô căn cứ ("vài trăm hash/giây, 8 ký tự mất hàng năm") → viết lại đúng: PBKDF2 không tốn RAM, GPU thử rất nhiều/giây, 8 ký tự phổ biến dò được trong vài ngày–vài tuần.
- lesson-security-016: bảng so sánh, MD5/SHA1 cột Salt "Không" → "Có (thường bỏ qua)".

node --check js/data/lessons-security.js: OK.
node scripts/test-lessons.js lesson-security-015/016: 4/4 + 4/4 pass.
node scripts/validate.js: không lỗi nào thuộc lessons-security.js. Cảnh báo/Lỗi còn lại (labs-sql.js pg_sleep, bugs.js bug-050 kí tự CJK, index-light.js cũ) nằm ngoài file sở hữu của task này (labs-sql chặn build-light-index.js) và đã tồn tại trước.
Status: DONE
