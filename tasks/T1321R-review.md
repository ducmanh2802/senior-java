# T1321R — Fact-check nội dung mới của T1321

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1321 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

### jvm-011 (JFR)
- Sửa "BLOCKED" → "WAITING": HikariPool.getConnection dùng ReentrantLock.lockInterruptibly, thread không block (BLOCKED) mà chờ (WAITING). BLOCKED chỉ dùng khi lock đã bị inflation và thread không thể interrupt.

### jvm-012 (Heap leak)
- Sửa phần giải thích số liệu retained: 2.5M Long × 24 B = 60 MB, Node[] array overhead ~1.1 GB (array 2.5M reference × 8 B + overhead object array). Tránh nói "60 MB = 1.2 GB".

### jvm-013 (RSS/native memory)
- Sửa "pool size unbounded, mỗi request tạo thread mới" → "pool connection không giới hạn (maxTotal=-1), mỗi thread HTTP giữ một connection lâu dài". Apache HttpClient 4.5 default maxTotal=20, không phải unbounded và không tạo thread mới mỗi request.

### jvm-014 (JVM flags baseline)
- Sửa "pod 1 vCPU chạy SerialGC" → "pod chạy G1 với cài đặt default, young gen quá nhỏ, old GC thường xuyên". Pod là 2 vCPU/4 GB (server-class), JVM chọn G1, không phải SerialGC. Chỉ pod 1 vCPU mới chọn SerialGC.
