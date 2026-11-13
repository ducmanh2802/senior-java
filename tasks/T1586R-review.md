# T1586R — Fact-check nội dung mới của T1586

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1586 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review nội dung mới (git diff HEAD -- js/data/lessons-ai.js): `lesson-ai-013` (retry/timeout/circuit breaker/fallback LLM API) và `lesson-ai-014` (RAG evaluation: precision@k/recall@k/chunking).
- Không phát hiện lỗi kỹ thuật (HTTP status 429/529/5xx/4xx, cơ chế exponential backoff+jitter, circuit breaker/fallback, công thức precision@k/recall@k, ví dụ tính toán), không lỗi markup, không có backtick/`${` trong template literal, không có claim số liệu bịa (ví dụ đời thực có ghi chú minh họa).
- Không chỉnh sửa `js/data/lessons-ai.js` (không có lỗi cần sửa). Nội dung HEAD không bị thay đổi.
- Kiểm tra: `node --check js/data/lessons-ai.js` OK, `node scripts/validate.js` → OK, `node scripts/test-lessons.js` → `Lesson exercises OK: 247/247  (222 bài học, 247 từ cache)`.
