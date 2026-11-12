# T1564 — Bài học kiến trúc: CQRS read model và saga orchestration

Status: DONE
Agent: kilo
Owns: `js/data/lessons-architecture.js`

Thêm **2 bài học mới** (track `architecture`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: bài 1: CQRS với read model cập nhật từ event (bài tập: projector cập nhật view từ danh sách event, xử lý event trùng và sai thứ tự); bài 2: saga orchestration cho đặt hàng (bài tập: orchestrator gọi các bước giả, bước lỗi thì chạy compensation theo thứ tự ngược).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-architecture.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-architecture.js logs/tmp-T1564.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added: `lesson-architecture-011` (CQRS + projector, xử lý event trùng/sai thứ tự, 1 exercise, 3 check, related: architecture-001, architecture-005, microservices-006), `lesson-architecture-012` (Saga orchestration đặt hàng, compensation ngược, 1 exercise, 3 check, related: architecture-001, architecture-006, microservices-005, microservices-006).
- `node scripts/build-light-index.js` OK, `node scripts/validate.js` → `OK — không có lỗi.` (có warning path.js hiện có), `node scripts/test-lessons.js` → `Lesson exercises OK: 233/233 (210 bài học, 231 từ cache)`.
- Only modified `js/data/lessons-architecture.js` and this task file (plus temp scripts/files in `logs/` used for generation). No commit. No processes killed by name, no browser opened.
Reviewed-by: kilo (T1564R)
