# T1718 — Microservices: 6 câu hỏi về đưa AI vào kiến trúc microservices

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý**.

Chủ đề: tách dịch vụ AI riêng hay nhúng vào service nghiệp vụ, gọi LLM đồng bộ trong request path vs qua queue, timeout và fallback khi dịch vụ AI chậm, chia sẻ quota LLM giữa nhiều service, log và trace xuyên service khi có bước gọi LLM, kiểm thử contract cho service AI.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

> **Quan trọng:** KHÔNG đọc toàn bộ `js/data/q-microservices.js` (file lớn, sẽ hết lượt). Xem danh sách bằng `node scripts/qtool.js list js/data/q-microservices.js`, xem một mục mẫu bằng `node scripts/qtool.js show js/data/q-microservices.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-microservices.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-microservices.js logs/tmp-T1718.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu (id nối tiếp từ microservices-069), tất cả `RST`, follow=3:
  - `microservices-070` (senior) — tách AI gateway riêng hay nhúng SDK LLM vào service nghiệp vụ; tiêu chí, trade-off, seq luồng gateway, code Spring AI, ví dụ chi phí 4.300→2.600 USD/tháng.
  - `microservices-071` (senior) — gọi LLM đồng bộ trong request path vs qua queue (202 + Kafka + worker); thread pool Tomcat, idempotency, DLQ, ví dụ 504→hết.
  - `microservices-072` (lead) — timeout/deadline, circuit breaker (gồm slowCall), retry có giới hạn, chuỗi fallback; Resilience4j + JdkClientHttpRequestFactory; ví dụ lỗi 4%→0,3%.
  - `microservices-073` (senior) — chia quota LLM giữa nhiều service/tenant: phân cấp, Redis + Lua nguyên tử, reserve/settle, fair-share, ví dụ hết 429 diện rộng.
  - `microservices-074` (senior) — log/trace xuyên service khi có bước LLM: traceparent qua Kafka, span gen_ai.*, không log prompt/PII, hash; ví dụ điều tra 2 ngày→40 phút.
  - `microservices-075` (lead) — contract test cho service AI: JSON Schema, Pact cho phần tất định, eval dataset vàng + rubric, canary/shadow, quy trình sở hữu eval.
- Nghiệm thu: `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ về path.js, không liên quan file này). Không commit.
Reviewed-by: kilo (T1718R)
