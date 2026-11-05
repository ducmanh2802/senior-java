# T726R — Fact-check nội dung mới của T726

Status: DONE
Agent: opencode
Owns: `js/data/path.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T726 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Reviewed `git diff HEAD -- js/data/path.js` (T726 additions): inserted lesson IDs into existing stage `lessons` arrays (path-01/03/05/06/07/08/09/14) and added new stage `path-15` (Automation Test với Playwright, requires `path-14`, `quizTopics:['autotest']`, 15 `lesson-autotest-*` lessons, 8 `autotest-*` questions). No technical claims (APIs/flags/defaults/mechanisms/versions), no markup in `goal` strings, no foreign-language leakage beyond proper nouns (Java, Docker, JUnit 5, Playwright) — all consistent with existing path style.
- Cross-checks: `node --check js/data/path.js` OK. `node scripts/validate.js` → `OK — không có lỗi.` (no PATH warnings for existing lessons). Referenced lesson/question/topic IDs resolve (validated). No edits to `js/data/path.js` needed.
- `scripts/test-lessons.js`: not run (T726 did not add/modify lesson content; only `path.js` mapping changed).
- Lỗi đã sửa theo id: **không có**.
