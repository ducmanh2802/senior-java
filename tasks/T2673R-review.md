# T2673R — Fact-check nội dung mới của T2673

Status: DONE
Agent: opencode
Owns: `js/data/lessons-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2673 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Nội dung mới của T2673 = các bài `lesson-design-011, 012, 013, 015, 016` (diff HEAD chỉ thêm mới, không sửa bài cũ). Đã fact-check + sửa lỗi kỹ thuật/không nhất quán + lỗi test theo từng id:

- **lesson-design-011 (Composite Pricing)**: test chỉ có 2 case (< 3) → thêm case thứ 3 `empty pipeline yields zero` để `test-lessons` chấp nhận. Nội dung lý thuyết (Strategy/Decorator/Composite, BigDecimel scale=2 HALF_UP, pipeline base→discount→tax→shipping, số liệu 108000/228000/127600) đúng, không sửa.
- **lesson-design-012 (Outbox nâng cao)**: lý thuyết ordering sticky-partition theo aggregateId, cleanup partition/batch, so sánh Polling vs CDC (LSN, Debezium OutboxEventRouter), saga/DLQ đúng. Không sửa nội dung.
- **lesson-design-013 (Notification Strategy)**: RateLimiter trong code là **fixed window** (scheduler reset `available=maxPermits` mỗi period) nhưng bị gọi nhầm là "token bucket" ở tiêu đề mục 5, prompt và explain → sửa lại thành "fixed window" cho khớp cơ chế. Thêm daemon thread cho `ScheduledExecutorService` (3 chỗ: body/starter/reference) để JVM thoát, tránh treo 45s khi chạy test.
- **lesson-design-015 (Payment Strategy)**: `CryptoStrategy.authorize/refund` sinh txHash bằng `UUID...substring(0,64)` trên chuỗi 32 ký tự → `StringIndexOutOfBoundsException` (reference fail). Sửa thành nối 2 UUID (64 hex). Lý thuyết vòng đời validate/authorize/capture/refund/query, Luhn, idempotency, health-check đúng.
- **lesson-design-016 (Outbox Priority + Dedup + Cleanup)**: nhiều lỗi:
  1. Schema `CHECK (priority BETWEEN 1 AND 100)` mâu thuẫn DLQ dùng `priority=1000` → nới thành `BETWEEN 1 AND 1000`.
  2. `findDueRetry` lọc `nextRetryAt <= now` khiến test retry không bao giờ tới hạn (backoff 30s trong tương lai) → reference/prompt/hint sửa thành mô phỏng không dùng đồng hồ (trả event `sentAt=null && retryCount>0`, loại DLQ `priority<1000`).
  3. `archiveSent` không xoá khỏi bảng chính (mâu thuẫn "archive = move") → gọi `repo.remove`; test đổi kỳ vọng `size()==10` cứng (sai, thực tế 13 sent) thành so với `sentBefore`.
  4. `IdempotentConsumer` khi fail **giữ** processed_event (đúng anti-pattern mà chính body cảnh báo "mất event") → sửa thành gỡ processed_event (mô phỏng rollback cùng transaction) + thêm `ProcessedEventStore.remove`; cập nhật test/prompt/hint/explain.
  5. Starter `size()` trả `all.size()` khiến starter in 1 PASS rồi crash → harness coi "starter pass hết" → cho `size()` ném TODO để starter fail sạch.

Nghiệm thu:
- `node --check js/data/lessons-design.js` → OK.
- `node scripts/test-lessons.js <id>` cho 011/012/013/015/016: reference pass hết (3/3, 7/7, 6/6, 25/25, 23/23), starter không pass hết. (Chạy riêng từng bài vì `lessons-concurrency.js` của task song song đang lỗi cú pháp tạm thời chặn nạp toàn bộ manifest; đã verify cô lập chỉ nạp lessons-design.js.)
- `node scripts/validate.js`: **không có lỗi nào thuộc `lessons-design.js`**. 2 lỗi còn lại thuộc file của task khác (`lessons-concurrency.js` lỗi cú pháp, `lessons-jvm.js` related "jvm-032" không tồn tại) — ngoài phạm vi sở hữu, không tự sửa.
