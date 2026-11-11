# T1361R — Fact-check nội dung mới của T1361

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1361 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review `git diff HEAD -- js/data/q-soft.js` (phần T1361 thêm): `testing-030..032`, `behavioral-031..033` — nội dung kỹ thuật/mô tả tình huống, cơ chế, ví dụ (Testcontainers/Flyway/k6/Resilience4j/outbox/Pact/CI gates...) nhìn chung đúng và nhất quán; không thấy API/flag/mặc định bịa hay cơ chế nói ngược.
- `behavioral-031` follow: sửa lỗi gõ dính chữ `đãgo-live` → `đã go-live` (typo nhỏ; file: `js/data/q-soft.js`).
- `node scripts/build-light-index.js` + `node scripts/validate.js` → OK (còn warning sẵn có: `path.js: có 1 bài học không nằm trong PATH: lesson-design-007`). Không chạy `test-lessons.js` vì task không sửa bài học.

