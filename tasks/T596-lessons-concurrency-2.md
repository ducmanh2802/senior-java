# T596 — 2 bài học concurrency có bài tập tự chấm

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`

Thêm 2 bài (track concurrency):
1. **CompletableFuture từ gốc**: supplyAsync, thenApply/thenCompose/thenCombine, allOf, exceptionally/handle, executor riêng, timeout. Bài tập: `PriceAggregator.best(List<Supplier<Integer>> sources, Executor ex)` gọi song song, bỏ qua nguồn lỗi, trả giá nhỏ nhất; ném exception khi mọi nguồn lỗi. Test dùng executor cố định, không sleep.
2. **Rate limiter & Semaphore**: token bucket, sliding window, Semaphore giới hạn concurrency. Bài tập: `TokenBucket(capacity, refillPerSecond, LongSupplier clockNanos)` với `tryAcquire()`; test điều khiển đồng hồ giả (deterministic) + 1 test đa luồng đếm số permit cấp ra không vượt capacity.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-concurrency.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

**Đã thêm 2 bài vào cuối mảng `window.LESSONS` trong `js/data/lessons-concurrency.js`** (không sửa bài cũ — các bài 1..5 giữ nguyên):

1. `lesson-concurrency-006` — *CompletableFuture từ gốc: hộp kết quả, callback và cách nối việc* (order 6, mid, 40 phút).
   Body: chi phí của việc chờ (blocking), mô hình "hộp" + `complete`, `thenApply` vs `thenCompose` (so cặp `map`/`flatMap`), `thenCombine`/`allOf`/`anyOf`, callback chạy trên thread nào, executor mặc định `ForkJoinPool.commonPool()` và tai hại khi bỏ I/O chặn vào đó (bảng loại việc → pool), chuỗi lỗi + `exceptionally`/`handle`/`whenComplete`, `CompletionException` vs `ExecutionException`, `orTimeout`/`completeOnTimeout` (không dừng được việc bên dưới), starvation deadlock, mất MDC/ThreadLocal. Kết bằng "### Liên hệ phỏng vấn".
   1 bài tập: `PriceAggregator.best(List<Supplier<Integer>>, Executor)` — phát song song, chuẩn hoá nguồn lỗi về null bằng `handle`, `allOf(...).join()`, lọc null, `min`, ném `NoSuchElementException` khi không nguồn nào dùng được. **7 test case** (min, nguồn ném lỗi, nguồn trả null, tất cả lỗi, danh sách rỗng + đếm số task được submit bằng `Executor` bọc bộ đếm, `CyclicBarrier(3)` + tên thread `src-N` để bắt lỗi chạy tuần tự/thay executor, single-thread executor). 4 câu check.
2. `lesson-concurrency-007` — *Rate limiter và Semaphore: giới hạn tốc độ và giới hạn số việc đồng thời* (order 7, senior, 40 phút).
   Body: phân biệt **tốc độ** (request/giây) và **số việc đồng thời** (permit), Little's law bằng số liệu cụ thể, bảng chọn công cụ; Semaphore từng bước (vé, `acquire`/`tryAcquire(timeout)`/`drainAcquire`, fair vs non-fair, `release()` trong `finally`, lỗi rò vé); token bucket (sơ đồ ASCII, công thức refill lười, `Math.min` cắt trần, vì sao giữ `double` để không mất phần lẻ, leaky bucket, Guava/Resilience4j); sliding window log vs fixed window counter + burst ở biên cửa sổ; một JVM vs nhiều JVM (Redis, fallback khi Redis sập); cách test không flaky; lỗi production. Kết bằng "### Liên hệ phỏng vấn".
   2 bài tập: `TokenBucket(capacity, refillPerSecond, LongSupplier clockNanos)` + `tryAcquire()` (**7 case**: burst khi đồng hồ đứng, 1,1s @2 token/s, 600ms @3 token/s, idle 60s vẫn bị cắt trần, "request bị từ chối không tạo nợ" @1000 token/s, gốc đồng hồ 5000s, **16 thread rút cạn bucket 100000 token — assert chính xác tổng số lần cấp**); `RateWindow(maxRequests, windowNanos, clockNanos)` sliding window log (**6 case**: chặn vượt hạn mức, hit hết hạn đúng tại `t + window`, từng hit rời cửa sổ theo thời điểm riêng, giết burst ở biên của fixed window, config sai, **16 thread đẩy 200000 request trên đồng hồ đứng yên**). 4 câu check.

**Test đã được chứng minh là "cắn"** (mutation check tạm thời, chạy 3 lần mỗi ca): bỏ `synchronized` ở `TokenBucket.tryAcquire` → fail; bỏ `synchronized` ở `RateWindow.allow` → fail; bỏ `Math.min(capacity, …)` → fail; thay `allOf(...).join()` bằng chờ từng nguồn tuần tự → fail; `supplyAsync(source)` không truyền executor → fail. Bài học đầu tiên (ban đầu chỉ 8 thread × 1000 token, vài chục micro giây) **không** bắt được lỗi mất `synchronized` — đã tăng dung lượng lên 100000/200000 để các thread "đánh nhau" hàng trăm nghìn lần; bản cũ đã được ghi lại trong body mục "Test sao cho không flaky".

**Cổng đã chạy**:
- `node scripts/test-lessons.js lesson-concurrency-006` → `RESULT 7/7`; `…-007` → `RESULT 7/7` + `RESULT 6/6`; `node scripts/test-lessons.js` (toàn repo) → `Lesson exercises OK: 111/111 (96 bài học)`. Starter của cả 2 bài biên dịch được và không pass hết (do gate kiểm tra).
- `node scripts/validate.js js/data/lessons-concurrency.js` → không còn lỗi schema/markup nào cho bài của tôi; chỉ còn `index-light.js: đã cũ` (xem cản trở bên dưới). Trước đó, khi repo còn lành, `node scripts/validate.js` từng in `OK — không có lỗi.` với hai bài này.
- Cảnh báo còn lại (không phải của T596): `path.js: có 4 bài học không nằm trong PATH: lesson-core-006, lesson-core-007, lesson-concurrency-006, lesson-concurrency-007`.

**Cản trở từ file khác (đã ghi nhận, không tự sửa)**: trong lúc tôi chạy cổng, `js/data/q-java.js` (task khác sở hữu, có vẻ là T593) đang giữa chừng hỏng cú pháp (`core-032` bị đặt sau `);` thiếu `push(`) làm `build-light-index.js` chết và `validate` bỏ qua cả file (`core/collections/modern 0 câu hỏi`) — agent đó đã sửa xong ngay sau đó, tôi chạy lại `node scripts/build-light-index.js` (OK, 103.7 KB) và `node scripts/validate.js`. **Hiện tại** `validate.js` chỉ còn một lỗi duy nhất, nằm ngoài T596: `projects.js: proj-bff.business.diagrams[0]: cần title và 2–6 actors` (file của T609, cũng đang được agent khác sửa). Không có lỗi nào thuộc `js/data/lessons-concurrency.js`; không cần chạy lại gate cho phần của T596 khi hai file kia lành — chỉ cần `build-light-index` + `validate` của người tích hợp.

**Đề xuất cho integrator**:
1. Thêm `'lesson-concurrency-006', 'lesson-concurrency-007'` vào stage `lessons` của track concurrency trong `js/data/path.js` (hiện mới tới `lesson-concurrency-005`) — xoá bớt cảnh báo "không nằm trong PATH".
2. Xoá giùm `scripts/tmp-negative-check.js` — script phụ trợ tôi tạo để kiểm tra mutation, đã dùng xong và đã được thay bằng stub đánh dấu "scratch"; tôi không được cấp quyền xoá/đổi tên file nên để lại.

Không chạy `git commit` / không tạo branch.
Reviewed-by: kilo (T596R)
