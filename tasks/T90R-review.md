# T90R — Fact-check nội dung mới của T90

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`, `js/data/q-concurrency-jvm.js`, `js/data/q-spring-data.js`, `js/data/q-sql.js`, `js/data/q-api.js`, `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T90 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `api-011`, `api-013`: RFC 9110 và OWASP API Security Project là nguồn phù hợp với nội dung; không phát hiện lỗi ở phần bổ sung.
- `security-013`: OWASP Top 10 và Cheat Sheet Series là nguồn phù hợp; không phát hiện lỗi ở phần bổ sung.
- `node scripts/check-links.mjs` không thể truy cập mạng (EACCES), nên trạng thái tồn tại của URL chưa được xác minh tự động.
- `node --check` cho hai file có diff và `node scripts/validate.js` đều đạt; validator in `OK — không có lỗi.`
