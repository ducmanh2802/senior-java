# T578 — 5 câu jvm + 4 câu concurrency chuyên sâu

Status: DONE
Agent: qoder
Owns: `js/data/q-concurrency-jvm.js`

Thêm **5 câu topic jvm** và **4 câu topic concurrency**, level senior/lead, phong cách "production + vì sao". Gợi ý góc (chọn cái chưa có):
- jvm: Pod Java bị OOMKilled dù heap chỉ dùng 60%: native memory (metaspace, thread stack, direct buffer, code cache, malloc arena), NMT (`-XX:NativeMemoryTracking=summary`, `jcmd <pid> VM.native_memory summary`), đặt `MaxRAMPercentage`.
- jvm: Chọn G1 hay generational ZGC (JDK 21+) cho API p99 < 50 ms heap 16 GB: đo gì, đánh đổi throughput/CPU/footprint.
- jvm: Dùng JFR + async-profiler tìm nguyên nhân CPU cao / allocation rate cao; đọc flame graph thế nào.
- jvm: Giảm startup/warm-up trên K8s: CDS/AppCDS, JIT warm-up, CRaC (nói rõ trạng thái hỗ trợ), GraalVM native image: trade-off.
- jvm: Leak qua ClassLoader / ThreadLocal khi hot-redeploy: cơ chế, chứng minh bằng heap dump (dominator tree, GC root path).
- concurrency: Virtual threads pinning: nguyên nhân, JDK 24 (JEP 491) đổi gì với `synchronized`, native/JNI vẫn pin; khi nào KHÔNG nên dùng virtual threads.
- concurrency: Chuyển service blocking sang virtual threads làm DB connection pool cạn: vì sao, giới hạn bằng Semaphore.
- concurrency: Structured concurrency (preview) + ScopedValue (final ở JDK 25, JEP 506) so với ThreadLocal; nói rõ trạng thái preview.
- concurrency: CompletableFuture trong Spring: commonPool mặc định, mất context (MDC/SecurityContext/transaction), timeout và cancel.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6 và docs/PLAN-v4-deep.md. Người đọc: dev Java 4 năm, cần giải thích **từ gốc, rất chi tiết**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-concurrency-jvm.js`; id tiếp nối số lớn nhất hiện có của topic. Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**. Trùng thì chọn góc khác cùng mảng.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (cơ chế bên trong, ví dụ code/số liệu, bảng trade-off, pitfall production) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Đúng kỹ thuật với Java 17/21 (có thể nhắc 25 LTS), Spring Boot 3.x. Không bịa flag/API; không chắc thì bỏ.
- Không backtick, không `${` trong template literal.
- `refs` tuỳ chọn, chỉ link chính thức chắc chắn tồn tại; có refs thì chạy `node scripts/check-links.mjs js/data/q-concurrency-jvm.js`.

## Nghiệm thu
`node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
Thêm 5 câu JVM (jvm-028, jvm-029, jvm-030, jvm-031, jvm-032) và 4 câu concurrency (concurrency-008, concurrency-009, concurrency-010, concurrency-011). Chạy build-light-index.js và validate.js → OK.
Reviewed-by: kilo (T578R)
