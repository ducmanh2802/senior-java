# T1392R — Fact-check nội dung mới của T1392

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1392 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 3 câu hỏi được thêm "Ví dụ đời thực" trong T1392:
- concurrency-051 (Exchanger): double-buffer pipeline, Exchanger<byte[]>, exchange timeout, allocation/GC số liệu — chính xác.
- concurrency-052 (Phaser): worker thoát sớm không deregister gây treo, try/finally + arriveAndDeregister, onAdvance parties==0 — chính xác.
- concurrency-053 (ScheduledThreadPoolExecutor): fixedRate catch-up behavior, chuyển fixedDelay, tách scheduler, metric last_success — chính xác.
Không có lỗi kỹ thuật, không lỗi markup, không chữ nước ngoài. validate.js lỗi do q-remote.js (file khác, không thuộc task) và index-light.js cũ (cần chạy build-light-index.js sau khi integrator sửa q-remote.js).
