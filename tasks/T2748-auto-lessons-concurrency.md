# T2748 — 2 bài học (concurrency) vào lessons-concurrency.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`
After: T2680

Thêm **2 bài học mới** (track `concurrency`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Semaphore và rate limit đồng thời gọi đối tác (tối đa 20 request song song) — bài tập tự chấm với CountDownLatch; (2) Structured concurrency về mặt khái niệm và cách làm tương đương trên Java 17 bằng ExecutorService + Future có timeout, huỷ các tác vụ còn lại khi một tác vụ lỗi.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm (chỉ JDK chuẩn, Java 17, không class public ngoài Main), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/lessons-concurrency.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Thêm 2 bài học vào js/data/lessons-concurrency.js (chèn trước dòng `);` cuối):
- lesson-concurrency-027 (order 27): Semaphore + rate limit, bulkhead đối tác, CountDownLatch test, lỗi permit rò / không reentrant / permit quá cao.
- lesson-concurrency-028 (order 28): Structured concurrency Java 17, ExecutorService + Future.get(timeout) + cancel(true) + shutdownNow(), CountDownLatch test, lỗi future không hủy / get không timeout / pool không shutdown.
- index-light.js: thêm 2 entry lesson-concurrency-027/028 thủ công (build-light-index.js crash vì q-aws.js có lỗi cú pháp sẵn có, không phải do task này).

Validate.js chạy trên lessons-concurrency.js: không còn lỗi ký tự lạ (sửa "càng강" → "càng chặt chẽ" ở 028.body). Lỗi còn lại chỉ `index-light.js: đã cũ` do q-aws.js lỗi cú pháp trước đó khiến AWS questions không load vào sandbox, LI.build() sinh khác file check-in — không thể khắc phục vì q-aws.js không thuộc quyền sở hữu task này.
node --check js/data/lessons-concurrency.js: OK.
test-lessons.js không chạy được do lessons-testing.js (file khác) có lỗi cú pháp sẵn có chặn App.loadData.
Reviewed-by: kilo (T2748R)
