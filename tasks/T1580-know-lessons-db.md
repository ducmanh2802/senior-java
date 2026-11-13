# T1580 — Kiến thức: 2 bài học (db) vào lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`

Thêm **2 bài học mới** (track `db`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: index composite và thứ tự cột (bài tập mô phỏng tìm kiếm trên index sắp xếp); isolation level và các anomaly (bài tập mô phỏng non-repeatable read và phantom).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-db.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-db.js logs/tmp-T1580.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài (order 12, 13) vào `js/data/lessons-db.js`:
  - `lesson-db-012` — Index composite và thứ tự cột (leftmost prefix, selectivity, chi phí ghi). Bài tập `CompositeIndex`: mô phỏng seek trên index sắp theo (a,b) vs (b,a), so sánh `examined`/`matched`. 7 test case, reference pass 7/7, starter biên dịch được và không pass hết.
  - `lesson-db-013` — Non-repeatable read và phantom: mô phỏng lịch giao dịch và snapshot (RC vs RR). Bài tập `IsolationSim` với `nonRepeatableRead` và `phantom`. 7 test case, reference pass 7/7, starter biên dịch được và không pass hết.
- Related dùng id có thật: 012 → db-001, db-022, db-023; 013 → db-002, db-033, db-034.
- `node scripts/build-light-index.js` đã chạy (cập nhật `js/data/index-light.js`).
- `node scripts/validate.js lessons-db.js` → `OK — không có lỗi.`
- `node scripts/test-lessons.js lesson-db-012` và `lesson-db-013` → `Lesson exercises OK: 1/1` mỗi bài.
- Lưu ý: `node scripts/validate.js` (toàn repo) hiện còn 3 lỗi thuộc `lessons-concurrency.js` (`lesson-concurrency-012.body`: inline code lồng `{ }`) — đây là file của task khác (T1578, đang TODO) trong working tree, ngoài phạm vi sở hữu của T1580 nên không sửa. Các bài của T1580 không sinh lỗi nào.
- Chưa commit (theo luật).
Reviewed-by: kilo (T1580R)
