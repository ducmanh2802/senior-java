# T2454R — Fact-check nội dung mới của T2454

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2454 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
`node scripts/validate.js q-ai.js` → OK — không có lỗi.

## Notes
- Fixed template literal backslash escape issue in question **ai-140** (`~~~text` block): changed `\b\d{12}\b` → `\\b\\d{12}\\b`, `\b0\d{9}\b` → `\\b0\\d{9}\\b`, `\b\d{16}\b` → `\\b\\d{16}\\b`, `\.[A-Za-z]{2,}\b` → `\\.[A-Za-z]{2,}\\b` per AGENTS.md section 5 rule: dấu `\` trong template literal phải escape thành `\\`. Single `\b` → backspace char (0x08), `\d` → `d` in JS template literals, causing regex display corruption.
- Questions **ai-138** (batch inference pipeline), **ai-139** (monitoring quality/drift), **ai-140** (PII protection) reviewed for: fake APIs (none found), wrong defaults (none), inverted mechanisms (none), unsourced numbers (illustrative in examples only). All three pass technical accuracy.
- Global `node scripts/validate.js` reports pre-existing errors in other tasks' files (lessons-spring.js: 14 errors, lessons-microservices.js: 7 errors, quiz.js: syntax error, stray .txt/.tmp files, index-light.js stale) that are outside ownership per AGENTS.md rule 3 — not modified.
- No content added/removed; only escape fix in existing ai-140 `~~~text` block.
