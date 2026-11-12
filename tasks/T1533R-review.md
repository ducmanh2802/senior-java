# T1533R — Fact-check nội dung mới của T1533

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1533 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `ai-065`..`ai-070` (nội dung mới T1533): fact-check không phát hiện lỗi kỹ thuật (eval/holdout & LLM-as-judge, distributed tracing/token/cost, prompt injection/least privilege/sandbox, prompt caching/model routing/budget, retry/backoff/429/529/fallback, feature flag/shadow/canary) hay lỗi markup/syntax (`node --check` OK). Không chỉnh nội dung.
- `node scripts/build-light-index.js` → OK, `node scripts/validate.js` → OK. (Không chạy `test-lessons.js`: task không sửa bài học.)
