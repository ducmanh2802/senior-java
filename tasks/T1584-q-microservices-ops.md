# T1584 — Microservices: 6 câu hỏi vận hành

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: microservices) vào `js/data/q-microservices.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-microservices.js`); đọc danh sách để **không trùng ý**.

Chủ đề: API gateway vs service mesh, distributed tracing (trace context, sampling), quản lý cấu hình tập trung, contract testing (Pact/Spring Cloud Contract), versioning event schema (schema registry, tương thích ngược), chia nhỏ monolith: xác định ranh giới service (DDD bounded context).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-microservices.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-microservices.js logs/tmp-T1584.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added 6 questions: `microservices-064` (senior, API Gateway vs Service Mesh, north-south/east-west, mTLS sidecar), `microservices-065` (senior, distributed tracing, trace context W3C traceparent, HTTP/Kafka propagation, sampling), `microservices-066` (mid, centralized config: env vars vs ConfigMap/Secret vs Spring Cloud Config, secret handling/refresh), `microservices-067` (senior, contract testing Pact/Spring Cloud Contract, CDC flow, can-i-deploy), `microservices-068` (lead, Kafka event schema versioning with Schema Registry, Avro, backward/forward/full compatibility), `microservices-069` (lead, monolith decomposition, DDD bounded context, Strangler Fig).
- Appended via `node scripts/qtool.js append js/data/q-microservices.js logs/tmp-T1584.js`.
- Ran `node scripts/build-light-index.js` and `node scripts/validate.js` → `OK — không có lỗi.` (fixed traceparent example angle brackets to avoid raw-HTML warning). No git commit. Only owned files changed.
Reviewed-by: kilo (T1584R)
