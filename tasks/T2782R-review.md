# T2782R — Fact-check nội dung mới của T2782

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2782 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Nội dung MỚI của T2782 là 3 câu hỏi scenario-191, 192, 193 ở cuối `js/data/q-scenario.js` (xem `git diff HEAD -- js/data/q-scenario.js`). Review kỹ theo chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x:
- scenario-191 (PITR multi-tenant): LSN, WAL archive, recovery_target_time, pg_basebackup, pg_waldump, ON CONFLICT, UPDATE…FROM — đúng Postgres 15; số liệu và RPO là ví dụ trong bài, hợp lý.
- scenario-192 (CPU cao + throughput giảm): sự kiện JFR JavaMonitorEnter/ThreadPark/ExecutionSample, async-profiler chế độ cpu vs wall, container_cpu_cfs_throttled_periods_total — đúng JVM/Kubernetes.
- scenario-193 (outbox double-publish): SELECT … FOR UPDATE SKIP LOCKED, CTE UPDATE…FROM, idempotency key (event_id do giao dịch sinh), seq diagram hợp lệ (2 actors, mỗi bước ≤ 60 ký tự).
Không có lỗi kỹ thuật, không có lỗi markup (không backtick, không ${, các {{ }} hợp lệ), thuật ngữ tiếng Anh được giải thích lần đầu xuất hiện. Không sửa gì, không thêm/xoá mục.
node scripts/validate.js: không có lỗi/cảnh báo nào thuộc q-scenario.js hoặc scenario-19x; các lỗi còn lại (q-security.js cú pháp 'GET', quiz-ops.js ### thụt lề, q-concurrency-jvm.js/jvm-07x đáp án ngắn, path.js…) là của file agent khác, không thuộc quyền sở hữu task này, không thể sửa.
index-light.js đã đồng bộ có scenario-191/192/193.
