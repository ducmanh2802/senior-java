# T1335R — Fact-check nội dung mới của T1335

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1335 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review toàn bộ nội dung mới của T1335 trong `js/data/q-concurrency-jvm.js` (6 phần thêm: `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` của jvm-017 khởi động/AppCDS/CRaC, jvm-018 async-profiler, concurrency-021 trạng thái thread, concurrency-022 start() vs run(), concurrency-023 sleep/wait/join/yield, concurrency-024 phạm vi lock synchronized).
- Không tìm thấy lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup (không backtick inline, không `${`, không HTML thô) hay chữ nước ngoài lẫn vào; convention (-t, metrics Hikari, …) nhất quán với nội dung đã có ở HEAD.
- Không sửa nội dung đã có ở HEAD; không thêm/xoá mục.
- `node --check js/data/q-concurrency-jvm.js` OK; `node scripts/validate.js` → OK.
