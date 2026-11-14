# T1727R — Fact-check nội dung mới của T1727

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1727 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 4 câu hỏi mới (security-057 đến security-060):
- security-057: Mass Assignment (Over-posting) qua BeanUtils.copyProperties/JPA dirty checking — đúng kỹ thuật
- security-058: Spring Boot Actuator expose endpoint và xử lý stack trace — đúng kỹ thuật  
- security-059: Jackson default typing / insecure deserialization (gadget chain RCE) — đúng kỹ thuật
- security-060: Path traversal khi tải file upload — đúng kỹ thuật

Không phát hiện lỗi kiến thức, lỗi markup, hay chữ nước ngoài lẫn vào. Validation OK. Build-light-index OK.
Không cần sửa file nào.
