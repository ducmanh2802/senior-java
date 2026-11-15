# T2088R — Fact-check nội dung mới của T2088

Status: DONE
Agent: opencode
Owns: `js/data/lessons-concurrency.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2088 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- **lesson-concurrency-017**: Sửa `Thread.ofVirtual().name("vt-", 0)` → `Thread.ofVirtual().name("vt-")`. `Thread.Builder.name()` chỉ nhận 1 tham số `String`, không nhận 2 tham số. Tham số thứ hai (threadId) không tồn tại.
- **lesson-concurrency-018**: Sửa `acquire(2)` → `tryAcquire(2)` trong mục "Bốn lỗi làm Semaphore sai" (dòng 5614). `Semaphore.acquire(int)` không tồn tại; API đúng là `tryAcquire(int permits)`. Dùng `acquire(2)` sẽ không biên dịch được.
- Không phát hiện lỗi khác. Validation OK, test-lessons 292/292 pass.
