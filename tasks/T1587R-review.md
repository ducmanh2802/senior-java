# T1587R — Fact-check nội dung mới của T1587

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1587 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD của `js/data/quiz-design.js`: nội dung mới `qz-design-022` → `qz-design-035` (14 câu).
- Kiểm tra kỹ thuật (delivery semantics/idempotency, sharding/hash key, consistency/CAP, cache-aside/TTL/invalidation, Kafka key→partition ordering, read replica/replication lag/read-after-write, CDN/cache-control, timeout/circuit breaker/bulkhead/backoff, RAG chunking/retrieval/rerank, LLM cost/streaming/tool-calling safety, degrade gracefully): không phát hiện lỗi kiến thức, API/flag bịa, cơ chế ngược hay số liệu vô căn cứ cần sửa.
- Kiểm tra markup/schema: không backtick, không `${` chưa escape, `{{ }}` inline code đúng; câu multi có `(Chọn 2)` và answer mảng tăng dần; `node --check js/data/quiz-design.js` OK.
- `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → OK — không có lỗi. Không sửa nội dung đã có ở HEAD, không thêm/xoá mục. Không có lỗi kiến thức.
