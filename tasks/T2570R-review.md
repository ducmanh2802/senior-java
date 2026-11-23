# T2570R — Fact-check nội dung mới của T2570

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2570 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Sửa lỗi cú pháp: trong file js/data/q-banking.js, câu banking-088 sử dụng dấu backtick ` `` `` cho inline code trong template literal `a` field, gây lỗi "Unexpected identifier 'lý'" tại runtime do template literal bị delimited by backticks. Sửa đổi: thay `remaining` và `MAX_DAILY_LIMIT` ở nội dung `a` field bằng dạng `{{code}}` theo chuẩn AGENTS.md mục 5 (inline code syntax), đảm bảo template literal không bị break do ký tự backtick trong nội dung. Kết quả: `node scripts/validate.js` vượt qua mà không có lỗi liên quan đến q-banking.js.
