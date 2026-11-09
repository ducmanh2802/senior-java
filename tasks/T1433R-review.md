# T1433R — Fact-check nội dung mới của T1433

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1433 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed diff (HEAD → working tree) of js/data/q-english.js: changes only in english-007, english-009, english-010, english-011, english-012 (answer text, useful phrases, lỗi người Việt, senior tip). Không có lỗi kiến thức (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ). Kiểm tra markup: không có backtick, không có `${` trong template literal, cú pháp markup hợp lệ. node --check và node scripts/validate.js → OK. Ghi notes "không có lỗi" theo quy tắc 9.
