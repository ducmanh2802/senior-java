# T1535 — Bài học AI agent (2/2): RAG và đánh giá agent

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`
After: T1534

Thêm **2 bài học mới** (track `ai`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: bài 1: RAG cơ bản (bài tập: chunking văn bản có overlap, tìm top-k theo cosine similarity trên vector cho sẵn, ghép context có trích nguồn); bài 2: đánh giá agent (bài tập: chạy eval set, tính pass rate, so sánh 2 phiên bản prompt, phát hiện regression).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-ai.js logs/tmp-T1535.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added `lesson-ai-009` (RAG: chunking overlap, cosine top-k, citation context) and `lesson-ai-010` (FakeLlm eval set, pass rate, prompt regression).
- `node scripts/test-lessons.js`: 229/229; `node scripts/build-light-index.js` completed; `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: kilo (T1535R)
