# T1587 — Trắc nghiệm: 15 câu system design và AI system

Status: DONE
Agent: kilo
Owns: `js/data/quiz-design.js`

Thêm **15 câu trắc nghiệm tình huống** vào `js/data/quiz-design.js` (topic design hoặc architecture, id nối tiếp): khoảng 10 câu system design kinh điển (cache, sharding, queue, consistency, rate limit) và 5 câu thiết kế hệ thống có LLM (RAG, chi phí, độ trễ, fallback). Khoảng 10 câu một đáp án, 5 câu multi (Chọn 2); explain tiếng Việt giải thích vì sao đúng và vì sao từng phương án sai. Theo schema AGENTS.md mục 4; đọc các câu có sẵn để không trùng.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/quiz-design.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/quiz-design.js logs/tmp-T1587.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added 15 questions (topic `design`), IDs: `qz-design-021`..`qz-design-035`.
- 10 single-answer: qz-design-021 (rate limiting/token bucket), qz-design-023 (sharding/hash user_id), qz-design-024 (strong vs eventual consistency/transfer), qz-design-026 (Kafka key/partition ordering), qz-design-027 (read-heavy cache+read replica), qz-design-029 (replication lag/read-after-write), qz-design-030 (CDN static vs dynamic), qz-design-032 (LLM cost optimization), qz-design-033 (LLM streaming/TTFT), qz-design-035 (LLM fallback/degrade gracefully).
- 5 multi (Chọn 2): qz-design-022 (queue reliability/idempotency+ack, answer [0,3]), qz-design-025 (cache-aside invalidate+TTL, answer [0,3]), qz-design-028 (circuit breaker+timeout/bulkhead, answer [0,2]), qz-design-031 (RAG chunking/retrieval improvements, answer [0,2]), qz-design-034 (LLM tool-calling safety/authz+validate/audit, answer [0,2]).
- Scope covered: classic system design (rate limit, queue, sharding, consistency, cache, read scaling, resilience, replication, CDN) and LLM system design (RAG, cost, latency/streaming, tool-calling safety, fallback).
- Explain viết chi tiết tiếng Việt cho dev ~4 năm, giải thích thuật ngữ, có ví dụ/số liệu/production case và trả lời phỏng vấn; không dùng backtick và không dùng `${`.
- Commands: `node scripts/build-light-index.js` → rebuilt index-light; `node scripts/validate.js` → `OK — không có lỗi.` No git commit. Temp build files created under `logs/` (not owned) can be ignored/cleaned by integrator.
Reviewed-by: kilo (T1587R)
