# T1315R — Fact-check nội dung mới của T1315

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1315 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD của `js/data/q-scenario.js` (T1315, scenario-064..069): phần thêm mới là mục `### Ví dụ đời thực` trong mỗi câu.
- Fact-check kỹ thuật (Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x): CFS quota/throttling & cgroup v2 `cpu.stat` (`nr_throttled/nr_periods`) đúng; SerialGC khi <2 CPU, `-XX:ActiveProcessorCount`, `-XX:+UseG1GC` đúng; Kafka `max.poll.records`/`max.poll.interval.ms` mặc định 500/300s, `CooperativeStickyAssignor`, static membership, `CommitFailedException` đúng; Spring Kafka `ErrorHandlingDeserializer`, `DefaultErrorHandler`+`FixedBackOff`+`DeadLetterPublishingRecoverer`, `DeserializationException` non-retryable, DLT partition, `--reset-offsets` đúng; batch listener/`BatchListenerFailedException` đúng; `jdeps`/`jdeprscan`, JAXB gỡ từ Java 11, strong encapsulation JEP 396/403, `-Xlog:gc*`, charset UTF-8 mặc định JEP 400 (Java 18) đúng; Spring MVC 6 tắt trailing slash match, Hibernate 6 đổi sequence naming, Sleuth → Micrometer Tracing đúng. Số liệu/command nhất quán, không bịa API/flag. Markup hợp lệ (không backtick, không `${` thô).
- **Không có lỗi kiến thức/markup** cần sửa trong phần mới; không chỉnh sửa nội dung.
- Kiểm tra: `node --check js/data/q-scenario.js` OK. `node scripts/validate.js` không báo lỗi nào thuộc `q-scenario.js` (repo còn lỗi pre-existing ở lessons-aws/projects/path và build-light-index crash do cú pháp cũ q-aws/q-soft ngoài phạm vi sở hữu). `node scripts/build-light-index.js` crash do cú pháp cũ ngoài phạm vi (không chỉnh file ngoài ownership). `scripts/test-lessons.js` không áp dụng (không sửa lesson). Not committed.
