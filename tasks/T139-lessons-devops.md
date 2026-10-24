# T139 — Track bài học `devops`: Docker, JVM trong container, CI/CD nền tảng

Status: TODO
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-devops.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. Người học: dev Java junior hổng nền, đang lên Senior. **3 bài** `lesson-devops-001..003` (track `devops`, order 1..3, level mid/mid/senior): (1) JVM trong container: heap từ MaxRAMPercentage, CPU limit và số thread GC/pool — bài tập: hàm tính heap/thread pool size từ memory limit + CPU quota theo công thức trong bài, test các cấu hình; (2) health check: liveness vs readiness vs startup — bài tập: state machine readiness (STARTING→READY→DRAINING) cho graceful shutdown, request mới bị từ chối khi DRAINING, request đang chạy hoàn tất; (3) triển khai rolling/canary — bài tập: mô phỏng canary chia traffic theo % với hash ổn định của userId và tự rollback khi error rate vượt ngưỡng.
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn, mô phỏng cơ chế bằng Java thuần (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`, `related` trỏ tới id câu hỏi có thật topic `devops`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
