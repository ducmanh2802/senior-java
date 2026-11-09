# T1273R — Fact-check nội dung mới của T1273

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1273 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi review: phần nội dung mới của T1273 trong `js/data/q-concurrency-jvm.js` (git diff HEAD) — các mục thêm vào `concurrency-034`..`concurrency-039` (`### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` và follow-up bổ sung).
- `node scripts/validate.js`: không còn lỗi nào thuộc `q-concurrency-jvm.js` (các lỗi còn lại là của file khác, có từ trước). `node --check js/data/q-concurrency-jvm.js` OK.
- `concurrency-034`: không sửa. Nội dung khớp HEAD (ScopedValue chính thức JDK 25, structured concurrency preview/API đổi), ví dụ đời thực và trả lời mẫu hợp lý.
- `concurrency-035`: **sửa lỗi kỹ thuật**. Xoá câu gợi ý `-XX:+UseContainerSupport -XX:MaxRAMPercentage=65` cho pod 2 vCPU để “bù commonPool parallelism” — các flag này liên quan heap/container detection, không quyết định commonPool parallelism (commonPool dựa trên `Runtime.availableProcessors()`; container support mặc định bật từ JDK 10+). Thay bằng giải thích đúng: pod 2 vCPU → availableProcessors=2 → parallelism commonPool rất nhỏ, nên phải tách I/O ra executor riêng.
- `concurrency-036`: không sửa. Queue bounded, Little’s Law, 503/load shedding/backpressure, HikariCP+Semaphore là hợp lý cho minh hoạ; không có API/flag bịa.
- `concurrency-037`: **sửa lỗi kỹ thuật quan trọng**. `KafkaConsumer.poll()` **không** ném `InterruptedException` và không dừng chỉ vì thread bị interrupt; ví dụ cũ bọc `poll()` trong vòng kiểm tra interrupt là sai cơ chế. Sửa thành pattern đúng: kiểm tra cờ interrupt + đăng ký shutdown hook gọi `consumer.wakeup()` từ thread khác, bắt `WakeupException`, commit offset cuối rồi thoát; giữ quy tắc khôi phục cờ khi bắt `InterruptedException` ở chỗ khác.
- `concurrency-038`: không sửa. `awaitUninterruptibly()` dùng khi consumer không nên bị interrupt giữa thao tác chờ là hợp lý; ví dụ lost-notify với `if` thay vì `while` đúng.
- `concurrency-039`: không sửa. Unsafe publication/ARM reorder, fix `volatile`/`AtomicReference` + immutable là đúng kỹ thuật.
- Kiểm tra markup: không có backtick, không có `${`, không có inline code `{{...}}` lồng ngoặc nhọn gây lỗi hiển thị.
- Không chạy `node scripts/test-lessons.js` vì task này không sửa bài học; script hiện fail do `lessons-testing.js` có lỗi cú pháp có sẵn (ngoài phạm vi sở hữu).
