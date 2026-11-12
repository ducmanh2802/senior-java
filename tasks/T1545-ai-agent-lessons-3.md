# T1545 — Bài học AI agent (3): memory hội thoại và MCP server

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`

Thêm **2 bài học mới** (track `ai`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: bài 1: memory cho agent (bài tập: cửa sổ hội thoại có giới hạn token, tóm tắt phần cũ bằng summarizer giả, giữ thông tin quan trọng); bài 2: viết một MCP-style tool server bằng Java thuần (bài tập: registry tool có name/description/schema, xử lý request list_tools và call_tool dạng JSON, trả lỗi có cấu trúc).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-ai.js logs/tmp-T1545.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `lesson-ai-011` (memory hội thoại) và `lesson-ai-012` (MCP-style tool server).
- Đã rebuild `js/data/index-light.js`; `node scripts/validate.js` báo `OK — không có lỗi.` và `node scripts/test-lessons.js` pass 231/231.
Reviewed-by: kilo (T1545R)
