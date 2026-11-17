# T2321R — Fact-check nội dung mới của T2321

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2321 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- aws-074: `{{$LATEST}}` → `$LATEST` (markup: `{{$LATEST}}` render thành `{$LATEST}` thay vì `$LATEST`; các entry cũ đều dùng `$LATEST` trực tiếp).
- aws-075: `wait_timeout của PostgreSQL` → `thời gian ngắt kết nối idle của PostgreSQL` (3 chỗ: comment YAML, đáp án mẫu, follow-up) — PostgreSQL không có tham số `wait_timeout` (đó là MySQL).
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → không có lỗi trong q-aws.js (các lỗi còn lại trong quiz-design.js thuộc quyền sở hữu task khác, không sửa).
