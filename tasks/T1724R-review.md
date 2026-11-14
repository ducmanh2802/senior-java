# T1724R — Fact-check nội dung mới của T1724

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1724 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff mới trong `js/data/q-ai.js`: `ai-115` → `ai-120`.
- Kiểm tra kỹ thuật: vòng lặp coding agent (quan sát/suy luận/hành động/kiểm chứng), CI least privilege/sandbox/prompt injection/supply chain, review PR AI (hallucination, edge case, idempotency/retry), đánh giá test AI (assert hành vi, deterministic, mutation testing/PIT), rủi ro shell/egress/allowlist, đo hiệu quả AI (DORA: lead time/change failure rate/MTTR + baseline/cohort) — không phát hiện API/flag bịa, cơ chế ngược, hay số liệu vô căn cứ cần sửa.
- Kiểm tra markup/syntax: không có backtick, không có `${` chưa escape trong vùng diff; `node --check js/data/q-ai.js` OK.
- Đã chạy `node scripts/build-light-index.js` (regenerate `js/data/index-light.js`) và `node scripts/validate.js` → OK (chỉ còn cảnh báo PATH lessons có sẵn, không lỗi).
- Không sửa nội dung kiến thức; không thêm/xoá mục. Không chạy `scripts/test-lessons.js` (task không sửa bài học).
