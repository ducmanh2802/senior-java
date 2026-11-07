# T597R — Fact-check nội dung mới của T597

Status: DONE
Agent: opencode
Owns: `js/data/quiz-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T597 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review toàn bộ 20 câu trắc nghiệm mới (qz-core-021→024, qz-collections-021→024, qz-modern-021→024, qz-concurrency-021→024, qz-jvm-021→024) trong js/data/quiz-java.js.
- Kỹ thuật: hết đúng (field hiding vs override, erasure/instanceof generic, unboxing null NPE, int overflow, WeakHashMap, Map.merge null-removal, comparator a-b overflow, BlockingQueue bảng hành vi, trim vs strip Unicode, text block chiều dài, Optional.ofNullable/of, Stream.iterate 3 tham số, CountDownLatch countDown trong finally, ScheduledExecutorService exception gộp lịch, synchronized/reentrant/Class lock, RWMLock upgrade deadlock, class init Erroneous/NoClassDefFoundError, escape analysis scalar replacement, humongous object >50% region, compressed oops 32 GB cliff).
- Markup: không backtick, không ${, {{}} khớp, fences ~~~ đóng, không HTML thô, không ký tự lạ.
- Định dạng quiz: id dạng qz-<topic>-NNN, 4 options duy nhất, answer 0..3 (hoặc multi: true với mảng 2–3 index tăng dần + "(Chọn N)" khớp); qz-concurrency-024 đã là single-answer đúng (answer: 0, không multi).
- Không sửa nội dung đã có ở HEAD; không thêm/xoá mục.
- node scripts/validate.js → OK — không có lỗi. Không cần build-light-index.js (quiz không nằm trong DATA_INDEX).
