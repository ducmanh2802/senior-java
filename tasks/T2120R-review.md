# T2120R — Fact-check nội dung mới của T2120

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6. Nội dung MỚI của task T2120 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: không áp dụng (file không phải lessons).

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Nội dung mới của T2120 là chỉ thêm `'core'` vào mảng `tags` của 40 câu trong js/data/q-microservices.js (không đụng q/a/follow).
- Kiểm tra diff: 40 dòng `tags` thêm 'core', số câu trước/sau = 92/92, không trùng tag, không lỗi markup, không có từ nước ngoài trong tags.
- Danh sách id gắn 'core': microservices-001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 014, 016, 018, 019, 020, 021, 024, 025, 026, 027, 028, 031, 033, 035, 041, 043, 047, 052, 053, 057, 060, 061, 064, 065, 067, 077, 078, 081.
- Không lỗi kiến thức kỹ thuật trong phần mới → Notes "không có lỗi".
- `node --check js/data/q-microservices.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → OK — không có lỗi.
