# T1719 — Bài học: queue cho tác vụ AI dài và bulkhead

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`

Thêm **2 bài học mới** (track `microservices`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: bài 1: xử lý tác vụ AI dài qua hàng đợi (bài tập: job queue với trạng thái PENDING/RUNNING/DONE/FAILED, worker xử lý, retry có giới hạn, client poll kết quả); bài 2: bulkhead giới hạn số request đồng thời tới dịch vụ chậm (bài tập: semaphore theo dependency, từ chối nhanh khi đầy).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

> **Quan trọng:** KHÔNG đọc toàn bộ `js/data/lessons-microservices.js` (file lớn, sẽ hết lượt). Xem danh sách bằng `node scripts/qtool.js list js/data/lessons-microservices.js`, xem một mục mẫu bằng `node scripts/qtool.js show js/data/lessons-microservices.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-microservices.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-microservices.js logs/tmp-T1719.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- File `js/data/lessons-microservices.js` đã có sẵn 2 bài `lesson-microservices-012` (job queue tác vụ AI dài) và `lesson-microservices-013` (bulkhead/semaphore per dependency) từ lần chạy trước bị gián đoạn. Tôi đã đọc lại, giữ phần tốt, sửa lỗi cú pháp và hoàn thiện phần còn thiếu (không thêm bài mới vì id/-012,-013 đã tồn tại với đúng 2 chủ đề của task):
  * -012.body: ` ``` ` → `~~~` (4 chỗ), `-->>` → `-->` (3 chỗ, parseSeq sẽ tạo actor ảo).
  * -012 ex1 tests: `main` thiếu `throws Exception`; `latch.await()` nằm trong lambda `check` → bọc try/catch InterruptedException.
  * -012 ex2 starter/reference: bổ sung class `JobQueue` (stub và đầy đủ) để `AiWorker` compile độc lập.
  * -012 ex2 tests: `check("...", boolean)` không compild (`check` trả void) → đổi thành `eq(true, ...)` (3 chỗ); `Thread.sleep`/`t.join` trong lambda → bọc try/catch; starter thiếu `import java.io.IOException`.
  * -013 ex1 tests: `main` thiếu `throws Exception`; `latch.await()` trong lambda → try/catch; bỏ gọi `getOrContainer` private (dùng public `getMetrics`); sửa `available` sai (3 permits × 3 acquire = 0, không phải 1); `eq(1, long)` sai do autoboxing → `1L`; `substring(0,27)` trên chuỗi 26 ký tự → lấy toàn bộ message.
  * -013 ex2 starter/reference: bổ sung `BulkheadFullException`, `Bulkhead`, `BulkheadRegistry` (stub và đầy đủ) để `BulkheadHttpClient` compile; tests viết lại thành 3 case deterministic (không dùng luồng ngẫu nhiên, không release permit khi chưa acquire).
* `node scripts/test-lessons.js lesson-microservices-012` → 2/2 OK; `lesson-microservices-013` → 2/2 OK. Reference pass 100% (≥3 case), starter biên dịch được và không pass hết.
* `node scripts/build-light-index.js` → OK; `node scripts/qtool.js check js/data/lessons-microservices.js` → OK.
* `node scripts/validate.js` toàn repo: file của T1719 không lỗi. Lỗi còn lại `q-ai.js: ai-109.a: code fence ~~~ chưa đóng` là của task khác (tôi không sở hữu `q-ai.js`, không sửa theo luật 3 AGENTS.md).
* KHÔNG git commit / KHÔNG tạo branch.
Reviewed-by: kilo (T1719R)
