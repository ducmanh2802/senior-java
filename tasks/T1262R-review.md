# T1262R — Fact-check nội dung mới của T1262

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1262 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ nội dung mới của `js/data/q-aws.js` (aws-001 → aws-061). Nội dung kỹ thuật đúng, không phát hiện API/flag bịa, cơ chế nói ngược hay số liệu vô căn cứ.

**Lỗi đã sửa:**
- `aws-008` (SQS): "tăng visibility timeout lên 120 **giày**" → sửa thành "120 **giây**" (lỗi chính tả đơn giản trong phần "Ví dụ đời thực" do model free viết).

**Đề xuất (không tự sửa, không phải file sở hữu):**
- `js/data/q-devops.js:1357` — có ký tự backtick `` ` `` lọt vào template literal (nằm trong câu `lọc artifact có \`log4j-core\` version...`), làm `node scripts/build-light-index.js` lỗi SyntaxError. Đây là lỗi markup đã có sẵn từ trước, không phải nội dung mới của T1262. Cần integrator sửa để có thể rebuild `index-light.js` sau khi thêm nội dung mới.
