# T1578 — Kiến thức: 2 bài học (concurrency) vào lessons-concurrency.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`

Thêm **2 bài học mới** (track `concurrency`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: Java Memory Model và volatile/happens-before (bài tập: sửa lỗi visibility có test lặp nhiều lần); ExecutorService và shutdown đúng cách (bài tập).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-concurrency.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-concurrency.js logs/tmp-T1578.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm lesson-concurrency-014 (order 14, JMM/volatile/happens-before) và lesson-concurrency-015 (order 15, ExecutorService/graceful shutdown).
- Sửa test của lesson-concurrency-014: `VisibilityPair p` được khởi tạo bên trong vòng lặp 100 round (gốc khởi tạo bên ngoài khiến ready=true lưu lại giữa các round, reader trả về data cũ).
- Kết quả: validate OK; test-lessons 014 → 3/3, 015 → 3/3.
Reviewed-by: kilo (T1578R)
