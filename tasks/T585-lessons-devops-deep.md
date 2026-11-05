# T585 — 2 bài học devops mô phỏng bằng Java thuần

Status: DONE
Reviewed-by: claude (self-checked: test-lessons, validate)
Agent: qoder
Owns: `js/data/lessons-devops.js`

Track devops có 5 bài (đọc hết để không trùng). Thêm 2 bài (order tiếp nối); đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001`:
1. **Graceful shutdown & rolling deploy**: SIGTERM → preStop → readiness false → drain request đang chạy → đóng pool; terminationGracePeriodSeconds. Bài tập: `GracefulServer` với `submit(Runnable)` từ chối request mới sau `shutdown()`, chờ request đang chạy xong trong timeout (ExecutorService + awaitTermination), trả số request bị huỷ. Test bằng CountDownLatch, deterministic.
2. **Retry, backoff, jitter, circuit breaker**: retry storm, idempotency, exponential backoff + full jitter, CLOSED/OPEN/HALF_OPEN. Bài tập: `CircuitBreaker` dùng đồng hồ giả (`LongSupplier nowMs`); `Backoff.delay(attempt, baseMs, capMs, Random)` với Random có seed.
Body ≥ 2500 ký tự, liên hệ K8s/Spring Boot thật (server.shutdown=graceful, Resilience4j), kết bằng "### Liên hệ phỏng vấn". Java 17 thuần.

## Nghiệm thu
`node scripts/test-lessons.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes
- Thêm lesson-devops-006 (Graceful shutdown end-to-end: ngân sách thời gian SIGTERM→SIGKILL, drain ExecutorService, rolling update; bài tập GracefulServer, 7 test) và lesson-devops-007 (retry storm, circuit breaker CLOSED/OPEN/HALF_OPEN, retry budget, các kiểu jitter, Resilience4j; bài tập CircuitBreaker 8 test + Backoff/RetryBudget 7 test).
- test-lessons: reference pass 100%, starter compile nhưng fail. build-light-index + validate OK.
- Đề xuất cho integrator: validate cảnh báo 2 bài mới chưa nằm trong PATH (js/data/path.js) — cần thêm vào lộ trình.
