# T2430 — 5 câu hỏi Senior Java (concurrency) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T2377

Thêm **5 câu hỏi phỏng vấn mới** (topic: concurrency) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: concurrency trong xử lý task/event: thread pool sizing cho IO vs CPU, BlockingQueue và backpressure, CompletableFuture fan-out có timeout, ConcurrentHashMap compute cho đếm/khóa theo key, virtual threads Java 21 cho IO-bound và pinning.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 5 câu mới vào cuối `js/data/q-concurrency-jvm.js` (file này sau khi append có concurrency-001..089; id lớn nhất trước khi thêm là concurrency-084, không làm mất mục nào):

- `concurrency-085` (senior) — vì sao pool chung CPU-bound + I/O-bound gây head-of-line blocking; bulkhead, Little law, trần là connection pool; 2 pool riêng + queue hữu hạn; đo queue wait/active để chọn size.
- `concurrency-086` (senior) — chọn BlockingQueue theo mục đích (ArrayBlockingQueue/LinkedBlockingQueue/SynchronousQueue/PriorityBlockingQueue/DelayQueue/LinkedTransferQueue); 3 kiểu backpressure (put, offer+timeout, drainTo theo lô); queue dài nên tính theo giây dữ liệu; dừng consumer sạch.
- `concurrency-087` (senior) — fan-out CompletableFuture: allOf không có deadline/huỷ, `cancel` không interrupt, `orTimeout`/`completeOnTimeout` chỉ đổi trạng thái future; deadline 3 lớp (client timeout + get timeout + cancel), Semaphore giới hạn đồng thời, tránh commonPool.
- `concurrency-088` (senior) — ConcurrentHashMap khoá theo bin trong `compute`; đếm bằng `merge`/LongAdder (không get+put); không I/O và không sửa map trong hàm mapping; lock striping khi cần loại trừ suốt quá trình; pitfall entry leak.
- `concurrency-089` (lead) — chuyển Spring Boot 3.2/Java 21 sang virtual thread: carrier/mount/unmount, không pool virtual thread, Semaphore thay pool, ThreadLocal bùng nổ, pinning do `synchronized`/`Object.wait` trên JDK 21, phát hiện bằng `-Djdk.tracePinnedThreads` và JFR `jdk.VirtualThreadPinned`, sửa bằng ReentrantLock hoặc JDK 24 (JEP 491).

Mỗi câu có `**Tóm tắt:**`, giải thích thuật ngữ từ đầu, cơ chế từng bước, code Java ≤ 30 dòng (hoặc sơ đồ ASCII), bảng trade-off, pitfall production, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn` ~150–170 từ, `> Senior tip:`, `follow` 3 câu. Không backtick, không `${`.

Kiểm tra: `node --check js/data/q-concurrency-jvm.js` OK; `node scripts/build-light-index.js` chạy xong; `node scripts/validate.js q-concurrency-jvm.js` → `OK — không có lỗi.`
Lưu ý: `node scripts/validate.js` (toàn repo) hiện vẫn báo 2 lỗi **của file người khác**, nằm ngoài quyền sở hữu của task này nên không sửa: `quiz_backup.js` (file không khai báo trong data-manifest) và `labs-sql.js` (lỗi cú pháp `Unexpected identifier 'artifacts'`, thuộc T2422 đang TODO). Cảnh báo `concurrency-081/083/084` là các mục có sẵn từ trước, không phải nội dung của task này.
Reviewed-by: kilo (T2430R)
