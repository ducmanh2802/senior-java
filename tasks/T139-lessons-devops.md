# T139 — Track bài học `devops`: Docker, JVM trong container, CI/CD nền tảng

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-devops.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. Người học: dev Java junior hổng nền, đang lên Senior. **3 bài** `lesson-devops-001..003` (track `devops`, order 1..3, level mid/mid/senior): (1) JVM trong container: heap từ MaxRAMPercentage, CPU limit và số thread GC/pool — bài tập: hàm tính heap/thread pool size từ memory limit + CPU quota theo công thức trong bài, test các cấu hình; (2) health check: liveness vs readiness vs startup — bài tập: state machine readiness (STARTING→READY→DRAINING) cho graceful shutdown, request mới bị từ chối khi DRAINING, request đang chạy hoàn tất; (3) triển khai rolling/canary — bài tập: mô phỏng canary chia traffic theo % với hash ổn định của userId và tự rollback khi error rate vượt ngưỡng.
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn, mô phỏng cơ chế bằng Java thuần (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`, `related` trỏ tới id câu hỏi có thật topic `devops`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- 3 bài `lesson-devops-001..003` đã viết vào `js/data/lessons-devops.js` (JVM sizing trong container; liveness/readiness/startup + state machine DRAINING; canary hash ổn định + auto-rollback). Mỗi bài 1 exercise Java 17 JDK chuẩn, body ≥ 2500 ký tự, 3 câu check, related trỏ devops-002/004/005/015/016/017/019/021.
- `node scripts/test-lessons.js` cho 3 lesson: reference 9/9, 6/6, 7/7 pass; starter biên dịch được và không pass hết.
- `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: opencode (T139R)
