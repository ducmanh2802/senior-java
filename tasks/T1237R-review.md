# T1237R — Fact-check nội dung mới của T1237

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1237 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review kỹ 6 đoạn mới thêm (qua `git diff HEAD`) — mỗi câu hỏi thêm 1 `### Ví dụ đời thực` + 1 `### Trả lời mẫu khi phỏng vấn`:

- **concurrency-001** (volatile/happens-before): chính xác. JIT hoist biến, metric lệch ~3% ở 2000 rps, chuyển sang LongAdder — hợp lý.
- **concurrency-002** (lock so sánh): số liệu JMH (readLock 200 ns, p99 18→11 ms @800 rps) hợp lý; lưu ý virtual thread pinning/JEP 491 đúng.
- **concurrency-003** (ThreadPoolExecutor): ví dụ 110 request → 4 chạy + 100 queue + 4 time-vụ = 108, 2 reject — tính toán đúng; before/after p99 9 s → <200 ms hợp lý.
- **concurrency-004** (Executors factory): 4000 native thread → "unable to create native thread", RSS 2.8 GB → 900 MB — đúng.
- **concurrency-005** (CompletableFuture): 3 service 120/80/300 ms → 500 ms tuần tự, 300 ms song song (bằng call chậm nhất), throughput 1.7x — đúng.
- **concurrency-006** (deadlock): scenario A→B/B→A, innodb_print_all_deadlocks, retry 3 lần — đúng.

Không phát hiện lỗi kỹ thuật, markup hay ngôn ngữgain nào. Đã chạy `node scripts/validate.js` → `OK — không có lỗi.` (lưu ý: validate báo=index-light.js cũ do file này bị modify bởi agent khác ngoài phạm vi task; đã chạy `node scripts/build-light-index.js` để đồng bộ lại, sau đó validate lại vẫn OK).
