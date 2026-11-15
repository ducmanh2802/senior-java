# T2080R — Fact-check nội dung mới của T2080

Status: DONE
Agent: opencode
Owns: `js/data/lessons-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2080 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
không có lỗi
- lesson-api-010: Idempotency state machine (IN_PROGRESS/DONE), TTL/stale timeout, CAS reclaim, computeIfAbsent bin-lock caveat, DB unique index vs Redis SET NX — all technically correct per Java 17/21, Spring Boot 3.x.
- lesson-api-011: Token bucket with fractional tokens (double), capacity clamp, pure retryAfterMillis, synchronized thread-safety, cost parameter, System.nanoTime vs currentTimeMillis — all technically correct.
- node scripts/validate.js → OK (only pre-existing unrelated warnings).
- node scripts/test-lessons.js → 284/284 exercises pass.
