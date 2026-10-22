# T47 — Nội dung: Concurrency & JVM (đợt 2)

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `concurrency`: thêm 7 câu (đang có 13 → mục tiêu ≥ 20)
- ForkJoinPool và work stealing; vì sao parallel stream dùng chung commonPool là nguy hiểm trên server
- Producer–consumer với {{BlockingQueue}}, backpressure, chọn bounded queue và chính sách khi đầy
- Interrupt: {{InterruptedException}} xử lý đúng (khôi phục cờ), huỷ task, {{Future.cancel}}
- {{wait/notify}} vs {{Condition}}, spurious wakeup, vì sao luôn kiểm tra điều kiện trong vòng lặp
- Safe publication và immutability: vì sao object không được publish an toàn có thể bị thấy nửa vời; {{final}} field semantics
- False sharing, cache line, {{@Contended}}; đo bằng JMH
- Graceful shutdown executor: {{shutdown}} vs {{shutdownNow}}, {{awaitTermination}}; {{ScheduledExecutorService}} nuốt exception làm job ngừng chạy

### topic `jvm`: thêm 7 câu (đang có 11 → mục tiêu ≥ 18)
- JFR + JMC: bật continuous profiling trên production, overhead, các event quan trọng
- Đọc heap dump: dominator tree, shallow vs retained size, GC roots path; quy trình tìm leak bằng MAT
- Native Memory Tracking: RSS cao hơn heap nhiều — metaspace, thread stack, direct buffer, code cache, glibc malloc arenas
- Bộ JVM flags baseline cho service Spring Boot trên container (heap %, GC, OOM dump, GC log, exit on OOM) và lý do từng flag
- Reference types: Soft/Weak/Phantom, {{ReferenceQueue}}, vì sao SoftReference cache là ý tồi
- Startup time: CDS/AppCDS, Spring AOT, CRaC, GraalVM native — so sánh và khi nào đáng làm
- async-profiler: CPU vs wall-clock vs alloc vs lock mode, đọc flame graph để tìm hot path

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
Đã thêm 7 câu cho concurrency (014-020) và 7 câu cho jvm (012-018). Tổng cộng concurrency: 20 câu, jvm: 18 câu. Validator OK.
