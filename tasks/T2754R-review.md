# T2754R — Fact-check nội dung mới của T2754

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2754 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- api-091: Sửa "2.1→4.0" thành "2.1 đến 4.0" (loại bỏ mũi tên Unicode, dùng tiếng Việt)
- api-092: Sửa "Spring 6" và "Spring Boot 6" thành "Spring Boot 3.x (Spring Framework 6)" để tuân thủ chuẩn dự án; sửa tiêu đề câu hỏi tương ứng
- api-093: Không có lỗi kỹ thuật, markup đúng chuẩn
- Đã chạy `node scripts/build-light-index.js` để cập nhật index-light.js
- `node scripts/validate.js` → OK (không lỗi trong q-api.js)
