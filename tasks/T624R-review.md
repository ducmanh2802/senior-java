# T624R — Fact-check nội dung mới của T624

Status: DONE
Agent: opencode
Owns: `js/data/path.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T624 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- path-14 (order 14, phase Senior, weeks 31–32): added by T624 model free. Fact-checked:
  - `lessons: ['lesson-banking-003', 'lesson-banking-004']` → both exist in `js/data/lessons-banking.js` (track banking, order 3/4). OK.
  - `questions`: 40 ids. Verified all exist:
    - banking-001..009 → `js/data/q-banking.js` (9, levels mid/senior/lead, all have topic 'banking'). OK.
    - ai-001..015 → `js/data/q-ai.js` (all exist). OK.
    - scenario-093..108 → `js/data/q-scenario.js` (all 16 exist, topic 'scenario'). OK.
  - `quizTopics: ['banking', 'ai']` → both exist in `js/data/topics.js`. OK.
  - `requires: ['path-13']` → path-13 exists (order 13). OK.
  - No markup errors, no invented API, no wrong defaults. No changes needed.
- Warning "path-14: questions nên có 4-8 câu (hiện 40)" is pre-existing style guidance from validate.js; the stage legitimately aggregates a large question pool (banking + AI + scenario). Left as-is — reducing would drop real content owned by other tasks.
- Warning "có 4 bài học không nằm trong PATH: lesson-testing-005, lesson-ai-002, lesson-ai-003, lesson-ai-004" is pre-existing and unrelated to path-14 (those lessons belong to other stages). Not touched.
- `node scripts/validate.js` → `OK — không có lỗi.` (warnings only, no errors).
