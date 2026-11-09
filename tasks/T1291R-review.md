# T1291R — Fact-check nội dung mới của T1291

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1291 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review toàn bộ nội dung MỚI của T1291 trong `js/data/q-concurrency-jvm.js` (50 dòng insert theo `git diff HEAD --stat`, 6 hunk thêm `### Ví dụ đời thực`/`### Trả lời mẫu khi phỏng vấn` cho `concurrency-019`, `concurrency-020`, `jvm-001`, `jvm-002`, `jvm-003`, `jvm-004`). Không thêm/xoá mục, không sửa nội dung đã có ở HEAD.
- Kiểm tra kỹ thuật: `-XX:-RestrictContended` + `@Contended` (JEP 142/JDK 9+) đúng; thứ tự `ScheduledExecutorService` nuốt exception (FutureTask/ScheduledFutureTask lưu exception, state EXCEPTIONAL, không reschedule) đúng; NMT `baseline`/`summary.diff` + `MaxDirectMemorySize`/`MaxRAMPercentage` đúng; Generational ZGC (`-XX:+UseZGC -XX:+ZGenerational`, JDK 21) đúng; K8s OOMKilled exit 137 + cgroup/container memory đúng; `DriverManager.deregisterDriver`/`ThreadLocal.remove` cho classloader leak redeploy đúng. Không phát hiện API/flag bịa hay mặc định sai nghiêm trọng.
- Sửa theo id:
  - `concurrency-020`: sửa mô tả điều tra thread dump (worker thread của scheduled pool rảnh thường `TIMED_WAITING` park trên `DelayedWorkQueue`, không phải `RUNNABLE`); dùng thuật ngữ chính xác FutureTask/ScheduledFuture lưu exception vào field outcome; làm rõ alert `rate(job_fx_success[5m]) == 0` (cửa sổ 5 phút ~5 chu kỳ cho job chạy mỗi phút) để tránh mâu thuẫn “3 chu kỳ / 5m / 3 phút”.
  - `jvm-001`: làm rõ lệnh NMT (`-XX:NativeMemoryTracking=summary`, `jcmd <pid> VM.native_memory baseline`/`summary.diff`) và diễn giải direct buffer/Netty cache để dễ hiểu, không suy diễn sai “GC không kịp thu direct buffer” thiếu ngữ cảnh.
  - `jvm-003`: sửa cách diễn giải NMT Thread (dùng “NMT Thread committed”) thay cho ước lượng “stack 200 thread × 1 MB reserve = 200 MB” dễ gây hiểu sai; giữ tổng RSS/số liệu hợp lý.
  - `jvm-004`: làm rõ bối cảnh WAR/Tomcat redeploy cho Metaspace leak (khớp `WebappClassLoader`), sửa path to GC Roots/ThreadLocal để tránh suy diễn sai “HikariCP đăng ký driver static” (JDBC driver `org.postgresql.Driver` tự đăng ký; HikariCP quản lý pool) — giữ đúng bản chất hai nguyên nhân giữ loader cũ.
  - `concurrency-019`, `jvm-002`: nội dung mới nhất quán về kỹ thuật/markup; không sửa.
- Đã chạy: `node --check js/data/q-concurrency-jvm.js` (OK), `node scripts/build-light-index.js` (OK, ghi `js/data/index-light.js`), `node scripts/validate.js`.
- `node scripts/validate.js` **chưa OK toàn repo** do lỗi nằm ngoài file sở hữu (không được sửa theo task): `lessons-testing.js: lesson-testing-005.body` có 4 lỗi inline code `{{}}` chứa dấu `{ }` lồng nhau. Đồng thời có cảnh báo `path.js` 2 bài không nằm trong PATH (`lesson-design-006`, `lesson-design-007`). Đã grep xác nhận **không có lỗi nào thuộc `q-concurrency-jvm.js`**. Cần integrator/owner của `lessons-testing.js` sửa để validate toàn cục đạt OK.
