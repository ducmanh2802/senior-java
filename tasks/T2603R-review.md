# T2603R — Fact-check nội dung mới của T2603

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2603 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Fixed the following issues in new T2603 content (qz-modern-047 through qz-concurrency-075, qz-kotlin-021 through qz-kotlin-030):

1. **qz-kotlin-021 through qz-kotlin-030**: Converted all Vietnamese text in question text, options, and explanations to English. Terms like "Ngoại lệ con trỏ null" → "NullPointerException", "gỡ r gói" → "destructuring", "hàm mở" → "extension function", etc.

2. **qz-modern-058**: Fixed option 4 text from "orElseThrow() ném IllegalStateException khi opt rỗng" to "orElseThrow() throws NoSuchElementException when opt empty" (correct exception type). Also converted entire question, options, and explanation from Vietnamese to English.

3. **qz-modern-059, qz-modern-060**: Verified technical accuracy - virtual thread pinning with synchronized (JDK 21-23), newVirtualThreadPerTaskExecutor vs fixedThreadPool with virtual threads, ThreadLocal inheritance behavior - all correct.

4. **qz-concurrency-056 through qz-concurrency-075**: Verified CompletableFuture thenCompose vs thenApply, thread execution on CompletableFuture stages, AtomicInteger vs volatile for counters, deadlock prevention (lock ordering), ConcurrentHashMap compute atomicity, Little's Law for thread pool sizing, check-then-act race condition, happens-before rules, interrupt handling, safe publication via volatile, CPU-bound vs I/O-bound pool sizing, exceptionally vs handle, ExecutorService submit vs execute - all technically correct.

5. **Template literal check**: No backticks or `${` patterns found inside template literal content that would break JavaScript. Markup uses `~~~` for code blocks correctly.

Validation: `node scripts/validate.js` passes for quiz-java.js (no errors). Other file errors are pre-existing and not owned by this task.
