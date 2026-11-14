# T2040R — Fact-check nội dung mới của T2040

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2040 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ nội dung mới của T2040 (6 câu `modern-058` … `modern-063`). Không thêm/xoá mục, không sửa nội dung đã có ở HEAD.

Lỗi kỹ thuật đã sửa:
- `modern-060` — **property không tồn tại:** `maven.compiler.encoding` không phải user property của maven-compiler-plugin (tài liệu plugin: tham số `encoding`, *User Property* là `encoding`, *Default* `${project.build.sourceEncoding}`). Đã đổi thành: đặt `project.build.sourceEncoding=UTF-8`, plugin dùng giá trị đó làm mặc định cho `encoding`.
- `modern-062` — **sai chính tả trong câu kỹ thuật:** "build/redploy fail" → "build/deploy fail".
- `modern-063` — **mô tả sai cấu hình scheduler:** nói chung chung `spring.task.scheduling.*` "áp dụng theo cấu hình tương ứng". Theo Spring Boot 3.2 Release Notes, khi bật VT `taskScheduler` là `SimpleAsyncTaskScheduler`: chỉ `spring.task.scheduling.thread-name-prefix` và `spring.task.scheduling.simple.*` được áp dụng, các thuộc tính pool (ví dụ `spring.task.scheduling.pool.size`) bị bỏ qua. Đã viết lại đúng ý này.

Đã đối chiếu và **không** phải sửa (nội dung đúng):
- `modern-058`: record làm DTO/projection (interface projection, constructor expression JPQL), record `@Embeddable` từ Hibernate 6.2 (canonical constructor), record không làm `@Entity` được (final, thiếu no-arg ctor, không có setter cho dirty checking, proxy lazy loading) — khớp tài liệu Hibernate 6.2/`in.relation.to`.
- `modern-059`: `sealed interface` + record biến thể, `switch` exhaustive không `default`, `ProblemDetail`/`setProperty` (Spring Framework 6, RFC 9457), rollback mặc định với unchecked, chỉ retry lỗi tạm thời.
- `modern-060`: chuẩn hoá line terminator về LF, incidental indentation, dòng trống cuối, `\s`/`\`, hằng số dùng được trong annotation và case label, `%` lẻ trong `formatted` — đã chạy thử javac 17 (text block trong annotation, trong case label, `String.format("100%")` → `UnknownFormatConversionException`).
- `modern-061`: record pattern, guard `when`, `yield`, dominance/exhaustiveness, Java 21 chưa có primitive pattern, `case null` khi selector null.
- `modern-062`: string templates preview JDK 21 (JEP 430) / 22 (JEP 459), JEP 465 bị hủy, JDK 23 không có kể cả preview, CSR JDK-8329949 (source/binary risk medium), class biên dịch với preview chỉ chạy đúng JDK + `--enable-preview`.
- `modern-063`: phạm vi `spring.threads.virtual.enabled` (Tomcat/Jetty, `applicationTaskExecutor`, `taskScheduler`, listener Kafka/Rabbit, Redis `ClusterCommandExecutor`), WebFlux/Netty event loop không đổi, HikariCP/`@Transactional` không đổi, pinning JDK 21-23 vs JEP 491 ở JDK 24, `jdk.tracePinnedThreads=short`, `spring.main.keep-alive` — khớp Spring Boot 3.2 Release Notes và JEP 444/491.

Không có lỗi markup (validator kiểm tra `{{ }}` lồng nhau, code fence, `~~~seq`), không có ký tự nước ngoài lẫn vào (chỉ có dấu tiếng Việt + `→`).

Nghiệm thu: `node scripts/validate.js` → **OK — không có lỗi.** (chỉ còn cảnh báo cũ, không liên quan file này: `path.js` có bài học chưa nằm trong PATH). Không chạy `test-lessons.js` vì task này không sửa file `js/data/lessons-*.js`.
