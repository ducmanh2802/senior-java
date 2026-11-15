# T2098R — Fact-check nội dung mới của T2098

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2098 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- modern-064, modern-066, modern-067, modern-068: không có lỗi kỹ thuật/markup (đã kiểm tra JEP 440/441, Spring Boot 3.2 virtual threads, Stream, Optional).
- modern-065: SỬA tóm tắt — bỏ "hoặc {{for}}": record pattern Java 21 (JEP 440) chỉ dùng trong `instanceof` và `switch`; hỗ trợ enhanced `for` đã bị loại bỏ trước khi finalize. node --check OK; validate.js không báo lỗi q-java.js.
- validate.js còn lỗi ở q-sql.js, lessons-sql.js, projects.js, path.js, index-light.js — nằm ngoài quyền sở nhiệm task (chỉ sở hữu q-java.js), không sửa theo luật 3 AGENTS.md.
