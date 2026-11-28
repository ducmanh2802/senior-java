# T2787R — Fact-check nội dung mới của T2787

Status: DONE
Agent: opencode
Owns: `js/data/lessons-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2787 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fixed 2 compilation errors in reference solutions:
  - lesson-banking-023 (line 6474): `split("\\|")` → `split("\\\\|")` - double backslash in template literal was being unescaped to single backslash in generated Java code, causing "illegal escape character" compile error
  - lesson-banking-024 (line 6974): `split("\\|")` → `split("\\\\|")` - same fix
- Both fixes ensure the reference code compiles correctly when extracted by test-lessons.js
- node scripts/validate.js passes for banking lessons (no errors)
- node scripts/test-lessons.js: banking lessons compile and pass (468/475 OK, banking lessons no longer show COMPILE ERROR)
