# T1586 — Bài học AI agent (4): gọi LLM API tin cậy và đánh giá RAG

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`

Thêm **2 bài học mới** (track `ai`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: bài 1: gọi LLM API tin cậy (bài tập: retry có exponential backoff + jitter cho lỗi 429/529, timeout, circuit breaker đơn giản, fallback sang model phụ; client giả lập lỗi theo kịch bản); bài 2: đánh giá RAG (bài tập: tính recall@k và precision của retrieval trên bộ câu hỏi có nhãn, so sánh 2 cách chunking).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-ai.js logs/tmp-T1586.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài: `lesson-ai-013` (Gọi LLM API tin cậy: retry, timeout, circuit breaker và fallback) và `lesson-ai-014` (Đánh giá RAG: đo recall@k, precision và so sánh cách chunking).
- Mỗi bài có 1 exercise Java thuần tự chấm với `ScriptedLlmClient` giả lập / mô phỏng retrieval, tests deterministic (≥ 5 case), reference pass 100%, starter biên dịch được và không pass hết.
- Đã chạy: `node scripts/build-light-index.js`, `node scripts/validate.js` → `OK — không có lỗi.`, `node scripts/test-lessons.js` → `Lesson exercises OK: 247/247`.
- Không sửa file khác ngoài `js/data/lessons-ai.js` và `tasks/T1586-lessons-ai-4.md`; không commit.
Reviewed-by: kilo (T1586R)
