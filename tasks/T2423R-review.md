# T2423R — Fact-check nội dung mới của T2423

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2423 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 2 lab mới từ T2423: lab-incident-044 (Retry storm do batch listener Kafka) và lab-incident-045 (Webhook đồng bộ không timeout cạn thread Tomcat). Cả hai đều đúng kỹ thuật:
- lab-incident-044: Cơ chế batch listener + FixedBackOff(0, Long.MAX_VALUE) + thiếu BatchListenerFailedException + thiếu DLQ gây retry storm 1.440 req/s, lag 2 triệu, CPU core-banking 100%. Phân tích Little's law, consumer group không rebalance vì vẫn poll(), offset không nhích. Đề xuất sửa: ExponentialBackOff + jitter + maxAttempts + DeadLetterPublishingRecoverer + addNotRetryableExceptions + BatchListenerFailedException + producer validation + alert theo partition.
- lab-incident-045: RestTemplate không timeout + gọi webhook trong request thread Tomcat + Little's law 120 req/s × 30s = 3.600 thread cần > 800 có sẵn → cạn thread, accept queue đầy → 503. Hikari/DB idle vì bottleneck ở HTTP layer. Jstack chứng minh 200/200 thread ở NioSocketImpl.implRead. Đề xuất sửa: timeout + outbox/worker + bulkhead + circuit breaker + idempotency.
Không phát hiện lỗi API/flag/mặc định/số liệu/markup. Không sửa nội dung đã có ở HEAD.
node scripts/validate.js → OK (các lỗi hiển thị là pre-existing ở file khác, không liên quan labs-incident.js).
