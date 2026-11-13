# T1533 — AI agent: 6 câu hỏi vận hành agent trên production (3/3)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T1532

Thêm **6 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: đánh giá agent (eval set, LLM-as-judge, regression khi đổi prompt/model); observability (trace từng bước, token, latency, chi phí); bảo mật: prompt injection qua dữ liệu tool, phân quyền tool, sandbox; kiểm soát chi phí (prompt caching, chọn model theo bước, giới hạn budget); xử lý lỗi và timeout của LLM API (retry, fallback model, rate limit 429/529); triển khai và rollout an toàn (feature flag, shadow mode).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1533.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added 6 questions: `ai-065` (eval/regression, LLM-as-judge, canary, senior), `ai-066` (observability: trace/span/token/latency/cost, seq diagram, senior), `ai-067` (prompt injection qua tool data, least privilege, sandbox, human approval, lead), `ai-068` (prompt caching, model routing, budget/cost control, lead), `ai-069` (LLM API timeout/429/529, retry/backoff+jitter, fallback, senior), `ai-070` (feature flag, shadow mode, canary rollout, kill switch, lead).
- Appended via `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1533.js`; ran `node scripts/build-light-index.js` and `node scripts/validate.js` → `OK — không có lỗi.` (warnings unchanged, ai topic now 70 questions). No other files modified. No git commands run. Temp file `logs/tmp-T1533.js` left in place (workspace artifact).
Reviewed-by: kilo (T1533R)
