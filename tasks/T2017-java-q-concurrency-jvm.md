# T2017 — 8 câu hỏi Senior Java (concurrency, jvm) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T1701

Thêm **8 câu hỏi phỏng vấn mới** (topic: concurrency, jvm) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: BlockingQueue các loại và producer–consumer, Semaphore/CountDownLatch/CyclicBarrier/Phaser chọn cái nào, ThreadPoolExecutor tham số và RejectedExecutionHandler, interrupt đúng cách và khôi phục cờ interrupt, AtomicLong vs LongAdder dưới tải cao, structured concurrency và scoped values (Java 21 preview, nói rõ trạng thái preview), JIT tiered compilation và warm-up khi deploy, container-aware JVM (cgroup, ActiveProcessorCount).

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

- Đã thêm 8 câu (concurrency-068 … concurrency-072, jvm-056 … jvm-058):
  - concurrency-068 senior — chọn loại BlockingQueue + tính capacity theo Little's law + chính sách khi queue đầy (có poison pill).
  - concurrency-069 senior — Semaphore / CountDownLatch / CyclicBarrier / Phaser: chọn theo ngữ nghĩa, bẫy BrokenBarrierException, await có timeout.
  - concurrency-070 senior — ThreadPoolExecutor: ctl, thứ tự execute(), 6 tham số, RejectedExecutionHandler, metric + cảnh báo, getLargestPoolSize.
  - concurrency-071 senior — interrupt đúng cách: vòng đời cờ, bảng điểm blocking không interruptible, shutdown/shutdownNow/awaitTermination, Future vs CompletableFuture.cancel.
  - concurrency-072 lead — AtomicLong vs LongAdder: Striped64 từng bước, bảng số JMH theo số thread, khi nào LongAdder sai (hạn mức/số tiền), đọc thường xuyên.
  - jvm-056 senior — tiered compilation (tier 0–4, OSR, deopt) + quy trình warm-up + JFR/CITime đo lường, ví dụ số liệu p99 sau deploy.
  - jvm-057 senior — JVM container-aware: cgroup v1/v2, MaxRAMPercentage, ActiveProcessorCount/availableProcessors, ngân sách bộ nhớ ngoài heap, OOMKilled vs OutOfMemoryError, MALLOC_ARENA_MAX.
  - jvm-058 lead — structured concurrency + scoped values: Java 21 preview (JEP 453/446), trạng thái đến JDK 25/27 (JEP 505/506/533/543), khác biệt với CompletableFuture/ThreadLocal, giới hạn khi lên production.
- Ghi chú lần chạy trước: file bị cắt giữa (8 mục 068–071, jvm-056–059 viết lỗi: backtick trong template literal, thiếu follow/tags đúng schema, có ký tự Trung, tiêu đề ### nằm trong đáp án). Đã hoàn nguyên phần đuôi về HEAD rồi viết lại 8 mục mới theo schema AGENTS.md mục 4 (chỉ thêm, không sửa mục cũ).
- Nghiệm thu: `node --check js/data/q-concurrency-jvm.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ của path.js, không thuộc task này). Không commit.
Reviewed-by: kilo (T2017R)
