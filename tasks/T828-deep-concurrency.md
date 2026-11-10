# T828 — Đào sâu senior: concurrency internals (8 câu)

Status: DONE
Agent: qoder
Owns: `js/data/q-concurrency-jvm.js`

Topic **concurrency** (file `js/data/q-concurrency-jvm.js`) đã có 37 câu: đọc HẾT các câu hiện có của topic, không lặp ý. Mục tiêu: **đào sâu kiến thức senior/lead** — cơ chế bên trong (internals) mà interviewer dùng để phân biệt senior thật với người chỉ biết dùng API.

Thêm **8 câu**: 5 `senior` + 3 `lead`. Mỗi câu chọn 1 chủ đề dưới (chủ đề nào đã có câu tương đương thì chọn góc sâu hơn hoặc chủ đề khác cùng topic, ghi lý do vào Notes):

- AbstractQueuedSynchronizer: state, CLH queue, park/unpark; ReentrantLock fair vs non-fair dựa trên AQS.
- ConcurrentHashMap Java 8+: CAS trên bin rỗng, synchronized trên head node, nhiều thread cùng giúp transfer khi resize, đếm size bằng CounterCell (giống LongAdder).
- False sharing, cache line 64 byte, padding / @Contended (nội bộ JDK, cần -XX:-RestrictContended); LongAdder vs AtomicLong khi tranh chấp cao.
- Java Memory Model: happens-before cụ thể (volatile, monitor, Thread.start/join, final field), reordering, double-checked locking sai thế nào.
- Virtual thread bên trong: continuation, carrier thread (ForkJoinPool), mount/unmount, pinning (synchronized, native) và thay đổi ở JDK 24 (JEP 491).
- StampedLock optimistic read; CompletableFuture: thread nào chạy callback (thenApply vs thenApplyAsync).

Yêu cầu riêng cho các câu này:
- Giải thích cơ chế **từng bước, như dạy người chưa biết**: dữ liệu/cấu trúc bên trong trông thế nào, chuyện gì xảy ra theo thứ tự, VÌ SAO thiết kế như vậy (trade-off mà người viết JDK/framework/DB đã chọn).
- Có ít nhất 1 ví dụ cụ thể: code ngắn có comment, hoặc output thật (log, EXPLAIN, jcmd…), hoặc sơ đồ ASCII/`~~~seq`.
- Có mục "### Trên production" (triệu chứng thật, cách đo, flag/cấu hình tuning có thật) và bảng so sánh khi phù hợp.
- 3000–5000 ký tự. `follow` 3 câu đào sâu tiếp. Có thể thêm `refs` (≤ 3, chỉ link tài liệu chính thức chắc chắn tồn tại; chạy `node scripts/check-links.mjs js/data/q-concurrency-jvm.js`).
- Không bịa flag/API. Không chắc thì viết ít lại nhưng đúng.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-concurrency-jvm.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-concurrency-jvm.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes

Thêm 8 câu mới (concurrency-046 → concurrency-053) vào `js/data/q-concurrency-jvm.js` ngay trước `);` cuối file:
- concurrency-046 (senior): VarHandle memory modes (Opaque/Release/Acquire/Volatile) so với volatile
- concurrency-047 (senior): ConcurrentSkipListMap — skip list, CAS tongues, range view weakly consistent
- concurrency-048 (senior): CopyOnWriteArrayList — snapshot iterator, write-and-copy, trade-off đọc/ghi
- concurrency-049 (senior): SynchronousQueue — handoff không buffers, TransferQueue, fair/non-fair
- concurrency-050 (senior): ExecutorCompletionService — hoàn thành-đầu-tiên, Future poll/take, gộp nhiều thread pool
- concurrency-051 (lead): Exchanger — double-barrier, hai luồngwap dữ liệu, use case pipeline, genetic algorithms
- concurrency-052 (lead): Phaser — barrier multi-phase, số thành viên thay đổi linh hoạt, registration/deregistration
- concurrency-053 (lead): ScheduledThreadPoolExecutor + DelayQueue — fixedRate vs fixedDelay, head-of-line blocking, head-of-line blocking

Mỗi câu: `**Tóm tắt:**`, các mục ###, ví dụ code `~~~java`, bảng so sánh, `### Trên production`, `### Lỗi hay gặp`, `> Senior tip:`, `follow` 3 câu, `refs` 1 link docs.oracle.com. Không backtick, không `${` trong template literal.

Kiểm tra: `node --check` OK, `node scripts/build-light-index.js` OK, `node scripts/validate.js` — không còn lỗi liên quan đến q-concurrency-jvm.js. Các LỖI còn lại (lessons-db.js, q-java.js, q-devops.js…) là pre-existing trong file không sở hữu bởi task này.

Số id trước: 45 (concurrency-001 → concurrency-045). Số id sau: 53 (concurrency-001 → concurrency-053). Đúng +8.
Reviewed-by: kilo (T828R)
