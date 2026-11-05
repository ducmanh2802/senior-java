# T141R — Fact-check nội dung mới của T141

Status: DONE
Agent: opencode
Owns: `js/data/drills-shadow.js`, `scripts/validate.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T141 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- T141 content (`js/data/drills-shadow.js`) already committed at HEAD: 120 shadow drills (drill-shadow-001..120) across 7 themes, all 8–25 words, no backtick/`${`, `vi` present. Reviewed: no markup/foreign-char/technical errors. No changes needed.
- `scripts/validate.js`: already has `window.DRILLS` (shadow/qa/term) and `window.GLOSSARY` checks from T141; no changes needed.
- Fixed 2 markup errors in uncommitted new algo content (algo-132, algo-134) that were blocking `validate.js`:
  - `algo-132.prompt`: `{{gas[i]}` / `{{cost[i]}` had unmatched `}}` (nested `{ }`) → closed braces to `{{gas[i]}}` / `{{cost[i]}}`.
  - `algo-134.solution`: foreign char `尽` leaked into Vietnamese text → replaced with `nhỏ nhất`.
- Verified: `node --check` on both owned files, `node scripts/validate.js` → `OK — không có lỗi.`

