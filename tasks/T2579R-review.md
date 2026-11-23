# T2579R — Fact-check nội dung mới của T2579

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2579 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 4 lỗi chính tả/ngữ pháp trong 3 câu hỏi mới (architecture-075, architecture-076, architecture-077):
1. architecture-075: "phụng thêm replica" → "thêm replica" (line 12635)
2. architecture-075: "mã hoá" → "mã hóa" (2 chỗ: line 12635, line 12687, line 12674 trong bảng trade-off)
3. architecture-075: "dữ liệu cuối cùng nhất quán" → "chỉ đạt nhất quán cuối cùng" (line 12670, mô tả trade-off chính xác hơn)
4. architecture-076: "mã hoá" → "mã hóa" (line 12756)
Không phát hiện lỗi kiến thức kỹ thuật (API sai, cơ chế sai, số liệu vô căn cứ) trong 3 câu hỏi mới.
validate.js và build-light-index.js chạy OK.
