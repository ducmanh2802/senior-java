# T55R — Fact-check nội dung mới của T55

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T55 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `api-011`: giữ RFC 9110 cho ngữ nghĩa HTTP và OWASP API Security cho các lưu ý bảo mật webhook; chuẩn hoá quote/whitespace.
- `api-013`: bỏ OWASP (không phù hợp nội dung so sánh giao thức), thêm tài liệu chính thức gRPC Core Concepts và GraphQL Learn bên cạnh RFC 9110.
- `node --check js/data/q-api.js` và `node scripts/validate.js` đều đạt; validator in `OK — không có lỗi.`
