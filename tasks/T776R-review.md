# T776R — Fact-check nội dung mới của T776

Status: DONE
Agent: opencode
Owns: `js/data/lessons-modern.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T776 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Phạm vi review: phần mới so với HEAD của `js/data/lessons-modern.js` (T776 thêm `lesson-modern-006`, `lesson-modern-007`; `node --check` OK). Chỉ chỉnh trong 2 bài mới, không sửa 001–005. Chạy `node scripts/build-light-index.js` trước validate (AGENTS.md luật 6).
- **lesson-modern-006** (Collectors nâng cao):
  - `groupingBy` overload: sửa câu "Java 16+ có 4 tham số" (sai) → "có 3 overload; thực dụng nhất là bản 3 tham số" (đúng với `java.util.stream.Collectors`, JDK 17).
  - `groupingBy` mặc định map: "mặc định trả {{HashMap}}" → "mặc định dùng map không đảm bảo thứ tự (hiện thực thường là {{HashMap}}; đặc tả {{Collector}} không cam kết kiểu/có thể đổi/tính thread-safe của {{Map}} trả về)". Tránh khẳng định sai theo spec; phần lý do không dựa vào thứ tự được giữ.
  - Markup: `{{partitioningBy(predicate}}` (thiếu `}}`) → `{{partitioningBy(predicate)}}`.
  - Kiểm tra kỹ thuật (không đổi): `toMap` 2 tham số ném `IllegalStateException` khi trùng key, `NullPointerException` khi value null (do `Map.merge`); merge function tham số `(old,new)`; `reducing` 3 tham số trả identity khi stream rỗng (tránh `Optional`/NPE) — đúng. `partitioningBy` luôn có cả 2 key `Boolean` — đúng. `teeing` (Java 12) gộp đúng 2 collector — đúng, ví dụ lồng 3 chỉ số hợp lệ. Starter compile được + `UnsupportedOperationException("TODO")`; 2 bài tập, 7+7 case deterministic; reference logic khớp yêu cầu (gộp tiền `BigDecimal`, `LinkedHashMap`/`TreeMap` cho thứ tự).
- **lesson-modern-007** (Fan-out/CompletableFuture/virtual threads):
  - Markup: `{{CompletableFuture.allOf(a, b, c}}` (thiếu `}}`) → `{{CompletableFuture.allOf(a, b, c)}}`.
  - Kiểm tra kỹ thuật (không đổi): `supplyAsync` không truyền executor chạy `ForkJoinPool.commonPool()` (≈ CPU-1, dùng chung JVM) — đúng. `allOf` trả `CompletableFuture<Void>`, phải giữ list future để lấy giá trị — đúng. `orTimeout`/`completeOnTimeout` (Java 9+) chỉ hoàn thành future, không huỷ I/O bên dưới — đúng, bài đã nêu rõ và cần read timeout client. `join()` ném `CompletionException` (unchecked), `get()` ném `ExecutionException` (checked), lỗi gốc nằm ở `getCause()` — đúng. Bài tập 1 dùng `orTimeout + exceptionally + null→fallback`, chuẩn hoá trước `allOf`; bài 2 dùng `completeOnTimeout + handle`, trả `CF` ngay (không `join/get` trong `page()`) — đúng, 8+6 case deterministic (`CyclicBarrier`/`CountDownLatch`, không sleep thời gian thực), chạy Java 17. Virtual threads/structured concurrency chỉ giải thích trong body (structured concurrency ghi rõ preview, không bật production) — phù hợp yêu cầu.
- Kiểm tra markup/chữ lạ: không có backtick, không có `${` trong template literal (chỉ `\${` placeholder được phép không xuất hiện). `~~~seq` hợp lệ (title/actors/note). Không phát hiện chữ nước ngoài lẫn sai ngữ cảnh.
- Chạy: `node --check js/data/lessons-modern.js` OK; `node scripts/test-lessons.js lesson-modern-006` → 2/2 (7+7 PASS); `node scripts/test-lessons.js lesson-modern-007` → 2/2 (8+6 PASS); `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (còn warnings cũ ở `q-java/q-system-design/q-scenario/path` không thuộc task, không phải lỗi).
