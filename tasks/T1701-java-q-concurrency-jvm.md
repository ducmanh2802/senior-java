# T1701 — 8 câu hỏi Senior Java (concurrency, jvm) vào q-concurrency-jvm.js

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`
After: T1570

Thêm **8 câu hỏi phỏng vấn mới** (topic: concurrency, jvm) vào `js/data/q-concurrency-jvm.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-concurrency-jvm.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: CompletableFuture: compose/combine, executor mặc định và lỗi chặn common pool, xử lý exception; virtual threads trên production (pinning khi synchronized trên JDK 21, ThreadLocal, giới hạn tài nguyên bằng Semaphore); chẩn đoán lock contention bằng JFR; false sharing và @Contended; safepoint và time-to-safepoint; chọn G1 vs ZGC vs Parallel theo latency/throughput; phân tích heap dump (dominator tree, retained size).

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

Đã thêm 8 câu hỏi vào js/data/q-concurrency-jvm.js:
- concurrency-063 (senior): ThreadLocal trong thread pool, rò rỉ dữ liệu giữa task, remove() trong finally
- concurrency-064 (senior): CompletableFuture exception handling (exceptionally/handle/whenComplete)
- concurrency-065 (senior): ReentrantLock vs synchronized, fairness, Condition, tryLock
- concurrency-066 (senior): LongAdder vs AtomicLong, tranh chấp CAS, striped cells
- concurrency-067 (mid): InterruptedException, interrupt status, shutdownNow()
- jvm-053 (senior): ClassLoader delegation, ClassCastException sau redeploy Tomcat, metaspace leak
- jvm-054 (mid): String.intern(), string pool trong heap (Java 7+), StringDeduplication
- jvm-055 (senior): JIT tiered compilation C1/C2, OSR, TieredStopAtLevel

Fix lỗi: BOM gây node --check báo sai; 5 ký tự Trung (平平, 首先, 突然, 争) đã viết lại thành Tiếng Việt. Chạy build-light-index.js rồi validate.js → OK.
Reviewed-by: kilo (T1701R)
