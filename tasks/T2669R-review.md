# T2669R — Fact-check nội dung mới của T2669

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2669 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 3 câu hỏi mới (kotlin-039, kotlin-040, kotlin-041) trong q-kotlin.js:
- kotlin-039: Nullable type Kotlin → Java interop, annotation @Nullable/@NotNull, cạm bẫy @JvmOverloads/@JvmStatic/inline/@JvmName/generic, cách bảo vệ contract (JSpecify/Jakarta/Spring annotation, smoke test Java, tránh default nullable, javap). Kỹ thuật đúng.
- kotlin-040: Coroutine structured concurrency trong Spring Boot 3, cancellation chỉ đặt cờ, blocking code (JDBC/RestTemplate) không respect cancellation, cần WebClient/R2DBC suspend, resource handling dùng use/finally, isActive/ensureActive(), connection pool timeout, transaction rollback. Kỹ thuật đúng.
- kotlin-041: Data class làm JPA entity, equals/hashCode trên tất cả thuộc tính phá vỡ HashSet/HashMap sau persist (id thay đổi), lazy collection trong equals kích hoạt query. Thiết kế identity: business key bất biến, hoặc equals/hashCode theo id với xử lý id null (trả false trừ cùng instance), không đưa lazy collection vào equals/hashCode/toString, Persistable với isNew. Kỹ thuật đúng.

Markup hợp lệ ({{code}}, ###, >, -), không có backtick, không có ${, tiếng Việt với thuật ngữ tiếng Anh. Không có lỗi kiến thức, không cần sửa.
Lưu ý: validate.js báo lỗi ở sd-problems.js, quiz-java.js, index-light.js — đây là lỗi sẵn có trong file không thuộc sở hữu task này.
