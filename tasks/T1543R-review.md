# T1543R — Fact-check nội dung mới của T1543

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1543 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ nội dung mới của T1543 (`ai-071` → `ai-076`, xem `git diff HEAD -- js/data/q-ai.js`). **Không có lỗi kiến thức/markup/chữ nước ngoài**, không sửa nội dung.

Đã kiểm tra và xác nhận đúng:
- `ai-071` guardrail/allowlist tool: schema chỉ kiểm hình dạng, authorization + domain check ở backend, phân biệt tool đọc/ghi, idempotency, kiểm output — đúng nguyên lý; code là pseudocode có ghi rõ không phải API Spring AI (không bịa API).
- `ai-072` golden set + A/B: holdout chống overfit, cùng snapshot/model/tool giả lập, judge hiệu chỉnh với người, metric chính + guardrail, phân nhóm ổn định theo user/tenant, không đổi nhiều biến cùng lúc — đúng.
- `ai-073` RAG citation: source ID/version/page từ ingestion, ACL khi retrieval, kiểm claim–evidence, abstain, server dựng link, version để tái lập — đúng.
- `ai-074` hard budget: race giữa nhiều instance, reserve → call → settle, atomic reservation, operation ID/idempotency, pending khi timeout mơ hồ, fail-open/fail-closed, quota phân cấp — đúng.
- `ai-075` semantic cache: embedding, scope theo tenant/ACL/locale/intent/version, hiệu chỉnh threshold bằng hard negatives, invalidate khi corpus/ACL đổi, đo false hit — đúng.
- `ai-076` fallback: capability contract, phân loại lỗi (4xx không retry, timeout/429/503 retry), circuit breaker, Retry-After, giữ output contract, không chạy lại tool side effect — đúng.

Số liệu trong các mục "Ví dụ đời thực" là ví dụ minh hoạ, nhất quán nội bộ và hợp lý (không mâu thuẫn kỹ thuật).

Markup: 6 code block `~~~java` đóng đủ, 6 bảng đúng định dạng, không có backtick/`${`/`\` trong template literal; `node --check` pass.

Lệnh đã chạy: `node --check js/data/q-ai.js`, `node scripts/qtool.js check js/data/q-ai.js ai-071 ... ai-076` (OK), `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ của `path.js` về 13 bài học ngoài PATH, không liên quan file này).
