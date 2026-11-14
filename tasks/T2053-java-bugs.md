# T2053 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2045

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) cache-aside cập nhật sai thứ tự (xoá cache trước rồi mới update DB) gây dữ liệu cũ quay lại cache khi có đọc đồng thời trong service tồn kho: test dùng CountDownLatch tái hiện xen kẽ đọc/ghi một cách xác định; reference: update DB rồi mới xoá cache (+ giải thích delayed double delete và CDC trong fix)

Test phải **tái hiện bug một cách xác định** (latch/barrier, fake repository đếm query, Clock cố định…), reference pass 100% (≥ 3 test), starter biên dịch được và KHÔNG pass hết. Chỉ JDK chuẩn, không class public ngoài Main, Java 17.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/test-bugs.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm **bug-028** và **bug-029** vào `js/data/bugs.js` (nối tiếp bug-027; tổng 29 bài). Chỉ append, không sửa mục cũ.
- **bug-028** — "Tồn kho: xoá cache trước khi ghi DB làm tồn kho cũ sống lại" (P1, senior, 30'). Mô phỏng cache-aside: starter `evictCache` trước rồi `writeDb`; reference `writeDb` trước rồi `evictCache`. Test `khong_co_du_lieu_cu` dùng 2 `CountDownLatch` (firstMutationDone + writerMayContinue) + `AtomicBoolean` one-shot để ép reader chạy đúng cửa sổ sau thao tác ghi đầu tiên của writer → tái hiện xác định. Reference 3/3, starter 2/3 (đỏ đúng test này). `fix` giải thích delayed double delete, CDC (Debezium + binlog), TTL, `@CacheEvict(beforeInvocation)`, thứ tự với `@Transactional`. related: spring-017, spring-068, jpa-058, api-009.
- **bug-029** — "Xử lý đơn: thread pool dùng queue không giới hạn, hàng nghìn job dồn lại làm pod OOM" (P2, senior, 25'). starter = `Executors.newFixedThreadPool` (queue vô hạn, `queueCapacity` bị bỏ qua); reference = `ThreadPoolExecutor` + `ArrayBlockingQueue` có giới hạn + `AbortPolicy`. Test `queue_co_gioi_han` nhồi 200 task vào pool 4 worker đang bận (latch `block`) → reference có `RejectedExecutionException` và queue ≤ capacity, starter queue phình 200 và không từ chối. Reference 3/3, starter 2/3. `fix` giải thích cơ chế `ThreadPoolExecutor` (core→queue→max→reject), các rejection policy, sizing CPU/IO-bound, bulkhead, hàng đợi bền, `ThreadPoolTaskExecutor`. related: concurrency-003, concurrency-004, concurrency-015, concurrency-020.
- Nghiệm thu: `node --check js/data/bugs.js` OK; `node scripts/build-light-index.js` OK; `node scripts/test-bugs.js` → **29/29 OK**; `node scripts/validate.js` → **không có lỗi nào liên quan bugs.js** (các lỗi còn lại nằm ở `q-spring-data.js` spring-078 và `labs-incident.js` lab-incident-033/034 — thuộc task khác, không sở hữu nên không sửa).
- KHÔNG commit (theo luật).
Reviewed-by: verify-only (code/UI task)
