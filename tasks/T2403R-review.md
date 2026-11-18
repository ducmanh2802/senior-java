# T2403R — Fact-check nội dung mới của T2403

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccao-2.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2403 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Kiểm tra `node scripts/validate.js` → OK. Rà nội dung mới trong `js/data/quiz-ccao-2.js`: các khái niệm (SSO/SCIM, audit logs, MCP, RAG, OCR, batch/real-time, token, temperature) dùng đúng ngữ nghĩa; không phát hiện lỗi kỹ thuật/API/flag bịa. Không chỉnh sửa nội dung.
