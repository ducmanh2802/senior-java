# T1302R — Fact-check nội dung mới của T1302

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1302 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Baseline: `node scripts/validate.js` (sau review) chỉ còn 1 lỗi pre-existing ngoài `js/data/q-ai.js`: `q-security.js: security-008.a` (inline code nested `{}`) — không thuộc sở hữu T1302R, không sửa.
- Nội dung MỚI (xác định bằng `git diff HEAD -- js/data/q-ai.js`, 36 dòng thêm): 6 khối bổ sung `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` cho **ai-020, ai-021, ai-022, ai-023, ai-024, ai-025**.
- Fact-check kỹ thuật (không phát hiện lỗi cần sửa, không thay đổi nội dung):
  - `ai-020`: gateway/pseudonymization/NER+regex, audit, data residency — đúng hướng; số liệu (3%, 0,4%, 0,05%, 200 mẫu) dùng như ví dụ minh hoạ, không bịa API/flag.
  - `ai-021`: khớp phần trả lời gốc của cùng câu (Spring AI retry mặc định 10 lần/backoff tối đa 3 phút; 429 non-transient ở mặc định 1.0 theo phần gốc), xử lý 503/429, read timeout 8s, max-attempts 2, slow-call 15s, bulkhead/fallback — cơ chế đúng.
  - `ai-022`: chat memory theo khoá hội thoại, `findByIdAndOwnerId`/IDOR, owner check, TTL/mask — đúng.
  - `ai-023`: pgvector + PostgreSQL 15, `CREATE INDEX CONCURRENTLY`, version hoá embedding, blue/green, WHERE post-filter/iterative scan/partial index — đúng.
  - `ai-024`: stub `ChatModel` giữ `ChatClient` thật, WireMock adapter, Testcontainers pgvector với vector tính sẵn, golden set/eval — đúng.
  - `ai-025`: ghim model id, golden set, LLM-as-judge có đảo vị trí (position bias), shadow/canary/feature flag rollback, embedding migration cần re-index — đúng.
- Markup/safety: không có backtick trong template literal, không có `${`, không nested `{}` trong `{{ }}`, không thêm/xoá mục. `node --check js/data/q-ai.js` OK.
- Ghi chú: `git diff HEAD` không cho thấy thêm câu mới ai-042..052 (các id này đã có ở HEAD; ai-048..049 có backtick trong template literal — pre-existing ở HEAD, ngoài phạm vi diff T1302). `node scripts/test-lessons.js` không chạy vì `js/data/q-ai.js` là ngân hàng câu hỏi (không phải `lessons-*`).
