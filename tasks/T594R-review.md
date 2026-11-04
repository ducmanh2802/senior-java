# T594R — Fact-check nội dung mới của T594

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T594 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- concurrency-034: Viết lại đầy đủ về sizing thread pool I/O-bound (Little's law, tài nguyên giới hạn, queue giới hạn, policy), đúng kỹ thuật thay vì công thức tĩnh sai.
- concurrency-035: Mô tả rõ Structured Concurrency (preview JEP 453), ShutdownOnFailure/ShutdownOnSuccess, ScopedValue, hạn chế không ship preview, ví dụ đúng.
- concurrency-036: Giải thích JMM happens-before chi tiết (visibility/ordering, nguồn tạo, ví dụ volatile, safe publication), sửa thành nội dung dạy rõ.
- concurrency-037: Hoàn chỉnh về Executor, timeout/orTimeout/completeOnTimeout, exceptionally/handle, MDC propagation, allOf lưu ý, đúng.
- jvm-033: Giải thích G1 pause (Young/Mixed/Full, Humongous, To-space exhausted), cách đọc log, khuyến nghị đúng.
- jvm-034: Viết lại tiered compilation (C1/C2, deopt, OSR), giải thích warm-up và khuyến nghị JMH đúng cách.
- jvm-035: Điều tra Metaspace leak bài bản (nguyên nhân, công cụ jcmd/heap dump/MAT, quy trình, tránh hot redeploy).
- jvm-036: So sánh CDS/AppCDS, Spring AOT, CRaC, GraalVM Native Image với trade-off rõ ràng, khuyến nghị thực tế.
- Dùng đúng markup {{code}}, không dùng backtick, không có ${}, tiếng Việt rõ ràng, đúng ngữ cảnh Java 17/21. Validate OK.
