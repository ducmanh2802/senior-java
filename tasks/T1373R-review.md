# T1373R — Fact-check nội dung mới của T1373

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1373 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff vs HEAD cho `js/data/q-concurrency-jvm.js` (phần mới của T1373: `jvm-032`, `concurrency-030`..`033`, fix nhỏ `concurrency-032`; `concurrency-038` không có diff mới ngoài phạm vi T1373R note context — giữ nguyên, nội dung đúng kỹ thuật).
- `jvm-032`: sửa điều tra dùng `jcmd VM.native_memory` cho đúng thực tế (Native Memory Tracking không bật mặc định) → thêm `-XX:NativeMemoryTracking=summary` và dùng `jcmd <pid> VM.native_memory summary`; ghi chú heap dump không thấy vùng đệm direct (nằm ngoài heap). Cơ chế Cleaner/MaxDirectMemorySize/FFM Arena/Netty pool: đúng.
- `concurrency-030`: không có lỗi kiến thức (stampede, single-flight/CHM+CompletableFuture, không I/O trong lock map, `completeExceptionally`, `copy()`/`orTimeout` dùng chung, Caffeine `AsyncLoadingCache`/`refreshAfterWrite`, key gồm tenant, object bất biến): đúng.
- `concurrency-031`: không có lỗi kiến thức (`jcmd Thread.print`, trạng thái BLOCKED/RUNNABLE, monitor address, JFR `jdk.JavaMonitorEnter`, async-profiler lock mode, tách I/O khỏi `synchronized` + snapshot `volatile`/`Map.copyOf`): đúng.
- `concurrency-032`: không có lỗi kiến thức (race check-then-act, `CountDownLatch` gate, `Future.get` timeout đưa lỗi về thread test, `@RepeatedTest`/jcstress/Awaitility phân biệt mục đích). Diff đã thay `{{if (count < limit) count++}}` bằng mô tả chữ — hợp lệ, tránh lồng `{}` trong `{{}}`.
- `concurrency-033`: không có lỗi kiến thức (`System.nanoTime()` cho đo khoảng/đơn điệu, tránh `currentTimeMillis()` khi NTP, cặp state atomic qua record+`AtomicReference` CAS, Caffeine `expireAfterAccess`/`maximumSize`, Redis Lua/script cho global limit): đúng.
- `concurrency-038`: không có thay đổi mới cần fact-check trong diff này; giữ nguyên.
- Kiểm tra: không backtick/`${` trong các id mục tiêu; `node --check js/data/q-concurrency-jvm.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → **OK — không có lỗi**. (Chỉ có warning `path.js` 2 lesson-design chưa nằm trong PATH, không liên quan.) Không commit, không kill process theo tên, không mở trình duyệt.
