# T2485R — Fact-check nội dung mới của T2485

Status: DONE
Agent: opencode
Owns: `js/data/lessons-testing.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2485 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fixed Vietnamese diacritics in lesson-testing-008 and lesson-testing-009:
  - lesson-testing-008: title, goals, body text, exercise prompt, hints, explain, check questions
  - lesson-testing-009: title, goals, body text, exercise prompt, hints, explain, check questions
- `node scripts/validate.js lessons-testing.js` → OK (no errors)
- `node scripts/test-lessons.js` → 338/338 exercises pass
- Full validation blocked by pre-existing issues in files outside task ownership:
  - q-scenario.js: syntax error (unexpected token ':') - blocks build-light-index.js
  - q-spring-data.js: syntax error with invalid → character in template literal
  - bugs.js: related fields referencing non-existent scenario questions
  - projects.js: related fields referencing non-existent scenario questions
  - path.js: questions referencing non-existent scenario questions
  - q-concurrency-jvm.js: answer length warnings (pre-existing)
  - q-sql.js: answer length warning (pre-existing)
  - path.js: 106 lessons not in PATH (pre-existing)
