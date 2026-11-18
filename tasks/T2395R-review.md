# T2395R — Fact-check nội dung mới của T2395

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2395 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Reviewed new questions design-062 through design-065 in `js/data/q-system-design.js`
- All technical content verified correct: double-entry ledger, idempotency, CQRS/ES, fraud pipeline
- No knowledge errors found (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ)
- Ran `node scripts/build-light-index.js` to regenerate `js/data/index-light.js` after adding new questions
- Ran `node scripts/validate.js` → `OK — không có lỗi.`
- Content verified: correct Java 17/21, Spring Boot 3.x, Hibernate 6 patterns; no backtick/$\${ inside template literals; markup valid
