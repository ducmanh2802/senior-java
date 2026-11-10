# T1364R — Fact-check nội dung mới của T1364

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1364 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

T1364R — Fact-check nội dung mới của T1364 (file `js/data/q-concurrency-jvm.js`).

Đã diff so với HEAD: nội dung MỚI là 5 đoạn `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` được chèn vào 5 câu hỏi (jvm-026, jvm-027, jvm-028, jvm-029, jvm-030, jvm-031) — tổng cộng 6 đoạn (jvm-029 có 2 đoạn). Không có file khác bị thay đổi.

**Kiểm tra kỹ thuật (chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x):**
- jvm-026 (OOM do input lớn): `Files.readAllLines` + `String.join` giữ cả file 1.5 GB → ~4 GB peak so với `-Xmx2g` → `OutOfMemoryError: Java heap space`. Đúng. Chuyển sang `Files.lines` streaming, `spring.servlet.multipart.max-file-size=100MB`, cắt dòng >10 KB để vừa tránh OOM vừa tránh ReDoS. Heap đỉnh ~120 MB, `-Xmx512m` ổn định, file vượt giới hạn trả 413. Đúng.
- jvm-027 (OOMKilled playbook): phân loại OOMKilled (exit 137, kernel) vs OutOfMemoryError (JVM). Metric `jvm_threads_live_threads` tăng 80→900, `jvm_buffer_memory_used_bytes` (direct) tăng; nguyên nhân executor không giới hạn + `ByteBuffer.allocateDirect` mỗi request. Sửa bằng `ThreadPoolExecutor` có queue capacity, buffer pool, `-XX:MaxDirectMemorySize`, QoS Guaranteed. Đúng.
- jvm-028 (RSS cao, heap thấp): phân biệt used / committed / RSS; G1 không uncommit nếu không có Full GC/concurrent cycle; `G1PeriodicGCInterval` (JEP 346) để uncommit định kỳ; `AlwaysPreTouch` + `Xms=Xmx` cho API latency nhạy. Đúng.
- jvm-029 (NPE mất stack trace): `OmitStackTraceInFastThrow` của C2; log sớm nhất sau deploy vẫn có stack trace → tìm null-check; thêm `-XX:-OmitStackTraceInFastThrow`. Đúng.
- jvm-030 (micro-benchmark sai): không warm-up, dead-code elimination, constant folding, OSR, đo A rồi B cùng JVM; JMH với `@Warmup/@Measurement/@Fork/@State/Blackhole`, `-prof gc`. Đúng.
- jvm-031 (Java agent): `premain` + `ClassFileTransformer`; overhead startup/CPU; `VerifyError` khi agent cũ không tương thích JDK 21; công tắc gỡ `-javaagent`, smoke test có agent. Đúng.

**Markup:** không backtick, không `${` (đã grep kiểm tra, 0 kết quả), template literal đúng cú pháp, `node --check` pass.

**Chất lượng nội dung:** 6 đoạn đều có `### Ví dụ đời thực` (triệu chứng → điều tra → xử lý → kết quả đo được) và `### Trả lời mẫu khi phỏng vấn` (150–220 từ, tự nhiên). Độ dài mỗi đáp án tổng thể vẫn ở khoảng 3000–5000 ký tự theo chuẩn. Không thay đổi phần đã có ở HEAD.

**Validator:** `node scripts/validate.js` → `OK — không có lỗi.` (1497 câu hỏi, 849 trắc nghiệm, 134 bài thuật toán, 64 debug lab, 197 bài học).

**Lưu ý:** không cần chạy `node scripts/test-lessons.js` vì task này chỉ owns file câu hỏi tự luận `q-concurrency-jvm.js`, không phải bài học.
