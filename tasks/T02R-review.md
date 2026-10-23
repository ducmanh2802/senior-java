# T02R — Fact-check nội dung mới của T02

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T02 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `concurrency-006`: thay link concurrency package không liên quan bằng Java ThreadMXBean; giữ JCIP làm tài liệu nền.
- `concurrency-012`: chuẩn hóa dấu nháy trong refs; hai nguồn về concurrency phù hợp với chủ đề backpressure.
- `concurrency-019`: thay link chung bằng JEP 142 về false sharing và cache contention.
- `jvm-006`: thay refs bị copy nhầm bằng tài liệu Java diagnostics/ThreadMXBean.
- `jvm-011`: thay refs bị copy nhầm bằng JEP 439 (Generational ZGC) và JEP 333 (ZGC).
- `jvm-015`: thay refs bị copy nhầm bằng Java launcher reference và GC tuning guide.
- `concurrency-025`: thay refs chung bằng API docs cho AtomicInteger và LongAdder.
- `node --check js/data/q-concurrency-jvm.js` và `node scripts/validate.js` đều OK.
- `node scripts/check-links.mjs q-concurrency-jvm.js` bị chặn mạng trong môi trường (EACCES); kiểm tra URL trực tiếp xác nhận tài liệu Oracle/JCIP hợp lệ, OpenJDK JEP 142/333/439 được tìm thấy nhưng máy chủ chặn truy cập tự động.
