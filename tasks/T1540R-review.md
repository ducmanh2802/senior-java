# T1540R — Fact-check nội dung mới của T1540

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1540 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff mới của `js/data/q-system-design.js` (architecture-045..architecture-049): không phát hiện lỗi kỹ thuật/API bịa/cơ chế ngược/số liệu vô căn cứ hay lỗi markup cần sửa.
- `node --check js/data/q-system-design.js` OK. Chạy `node scripts/validate.js` → OK. Chạy `node scripts/build-light-index.js` → OK (cập nhật `js/data/index-light.js`).
- Ghi chú: cảnh báo path lessons không nằm trong PATH là có sẵn, không thuộc scope file sở hữu.
