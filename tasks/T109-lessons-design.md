# T109 — Track bài học `design`: tự cài các building block system design bằng Java thuần

Status: TODO
Agent: opencode
Owns: `js/data/lessons-design.js`, `index.html` (đã gắn sẵn script tag, KHÔNG sửa index.html)

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001`. File đã có sẵn (rỗng) và đã gắn vào index.html. Viết **5 bài** (`lesson-design-001..005`, track `design`, order 1..5), mỗi bài 1–2 bài tập tự chấm:
1. Rate limiter: token bucket và sliding window log (dùng đồng hồ giả truyền vào, KHÔNG dùng thời gian thật).
2. LRU / LFU cache (LinkedHashMap accessOrder + tự cài bằng HashMap + doubly linked list).
3. Consistent hashing có virtual nodes: thêm/bớt node, đo tỉ lệ key bị di chuyển.
4. Circuit breaker: CLOSED → OPEN → HALF_OPEN với ngưỡng lỗi và đồng hồ giả.
5. Idempotency key + retry với exponential backoff (mô phỏng API thanh toán gọi lại an toàn).
Body nói rõ khi nào dùng trong production (Resilience4j, Redis, Bucket4j…) nhưng bài tập chỉ JDK chuẩn, Java 17. Test deterministic.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass, starter compile + fail) và `node scripts/validate.js` → OK.

## Notes
