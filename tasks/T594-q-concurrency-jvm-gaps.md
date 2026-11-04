# T594 — 8 câu concurrency + JVM (đợt 2)

Status: DONE
Agent: kilo
Owns: `js/data/q-concurrency-jvm.js`

Thêm 8 câu (4 concurrency, 4 jvm), level senior/lead. Gợi ý góc (chọn cái chưa có):
- concurrency: CompletableFuture trong service gọi 3 API song song: executor nào, timeout (orTimeout), xử lý lỗi từng nhánh, tránh chặn ForkJoinPool.commonPool.
- concurrency: Java Memory Model thực tế: happens-before, volatile vs AtomicLong vs LongAdder, double-checked locking, publish object an toàn.
- concurrency: Sizing thread pool cho Tomcat + HikariCP + @Async; queue không giới hạn gây OOM; RejectedExecutionHandler.
- concurrency: Structured concurrency / ScopedValue (preview ở 21) — ý tưởng, so với CompletableFuture; nói rõ trạng thái preview.
- jvm: Đọc GC log G1 (Pause Young, Mixed, Humongous allocation, To-space exhausted) và tuning bước đầu; khi nào cân nhắc ZGC generational.
- jvm: JIT: tiered compilation, warm-up, deoptimization; vì sao benchmark bằng System.nanoTime sai, JMH làm gì.
- jvm: Class loading và Metaspace leak (redeploy, dynamic proxy, Groovy/scripting); OutOfMemoryError: Metaspace điều tra thế nào.
- jvm: Khởi động nhanh cho Spring Boot trên K8s: CDS/AppCDS, Spring AOT, CRaC, GraalVM native image — trade-off.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, ít va chạm thực tế, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-concurrency-jvm.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic (grep "topic: '<id>'") để **không trùng ý**. Góc gợi ý nào đã có thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/q-concurrency-jvm.js`.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Đã thêm 8 câu: concurrency-034..037, jvm-033..036.
Reviewed-by: kilo (T594R)
