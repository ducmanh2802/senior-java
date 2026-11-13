# T1539R — Fact-check nội dung mới của T1539

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1539 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Fact-check hoàn tất 6 câu hỏi mới (architecture-039 đến architecture-044):
- architecture-039: Checkout flow consistency — conditional UPDATE, outbox pattern, read-your-writes, SLO cho projection lag. Đúng kỹ thuật PostgreSQL/Kafka.
- architecture-040: Sharding key selection — hash vs range vs tenant mapping, Math.floorMod xử lý hash âm, logical bucket 1024, CDC resharding. Đúng Java 17/21.
- architecture-041: Cache-aside vs write-through — race condition v1/v2, version-based eviction, outbox invalidation, TTL+jitter, cache key schema versioning. Đúng Redis/PostgreSQL.
- architecture-042: Idempotency end-to-end — idempotency key + request hash + unique constraint, outbox/inbox pattern, exactly-once limitations, UNKNOWN state cho payment, reconciliation. Đúng Kafka/DB.
- architecture-043: Back-pressure & load shedding — Little's Law, bulkhead, semaphore tryAcquire, deadline propagation, 429 vs 503, retry budget với jitter. Đúng resilience patterns.
- architecture-044: Capacity planning — QPS/storage/bandwidth calculation với đơn vị đúng, peak factor, fan-out, replica/WAL/retention overhead, benchmark-based sizing. Số liệu tính toán chính xác.
Không tìm thấy lỗi kỹ thuật, lỗi markup (backtick, ${}), hay từ tiếng Anh lẫn lộn sai chỗ. Chạy validate.js → OK, build-light-index.js → OK.
