# T2176R — Fact-check nội dung mới của T2176

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccao-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2176 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHÚA: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.

## Nghiệm thu
node scripts/validate.js → OK — không có lỗi (schema: field đúng định dạng, answer trong range, multi đúng format, options không trùng, `(Chọn N)` khớp với answer.length).

## Notes
- Reviewed 30 new questions (qz-ccao-061 → qz-ccao-090) covering: Product Selection (10), Knowledge Config (10), Responsible Use (5), Prompting Basics (5).
- All questions follow AGENTS.md §4 schema: correct field set, answer within range, multi-format with `(Chọn N)` matching answer.length, options non-overlapping, answer indices ascending.
- No knowledge errors found: all content technically accurate for Claude product/knowledge/prompting best practices; no fabricated APIs/flags, correct default values, consistent mechanics.
- No markup errors: no backticks inside template optionals, no `${`, proper `**Đáp án đúng:**` + `### Vì sao đúng` + `> Nguyên tắc:` format.
- Validator passed on first run: `OK — không có lỗi.`
